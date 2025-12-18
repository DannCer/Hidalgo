/**
 * @fileoverview Servicio de comunicación con GeoServer (WFS/WMS).
 * 
 * Este módulo encapsula todas las operaciones de comunicación con el servidor
 * GeoServer, incluyendo:
 * - Obtención de features (WFS GetFeature)
 * - Consultas espaciales (intersección, bbox)
 * - Generación de URLs de descarga
 * - Obtención de leyendas (WMS GetLegendGraphic)
 * - Cache de valores únicos
 * 
 * Utiliza el estándar OGC WFS 1.0.0/1.1.0 y WMS 1.1.0
 * 
 * @module utils/wfsService
 * @requires proj4 - Para transformaciones de coordenadas
 */

import { accordionData } from '../data/AccordionData';
import proj4 from 'proj4';
import { config, logger } from '../config/env';

// ============================================================================
// CONSTANTES Y CONFIGURACIÓN
// ============================================================================

/** URL base del servicio WFS (construida desde config) */
const WFS_BASE_URL = config.geoserver.wfsUrl;

/** URL base del servicio WMS (construida desde config) */
const WMS_BASE_URL = config.geoserver.wmsUrl;

// ----------------------------------------------------------------------------
// Definición de sistemas de coordenadas para proj4
// ----------------------------------------------------------------------------

/**
 * Web Mercator (usado por Google Maps, OSM, etc.)
 * La mayoría de las capas base de tiles usan esta proyección.
 */
proj4.defs("EPSG:3857", "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs +type=crs");

/**
 * Lambert Conformal Conic para México (INEGI)
 * Proyección oficial de México, algunas capas pueden venir en este CRS.
 */
proj4.defs("EPSG:6362", "+proj=lcc +lat_1=17.5 +lat_2=29.5 +lat_0=12 +lon_0=-102 +x_0=2500000 +y_0=0 +ellps=GRS80 +units=m +no_defs");

/**
 * Parámetros para consultas espaciales.
 * Define tolerancias para diferentes tipos de geometría.
 */
const SPATIAL_QUERY_PARAMS = {
    /** Tolerancia en grados para puntos y líneas (permite clicks cercanos) */
    TOLERANCE_DEGREES_POINTS_LINES: 0.005,
    
    /** Tolerancia para polígonos (prácticamente exacta) */
    TOLERANCE_DEGREES_POLYGONS: 0.00001,
    
    /** Tamaño por defecto de íconos de leyenda en píxeles */
    LEGEND_ICON_SIZE: 20
};

/** Timeout por defecto para peticiones HTTP */
const REQUEST_TIMEOUT = config.geoserver.timeout;

// ============================================================================
// CLASES DE ERROR PERSONALIZADAS
// ============================================================================

/**
 * Error específico de GeoServer.
 * Se lanza cuando GeoServer responde con un error o datos inesperados.
 * 
 * @class
 * @extends Error
 */
class GeoServerError extends Error {
    /**
     * @param {string} message - Mensaje de error
     * @param {number} status - Código HTTP de respuesta
     * @param {string} url - URL que causó el error
     * @param {string} layerName - Nombre de la capa involucrada
     */
    constructor(message, status, url, layerName = '') {
        super(message);
        this.name = 'GeoServerError';
        this.status = status;
        this.url = url;
        this.layerName = layerName;
        this.timestamp = new Date().toISOString();
    }
}

/**
 * Error de red.
 * Se lanza cuando hay problemas de conectividad.
 * 
 * @class
 * @extends Error
 */
