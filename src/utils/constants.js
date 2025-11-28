// src/utils/constants.js
// ============================================
// CONSTANTES DEL DOMINIO
// ============================================
// Las configuraciones de entorno están en src/config/env.js
// Este archivo contiene solo constantes del dominio de negocio
// ============================================

import { config } from '../config/env';

/**
 * Re-exportamos la configuración de sequías desde env.js
 * para mantener compatibilidad con imports existentes
 */
export { SEQUIA_CONFIG, BASE_LAYERS } from '../config/env';

/**
 * Estados de intensidad de sequía
 */
export const SEQUIA_INTENSIDADES = {
  ANORMALMENTE_SECO: 'D0',
  SEQUIA_MODERADA: 'D1',
  SEQUIA_SEVERA: 'D2',
  SEQUIA_EXTREMA: 'D3',
  SEQUIA_EXCEPCIONAL: 'D4'
};

/**
 * Colores para cada nivel de intensidad de sequía
 */
export const SEQUIA_COLORS = {
  D0: '#FFFF00', // Amarillo - Anormalmente Seco
  D1: '#FCD37F', // Naranja claro - Sequía Moderada
  D2: '#FFAA00', // Naranja - Sequía Severa
  D3: '#E60000', // Rojo - Sequía Extrema
  D4: '#730000', // Rojo oscuro - Sequía Excepcional
};

/**
 * Etiquetas descriptivas para cada intensidad
 */
export const SEQUIA_LABELS = {
  D0: 'Anormalmente Seco',
  D1: 'Sequía Moderada',
  D2: 'Sequía Severa',
  D3: 'Sequía Extrema',
  D4: 'Sequía Excepcional'
};

/**
 * Re-exportamos MAP_CONFIG desde env.js
 */
export const MAP_CONFIG = config.map;

/**
 * Configuración de performance general
 */
export const PERFORMANCE_CONFIG = {
  mapEventThrottle: 100,
  searchDebounce: 500,
  featureBatchSize: 100,
  batchDelayMs: 10,
  enableVirtualization: true,
  virtualScrollThreshold: 500
};

/**
 * Mensajes de error estandarizados
 */
export const ERROR_MESSAGES = {
  FETCH_FAILED: 'Error al cargar los datos. Por favor, intente nuevamente.',
  INVALID_QUINCENA: 'La quincena seleccionada no es válida.',
  NO_DATA: 'No hay datos disponibles para la quincena seleccionada.',
  NETWORK_ERROR: 'Error de conexión. Verifique su conexión a internet.',
  TIMEOUT: 'La petición ha tardado demasiado. Por favor, intente nuevamente.'
};

/**
 * Configuración de logging - Ahora se maneja en config/env.js
 * @deprecated Usar logger de config/env.js
 */
export const DEBUG_CONFIG = {
  enableConsoleLog: config.app.debug,
  logLevel: 'info',
  logTimeline: true,
  logLayerChanges: true,
  logStyleUpdates: false
};
