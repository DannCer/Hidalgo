
import { accordionData } from '../data/AccordionData';
import proj4 from 'proj4';
import { config, logger } from '../config/env';

const WFS_BASE_URL = config.geoserver.wfsUrl;
const WMS_BASE_URL = config.geoserver.wmsUrl;

proj4.defs("EPSG:3857", "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs +type=crs");
proj4.defs("EPSG:6362", "+proj=lcc +lat_1=17.5 +lat_2=29.5 +lat_0=12 +lon_0=-102 +x_0=2500000 +y_0=0 +ellps=GRS80 +units=m +no_defs");

const SPATIAL_QUERY_PARAMS = {
    TOLERANCE_DEGREES_POINTS_LINES: 0.005,
    TOLERANCE_DEGREES_POLYGONS: 0.00001,
    LEGEND_ICON_SIZE: 20
};

const REQUEST_TIMEOUT = config.geoserver.timeout;

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

const fetchWithTimeout = async (url, options = {}, timeout = REQUEST_TIMEOUT) => {

    const externalSignal = options.signal;
    const controller = externalSignal ? null : new AbortController();

    let timeoutId;


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


        if (error.name === 'AbortError') {
            throw error;
        }

        throw new NetworkError(`Error de red: ${error.message}`, error);
    }
};

const validateWfsParams = (typeName, functionName) => {
    if (!typeName || typeof typeName !== 'string') {
        throw new Error(`${functionName}: typeName debe ser un string no vacío`);
    }

    if (!typeName.includes(':')) {
        console.warn(`${functionName}: typeName "${typeName}" podría no tener el formato correcto (debería ser workspace:layer)`);
    }
};

const isLayerMatch = (link, layerName) => {
  if (!link.layerName) return false;
  return Array.isArray(link.layerName)
    ? link.layerName.includes(layerName)
    : link.layerName === layerName;
};

export const getLayerInfo = (layerName) => {
  if (!layerName) return null;

  for (const section of accordionData) {
    if (!section.cards) continue;

    for (const card of section.cards) {
      if (!card.links) continue;

      for (const link of card.links) {

        if (isLayerMatch(link, layerName)) {
          return link;
        }


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

export const fetchWfsLayer = async (
    typeName,
    cql_filter = null,
    maxFeatures = 5000,
    startIndex = 0,
    signal = null
) => {
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

    if (startIndex > 0) params.append('startIndex', startIndex.toString());
    if (cql_filter) params.append('cql_filter', cql_filter);

    const url = `${WFS_BASE_URL}?${params.toString()}`;

    try {

        const response = await fetchWithTimeout(
            url,
            { signal },
            signal ? Infinity : REQUEST_TIMEOUT
        );

        if (!response.ok) {
            throw new GeoServerError(
                `Error ${response.status}: ${response.statusText}`,
                response.status,
                url,
                typeName
            );
        }

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

        return {
            ...data,
            features: Array.isArray(data.features) ? data.features : []
        };

    } catch (error) {

        if (error.name === 'AbortError') {
            throw error;
        }

        logger.error(`Error en fetchWfsLayer para ${typeName}:`, error);

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

export const fetchFeaturesAtPoint = async (
    typeName,
    latlng,
    geomType,
    maxFeatures = 50,
    cqlFilter = null,
    signal = null
) => {
    validateWfsParams(typeName, 'fetchFeaturesAtPoint');

    if (!latlng || typeof latlng.lat !== 'number' || typeof latlng.lng !== 'number') {
        throw new Error('latlng debe ser un objeto con propiedades lat y lng numéricas');
    }


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

    let featuresLimit = parseInt(maxFeatures, 10);
    if (isNaN(featuresLimit)) {
        featuresLimit = 50;
    }

    try {
        const { lat, lng } = latlng;

        if (lowerGeomType === 'polygon' || lowerGeomType === 'multipolygon') {
            spatialFilter = `INTERSECTS(${geomField}, SRID=4326;POINT(${lng} ${lat}))`;

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
        } else {
            throw new GeoServerError(
                `Tipo de geometría desconocido o no soportado: "${finalGeomType}" para la capa ${typeName}`,
                0,
                '',
                typeName
            );
        }


        let finalCqlFilter = spatialFilter;
        if (cqlFilter) {
            finalCqlFilter = `${spatialFilter} AND ${cqlFilter}`;
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

export { SPATIAL_QUERY_PARAMS };

export const fetchInitialLayers = async (maxFeaturesPerLayer = 500) => {
    const layerPromises = [];
    const layerNames = [];

    accordionData.forEach(section => {
        section.cards.forEach(card => {
            card.links.forEach(link => {
                const currentLayerNames = Array.isArray(link.layerName)
                    ? link.layerName
                    : (link.layerName ? [link.layerName] : []);

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

    return initialLayers;
};

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
        const response = await fetchWithTimeout(
            `${WFS_BASE_URL}?service=WFS&version=1.0.0&request=GetCapabilities`,
            {},
            5000
        );
        return response.ok;
    } catch (error) {
        console.error('❌ GeoServer no disponible:', error);
        return false;
    }
};

export const fetchUniqueValues = async (
    layerName,
    fieldName,
    maxFeatures = 1000,
    signal = null
) => {
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


        const uniqueValues = [...new Set(
            data.features
                .map(f => f.properties?.[fieldName])
                .filter(Boolean)
                .map(val => {

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

const uniqueValuesCache = new Map();

export const fetchUniqueValuesCached = async (
    layerName,
    fieldName,
    maxFeatures = 1000,
    signal = null,
    cacheTimeout = 5 * 60 * 1000
) => {
    const cacheKey = `${layerName}:${fieldName}`;
    const cached = uniqueValuesCache.get(cacheKey);


    if (cached && (Date.now() - cached.timestamp < cacheTimeout)) {
        return cached.values;
    }


    try {
        const values = await fetchUniqueValues(layerName, fieldName, maxFeatures, signal);
        uniqueValuesCache.set(cacheKey, {
            values,
            timestamp: Date.now()
        });
        return values;
    } catch (error) {

        if (cached) {
            console.warn('⚠️ Usando cache expirado debido a error en fetch');
            return cached.values;
        }
        throw error;
    }
};

export const clearUniqueValuesCache = (layerName = null, fieldName = null) => {
    if (layerName && fieldName) {
        uniqueValuesCache.delete(`${layerName}:${fieldName}`);
    } else if (layerName) {

        for (const key of uniqueValuesCache.keys()) {
            if (key.startsWith(`${layerName}:`)) {
                uniqueValuesCache.delete(key);
            }
        }
    } else {

        uniqueValuesCache.clear();
    }
};