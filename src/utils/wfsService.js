import { accordionData } from '../components/ui/AccordionData';
import proj4 from 'proj4';

// --- CONSTANTES DE CONFIGURACIÓN ---

const local = 'http://localhost:8080/';
const remote = 'http://187.237.240.169/';

const WFS_BASE_URL =  local + 'geoserver/Hidalgo/wfs';
const WMS_BASE_URL = local + 'geoserver/Hidalgo/wms';

// Configuración de proj4 para transformaciones de coordenadas
proj4.defs("EPSG:3857", "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs +type=crs");
proj4.defs("EPSG:6362", "+proj=lcc +lat_1=17.5 +lat_2=29.5 +lat_0=12 +lon_0=-102 +x_0=2500000 +y_0=0 +ellps=GRS80 +units=m +no_defs");

// Parámetros de tolerancia para consultas espaciales (ACTUALIZADO)
const SPATIAL_QUERY_PARAMS = {
  TOLERANCE_DEGREES_POINTS_LINES: 0.015,
  TOLERANCE_DEGREES_POLYGONS: 0.00001,
  LEGEND_ICON_SIZE: 20
};

// Timeout para peticiones (en milisegundos)
const REQUEST_TIMEOUT = 30000;

// --- MANEJO DE ERRORES ---
class GeoServerError extends Error {
  constructor(message, status, url, layerName = '') {
    super(message);
    this.name = 'GeoServerError';
    this.status = status;
    this.url = url;
    this.layerName = layerName;
    this.timestamp = new Date().toISOString();
  }
}

class NetworkError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'NetworkError';
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
  }
}

/**
* Función de fetch con timeout y manejo de errores mejorado
*/
const fetchWithTimeout = async (url, options = {}, timeout = REQUEST_TIMEOUT) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new NetworkError(`Timeout después de ${timeout}ms`, error);
    }
    throw new NetworkError(`Error de red: ${error.message}`, error);
  }
};

/**
* Valida los parámetros de entrada para las funciones WFS
*/
const validateWfsParams = (typeName, functionName) => {
  if (!typeName || typeof typeName !== 'string') {
    throw new Error(`${functionName}: typeName debe ser un string no vacío`);
  }

  if (!typeName.includes(':')) {
    console.warn(`${functionName}: typeName "${typeName}" podría no tener el formato correcto (debería ser workspace:layer)`);
  }
};

// --- FUNCIÓN MOVIDA ---
// Se movió 'getLayerInfo' aquí arriba para que 'fetchFeaturesAtPoint' pueda usarla.
export const getLayerInfo = (layerNameToFind) => {
  if (!layerNameToFind) return null;

  for (const section of accordionData) {
    if (!section.cards) continue;
    for (const card of section.cards) {
      if (!card.links) continue;
      for (const link of card.links) {
        const { layerName } = link;
        if (!layerName) continue;

        if (Array.isArray(layerName) && layerName.includes(layerNameToFind)) {
          return {
            ...link,
            sectionTitle: section.title,
            cardTitle: card.title
          };
        }

        if (typeof layerName === 'string' && layerName === layerNameToFind) {
          return {
            ...link,
            sectionTitle: section.title,
            cardTitle: card.title
          };
        }
      }
    }
  }
  return null;
};


