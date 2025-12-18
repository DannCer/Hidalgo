import L from "leaflet";
import { basePointStyle, basePolygonStyle, styleOutlineRed } from "./baseStyles";
import { COLORS } from "./colors";
import { createRangedStyleFromLegend, createCategoricalStyleFromLegend } from "./styleGenerators";
import { legendData } from "./legendData";

/**
 * Mapeo de nombres de capas a claves de leyenda.
 * Permite reutilizar leyendas para múltiples capas relacionadas.
 */
const LEGEND_MAPPING = {
  'Hidalgo:01_spsitios': 'Hidalgo:01_sitios',          // Sitios superficiales
  'Hidalgo:01_sbsitios': 'Hidalgo:01_sitios',          // Sitios subterráneos
  'Hidalgo:01_sbcalidadagua': 'Hidalgo:01_calidadagua', // Calidad agua subterránea
  'Hidalgo:01_spcalidadagua': 'Hidalgo:01_calidadagua', // Calidad agua superficial
};

/**
 * Nombres especiales de capas que requieren tratamiento específico
 */
const SPECIAL_LAYERS = {
  MUNICIPIOS: 'Hidalgo:00_Municipios',  // Capa de límites municipales
  ESTADO: 'Hidalgo:00_Estado',          // Capa de límite estatal
  SEQUIAS: 'Hidalgo:04_sequias',        // Capa de sequías (requiere actualización dinámica)
};

/**
 * Sistema de caché para estilos de capas.
 * Optimiza rendimiento almacenando estilos ya calculados.
 */
class StyleCache {
  constructor() {
    this.cache = new Map();  // Almacén de estilos calculados
    this.version = 0;        // Versión para invalidar caché
  }

  /**
   * Obtiene un estilo de la caché
   * @param {string} key - Clave de caché
   * @returns {Object|null} Estilo almacenado o null
   */
  get(key) {
    return this.cache.get(key);
  }

  /**
   * Almacena un estilo en la caché
   * @param {string} key - Clave de caché
   * @param {Object} value - Estilo a almacenar
   */
  set(key, value) {
    this.cache.set(key, value);
  }

  /**
   * Genera una clave única para identificar estilos en caché
   * Incluye nombre de capa, variante y versión
   * @param {string} layerName - Nombre de la capa
   * @param {string} variant - Variante de estilo (opcional)
   * @returns {string} Clave de caché
   */
  getCacheKey(layerName, variant) {
    return `${layerName}:${variant || 'default'}:v${this.version}`;
  }

  /**
   * Invalida entradas de caché
   * @param {string|null} layerName - Nombre de capa específica o null para limpiar todo
   */
  invalidate(layerName = null) {
    if (layerName) {
      // Eliminar solo entradas para la capa específica
      const prefix = `${layerName}:`;
      for (const key of this.cache.keys()) {
        if (key.startsWith(prefix)) this.cache.delete(key);
      }
    } else {
      // Limpiar toda la caché
      this.cache.clear();
    }
  }

  /**
   * Incrementa la versión de caché para forzar recálculo
   */
  incrementVersion() {
    this.version++;
  }
}

// Instancia global de caché
const cache = new StyleCache();

/**
 * Obtiene la clave de leyenda para una capa
 * Usa mapeo si existe, de lo contrario retorna el nombre original
 * @param {string} layerName - Nombre de la capa
 * @returns {string} Clave de leyenda
 */
const getLegendKey = (layerName) => LEGEND_MAPPING[layerName] || layerName;

/**
 * Determina el color para capas de puntos según el tipo de capa
 * @param {string} layerName - Nombre de la capa
 * @param {Array} items - Items de leyenda
 * @returns {string} Color a aplicar
 */
const getPointColor = (layerName, items) => {
  if (items.length <= 1) return items[0]?.color || COLORS.DEFAULT;
  
  // Asignar color según prefijo de capa (sp=superficial, sb=subterráneo)
  const idx = layerName.includes('sp') ? 0 : layerName.includes('sb') ? 1 : 0;
  return items[idx]?.color || COLORS.DEFAULT;
};

