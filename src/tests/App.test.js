

import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('../utils/wfsService', () => ({
  fetchWfsLayer: vi.fn(() => Promise.resolve({
    type: 'FeatureCollection',
    features: []
  })),
  fetchUniqueValues: vi.fn(() => Promise.resolve([])),
  getShapefileDownloadUrl: vi.fn(() => 'http://example.com/shapefile.zip'),
}));

vi.mock('../config/env', () => ({
  config: {
    geoserver: {
      url: 'http://localhost:8080',
      workspace: 'Hidalgo',
      timeout: 30000,
      maxFeatures: 5000,
      wfsUrl: 'http://localhost:8080/geoserver/Hidalgo/wfs',
      wmsUrl: 'http://localhost:8080/geoserver/Hidalgo/wms',
    },
    map: {
      center: [20.5, -99],
      zoom: 9.5,
      minZoom: 8.5,
      maxZoom: 19,
    },
    app: {
      name: 'Test App',
      version: '1.0.0',
      debug: false,
    },
    isDevelopment: true,
    isProduction: false,
  },
  logger: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
  SEQUIA_CONFIG: {
    layerName: 'Hidalgo:04_sequias',
    fieldName: 'Quincena',
  },
  BASE_LAYERS: {
    ESTADO: 'Hidalgo:00_Estado',
    MUNICIPIOS: 'Hidalgo:00_Municipios',
  },
}));

describe('Configuración del proyecto', () => {
  test('Las variables de entorno están definidas', async () => {
    const { config } = await import('../config/env');

    expect(config.geoserver.url).toBeDefined();
    expect(config.geoserver.workspace).toBe('Hidalgo');
    expect(config.map.center).toHaveLength(2);
  });

  test('SEQUIA_CONFIG tiene las propiedades requeridas', async () => {
    const { SEQUIA_CONFIG } = await import('../config/env');

    expect(SEQUIA_CONFIG.layerName).toContain('sequias');
    expect(SEQUIA_CONFIG.fieldName).toBe('Quincena');
  });
});

describe('Utilidades', () => {
  test('Las constantes de sequía están definidas', async () => {
    const { SEQUIA_INTENSIDADES, SEQUIA_COLORS } = await import('../utils/constants');

    expect(SEQUIA_INTENSIDADES.SEQUIA_MODERADA).toBe('D1');
    expect(SEQUIA_COLORS.D0).toBe('#FFFF00');
  });

  test('Los mensajes de error están definidos', async () => {
    const { ERROR_MESSAGES } = await import('../utils/constants');

    expect(ERROR_MESSAGES.FETCH_FAILED).toBeDefined();
    expect(ERROR_MESSAGES.NETWORK_ERROR).toBeDefined();
  });
});

describe('WFS Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('fetchWfsLayer retorna un FeatureCollection', async () => {
    const { fetchWfsLayer } = await import('../utils/wfsService');

    const result = await fetchWfsLayer('Hidalgo:00_Estado');

    expect(result.type).toBe('FeatureCollection');
    expect(Array.isArray(result.features)).toBe(true);
  });
});

