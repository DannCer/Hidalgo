import L from "leaflet";
import { COLORS } from "./colors";
import { basePointStyle, basePolygonStyle } from "./baseStyles";

const defaultTransform = (v) => parseFloat(v) || 0;

const getStyleDefaults = (items, type) => ({
  borderColor: items[0]?.borderColor || COLORS.BLACK,
  defaultColor: COLORS.LIGHT_GRAY,
  baseStyle: type === "point" ? basePointStyle : basePolygonStyle
});

export function createRangedStyleFromLegend(
  propertyName,
  items,
  type = "polygon",
  transform = defaultTransform
) {

  const ranges = items.map(item => ({
    limit: item.value === "Infinity" || item.value === Infinity
      ? Infinity
      : transform(item.value),
    color: item.color
  }));

  const { borderColor, defaultColor, baseStyle } = getStyleDefaults(items, type);

  return (feature, latlng) => {
    const value = transform(feature.properties[propertyName]);


    const fillColor = ranges.find(r => value <= r.limit)?.color || defaultColor;


    return type === "point"
      ? L.circleMarker(latlng, { ...baseStyle, fillColor, fillOpacity: 0.9 })
      : { ...baseStyle, fillColor, color: borderColor };
  };
}

export function createCategoricalStyleFromLegend(
  propertyName,
  items,
  type = "polygon"
) {

  const colorMap = new Map(items.map(item => [item.label, item.color]));

  const { borderColor, defaultColor, baseStyle } = getStyleDefaults(items, type);

  return (feature, latlng) => {
    const value = feature.properties[propertyName];
    const fillColor = colorMap.get(value) || defaultColor;

    return type === "point"
      ? L.circleMarker(latlng, { ...baseStyle, fillColor, fillOpacity: 0.9 })
      : { ...baseStyle, fillColor, color: borderColor };
  };
}