class NetworkError extends Error {
    /**
     * @param {string} message - Mensaje de error
     * @param {Error} originalError - Error original capturado
     */
    constructor(message, originalError) {
        super(message);
        this.name = 'NetworkError';
        this.originalError = originalError;
        this.timestamp = new Date().toISOString();
    }
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Realiza un fetch con timeout configurable.
 * Permite cancelar peticiones que tarden demasiado.
 * 
 * @async
 * @param {string} url - URL a consultar
 * @param {Object} options - Opciones de fetch (headers, method, etc.)
 * @param {AbortSignal} [options.signal] - Signal externo para cancelación
 * @param {number} [timeout=REQUEST_TIMEOUT] - Timeout en milisegundos
 * @returns {Promise<Response>} Respuesta del fetch
 * @throws {NetworkError} Si hay error de red
 * @throws {AbortError} Si se cancela la petición
 */
const fetchWithTimeout = async (url, options = {}, timeout = REQUEST_TIMEOUT) => {
    // Si ya viene un signal externo, lo respetamos (ej: del componente React)
    const externalSignal = options.signal;
    const controller = externalSignal ? null : new AbortController();

    let timeoutId;

    // Solo configuramos timeout si no hay signal externo
    if (!externalSignal) {
        timeoutId = setTimeout(() => controller.abort(), timeout);
    }

    try {
        const response = await fetch(url, {
            ...options,
            signal: externalSignal || controller?.signal
        });

        if (timeoutId) clearTimeout(timeoutId);
        return response;

    } catch (error) {
        if (timeoutId) clearTimeout(timeoutId);

        // Re-lanzar AbortError sin modificar (es esperado en cancelaciones)
        if (error.name === 'AbortError') {
            throw error;
        }

        throw new NetworkError(`Error de red: ${error.message}`, error);
    }
};

/**
 * Valida los parámetros de una petición WFS.
 * 
 * @param {string} typeName - Nombre de la capa (workspace:layer)
 * @param {string} functionName - Nombre de la función que llama (para logs)
 * @throws {Error} Si typeName es inválido
 */
const validateWfsParams = (typeName, functionName) => {
    if (!typeName || typeof typeName !== 'string') {
        throw new Error(`${functionName}: typeName debe ser un string no vacío`);
    }

    // Advertir si falta el prefijo del workspace
    if (!typeName.includes(':')) {
        console.warn(`${functionName}: typeName "${typeName}" podría no tener el formato correcto (debería ser workspace:layer)`);
    }
};

/**
 * Verifica si un link de AccordionData coincide con un nombre de capa.
 * Maneja tanto strings simples como arrays de nombres.
 * 
 * @param {Object} link - Objeto link de AccordionData
 * @param {string} layerName - Nombre de capa a buscar
 * @returns {boolean} true si coincide
 */
const isLayerMatch = (link, layerName) => {
  if (!link.layerName) return false;
  return Array.isArray(link.layerName)
    ? link.layerName.includes(layerName)
    : link.layerName === layerName;
};

/**
 * Busca la configuración de una capa en AccordionData.
 * 
 * Recorre toda la estructura de accordionData buscando la capa especificada.
 * Retorna el objeto completo con metadata (geomType, crs, etc.)
 * 
 * @param {string} layerName - Nombre completo de la capa (workspace:layer)
 * @returns {Object|null} Configuración de la capa o null si no se encuentra
 * 
 * @example
 * const info = getLayerInfo('Hidalgo:00_Municipios');
 * // { text: 'Municipios', layerName: 'Hidalgo:00_Municipios', geomType: 'polygon', ... }
 */
export const getLayerInfo = (layerName) => {
  if (!layerName) return null;

  // Recorrer todas las secciones del acordeón
  for (const section of accordionData) {
    if (!section.cards) continue;

    for (const card of section.cards) {
      if (!card.links) continue;

      for (const link of card.links) {
        // Verificar coincidencia directa
        if (isLayerMatch(link, layerName)) {
          return link;
        }

        // También buscar en sublinks (dropdowns)
        if (link.sublinks) {
          for (const sublink of link.sublinks) {
             if (isLayerMatch(sublink, layerName)) {
               return sublink;
             }
          }
        }
      }
    }
  }
  return null;
};

// ============================================================================
// FUNCIONES PRINCIPALES DE WFS
// ============================================================================

/**
 * Obtiene features de una capa WFS.
 * 
 * Esta es la función principal para cargar datos geoespaciales desde GeoServer.
 * Soporta filtros CQL, paginación y cancelación de peticiones.
 * 
 * @async
 * @param {string} typeName - Nombre de la capa (workspace:layer)
 * @param {string|null} [cql_filter=null] - Filtro CQL para la consulta
 * @param {number} [maxFeatures=5000] - Número máximo de features
 * @param {number} [startIndex=0] - Índice inicial para paginación
 * @param {AbortSignal|null} [signal=null] - Signal para cancelar la petición
 * @returns {Promise<Object>} GeoJSON FeatureCollection
 * @throws {GeoServerError} Si hay error en la respuesta de GeoServer
 * @throws {NetworkError} Si hay error de red
 * 
 * @example
 * // Cargar todos los municipios
 * const municipios = await fetchWfsLayer('Hidalgo:00_Municipios');
 * 
 * @example
 * // Cargar sequías con filtro de fecha
 * const sequias = await fetchWfsLayer(
 *   'Hidalgo:04_sequias',
 *   "Quincena='2024-01-15'",
 *   5000
 * );
 */
export const fetchWfsLayer = async (
    typeName,
    cql_filter = null,
    maxFeatures = 5000,
    startIndex = 0,
    signal = null
) => {
    validateWfsParams(typeName, 'fetchWfsLayer');

    // Construir parámetros de la petición WFS GetFeature
    const params = new URLSearchParams({
        service: 'WFS',
        version: '1.0.0',
        request: 'GetFeature',
        typeName: typeName,
        outputFormat: 'application/json',  // Respuesta en GeoJSON
        srsName: 'EPSG:4326',               // Coordenadas en WGS84
        maxFeatures: Math.min(maxFeatures, 10000).toString()  // Límite de seguridad
    });

    // Agregar paginación si es necesario
    if (startIndex > 0) params.append('startIndex', startIndex.toString());
    
    // Agregar filtro CQL si se proporciona
    if (cql_filter) params.append('cql_filter', cql_filter);

    const url = `${WFS_BASE_URL}?${params.toString()}`;

    try {
        // Realizar petición con timeout (o signal externo)
        const response = await fetchWithTimeout(
            url,
            { signal },
            signal ? Infinity : REQUEST_TIMEOUT  // Sin timeout si hay signal externo
        );

        if (!response.ok) {
            throw new GeoServerError(
                `Error ${response.status}: ${response.statusText}`,
                response.status,
                url,
                typeName
            );
        }

        // Verificar que la respuesta sea JSON
        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
            throw new GeoServerError(
                'Respuesta inesperada del servidor (no JSON)',
                response.status,
                url,
                typeName
            );
        }

        const data = await response.json();

        if (!data || typeof data !== 'object') {
            throw new GeoServerError('Respuesta JSON inválida', 200, url, typeName);
        }

        // Asegurar que siempre haya un array de features
        return {
            ...data,
            features: Array.isArray(data.features) ? data.features : []
        };

    } catch (error) {
        // Re-lanzar AbortError sin modificar
        if (error.name === 'AbortError') {
            throw error;
        }

        logger.error(`Error en fetchWfsLayer para ${typeName}:`, error);

        // Re-lanzar errores tipados
        if (error instanceof GeoServerError || error instanceof NetworkError) {
            throw error;
        }

        // Envolver otros errores
        throw new GeoServerError(
            `Error desconocido: ${error.message}`,
            0,
            url,
            typeName
        );
    }
};

