/**
 * @fileoverview Paleta de colores de la aplicación.
 * 
 * Define los colores utilizados para estilizar las capas geoespaciales
 * y elementos de la interfaz de usuario.
 * 
 * @module utils/colors
 */

/**
 * Paleta de colores constantes.
 * Usado por styleGenerators.js y otros componentes para mantener
 * consistencia visual en toda la aplicación.
 * 
 * @constant
 * @type {Object.<string, string>}
 * 
 * @property {string} WATER - Azul para cuerpos de agua
 * @property {string} PROTECTED_AREA - Verde para áreas protegidas
 * @property {string} WETLAND - Verde claro para humedales
 * @property {string} EMERGENCY - Amarillo para emergencias/alertas
 * @property {string} DISCHARGE - Morado para descargas
 * @property {string} BLACK - Negro para bordes
 * @property {string} RED - Rojo para resaltados
 * @property {string} GREEN - Verde oscuro institucional
 * @property {string} LIGHT_GREEN - Verde claro
 * @property {string} LIGHT_GRAY - Gris claro para fondos
 * @property {string} BORDER_GRAY - Gris para bordes
 * @property {string} YELLOW - Amarillo brillante
 * @property {string} WHITE - Blanco
 * @property {string} DEFAULT - Color por defecto (guinda institucional)
 * @property {string} COMISIONES_CUENCA - Azul para comisiones de cuenca
 * @property {string} COMITES_CUENCA - Verde para comités de cuenca
 * @property {string} COTAS - Morado para COTAS
 */
export const COLORS = {
  /** Azul agua - #2E86C1 */
  WATER: '#2E86C1',
  
  /** Verde área protegida - #239B56 */
  PROTECTED_AREA: '#239B56',
  
  /** Verde claro humedal - #A9DFBF */
  WETLAND: '#A9DFBF',
  
  /** Amarillo emergencia - #F1C40F */
  EMERGENCY: '#F1C40F',
  
  /** Morado descarga - #8E44AD */
  DISCHARGE: '#8E44AD',
  
  /** Negro - #000000 */
  BLACK: '#000000',
  
  /** Rojo - #ff0000 */
  RED: '#ff0000',
  
  /** Verde oscuro - #106836 */
  GREEN: '#106836ff',
  
  /** Verde claro - #2ec16b */
  LIGHT_GREEN: '#2ec16bff',
  
  /** Gris claro - #f0f0f0 */
  LIGHT_GRAY: '#f0f0f0',
  
  /** Gris borde - #cccccc */
  BORDER_GRAY: '#cccccc',
  
  /** Amarillo - #FFFF00 */
  YELLOW: '#FFFF00',
  
  /** Blanco - #ffffff */
  WHITE: '#ffffff',
  
  /** Guinda institucional - #A02142 */
  DEFAULT: '#A02142',
  
  /** Azul comisiones - #3498DB */
  COMISIONES_CUENCA: '#3498DB',
  
  /** Verde comités - #2ECC71 */
  COMITES_CUENCA: '#2ECC71',
  
  /** Morado COTAS - #9B59B6 */
  COTAS: '#9B59B6'
};
