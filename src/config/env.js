/**
 * @fileoverview Configuración centralizada de la aplicación.
 * 
 * Este módulo centraliza todas las configuraciones de la aplicación,
 * leyendo las variables de entorno de Vite (prefijo VITE_) y proporcionando
 * valores por defecto seguros.
 * 
 * Las variables de entorno se definen en archivos:
 * - .env.development : Para desarrollo local
 * - .env.production  : Para producción
 * - .env.example     : Plantilla con documentación
 * 
 * @module config/env
 */

// ============================================================================
// FUNCIONES AUXILIARES PARA VARIABLES DE ENTORNO
// ============================================================================

/**
 * Obtiene una variable de entorno como string.
 * Vite expone las variables con prefijo VITE_ en import.meta.env
 * 
 * @param {string} key - Nombre de la variable (sin prefijo VITE_)
 * @param {string} defaultValue - Valor por defecto si no existe
 * @returns {string} Valor de la variable o el valor por defecto
 * 
 * @example
 * getEnv('GEOSERVER_URL', 'http://localhost:8080')
 * // Lee VITE_GEOSERVER_URL o devuelve 'http://localhost:8080'
 */
const getEnv = (key, defaultValue = '') => {
    return import.meta.env[`VITE_${key}`] ?? defaultValue;
};

/**
 * Obtiene una variable de entorno como número.
 * 
 * @param {string} key - Nombre de la variable (sin prefijo VITE_)
 * @param {number} defaultValue - Valor numérico por defecto
 * @returns {number} Valor parseado o el valor por defecto
 */