/**
 * Busca features en un punto específico del mapa.
 * 
 * Realiza una consulta espacial para encontrar features que intersectan
 * o están cerca de un punto dado. El comportamiento varía según el tipo
 * de geometría:
 * - Polígonos: usa INTERSECTS (punto exacto)
 * - Puntos/Líneas: usa BBOX con tolerancia (área alrededor del click)
 * 
 * @async
 * @param {string} typeName - Nombre de la capa
 * @param {Object} latlng - Coordenadas del click
 * @param {number} latlng.lat - Latitud
 * @param {number} latlng.lng - Longitud
 * @param {string} [geomType] - Tipo de geometría (si no se especifica, se busca en AccordionData)
 * @param {number} [maxFeatures=50] - Máximo de features a retornar
 * @param {string|null} [cqlFilter=null] - Filtro CQL adicional
 * @param {AbortSignal|null} [signal=null] - Signal para cancelación
 * @returns {Promise<Object>} GeoJSON FeatureCollection
 * @throws {GeoServerError} Si hay error
 * 
 * @example
 * // Buscar municipio en el punto clickeado
 * const features = await fetchFeaturesAtPoint(
 *   'Hidalgo:00_Municipios',
 *   { lat: 20.5, lng: -99.0 },
 *   'polygon'
 * );
 */
