

import { config } from '../config/env';

export { SEQUIA_CONFIG, BASE_LAYERS } from '../config/env';

export const SEQUIA_INTENSIDADES = {
  ANORMALMENTE_SECO: 'D0',
  SEQUIA_MODERADA: 'D1',
  SEQUIA_SEVERA: 'D2',
  SEQUIA_EXTREMA: 'D3',
  SEQUIA_EXCEPCIONAL: 'D4'
};

export const SEQUIA_COLORS = {
  D0: '#FFFF00',
  D1: '#FCD37F',
  D2: '#FFAA00',
  D3: '#E60000',
  D4: '#730000',
};

export const SEQUIA_LABELS = {
  D0: 'Anormalmente Seco',
  D1: 'Sequía Moderada',
  D2: 'Sequía Severa',
  D3: 'Sequía Extrema',
  D4: 'Sequía Excepcional'
};

export const MAP_CONFIG = config.map;

export const PERFORMANCE_CONFIG = {
  mapEventThrottle: 100,
  searchDebounce: 500,
  featureBatchSize: 100,
  batchDelayMs: 10,
  enableVirtualization: true,
  virtualScrollThreshold: 500
};

export const ERROR_MESSAGES = {
  FETCH_FAILED: 'Error al cargar los datos. Por favor, intente nuevamente.',
  INVALID_QUINCENA: 'La quincena seleccionada no es válida.',
  NO_DATA: 'No hay datos disponibles para la quincena seleccionada.',
  NETWORK_ERROR: 'Error de conexión. Verifique su conexión a internet.',
  TIMEOUT: 'La petición ha tardado demasiado. Por favor, intente nuevamente.'
};

export const DEBUG_CONFIG = {
  enableConsoleLog: config.app.debug,
  logLevel: 'info',
  logTimeline: true,
  logLayerChanges: true,
  logStyleUpdates: false
};