const getEnvNumber = (key, defaultValue) => {
    const value = import.meta.env[`VITE_${key}`];
    if (value === undefined || value === '') return defaultValue;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Obtiene una variable de entorno como booleano.
 * Acepta 'true' o '1' como valores verdaderos.
 * 
 * @param {string} key - Nombre de la variable (sin prefijo VITE_)
 * @param {boolean} defaultValue - Valor booleano por defecto
 * @returns {boolean} Valor parseado o el valor por defecto
 */
const getEnvBoolean = (key, defaultValue) => {
    const value = import.meta.env[`VITE_${key}`];
    if (value === undefined || value === '') return defaultValue;
    return value === 'true' || value === '1';
};

// ============================================================================
// CONFIGURACIÓN PRINCIPAL
// ============================================================================

/**
 * Objeto de configuración principal de la aplicación.
 * Agrupa todas las configuraciones en un solo lugar accesible.
 * 
 * @constant
 * @type {Object}
 * 
 * @property {Object} geoserver - Configuración del servidor GeoServer
 * @property {Object} map - Configuración del mapa Leaflet
 * @property {Object} app - Configuración general de la aplicación
 * @property {boolean} isDevelopment - true si estamos en modo desarrollo
 * @property {boolean} isProduction - true si estamos en modo producción
 * @property {string} mode - Modo actual ('development' | 'production')
 */
export const config = {
    // -------------------------------------------------------------------------
    // CONFIGURACIÓN DE GEOSERVER
    // -------------------------------------------------------------------------
    geoserver: {
        /** URL base del servidor GeoServer (sin /geoserver) */
        url: getEnv('GEOSERVER_URL', 'http://localhost:8080'),
        
        /** Workspace de GeoServer donde están las capas */
        workspace: getEnv('GEOSERVER_WORKSPACE', 'Hidalgo'),
        
        /** Timeout en ms para peticiones WFS */
        timeout: getEnvNumber('WFS_TIMEOUT', 30000),
        
        /** Número máximo de features por petición */
        maxFeatures: getEnvNumber('MAX_FEATURES', 5000),

        /**
         * URL completa del servicio WFS.
         * Se calcula dinámicamente basándose en url y workspace.
         * @returns {string} URL del endpoint WFS
         */
        get wfsUrl() {
            return `${this.url}/geoserver/${this.workspace}/wfs`;
        },
        
        /**
         * URL completa del servicio WMS.
         * Se calcula dinámicamente basándose en url y workspace.
         * @returns {string} URL del endpoint WMS
         */
        get wmsUrl() {
            return `${this.url}/geoserver/${this.workspace}/wms`;
        },
    },

    // -------------------------------------------------------------------------
    // CONFIGURACIÓN DEL MAPA LEAFLET
    // -------------------------------------------------------------------------
    map: {
        /** Centro inicial del mapa [latitud, longitud] */
        center: [
            getEnvNumber('MAP_CENTER_LAT', 20.5),
            getEnvNumber('MAP_CENTER_LNG', -99),
        ],
        
        /** Nivel de zoom inicial (9.5 muestra todo Hidalgo) */
        zoom: getEnvNumber('MAP_ZOOM', 9.5),
        
        /** Zoom mínimo permitido */
        minZoom: getEnvNumber('MAP_MIN_ZOOM', 8.5),
        
        /** Zoom máximo permitido */
        maxZoom: getEnvNumber('MAP_MAX_ZOOM', 19),
        
        /**
         * Límites geográficos del mapa (bounding box).
         * Restringe la navegación al estado de Hidalgo y alrededores.
         * Formato: [[norte, este], [sur, oeste]]
         */
        maxBounds: [
            [22, -97.5],      // Esquina noreste
            [19.3, -100.5],   // Esquina suroeste
        ],
        
        /** Viscosidad de los límites (0-1, mayor = más restrictivo) */
        maxBoundsViscosity: 0.7,
        
        /** Incremento de zoom por cada scroll/click */
        zoomDelta: 0.1,
        
        /** Snap de zoom (ajuste a niveles discretos) */
        zoomSnap: 0.1,
    },

    // -------------------------------------------------------------------------
    // CONFIGURACIÓN DE LA APLICACIÓN
    // -------------------------------------------------------------------------
    app: {
        /** Nombre de la aplicación (usado en títulos y logs) */
        name: getEnv('APP_NAME', 'Observatorio del Agua de Hidalgo'),
        
        /** Versión de la aplicación */
        version: getEnv('APP_VERSION', '1.0.0'),
        
        /** Modo debug (activa logs detallados) */
        debug: getEnvBoolean('DEBUG_MODE', import.meta.env.DEV),
    },

    // -------------------------------------------------------------------------
    // FLAGS DE ENTORNO
    // -------------------------------------------------------------------------
    /** true cuando NODE_ENV=development */
    isDevelopment: import.meta.env.DEV,
    
    /** true cuando NODE_ENV=production */
    isProduction: import.meta.env.PROD,
    
    /** Modo actual de Vite */
    mode: import.meta.env.MODE,
};

// ============================================================================
// CONFIGURACIÓN DE LA CAPA DE SEQUÍAS
// ============================================================================

/**
 * Configuración específica para la capa de monitor de sequías.
 * Esta capa es especial porque tiene funcionalidad de timeline temporal.
 * 
 * @constant
 * @type {Object}
 */
export const SEQUIA_CONFIG = {
    /** Nombre completo de la capa en GeoServer (workspace:layer) */
    layerName: `${config.geoserver.workspace}:04_sequias`,
    
    /** Campo que contiene la fecha de la quincena */
    fieldName: 'Quincena',
    
    /** Nombre para mostrar en la UI */
    displayName: 'Monitor de Sequía',
    
    /** Tiempo de debounce para el timeline en ms */
    debounceMs: 300,
    
    /** Máximo de features para esta capa */
    maxFeatures: config.geoserver.maxFeatures,
    
    /** Tiempo de caché en ms (5 minutos) */
    cacheTimeout: 5 * 60 * 1000,
};

// ============================================================================
// CAPAS BASE
// ============================================================================

/**
 * Nombres de las capas base que siempre se muestran como referencia.
 * 
 * @constant
 * @type {Object}
 */
export const BASE_LAYERS = {
    /** Límite del estado de Hidalgo */
    ESTADO: `${config.geoserver.workspace}:00_Estado`,
    
    /** Límites municipales */
    MUNICIPIOS: `${config.geoserver.workspace}:00_Municipios`,
};

// ============================================================================
// SISTEMA DE LOGGING
// ============================================================================

/**
 * Logger centralizado de la aplicación.
 * Respeta la configuración de debug para evitar logs en producción.
 * 
 * @constant
 * @type {Object}
 * 
 * @example
 * logger.debug('Cargando capa:', layerName);
 * logger.error('Error en petición WFS:', error);
 */
export const logger = {
    /**
     * Log general (solo en modo debug)
     */
    log: (...args) => {
        if (config.app.debug) {
            console.log(`[${config.app.name}]`, ...args);
        }
    },
    
    /**
     * Warning (solo en modo debug)
     */
    warn: (...args) => {
        if (config.app.debug) {
            console.warn(`[${config.app.name}]`, ...args);
        }
    },
    
    /**
     * Error (siempre se muestra, incluso en producción)
     */
    error: (...args) => {
        // Los errores siempre se muestran para debugging en producción
        console.error(`[${config.app.name}]`, ...args);
    },
    
    /**
     * Debug detallado (solo en desarrollo Y con debug activo)
     */
    debug: (...args) => {
        if (config.app.debug && config.isDevelopment) {
            console.debug(`[${config.app.name} DEBUG]`, ...args);
        }
    },
};

// ============================================================================
// VALIDACIÓN DE CONFIGURACIÓN EN DESARROLLO
// ============================================================================

/**
 * En modo desarrollo, valida que las variables de entorno críticas estén definidas.
 * Muestra una advertencia si faltan variables pero continúa con valores por defecto.
 */
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
