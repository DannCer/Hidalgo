/**
 * @fileoverview Estilos base para capas geoespaciales.
 * 
 * Define los estilos predeterminados para diferentes tipos de geometría
 * (puntos, polígonos) que se usan como base para los estilos específicos
 * de cada capa.
 * 
 * @module utils/baseStyles
 */

import { COLORS } from "./colors";

/**
 * Estilo base para geometrías de punto.
 * Se usa como punto de partida para capas con marcadores circulares.
 * 
 * @constant
 * @type {Object}
 * @property {number} radius - Radio del círculo en píxeles
 * @property {string} color - Color del borde
 * @property {number} weight - Grosor del borde en píxeles
 * @property {number} opacity - Opacidad del borde (0-1)
 * @property {number} fillOpacity - Opacidad del relleno (0-1)
 */
export const basePointStyle = {
  radius: 6,
  color: COLORS.BLACK,
  weight: 1,
  opacity: 1,
  fillOpacity: 0.8
};

/**
 * Estilo base para geometrías de polígono.
 * Se usa como punto de partida para capas con áreas/superficies.
 * 
 * @constant
 * @type {Object}
 * @property {string} color - Color del borde
 * @property {number} weight - Grosor del borde en píxeles
 * @property {number} fillOpacity - Opacidad del relleno (0-1)
 */
export const basePolygonStyle = {
  color: COLORS.BLACK,
  weight: 1,
  fillOpacity: 0.7
};

/**
 * Estilo para resaltar features (solo contorno rojo).
 * Se usa para destacar elementos seleccionados o en hover.
 * 
 * @constant
 * @type {Object}
 * @property {number} fillOpacity - Sin relleno (transparente)
 * @property {number} weight - Borde más grueso para destacar
 * @property {string} color - Rojo para visibilidad
 */
export const styleOutlineRed = {
  fillOpacity: 0,
  weight: 2,
  color: COLORS.RED
};
