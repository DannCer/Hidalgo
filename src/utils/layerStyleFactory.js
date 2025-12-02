import L from "leaflet";
import { basePointStyle, basePolygonStyle, styleOutlineRed } from "./baseStyles";
import { COLORS } from "./colors";
import { createRangedStyleFromLegend, createCategoricalStyleFromLegend } from "./styleGenerators";
import { legendData } from "./legendData";

const LEGEND_MAPPING = {
  'Hidalgo:01_spsitios': 'Hidalgo:01_sitios',
  'Hidalgo:01_sbsitios': 'Hidalgo:01_sitios',
  'Hidalgo:01_sbcalidadagua': 'Hidalgo:01_calidadagua',
  'Hidalgo:01_spcalidadagua': 'Hidalgo:01_calidadagua',
};

const SPECIAL_LAYERS = {
  MUNICIPIOS: 'Hidalgo:00_Municipios',
  ESTADO: 'Hidalgo:00_Estado',
  SEQUIAS: 'Hidalgo:04_sequias',
};

class StyleCache {
  constructor() {
    this.cache = new Map();
    this.version = 0;
  }

  get(key) {
    return this.cache.get(key);
  }

  set(key, value) {
    this.cache.set(key, value);
  }

  getCacheKey(layerName, variant) {
    return `${layerName}:${variant || 'default'}:v${this.version}`;
  }

  invalidate(layerName = null) {
    if (layerName) {
      const prefix = `${layerName}:`;
      for (const key of this.cache.keys()) {
        if (key.startsWith(prefix)) this.cache.delete(key);
      }
    } else {
      this.cache.clear();
    }
  }

  incrementVersion() {
    this.version++;
  }
}

const cache = new StyleCache();

const getLegendKey = (layerName) => LEGEND_MAPPING[layerName] || layerName;

const getPointColor = (layerName, items) => {
  if (items.length <= 1) return items[0]?.color || COLORS.DEFAULT;
  const idx = layerName.includes('sp') ? 0 : layerName.includes('sb') ? 1 : 0;
  return items[idx]?.color || COLORS.DEFAULT;
};

const createPointLayerStyle = (legendKey, layerName, legend) => {
  const color = getPointColor(layerName, legend.items);
  return (feature, latlng) => L.circleMarker(latlng, {
    ...basePointStyle,
    fillColor: color
  });
};

const createPolygonLayerStyle = (legendKey, legend) => {

  if (legendKey === SPECIAL_LAYERS.MUNICIPIOS) {
    return () => styleOutlineRed;
  }

  if (legendKey === SPECIAL_LAYERS.ESTADO) {
    return () => ({
      ...basePolygonStyle,
      color: COLORS.BLACK,
      weight: 5,
      opacity: 1,
      fillOpacity: 0,
      dashArray: '10, 5',
    });
  }


  const { color: fillColor = COLORS.LIGHT_GRAY, borderColor = COLORS.BLACK } = legend.items[0] || {};
  return () => ({ ...basePolygonStyle, fillColor, color: borderColor });
};

const getActiveVariant = (legend, variant) => {
  if (!legend.variants) return null;
  const variantKey = variant || Object.keys(legend.variants)[0];
  return {
    key: variantKey,
    data: legend.variants[variantKey]
  };
};

const createStyleFromLegend = (legendKey, layerName, legend, variant) => {

  const activeVariant = getActiveVariant(legend, variant);
  if (activeVariant) {
    const { key, data } = activeVariant;
    const propertyName = data.propertyName || key;

    if (data.type === "ranged-polygon") {
      return {
        styleFunc: createRangedStyleFromLegend(propertyName, data.items, "polygon"),
        isPoint: false
      };
    }

    if (data.type === "categorical-polygon") {
      return {
        styleFunc: createCategoricalStyleFromLegend(propertyName, data.items, "polygon"),
        isPoint: false
      };
    }
  }


  const { type, propertyName, items } = legend;

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

  return (styleMap[type] || (() => ({
    styleFunc: () => ({ ...basePolygonStyle, fillColor: COLORS.LIGHT_GRAY }),
    isPoint: false
  })))();
};

export function getLayerOptions(layerName, variant = null, forceUpdate = false) {
  const isSequiaLayer = layerName === SPECIAL_LAYERS.SEQUIAS;


  if (isSequiaLayer && forceUpdate) {
    cache.incrementVersion();
  }

  const cacheKey = cache.getCacheKey(layerName, variant);


  if (!forceUpdate && cache.get(cacheKey)) {
    return cache.get(cacheKey);
  }


  const legendKey = getLegendKey(layerName);
  const legend = legendData[legendKey];


  if (!legend) {
    const result = {
      style: { ...basePolygonStyle, fillColor: COLORS.LIGHT_GRAY }
    };
    cache.set(cacheKey, result);
    return result;
  }


  const { styleFunc, isPoint } = createStyleFromLegend(legendKey, layerName, legend, variant);


  const result = {
    ...(isPoint ? { pointToLayer: styleFunc } : { style: styleFunc }),
    onEachFeature: (feature, layer) => {
      if (isSequiaLayer && layer.setStyle) {

        setTimeout(() => {
          const style = typeof styleFunc === 'function' ? styleFunc(feature) : styleFunc;
          layer.setStyle(style);
        }, 0);
      }
    }
  };

  cache.set(cacheKey, result);
  return result;
}

export const forceStyleUpdate = () => {
  cache.incrementVersion();
  return cache.version;
};

export const clearStyleCache = (layerName = null) => {
  cache.invalidate(layerName);
  return layerName ? 'partial' : 'full';
};

export const getCacheInfo = () => ({
  size: cache.cache.size,
  version: cache.version,
  keys: Array.from(cache.cache.keys())
});