export const fetchFeaturesAtPoint = async (
    typeName,
    latlng,
    geomType,
    maxFeatures = 50,
    cqlFilter = null,
    signal = null
) => {
    validateWfsParams(typeName, 'fetchFeaturesAtPoint');

    // Validar coordenadas
    if (!latlng || typeof latlng.lat !== 'number' || typeof latlng.lng !== 'number') {
        throw new Error('latlng debe ser un objeto con propiedades lat y lng numéricas');
    }

    // Si no se especifica geomType, buscarlo en AccordionData
    let finalGeomType = geomType;
    if (!finalGeomType) {
        const layerInfo = getLayerInfo(typeName);
        if (!layerInfo || !layerInfo.geomType) {
            const errorMsg = `No se encontró metadata (geomType) para la capa ${typeName} en accordionData.`;
            console.error(errorMsg);
            throw new GeoServerError(errorMsg, 0, '', typeName);
        }
        finalGeomType = layerInfo.geomType;
    }

    const lowerGeomType = finalGeomType.toLowerCase();
    const geomField = 'geom';  // Nombre del campo de geometría en GeoServer
    let spatialFilter;

    // Validar y sanear maxFeatures
    let featuresLimit = parseInt(maxFeatures, 10);
    if (isNaN(featuresLimit)) {
        featuresLimit = 50;
    }

    try {
        const { lat, lng } = latlng;

        // Construir filtro espacial según tipo de geometría
        if (lowerGeomType === 'polygon' || lowerGeomType === 'multipolygon') {
            // Para polígonos: intersección exacta con el punto
            spatialFilter = `INTERSECTS(${geomField}, SRID=4326;POINT(${lng} ${lat}))`;

        } else if (
            lowerGeomType === 'point' ||
            lowerGeomType === 'multipoint' ||
            lowerGeomType === 'line' ||
            lowerGeomType === 'linestring' ||
            lowerGeomType === 'multilinestring'
        ) {
            // Para puntos y líneas: bbox con tolerancia
            const tolerance = SPATIAL_QUERY_PARAMS.TOLERANCE_DEGREES_POINTS_LINES;
            const bbox = `${lng - tolerance},${lat - tolerance},${lng + tolerance},${lat + tolerance}`;
            spatialFilter = `BBOX(${geomField}, ${bbox}, 'EPSG:4326')`;
        } else {
            throw new GeoServerError(
                `Tipo de geometría desconocido o no soportado: "${finalGeomType}" para la capa ${typeName}`,
                0,
                '',
                typeName
            );
        }

        // Combinar filtro espacial con filtro CQL adicional (si existe)
        let finalCqlFilter = spatialFilter;
        if (cqlFilter) {
            finalCqlFilter = `${spatialFilter} AND ${cqlFilter}`;
        }

        // Construir petición WFS
        const params = new URLSearchParams({
            service: 'WFS',
            version: '1.1.0',  // Usamos 1.1.0 para mejor soporte de filtros
            request: 'GetFeature',
            typeName,
            outputFormat: 'application/json',
            srsName: 'EPSG:4326',
            maxFeatures: Math.min(featuresLimit, 100).toString(),
            cql_filter: finalCqlFilter,
        });

        const url = `${WFS_BASE_URL}?${params.toString()}`;

        // Ejecutar petición
        const response = await fetchWithTimeout(
            url,
            { signal },
            signal ? Infinity : REQUEST_TIMEOUT
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Error en la petición WFS (Status NO OK):", errorText, "URL:", url);
            throw new GeoServerError(
                `Error ${response.status}: ${response.statusText}`,
                response.status,
                url,
                typeName
            );
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return data;
        } else {
            const errorText = await response.text();
            console.error("Error en la petición WFS (Respuesta 200 OK pero no es JSON):", errorText, "URL:", url);
            throw new GeoServerError(
                `Respuesta inesperada del servidor (no JSON). Ver consola para detalles.`,
                response.status,
                url,
                typeName
            );
        }
    } catch (error) {

        if (error.name === 'AbortError') {
            throw error;
        }

        console.error(`❌ Error en fetchFeaturesAtPoint para ${typeName}:`, error);

        if (error instanceof GeoServerError || error instanceof NetworkError) {
            throw error;
        }

        throw new GeoServerError(
            `Error en consulta espacial: ${error.message}`,
            0,
            '',
            typeName
        );
    }
};