/**
* Obtiene una capa del servicio WFS de GeoServer.
* @param {string} typeName - El nombre de la capa (ej. 'Hidalgo:municipios').
* @param {string} [cql_filter] - Un filtro CQL opcional para la consulta.
* @param {number} [maxFeatures=5000] - Número máximo de features a retornar.
* @returns {Promise<Object>} Una promesa que resuelve a la colección de features en formato GeoJSON.
*/
export const fetchWfsLayer = async (typeName, cql_filter, maxFeatures = 5000, startIndex = 0) => {
  validateWfsParams(typeName, 'fetchWfsLayer');

  const params = new URLSearchParams({
    service: 'WFS',
    version: '1.0.0',
    request: 'GetFeature',
    typeName: typeName,
    outputFormat: 'application/json',
    srsName: 'EPSG:4326',
    maxFeatures: Math.min(maxFeatures, 10000).toString()
  });

  // ✅ AGREGAR: Parámetro startIndex para paginación
  if (startIndex > 0) {
    params.append('startIndex', startIndex.toString());
  }

  if (cql_filter) {
    params.append('cql_filter', cql_filter);
  }

  const url = `${WFS_BASE_URL}?${params.toString()}`;
  console.log(`🔄 Cargando capa ${typeName} con límite de ${maxFeatures} features, inicio: ${startIndex}`);

  try {
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error en fetchWfsLayer (Status NO OK) para ${typeName}:`, errorText, "URL:", url);
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

      if (!data || typeof data !== 'object') {
        throw new GeoServerError('Respuesta JSON inválida del servidor', 200, url, typeName);
      }

      if (!Array.isArray(data.features)) {
        console.warn(`⚠️ La capa ${typeName} no tiene array de features:`, data);
        data.features = [];
      }

      console.log(`✅ Capa ${typeName} cargada: ${data.features.length} features`);

      if (data.features.length > 0) {
        const sampleFeature = data.features[0];
        console.log(`📋 Estructura del feature:`, {
          hasGeometry: !!sampleFeature.geometry,
          propertiesCount: Object.keys(sampleFeature.properties || {}).length,
          propertyNames: Object.keys(sampleFeature.properties || {}).slice(0, 5)
        });
      }
      return data;

    } else {
      // Respuesta 200 OK, pero no es JSON (es un error XML)
      const errorText = await response.text();
      console.error(`Error en fetchWfsLayer (Respuesta 200 OK pero no es JSON) para ${typeName}:`, errorText, "URL:", url);
      throw new GeoServerError(
        `Respuesta inesperada del servidor (no JSON). Ver consola para detalles.`,
        response.status,
        url,
        typeName
      );
    }
  } catch (error) {
    console.error(`❌ Error en fetchWfsLayer para ${typeName}:`, error);

    if (error instanceof GeoServerError || error instanceof NetworkError) {
      throw error;
    }

    throw new GeoServerError(
      `Error desconocido: ${error.message}`,
      0,
      url,
      typeName
    );
  }
};


/**
* --- FUNCIÓN MODIFICADA ---
* Consulta features en un punto específico usando filtros espaciales inteligentes.
* @param {string} typeName - Nombre de la capa.
* @param {object} latlng - Objeto con latitud y longitud { lat: number, lng: number }.
* @param {string} [geomType] - Tipo de geometría (opcional, se obtiene de accordionData si no se proporciona).
* @param {number} [maxFeatures=50] - Límite de features a retornar.
* @param {string} [cqlFilter] - Filtro CQL adicional (para sequías por quincena).
* @returns {Promise<Object>} GeoJSON con los features encontrados.
*/
export const fetchFeaturesAtPoint = async (typeName, latlng, geomType, maxFeatures = 50, cqlFilter = null) => {
  validateWfsParams(typeName, 'fetchFeaturesAtPoint');

  if (!latlng || typeof latlng.lat !== 'number' || typeof latlng.lng !== 'number') {
    throw new Error('latlng debe ser un objeto con propiedades lat y lng numéricas');
  }

  // ✅ Obtener geomType de accordionData si no se proporciona
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
  const geomField = 'geom';
  let spatialFilter;

  // --- INICIO DE CORRECCIÓN PARA 'maxFeatures=NaN' ---
  let featuresLimit = parseInt(maxFeatures, 10);
  if (isNaN(featuresLimit)) {
    featuresLimit = 50;
  }
  // --- FIN DE CORRECCIÓN ---

  try {
    const { lat, lng } = latlng;

    if (lowerGeomType === 'polygon' || lowerGeomType === 'multipolygon') {
      spatialFilter = `INTERSECTS(${geomField}, SRID=4326;POINT(${lng} ${lat}))`;
      console.log(`🔍 Consultando ${typeName} (Polígono) con INTERSECTS...`);

    } else if (
      lowerGeomType === 'point' ||
      lowerGeomType === 'multipoint' ||
      lowerGeomType === 'line' ||
      lowerGeomType === 'linestring' ||
      lowerGeomType === 'multilinestring'
    ) {
      const tolerance = SPATIAL_QUERY_PARAMS.TOLERANCE_DEGREES_POINTS_LINES;
      const bbox = `${lng - tolerance},${lat - tolerance},${lng + tolerance},${lat + tolerance}`;
      spatialFilter = `BBOX(${geomField}, ${bbox}, 'EPSG:4326')`;
      console.log(`🔍 Consultando ${typeName} (tipo: ${finalGeomType}) con tolerancia: ${tolerance}`);
    } else {
      throw new GeoServerError(
        `Tipo de geometría desconocido o no soportado: "${finalGeomType}" para la capa ${typeName}`,
        0,
        '',
        typeName
      );
    }

    // ✅ COMBINAR FILTROS: espacial + quincena (si existe)
    let finalCqlFilter = spatialFilter;
    if (cqlFilter) {
      finalCqlFilter = `${spatialFilter} AND ${cqlFilter}`;
      console.log(`🎯 Aplicando filtro combinado: ${finalCqlFilter}`);
    }

    const params = new URLSearchParams({
      service: 'WFS',
      version: '1.1.0',
      request: 'GetFeature',
      typeName,
      outputFormat: 'application/json',
      srsName: 'EPSG:4326',
      maxFeatures: Math.min(featuresLimit, 100).toString(),
      cql_filter: finalCqlFilter,
    });

    const url = `${WFS_BASE_URL}?${params.toString()}`;
    console.log(`🔍 Consultando ${typeName} (tipo real: ${finalGeomType}) con filtro: ${finalCqlFilter}`);

    const response = await fetchWithTimeout(url);

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
      console.log(`✅ Consulta en punto para ${typeName}: ${data.features?.length || 0} features encontrados`);
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


/**
* Genera URL para descargar capa en formato Shapefile
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

  // ✅ AGREGAR FILTRO CQL si existe
  if (cqlFilter) {
    params.append('cql_filter', cqlFilter);
    console.log(`🎯 Descargando Shapefile con filtro: ${cqlFilter}`);
  }

  const url = `${WFS_BASE_URL}?${params.toString()}`;
  console.log(`📥 URL de descarga Shapefile: ${url}`);
  return url;
};

/**
* Descarga un archivo desde una URL
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

    console.log(`📥 Descarga iniciada: ${filename}`);
  } catch (error) {
    console.error('❌ Error al iniciar descarga:', error);
    throw new Error(`No se pudo iniciar la descarga: ${error.message}`);
  }
};

export { SPATIAL_QUERY_PARAMS };

export const fetchInitialLayers = async (maxFeaturesPerLayer = 500) => {
  const layerPromises = [];
  const layerNames = [];

  accordionData.forEach(section => {
    section.cards.forEach(card => {
      card.links.forEach(link => {
        if (link.layerName && !layerNames.includes(link.layerName)) {
          layerNames.push(link.layerName);
          layerPromises.push(
            fetchWfsLayer(link.layerName, null, maxFeaturesPerLayer)
          );
        }
      });
    });
  });

  console.log(`🔄 Cargando ${layerNames.length} capas iniciales...`);
  const settledPromises = await Promise.allSettled(layerPromises);
  const initialLayers = {};
  const errors = [];

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

  console.log(`✅ Carga inicial completada: ${Object.keys(initialLayers).length} capas cargadas exitosamente`);
  return initialLayers;
};

export const getLegendGraphicUrl = (layerName, width = SPATIAL_QUERY_PARAMS.LEGEND_ICON_SIZE, height = SPATIAL_QUERY_PARAMS.LEGEND_ICON_SIZE, format = 'image/png') => {
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
      LEGEND_OPTIONS: 'forceRule:True;fontName:Arial;fontAntiAliasing:true;fontSize:12;dpi:180'
    });

    return `${WMS_BASE_URL}?${params.toString()}`;
  } catch (error) {
    console.error('❌ Error generando URL de leyenda:', error);
    return null;
  }
};

export const checkGeoServerAvailability = async () => {
  try {
    const response = await fetchWithTimeout(`${WFS_BASE_URL}?service=WFS&version=1.0.0&request=GetCapabilities`);
    return response.ok;
  } catch (error) {
    console.error('❌ GeoServer no disponible:', error);
    return false;
  }
};

export const fetchUniqueValues = async (layerName, fieldName, maxFeatures = 1000) => {
  try {
    const params = new URLSearchParams({
      service: 'WFS',
      version: '1.0.0',
      request: 'GetFeature',
      typeName: layerName,
      outputFormat: 'application/json',
      srsName: 'EPSG:4326',
      maxFeatures: Math.min(maxFeatures, 10000).toString(),
      propertyName: fieldName  
    });

    const url = `${WFS_BASE_URL}?${params.toString()}`;
    
    console.log(`🔍 Obteniendo valores únicos de ${fieldName} en ${layerName}`);
    
    const response = await fetchWithTimeout(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    
    if (!data.features) {
      console.warn("⚠️ No se encontraron features para extraer valores únicos");
      return [];
    }

    // ✅ NORMALIZAR FORMATO: Eliminar 'Z' y espacios, mantener consistencia
    const uniqueValues = [...new Set(
      data.features
        .map(f => f.properties?.[fieldName])
        .filter(Boolean)
        .map(val => {
          // Limpiar y normalizar el valor
          const cleanVal = val.toString()
            .replace('Z', '')  // Eliminar Z
            .replace('T00:00:00.000', '') // Eliminar parte de tiempo si existe
            .trim();
          
          console.log(`🔄 Normalizando: "${val}" -> "${cleanVal}"`);
          return cleanVal;
        })
    )].sort();

    console.log(`✅ ${uniqueValues.length} valores únicos encontrados para ${fieldName}:`, uniqueValues.slice(0, 10));
    
    return uniqueValues;
  } catch (error) {
    console.error(`❌ Error obteniendo valores únicos de ${fieldName}:`, error);
    return [];
  }
};