/**
 * Crea función de estilo para capas de puntos simples
 * @param {string} legendKey - Clave de leyenda
 * @param {string} layerName - Nombre de la capa
 * @param {Object} legend - Datos de leyenda
 * @returns {Function} Función de estilo para puntos
 */
const createPointLayerStyle = (legendKey, layerName, legend) => {
  const color = getPointColor(layerName, legend.items);
  return (feature, latlng) => L.circleMarker(latlng, {
    ...basePointStyle,
    fillColor: color
  });
};

/**
 * Crea función de estilo para capas de polígonos especiales
 * @param {string} legendKey - Clave de leyenda
 * @param {Object} legend - Datos de leyenda
 * @returns {Function} Función de estilo para polígonos
 */
const createPolygonLayerStyle = (legendKey, legend) => {
  // Estilo específico para límites municipales (borde rojo)
  if (legendKey === SPECIAL_LAYERS.MUNICIPIOS) {
    return () => styleOutlineRed;
  }

  // Estilo específico para límite estatal (borde negro con guiones)
  if (legendKey === SPECIAL_LAYERS.ESTADO) {
    return () => ({
      ...basePolygonStyle,
      color: COLORS.BLACK,
      weight: 5,          // Línea más gruesa
      opacity: 1,
      fillOpacity: 0,     // Sin relleno
      dashArray: '10, 5', // Línea discontinua
    });
  }

  // Estilo por defecto para polígonos (primer item de leyenda)
  const { color: fillColor = COLORS.LIGHT_GRAY, borderColor = COLORS.BLACK } = legend.items[0] || {};
  return () => ({ ...basePolygonStyle, fillColor, color: borderColor });
};

/**
 * Obtiene la variante activa de una leyenda con variantes
 * @param {Object} legend - Datos de leyenda
 * @param {string} variant - Nombre de variante solicitada
 * @returns {Object|null} Información de variante activa
 */
const getActiveVariant = (legend, variant) => {
  if (!legend.variants) return null;
  
  // Usar variante solicitada o primera disponible
  const variantKey = variant || Object.keys(legend.variants)[0];
  return {
    key: variantKey,
    data: legend.variants[variantKey]
  };
};

/**
 * Crea función de estilo a partir de datos de leyenda
 * Maneja diferentes tipos de leyenda y variantes
 * @param {string} legendKey - Clave de leyenda
 * @param {string} layerName - Nombre de la capa
 * @param {Object} legend - Datos de leyenda
 * @param {string} variant - Variante específica (opcional)
 * @returns {Object} Objeto con función de estilo y tipo de geometría
 */
const createStyleFromLegend = (legendKey, layerName, legend, variant) => {
  // Manejar capas con variantes (múltiples representaciones)
  const activeVariant = getActiveVariant(legend, variant);
  if (activeVariant) {
    const { key, data } = activeVariant;
    const propertyName = data.propertyName || key;

    // Estilo de polígonos con rangos
    if (data.type === "ranged-polygon") {
      return {
        styleFunc: createRangedStyleFromLegend(propertyName, data.items, "polygon"),
        isPoint: false
      };
    }

    // Estilo de polígonos categóricos
    if (data.type === "categorical-polygon") {
      return {
        styleFunc: createCategoricalStyleFromLegend(propertyName, data.items, "polygon"),
        isPoint: false
      };
    }
  }

  // Extraer propiedades básicas de leyenda
  const { type, propertyName, items } = legend;

  // Mapa de funciones creadoras de estilo por tipo de leyenda
  const styleMap = {
    "ranged-polygon": () => ({
      styleFunc: createRangedStyleFromLegend(propertyName, items, "polygon"),
      isPoint: false
    }),
    "categorical-polygon": () => ({
      styleFunc: createCategoricalStyleFromLegend(propertyName, items, "polygon"),
      isPoint: false
    }),
    "ranged-point": () => ({
      styleFunc: createRangedStyleFromLegend(propertyName, items, "point"),
      isPoint: true
    }),
    "categorical-point": () => ({
      styleFunc: createCategoricalStyleFromLegend(propertyName, items, "point"),
      isPoint: true
    }),
    "point": () => ({
      styleFunc: createPointLayerStyle(legendKey, layerName, legend),
      isPoint: true
    }),
    "polygon": () => ({
      styleFunc: createPolygonLayerStyle(legendKey, legend),
      isPoint: false
    })
  };

  // Ejecutar función correspondiente o retornar estilo por defecto
  return (styleMap[type] || (() => ({
    styleFunc: () => ({ ...basePolygonStyle, fillColor: COLORS.LIGHT_GRAY }),
    isPoint: false
  })))();
};