// ============================================================================
// FUNCIONES DE DESCARGA
// ============================================================================

/**
 * Genera URL de descarga de Shapefile desde GeoServer.
 * 
 * Construye una URL que permite descargar los datos de una capa
 * en formato Shapefile comprimido (ZIP).
 * 
 * @param {string} typeName - Nombre de la capa
 * @param {string} [format='shape-zip'] - Formato de salida
 * @param {string|null} [cqlFilter=null] - Filtro CQL para descargar subset
 * @returns {string} URL de descarga
 * 
 * @example
 * const url = getShapefileDownloadUrl('Hidalgo:00_Municipios');
 * // Retorna URL para descargar todos los municipios como shapefile
 */
export const getShapefileDownloadUrl = (typeName, format = 'shape-zip', cqlFilter = null) => {
    validateWfsParams(typeName, 'getShapefileDownloadUrl');

    const params = new URLSearchParams({
        service: 'WFS',
        version: '1.0.0',
        request: 'GetFeature',
        typeName: typeName,
        outputFormat: format,
        srsName: 'EPSG:4326'
    });

    if (cqlFilter) {
        params.append('cql_filter', cqlFilter);
    }

    const url = `${WFS_BASE_URL}?${params.toString()}`;
    return url;
};

/**
 * Inicia la descarga de un archivo.
 * 
 * Crea un elemento <a> temporal para iniciar la descarga
 * de un archivo desde una URL.
 * 
 * @param {string} url - URL del archivo a descargar
 * @param {string} filename - Nombre sugerido para el archivo
 * @throws {Error} Si faltan parámetros o hay error al descargar
 */
