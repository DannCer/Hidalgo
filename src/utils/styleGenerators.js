// styles/styleGenerators.js
import L from "leaflet";
import { COLORS } from "./colors";
import { basePointStyle, basePolygonStyle } from "./baseStyles";

/**
 * Generador para estilos con rangos numéricos (puntos y polígonos).
 */
export function createRangedStyleFromLegend(propertyName, items, type = "polygon", transform = v => parseFloat(v) || 0) {
  const ranges = items.map(item => ({
    limit: item.value === "Infinity" || item.value === Infinity ? Infinity : transform(item.value),
    color: item.color
  }));

  const borderColor = items[0]?.borderColor || COLORS.BLACK;

  return (feature, latlng) => {
    const featureValue = transform(feature.properties[propertyName]);
    let fillColor = COLORS.LIGHT_GRAY;

    for (const range of ranges) {
      if (featureValue <= range.limit) {
        fillColor = range.color;
        break;
      }
    }

    if (type === "point") {
      return L.circleMarker(latlng, { ...basePointStyle, fillColor, fillOpacity: 0.9 });
    }

    return { ...basePolygonStyle, fillColor, color: borderColor };
  };
}

/**
 * Generador para estilos categóricos.
 */
export function createCategoricalStyleFromLegend(propertyName, items, type = "polygon") {
  const colorMapping = items.reduce((map, item) => {
    map[item.label] = item.color;
    return map;
  }, {});

  const borderColor = items[0]?.borderColor || COLORS.BLACK;

  return (feature, latlng) => {
    const value = feature.properties[propertyName];
    const fillColor = colorMapping[value] || COLORS.LIGHT_GRAY;

    if (type === "point") {
      return L.circleMarker(latlng, { ...basePointStyle, fillColor, fillOpacity: 0.9 });
    }

    return { ...basePolygonStyle, fillColor, color: borderColor };
  };
}
