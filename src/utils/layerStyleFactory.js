import L from "leaflet";
import { basePointStyle, basePolygonStyle, styleOutlineRed } from "./baseStyles";
import { COLORS } from "./colors";
import { createRangedStyleFromLegend, createCategoricalStyleFromLegend } from "./styleGenerators";
import { legendData } from "./legendData";

const pointToLayerGeneric = (feature, latlng) =>
  L.circleMarker(latlng, { ...basePointStyle, fillColor: COLORS.DEFAULT });

//  Cache para forzar actualizaciones de estilo
let styleCache = {};
let cacheVersion = 0;

export function getLayerOptions(layerName, variant = null, forceUpdate = false) {
  
  //  Cache busting para sequías
  const isSequiaLayer = layerName === "Hidalgo:04_sequias";
  if (isSequiaLayer && forceUpdate) {
    cacheVersion++;
  }

  const cacheKey = `${layerName}-${variant}-${cacheVersion}`;
  
  //  Usar cache para evitar recreaciones innecesarias
  if (styleCache[cacheKey] && !forceUpdate) {
    return styleCache[cacheKey];
  }

  const baseOptions = { 
    onEachFeature: (feature, layer) => {
      //  Asegurar que los estilos se aplican inmediatamente
      if (isSequiaLayer) {
        setTimeout(() => {
          if (layer.setStyle) {
            const style = getStyleFunction(layerName, legend, variant);
            if (typeof style === 'function') {
              layer.setStyle(style(feature));
            } else {
              layer.setStyle(style);
            }
          }
        }, 0);
      }
    }
  };

  const legend = legendData[layerName];

  if (!legend) {
    const result = { ...baseOptions, style: { ...basePolygonStyle, fillColor: COLORS.LIGHT_GRAY } };
    styleCache[cacheKey] = result;
    return result;
  }

  let activeLegend = legend;
  let styleFunction;
  let isPointLayer = false;

  // Función auxiliar para obtener la función de estilo
  const getStyleFunction = (layerName, legend, variant) => {
    let styleFunc;
    let isPoint = false;

    // Variants
    if (legend.variants) {
      const activeVariantKey = variant || Object.keys(legend.variants)[0];
      const currentLegend = legend.variants[activeVariantKey];
      const propertyName = currentLegend.propertyName || activeVariantKey;

      if (currentLegend.type === "ranged-polygon") {
        styleFunc = createRangedStyleFromLegend(propertyName, currentLegend.items, "polygon");
      } else if (currentLegend.type === "categorical-polygon") {
        styleFunc = createCategoricalStyleFromLegend(propertyName, currentLegend.items, "polygon");
      }
    } else {
      // No variants - código existente
      switch (legend.type) {
        case "ranged-polygon":
          styleFunc = createRangedStyleFromLegend(legend.propertyName, legend.items, "polygon");
          break;

        case "categorical-polygon":
          styleFunc = createCategoricalStyleFromLegend(legend.propertyName, legend.items, "polygon");
          break;

        case "ranged-point":
          styleFunc = createRangedStyleFromLegend(legend.propertyName, legend.items, "point");
          isPoint = true;
          break;

        case "categorical-point":
          styleFunc = createCategoricalStyleFromLegend(legend.propertyName, legend.items, "point");
          isPoint = true;
          break;

        case "point":
          const pointColor = legend.items[0]?.color;
          styleFunc = (feature, latlng) =>
            L.circleMarker(latlng, { ...basePointStyle, fillColor: pointColor || COLORS.DEFAULT });
          isPoint = true;
          break;

        case "polygon":
          if (layerName === "Hidalgo:00_Municipios") {
            styleFunc = () => styleOutlineRed;
          } else if (layerName === "Hidalgo:00_Estado") {
            styleFunc = () => ({
              ...basePolygonStyle,
              color: COLORS.BLACK,
              weight: 5, 
              opacity: 1,
              fillOpacity: 0,
              dashArray: '10, 5',
            });
          } else {
            const polygonColor = legend.items[0]?.color;
            const polygonBorderColor = legend.items[0]?.borderColor || COLORS.BLACK;
            styleFunc = () => ({ ...basePolygonStyle, fillColor: polygonColor, color: polygonBorderColor });
          }
          break;

        default:
          styleFunc = () => ({ ...basePolygonStyle, fillColor: COLORS.LIGHT_GRAY });
      }
    }

    return { styleFunc, isPoint };
  };

  const { styleFunc, isPoint } = getStyleFunction(layerName, activeLegend, variant);
  styleFunction = styleFunc;
  isPointLayer = isPoint;

  const result = isPointLayer
    ? { ...baseOptions, pointToLayer: styleFunction }
    : { ...baseOptions, style: styleFunction };

  //  Cachear el resultado
  styleCache[cacheKey] = result;
  
  //  Limpiar cache periódicamente para sequías
  if (isSequiaLayer) {
    setTimeout(() => {
      delete styleCache[cacheKey];
    }, 5000);
  }

  return result;
}

//  Función para forzar actualización de estilos
export function forceStyleUpdate() {
  cacheVersion++;
}

//  Función para limpiar cache específico
export function clearStyleCache(layerName = null) {
  if (layerName) {
    Object.keys(styleCache).forEach(key => {
      if (key.startsWith(layerName)) {
        delete styleCache[key];
      }
    });
  } else {
    styleCache = {};
  }
}