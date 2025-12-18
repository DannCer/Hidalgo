/**
 * @fileoverview Constantes globales de la aplicación.
 * 
 * Centraliza valores constantes utilizados en toda la aplicación,
 * incluyendo configuración de sequías, colores, etiquetas y
 * parámetros de rendimiento.
 * 
 * @module utils/constants
 */

import { config } from '../config/env';

// ============================================================================
// RE-EXPORTACIONES DE CONFIG
// ============================================================================

/**
 * Configuración de la capa de sequías.
 * Re-exportado desde config/env.js para acceso conveniente.
 */
export { SEQUIA_CONFIG, BASE_LAYERS } from '../config/env';

// ============================================================================
// CONSTANTES DE SEQUÍAS
// ============================================================================

/**
 * Códigos de intensidad de sequía según el Monitor de Sequía de México.
 * Basado en la clasificación del Servicio Meteorológico Nacional.
 * 
 * @constant
 * @type {Object.<string, string>}
 */
export const SEQUIA_INTENSIDADES = {
  ANORMALMENTE_SECO: 'D0',   // Sin sequía pero con condiciones anormales
  SEQUIA_MODERADA: 'D1',     // Impactos menores
  SEQUIA_SEVERA: 'D2',       // Impactos moderados
  SEQUIA_EXTREMA: 'D3',      // Impactos severos
  SEQUIA_EXCEPCIONAL: 'D4'   // Impactos excepcionales
};

/**
 * Colores para cada nivel de intensidad de sequía.
 * Paleta oficial del Monitor de Sequía de México.
 * 
 * @constant
 * @type {Object.<string, string>}
 */
export const SEQUIA_COLORS = {
  D0: '#FFFF00',  // Amarillo - Anormalmente seco
  D1: '#FCD37F',  // Amarillo claro - Sequía moderada
  D2: '#FFAA00',  // Naranja - Sequía severa
  D3: '#E60000',  // Rojo - Sequía extrema
  D4: '#730000',  // Rojo oscuro - Sequía excepcional
};

/**
 * Etiquetas legibles para cada nivel de sequía.
 * 
 * @constant
 * @type {Object.<string, string>}
 */
export const SEQUIA_LABELS = {
  D0: 'Anormalmente Seco',
  D1: 'Sequía Moderada',
  D2: 'Sequía Severa',
  D3: 'Sequía Extrema',
  D4: 'Sequía Excepcional'
};

// ============================================================================
// CONFIGURACIÓN DEL MAPA
// ============================================================================

/**
 * Configuración del mapa (desde env.js).
 * 
 * @constant
 * @type {Object}
 */
export const MAP_CONFIG = config.map;

// ============================================================================
// CONFIGURACIÓN DE RENDIMIENTO
// ============================================================================

/**
 * Parámetros de rendimiento para optimizar la aplicación.
 * 
 * @constant
 * @type {Object}
 */
export const PERFORMANCE_CONFIG = {
  /** Throttle para eventos del mapa (pan, zoom) en ms */
  mapEventThrottle: 100,
  
  /** Debounce para búsqueda de texto en ms */
  searchDebounce: 500,
  
  /** Tamaño de lote para renderizado de features */
  featureBatchSize: 100,
  
  /** Delay entre lotes de renderizado en ms */
  batchDelayMs: 10,
  
  /** Habilitar virtualización de listas largas */
  enableVirtualization: true,
  
  /** Umbral de elementos para activar virtualización */
  virtualScrollThreshold: 500
};

// ============================================================================
// MENSAJES DE ERROR
// ============================================================================

/**
 * Mensajes de error localizados (español).
 * 
 * @constant
 * @type {Object.<string, string>}
 */
export const ERROR_MESSAGES = {
  FETCH_FAILED: 'Error al cargar los datos. Por favor, intente nuevamente.',
  INVALID_QUINCENA: 'La quincena seleccionada no es válida.',
  NO_DATA: 'No hay datos disponibles para la quincena seleccionada.',
  NETWORK_ERROR: 'Error de conexión. Verifique su conexión a internet.',
  TIMEOUT: 'La petición ha tardado demasiado. Por favor, intente nuevamente.'
};

// ============================================================================
// CONFIGURACIÓN DE DEBUG
// ============================================================================

/**
 * Configuración de logging y debug.
 * 
 * @constant
 * @type {Object}
 */
export const DEBUG_CONFIG = {
  /** Habilitar logs en consola */
  enableConsoleLog: config.app.debug,
  
  /** Nivel de log: 'debug' | 'info' | 'warn' | 'error' */
  logLevel: 'info',
  
  /** Log cambios de timeline */
  logTimeline: true,
  
  /** Log cambios de capas */
  logLayerChanges: true,
  
  /** Log actualizaciones de estilos (verbose) */
  logStyleUpdates: false
};