/**
 * Obtiene opciones de estilo para una capa específica
 * Usa caché para optimizar rendimiento
 * 
 * @param {string} layerName - Nombre de la capa
 * @param {string} variant - Variante de estilo (opcional)
 * @param {boolean} forceUpdate - Forzar actualización ignorando caché
 * @returns {Object} Opciones de estilo para la capa
 */
export function getLayerOptions(layerName, variant = null, forceUpdate = false) {
  const isSequiaLayer = layerName === SPECIAL_LAYERS.SEQUIAS;

  // Forzar actualización de caché para capas dinámicas (como sequías)
  if (isSequiaLayer && forceUpdate) {
    cache.incrementVersion();
  }

  const cacheKey = cache.getCacheKey(layerName, variant);

  // Retornar de caché si existe y no se fuerza actualización
  if (!forceUpdate && cache.get(cacheKey)) {
    return cache.get(cacheKey);
  }

  // Obtener datos de leyenda
  const legendKey = getLegendKey(layerName);
  const legend = legendData[legendKey];

  // Retornar estilo por defecto si no hay leyenda
  if (!legend) {
    const result = {
      style: { ...basePolygonStyle, fillColor: COLORS.LIGHT_GRAY }
    };
    cache.set(cacheKey, result);
    return result;
  }

  // Crear función de estilo según tipo de leyenda
  const { styleFunc, isPoint } = createStyleFromLegend(legendKey, layerName, legend, variant);

  // Construir objeto de opciones para Leaflet
  const result = {
    // Diferentes propiedades según tipo de geometría
    ...(isPoint ? { pointToLayer: styleFunc } : { style: styleFunc }),
    
    // Callback para manejar estilos por feature (especialmente para sequías)
    onEachFeature: (feature, layer) => {
      if (isSequiaLayer && layer.setStyle) {
        // Aplicar estilo con timeout para evitar conflictos de renderizado
        setTimeout(() => {
          const style = typeof styleFunc === 'function' ? styleFunc(feature) : styleFunc;
          layer.setStyle(style);
        }, 0);
      }
    }
  };

  // Almacenar en caché y retornar
  cache.set(cacheKey, result);
  return result;
}

/**
 * Fuerza la actualización de todos los estilos incrementando la versión de caché
 * Útil cuando se cambian variantes o datos dinámicos
 * @returns {number} Nueva versión de caché
 */
export const forceStyleUpdate = () => {
  cache.incrementVersion();
  return cache.version;
};

/**
 * Limpia la caché de estilos
 * @param {string|null} layerName - Nombre de capa específica o null para todas
 * @returns {string} Tipo de limpieza realizada
 */
export const clearStyleCache = (layerName = null) => {
  cache.invalidate(layerName);
  return layerName ? 'partial' : 'full';
};

/**
 * Obtiene información de depuración de la caché
 * @returns {Object} Información de estado de caché
 */
export const getCacheInfo = () => ({
  size: cache.cache.size,              // Número de entradas
  version: cache.version,              // Versión actual
  keys: Array.from(cache.cache.keys()) // Lista de claves
});