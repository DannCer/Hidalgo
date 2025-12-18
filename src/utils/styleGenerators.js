import L from "leaflet";
import { COLORS } from "./colors";
import { basePointStyle, basePolygonStyle } from "./baseStyles";

/**
 * Función transformadora por defecto para convertir valores de propiedades
 * Convierte valores a números flotantes, retorna 0 si no es convertible
 * @param {any} v - Valor a transformar
 * @returns {number} Valor numérico transformado
 */
const defaultTransform = (v) => parseFloat(v) || 0;

/**
 * Obtiene valores por defecto para estilos basados en el tipo de geometría
 * @param {Array} items - Array de items de leyenda
 * @param {string} type - Tipo de geometría ('point' o 'polygon')
 * @returns {Object} Configuración por defecto de estilos
 */
const getStyleDefaults = (items, type) => ({
  borderColor: items[0]?.borderColor || COLORS.BLACK,  // Color de borde o negro por defecto
  defaultColor: COLORS.LIGHT_GRAY,                     // Color por defecto (gris claro)
  baseStyle: type === "point" ? basePointStyle : basePolygonStyle  // Estilo base según tipo
});

/**
 * Crea una función de estilo basada en rangos numéricos a partir de datos de leyenda
 * Asigna colores según rangos predefinidos de valores
 * 
 * @param {string} propertyName - Nombre de la propiedad a evaluar en los features
 * @param {Array} items - Array de objetos de leyenda con rangos y colores
 * @param {string} type - Tipo de geometría ('point' o 'polygon')
 * @param {Function} transform - Función para transformar valores (por defecto parseFloat)
 * @returns {Function} Función de estilo de Leaflet
 */
export function createRangedStyleFromLegend(
  propertyName,
  items,
  type = "polygon",
  transform = defaultTransform
) {
  // Procesar rangos: convertir valores Infinity y aplicar transformación
  const ranges = items.map(item => ({
    limit: item.value === "Infinity" || item.value === Infinity
      ? Infinity  // Manejo especial para valores infinitos
      : transform(item.value),
    color: item.color
  }));

  // Obtener valores por defecto
  const { borderColor, defaultColor, baseStyle } = getStyleDefaults(items, type);

  /**
   * Función de estilo que se ejecuta por cada feature
   * @param {Object} feature - Feature de GeoJSON
   * @param {L.LatLng} latlng - Coordenadas para puntos
   * @returns {L.Path|Object} Estilo aplicado
   */
  return (feature, latlng) => {
    // Obtener y transformar el valor de la propiedad
    const value = transform(feature.properties[propertyName]);

    // Encontrar el primer rango cuyo límite sea mayor o igual al valor
    const fillColor = ranges.find(r => value <= r.limit)?.color || defaultColor;

    // Retornar estilo según tipo de geometría
    return type === "point"
      // Para puntos: crear circleMarker con opacidad completa
      ? L.circleMarker(latlng, { ...baseStyle, fillColor, fillOpacity: 0.9 })
      // Para polígonos: retornar objeto de estilo
      : { ...baseStyle, fillColor, color: borderColor };
  };
}

/**
 * Crea una función de estilo basada en categorías a partir de datos de leyenda
 * Asigna colores según valores categóricos (etiquetas)
 * 
 * @param {string} propertyName - Nombre de la propiedad categórica
 * @param {Array} items - Array de objetos de leyenda con etiquetas y colores
 * @param {string} type - Tipo de geometría ('point' o 'polygon')
 * @returns {Function} Función de estilo de Leaflet
 */
export function createCategoricalStyleFromLegend(
  propertyName,
  items,
  type = "polygon"
) {
  // Crear mapa de colores para búsqueda rápida por etiqueta
  const colorMap = new Map(items.map(item => [item.label, item.color]));

  // Obtener valores por defecto
  const { borderColor, defaultColor, baseStyle } = getStyleDefaults(items, type);

  /**
   * Función de estilo que se ejecuta por cada feature
   * @param {Object} feature - Feature de GeoJSON
   * @param {L.LatLng} latlng - Coordenadas para puntos
   * @returns {L.Path|Object} Estilo aplicado
   */
  return (feature, latlng) => {
    const value = feature.properties[propertyName];
    // Buscar color por etiqueta, usar color por defecto si no existe
    const fillColor = colorMap.get(value) || defaultColor;

    // Retornar estilo según tipo de geometría
    return type === "point"
      ? L.circleMarker(latlng, { ...baseStyle, fillColor, fillOpacity: 0.9 })
      : { ...baseStyle, fillColor, color: borderColor };
  };
}