export const downloadFile = (url, filename) => {
    if (!url || !filename) {
        throw new Error('URL y filename son parámetros requeridos');
    }

    try {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (error) {
        console.error('❌ Error al iniciar descarga:', error);
        throw new Error(`No se pudo iniciar la descarga: ${error.message}`);
    }
};

// Exportar constantes de configuración espacial
export { SPATIAL_QUERY_PARAMS };

// ============================================================================
// FUNCIONES DE CARGA MASIVA
// ============================================================================

/**
 * Carga todas las capas definidas en AccordionData.
 * 
 * Útil para precargar datos al inicio de la aplicación.
 * Usa Promise.allSettled para no fallar si una capa tiene error.
 * 
 * @async
 * @param {number} [maxFeaturesPerLayer=500] - Máximo de features por capa
 * @returns {Promise<Object>} Objeto con capas cargadas { layerName: GeoJSON }
 * 
 * @example
 * const allLayers = await fetchInitialLayers(1000);
 * console.log(Object.keys(allLayers)); // ['Hidalgo:00_Estado', 'Hidalgo:00_Municipios', ...]
 */
export const fetchInitialLayers = async (maxFeaturesPerLayer = 500) => {
    const layerPromises = [];
    const layerNames = [];

    // Recolectar todas las capas definidas en accordionData
    accordionData.forEach(section => {
        section.cards.forEach(card => {
            card.links.forEach(link => {
                const currentLayerNames = Array.isArray(link.layerName)
                    ? link.layerName
                    : (link.layerName ? [link.layerName] : []);

                // Evitar duplicados
                currentLayerNames.forEach(name => {
                    if (name && !layerNames.includes(name)) {
                        layerNames.push(name);
                        layerPromises.push(
                            fetchWfsLayer(name, null, maxFeaturesPerLayer)
                        );
                    }
                });
            });
        });
    });

    // Ejecutar todas las peticiones en paralelo
    const settledPromises = await Promise.allSettled(layerPromises);
    const initialLayers = {};
    const errors = [];

    // Procesar resultados
    settledPromises.forEach((result, index) => {
        const layerName = layerNames[index];
        if (result.status === 'fulfilled') {
            initialLayers[layerName] = result.value;
        } else {
            console.error(`❌ Error al cargar la capa ${layerName}:`, result.reason);
            errors.push({ layerName, error: result.reason });
        }
    });

    if (errors.length > 0) {
        console.warn(`⚠️ ${errors.length} capas no pudieron cargarse`);
    }

    return initialLayers;
};

// ============================================================================
// FUNCIONES WMS (LEYENDAS)
// ============================================================================

/**
 * Genera URL para obtener la leyenda de una capa desde WMS.
 * 
 * Usa GetLegendGraphic de WMS para obtener la imagen de la leyenda
 * según el estilo configurado en GeoServer.
 * 
 * @param {string} layerName - Nombre de la capa
 * @param {number} [width=20] - Ancho del ícono en píxeles
 * @param {number} [height=20] - Alto del ícono en píxeles
 * @param {string} [format='image/png'] - Formato de imagen
 * @returns {string|null} URL de la leyenda o null si hay error
 * 
 * @example
 * const legendUrl = getLegendGraphicUrl('Hidalgo:04_sequias');
 * // <img src={legendUrl} />
 */
export const getLegendGraphicUrl = (
    layerName,
    width = SPATIAL_QUERY_PARAMS.LEGEND_ICON_SIZE,
    height = SPATIAL_QUERY_PARAMS.LEGEND_ICON_SIZE,
    format = 'image/png'
) => {
    if (!layerName) {
        console.warn('getLegendGraphicUrl: layerName no proporcionado');
        return null;
    }

    try {
        const params = new URLSearchParams({
            REQUEST: 'GetLegendGraphic',
            VERSION: '1.1.0',
            FORMAT: format,
            WIDTH: width.toString(),
            HEIGHT: height.toString(),
            LAYER: layerName,
            // Opciones para mejorar la calidad de la leyenda
            LEGEND_OPTIONS: 'forceRule:True;fontName:Arial;fontAntiAliasing:true;fontSize:12;dpi:180'
        });

        return `${WMS_BASE_URL}?${params.toString()}`;
    } catch (error) {
        console.error('❌ Error generando URL de leyenda:', error);
        return null;
    }
};

// ============================================================================
// FUNCIONES DE DIAGNÓSTICO
// ============================================================================

/**
 * Verifica si GeoServer está disponible.
 * 
 * Realiza una petición GetCapabilities para verificar conectividad.
 * Útil para mostrar estado de conexión en la UI.
 * 
 * @async
 * @returns {Promise<boolean>} true si GeoServer responde correctamente
 * 
 * @example
 * const isAvailable = await checkGeoServerAvailability();
 * if (!isAvailable) {
 *   showErrorMessage('No hay conexión con el servidor de mapas');
 * }
 */
export const checkGeoServerAvailability = async () => {
    try {
        const response = await fetchWithTimeout(
            `${WFS_BASE_URL}?service=WFS&version=1.0.0&request=GetCapabilities`,
            {},
            5000  // Timeout corto para check rápido
        );
        return response.ok;
    } catch (error) {
        console.error('❌ GeoServer no disponible:', error);
        return false;
    }
};

// ============================================================================
// FUNCIONES DE VALORES ÚNICOS (Para filtros y timelines)
// ============================================================================

/**
 * Obtiene valores únicos de un campo en una capa.
 * 
 * Útil para construir listas de filtros o timelines.
 * Por ejemplo, obtener todas las quincenas disponibles para sequías.
 * 
 * @async
 * @param {string} layerName - Nombre de la capa
 * @param {string} fieldName - Nombre del campo
 * @param {number} [maxFeatures=1000] - Máximo de features a consultar
 * @param {AbortSignal|null} [signal=null] - Signal para cancelación
 * @returns {Promise<string[]>} Array de valores únicos ordenados
 * 
 * @example
 * const quincenas = await fetchUniqueValues('Hidalgo:04_sequias', 'Quincena');
 * // ['2023-01-01', '2023-01-15', '2023-02-01', ...]
 */
export const fetchUniqueValues = async (
    layerName,
    fieldName,
    maxFeatures = 1000,
    signal = null
) => {
    try {
        // Solo solicitar el campo específico (más eficiente)
        const params = new URLSearchParams({
            service: 'WFS',
            version: '1.0.0',
            request: 'GetFeature',
            typeName: layerName,
            outputFormat: 'application/json',
            srsName: 'EPSG:4326',
            maxFeatures: Math.min(maxFeatures, 10000).toString(),
            propertyName: fieldName  // Solo este campo
        });

        const url = `${WFS_BASE_URL}?${params.toString()}`;

        const response = await fetchWithTimeout(
            url,
            { signal },
            signal ? Infinity : REQUEST_TIMEOUT
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.features) {
            console.warn("⚠️ No se encontraron features para extraer valores únicos");
            return [];
        }

        // Extraer valores únicos, limpiar fechas ISO y ordenar
        const uniqueValues = [...new Set(
            data.features
                .map(f => f.properties?.[fieldName])
                .filter(Boolean)
                .map(val => {
                    // Limpiar formato de fecha ISO
                    const cleanVal = val.toString()
                        .replace('Z', '')
                        .replace('T00:00:00.000', '')
                        .trim();
                    return cleanVal;
                })
        )].sort();

        return uniqueValues;

    } catch (error) {
        if (error.name === 'AbortError') {
            throw error;
        }

        console.error(`❌ Error obteniendo valores únicos de ${fieldName}:`, error);
        return [];
    }
};

// ============================================================================
// SISTEMA DE CACHÉ PARA VALORES ÚNICOS
// ============================================================================

/** Caché en memoria para valores únicos (evita peticiones repetidas) */
const uniqueValuesCache = new Map();

/**
 * Obtiene valores únicos con caché.
 * 
 * Wrapper de fetchUniqueValues que implementa caché en memoria
 * para evitar peticiones repetidas al servidor.
 * 
 * @async
 * @param {string} layerName - Nombre de la capa
 * @param {string} fieldName - Nombre del campo
 * @param {number} [maxFeatures=1000] - Máximo de features
 * @param {AbortSignal|null} [signal=null] - Signal para cancelación
 * @param {number} [cacheTimeout=300000] - Tiempo de vida del caché en ms (5 min)
 * @returns {Promise<string[]>} Array de valores únicos
 * 
 * @example
 * // Primera llamada: hace petición al servidor
 * const quincenas1 = await fetchUniqueValuesCached('Hidalgo:04_sequias', 'Quincena');
 * 
 * // Segunda llamada (dentro de 5 min): usa caché
 * const quincenas2 = await fetchUniqueValuesCached('Hidalgo:04_sequias', 'Quincena');
 */
export const fetchUniqueValuesCached = async (
    layerName,
    fieldName,
    maxFeatures = 1000,
    signal = null,
    cacheTimeout = 5 * 60 * 1000  // 5 minutos por defecto
) => {
    const cacheKey = `${layerName}:${fieldName}`;
    const cached = uniqueValuesCache.get(cacheKey);

    // Verificar si hay caché válido
    if (cached && (Date.now() - cached.timestamp < cacheTimeout)) {
        return cached.values;
    }

    // Obtener datos frescos
    try {
        const values = await fetchUniqueValues(layerName, fieldName, maxFeatures, signal);
        uniqueValuesCache.set(cacheKey, {
            values,
            timestamp: Date.now()
        });
        return values;
    } catch (error) {
        // Si hay error pero tenemos caché (aunque expirado), usarlo
        if (cached) {
            console.warn('⚠️ Usando cache expirado debido a error en fetch');
            return cached.values;
        }
        throw error;
    }
};

/**
 * Limpia el caché de valores únicos.
 * 
 * Permite limpiar selectivamente el caché por capa, campo o todo.
 * 
 * @param {string|null} [layerName=null] - Si se especifica, solo limpia esta capa
 * @param {string|null} [fieldName=null] - Si se especifica junto con layerName, solo limpia ese campo
 * 
 * @example
 * // Limpiar todo el caché
 * clearUniqueValuesCache();
 * 
 * // Limpiar solo una capa
 * clearUniqueValuesCache('Hidalgo:04_sequias');
 * 
 * // Limpiar un campo específico
 * clearUniqueValuesCache('Hidalgo:04_sequias', 'Quincena');
 */
export const clearUniqueValuesCache = (layerName = null, fieldName = null) => {
    if (layerName && fieldName) {
        // Limpiar entrada específica
        uniqueValuesCache.delete(`${layerName}:${fieldName}`);
    } else if (layerName) {
        // Limpiar todas las entradas de una capa
        for (const key of uniqueValuesCache.keys()) {
            if (key.startsWith(`${layerName}:`)) {
                uniqueValuesCache.delete(key);
            }
        }
    } else {
        // Limpiar todo el caché
        uniqueValuesCache.clear();
    }
};