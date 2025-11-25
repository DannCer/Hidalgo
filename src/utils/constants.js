// src/utils/constants.js

/**
 * Configuración para la capa de sequías
 */
export const SEQUIA_CONFIG = {
  layerName: 'Hidalgo:04_sequias', 
  fieldName: 'Quincena',            
  displayName: 'Monitor de Sequía',
  
  // Configuración de performance
  debounceMs: 300,
  maxFeatures: 5000,
  cacheTimeout: 5 * 60 * 1000, // 5 minutos
  
  // Configuración de UI
  timelineFormat: 'short',
  showLoadingIndicator: true,
  
  // Configuración de estilo
  styleField: 'intensidad',
  defaultStyle: {
    fillOpacity: 0.6,
    weight: 1,
    color: '#333',
  }
};

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
 * Configuración del mapa
 */
export const MAP_CONFIG = {
  center: [20.5, -98.8],
  zoom: 9,
  minZoom: 8,
  maxZoom: 15,
  zoomDelta: 0.5,
  zoomSnap: 0.5,
  maxBounds: [
    [19.8, -99.5],
    [21.2, -98.1]
  ],
  maxBoundsViscosity: 0.8
};

/**
 * Configuración de capas base
 */
export const BASE_LAYERS = {
  BASE_LAYER_NAME: 'Hidalgo:00_Estado',
  BASE_LAYER_STYLE: {
    fillColor: '#f0f0f0',
    fillOpacity: 0.3,
    weight: 2,
    color: '#666',
    dashArray: '5, 5'
  }
};

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
 * Configuración de logging
 */
export const DEBUG_CONFIG = {
  enableConsoleLog: process.env.NODE_ENV === 'development',
  logLevel: 'info',
  logTimeline: true,
  logLayerChanges: true,
  logStyleUpdates: false
};