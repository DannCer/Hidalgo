// src/config/env.js
// ============================================
// CONFIGURACIÓN CENTRALIZADA DEL PROYECTO
// ============================================
// Este archivo lee las variables de entorno de Vite
// y las exporta de forma tipada y con valores por defecto.
//
// USO:
//   import { config } from '@/config/env';
//   console.log(config.geoserver.url);
// ============================================

/**
 * Obtiene una variable de entorno con valor por defecto
 * @param {string} key - Nombre de la variable (sin VITE_)
 * @param {string} defaultValue - Valor por defecto si no existe
 * @returns {string}
 */
const getEnv = (key, defaultValue = '') => {
    return import.meta.env[`VITE_${key}`] ?? defaultValue;
};

/**
 * Obtiene una variable de entorno como número
 * @param {string} key - Nombre de la variable (sin VITE_)
 * @param {number} defaultValue - Valor por defecto
 * @returns {number}
 */
const getEnvNumber = (key, defaultValue) => {
    const value = import.meta.env[`VITE_${key}`];
    if (value === undefined || value === '') return defaultValue;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Obtiene una variable de entorno como booleano
 * @param {string} key - Nombre de la variable (sin VITE_)
 * @param {boolean} defaultValue - Valor por defecto
 * @returns {boolean}
 */
const getEnvBoolean = (key, defaultValue) => {
    const value = import.meta.env[`VITE_${key}`];
    if (value === undefined || value === '') return defaultValue;
    return value === 'true' || value === '1';
};

// ============================================
// CONFIGURACIÓN EXPORTADA
// ============================================

export const config = {
    // --- GeoServer ---
    geoserver: {
        url: getEnv('GEOSERVER_URL', 'http://localhost:8080'),
        workspace: getEnv('GEOSERVER_WORKSPACE', 'Hidalgo'),
        timeout: getEnvNumber('WFS_TIMEOUT', 30000),
        maxFeatures: getEnvNumber('MAX_FEATURES', 5000),
        
        // URLs construidas
        get wfsUrl() {
            return `${this.url}/geoserver/${this.workspace}/wfs`;
        },
        get wmsUrl() {
            return `${this.url}/geoserver/${this.workspace}/wms`;
        },
    },

    // --- Mapa ---
    map: {
        center: [
            getEnvNumber('MAP_CENTER_LAT', 20.5),
            getEnvNumber('MAP_CENTER_LNG', -99),
        ],
        zoom: getEnvNumber('MAP_ZOOM', 9.5),
        minZoom: getEnvNumber('MAP_MIN_ZOOM', 8.5),
        maxZoom: getEnvNumber('MAP_MAX_ZOOM', 19),
        maxBounds: [
            [22, -97.5],
            [19.3, -100.5],
        ],
        maxBoundsViscosity: 0.7,
        zoomDelta: 0.1,
        zoomSnap: 0.1,
    },

    // --- Aplicación ---
    app: {
        name: getEnv('APP_NAME', 'Observatorio del Agua de Hidalgo'),
        version: getEnv('APP_VERSION', '1.0.0'),
        debug: getEnvBoolean('DEBUG_MODE', import.meta.env.DEV),
    },

    // --- Constantes derivadas ---
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
    mode: import.meta.env.MODE,
};

// ============================================
// CONFIGURACIÓN DE SEQUÍAS (específica del dominio)
// ============================================

export const SEQUIA_CONFIG = {
    layerName: `${config.geoserver.workspace}:04_sequias`,
    fieldName: 'Quincena',
    displayName: 'Monitor de Sequía',
    debounceMs: 300,
    maxFeatures: config.geoserver.maxFeatures,
    cacheTimeout: 5 * 60 * 1000, // 5 minutos
};

// ============================================
// CONSTANTES DE CAPAS BASE
// ============================================

export const BASE_LAYERS = {
    ESTADO: `${config.geoserver.workspace}:00_Estado`,
    MUNICIPIOS: `${config.geoserver.workspace}:00_Municipios`,
};

// ============================================
// LOGGER PARA DEBUG
// ============================================

export const logger = {
    log: (...args) => {
        if (config.app.debug) {
            console.log(`[${config.app.name}]`, ...args);
        }
    },
    warn: (...args) => {
        if (config.app.debug) {
            console.warn(`[${config.app.name}]`, ...args);
        }
    },
    error: (...args) => {
        // Los errores siempre se muestran
        console.error(`[${config.app.name}]`, ...args);
    },
    debug: (...args) => {
        if (config.app.debug && config.isDevelopment) {
            console.debug(`[${config.app.name} DEBUG]`, ...args);
        }
    },
};

// ============================================
// VALIDACIÓN DE CONFIGURACIÓN
// ============================================

// Validar configuración crítica en desarrollo
if (config.isDevelopment) {
    const requiredVars = ['GEOSERVER_URL', 'GEOSERVER_WORKSPACE'];
    const missing = requiredVars.filter(key => !import.meta.env[`VITE_${key}`]);
    
    if (missing.length > 0) {
        console.warn(
            `⚠️ Variables de entorno faltantes: ${missing.join(', ')}\n` +
            `   Usando valores por defecto. Crea un archivo .env.development\n` +
            `   basándote en .env.example`
        );
    }
}

export default config;
