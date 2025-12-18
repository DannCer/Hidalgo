/**
 * @fileoverview Hook para gestión del timeline de sequías.
 * 
 * Maneja la navegación temporal de la capa de sequías con optimizaciones
 * de rendimiento como debouncing, caché LRU, y cancelación de peticiones.
 * 
 * @module hooks/useTimelineManager
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { fetchWfsLayer } from '../utils/wfsService';
import { SEQUIA_CONFIG } from '../utils/constants';
import { normalizeQuincena, createSequiaFilter } from '../utils/dataUtils';
import { logger } from '../config/env';

// ============================================================================
// CONSTANTES
// ============================================================================

/** Tiempo de debounce en ms para evitar peticiones excesivas */
const DEBOUNCE_MS = 300;

/** Tiempo mínimo entre peticiones consecutivas */
const MIN_TIME_BETWEEN_FETCHES = 200;

/**
 * Hook para gestionar el timeline temporal de la capa de sequías.
 * 
 * Proporciona optimizaciones de rendimiento:
 * - Debouncing para evitar peticiones mientras se arrastra el slider
 * - Caché LRU para reutilizar datos ya cargados
 * - Cancelación automática de peticiones obsoletas
 * - Prefetch de quincenas adyacentes
 * 
 * @param {Object} activeLayers - Capas actualmente activas
 * @param {Function} setActiveLayers - Setter para activeLayers
 * @param {Function} setLoadingLayers - Setter para loadingLayers
 * @param {Function} setCurrentFilters - Setter para filtros CQL
 * @returns {Object} Funciones y estado del timeline
 * 
 * @example
 * const {
 *   handleTimelineChange,  // Llamar cuando cambia el slider
 *   isUpdating,            // true mientras carga
 *   optimisticQuincena,    // Quincena que se está cargando
 *   clearCache             // Limpiar caché manualmente
 * } = useTimelineManager(activeLayers, setActiveLayers, setLoadingLayers, setCurrentFilters);
 */
export const useTimelineManager = (
  activeLayers,
  setActiveLayers,
  setLoadingLayers,
  setCurrentFilters
) => {

  // =========================================================================
  // ESTADO
  // =========================================================================
  
  /** @type {[boolean, Function]} Indica si hay una actualización en progreso */
  const [isUpdating, setIsUpdating] = useState(false);
  
  /** @type {[string|null, Function]} Quincena que se está cargando (optimistic UI) */
  const [optimisticQuincena, setOptimisticQuincena] = useState(null);
  
  /** @type {[string|null, Function]} Último error ocurrido */
  const [lastError, setLastError] = useState(null);

  // =========================================================================
  // REFS
  // =========================================================================
  
  /** Controlador para cancelar peticiones en curso */
  const abortControllerRef = useRef(null);
  
  /** Timer del debounce */
  const debounceTimerRef = useRef(null);
  
  /** Última quincena solicitada (para descartar respuestas obsoletas) */
  const lastRequestedQuincenaRef = useRef(null);
  
  /** Timestamp de la última petición completada */
  const lastFetchTimeRef = useRef(0);

  // =========================================================================
  // CACHÉ LRU
  // =========================================================================
  
  /** Caché de datos en memoria (Map para mantener orden de inserción) */
  const dataCache = useRef(new Map());
  
  /** Tamaño máximo del caché (número de quincenas) */
  const MAX_CACHE_SIZE = 10;

  // =========================================================================
  // CLEANUP
  // =========================================================================

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // =========================================================================
  // FUNCIONES DE CACHÉ
  // =========================================================================

  /**
   * Agrega datos al caché con política LRU.
   * @param {string} quincena - Quincena como clave
   * @param {Object} data - Datos GeoJSON a cachear
   */
  const addToCache = useCallback((quincena, data) => {
    // Eliminar entrada más antigua si se alcanza el límite
    if (dataCache.current.size >= MAX_CACHE_SIZE) {
      const firstKey = dataCache.current.keys().next().value;
      dataCache.current.delete(firstKey);
    }

    dataCache.current.set(quincena, {
      data,
      timestamp: Date.now()
    });

    logger.debug(`Cache: agregada quincena ${quincena}, total: ${dataCache.current.size}`);
  }, []);

  /**
   * Obtiene datos del caché si existen.
   * @param {string} quincena - Quincena a buscar
   * @returns {Object|null} Datos cacheados o null
   */
  const getFromCache = useCallback((quincena) => {
    const cached = dataCache.current.get(quincena);
    if (cached) {
      logger.debug(`Cache HIT para quincena ${quincena}`);
      return cached.data;
    }
    return null;
  }, []);

  // =========================================================================
  // FUNCIONES PRINCIPALES
  // =========================================================================

  /**
   * Ejecuta la actualización de datos de sequía.
   * @async
   * @param {string} normalizedQuincena - Quincena normalizada
   * @returns {Promise<boolean>} true si la actualización fue exitosa
   */
  const executeUpdate = useCallback(async (normalizedQuincena) => {
    // Validar quincena
    if (!normalizedQuincena) {
      logger.error('executeUpdate: quincena inválida, abortando');
      setIsUpdating(false);
      return false;
    }

    // Crear filtro CQL
    const filter = createSequiaFilter(normalizedQuincena);

    if (!filter) {
      logger.error('executeUpdate: no se pudo crear filtro, abortando');
      setLastError('No se pudo crear filtro para la quincena');
      setIsUpdating(false);
      return false;
    }

    // Verificar caché primero
    const cachedData = getFromCache(normalizedQuincena);
    if (cachedData) {
      // Usar datos cacheados (actualización instantánea)
      setCurrentFilters(prev => ({
        ...prev,
        [SEQUIA_CONFIG.layerName]: filter
      }));

      setActiveLayers(prev => ({
        ...prev,
        [SEQUIA_CONFIG.layerName]: {
          ...cachedData,
          _metadata: {
            ...cachedData._metadata,
            fromCache: true,
            lastAccess: Date.now()
          }
        }
      }));

      setIsUpdating(false);
      setLoadingLayers(prev => {
        const newSet = new Set(prev);
        newSet.delete(SEQUIA_CONFIG.layerName);
        return newSet;
      });

      return true;
    }

    // Cancelar petición anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Crear nuevo controlador
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Actualizar estado
    setIsUpdating(true);
    setLastError(null);
    lastRequestedQuincenaRef.current = normalizedQuincena;

    // Actualizar filtro inmediatamente (optimistic update)
    setCurrentFilters(prev => ({
      ...prev,
      [SEQUIA_CONFIG.layerName]: filter
    }));

    try {
      logger.debug(`Fetching sequías: ${normalizedQuincena} con filtro: ${filter}`);

      const data = await fetchWfsLayer(
        SEQUIA_CONFIG.layerName,
        filter,
        SEQUIA_CONFIG.maxFeatures || 5000,
        0,
        controller.signal
      );

      // Verificar que la respuesta sigue siendo relevante
      if (lastRequestedQuincenaRef.current !== normalizedQuincena) {
        logger.debug('Respuesta descartada: quincena cambió');
        return false;
      }

      // Actualizar timestamp
      lastFetchTimeRef.current = Date.now();

      // Procesar respuesta
      const features = data?.features || [];
      const featureCount = features.length;

      logger.debug(`Recibidos ${featureCount} features para ${normalizedQuincena}`);

      // Preparar datos con metadata
      const layerData = {
        type: 'FeatureCollection',
        features,
        _metadata: {
          quincena: normalizedQuincena,
          filter,
          featureCount,
          lastUpdate: Date.now(),
          fromCache: false
        }
      };

      // Agregar al caché
      addToCache(normalizedQuincena, layerData);

      // Actualizar estado de capas
      setActiveLayers(prev => ({
        ...prev,
        [SEQUIA_CONFIG.layerName]: layerData
      }));

      return true;

    } catch (error) {
      // Ignorar errores de cancelación
      if (error.name === 'AbortError') {
        logger.debug('Request abortada (esperado)');
        return false;
      }

      logger.error('Error actualizando sequías:', error);
      setLastError(error.message);
      return false;

    } finally {
      // Limpiar estado solo si esta es la última petición
      if (lastRequestedQuincenaRef.current === normalizedQuincena) {
        setIsUpdating(false);
        setLoadingLayers(prev => {
          const newSet = new Set(prev);
          newSet.delete(SEQUIA_CONFIG.layerName);
          return newSet;
        });
      }

      // Limpiar referencia al controlador
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [setActiveLayers, setCurrentFilters, setLoadingLayers, getFromCache, addToCache]);

  /**
   * Maneja cambios del timeline (con debounce).
   * @param {string} layerName - Nombre de la capa (debe ser sequías)
   * @param {string} newQuincena - Nueva quincena seleccionada
   */
  const handleTimelineChange = useCallback((layerName, newQuincena) => {
    // Solo funciona para capa de sequías
    if (layerName !== SEQUIA_CONFIG.layerName) {
      logger.warn('Timeline change para capa no soportada:', layerName);
      return;
    }

    // Normalizar quincena
    const normalized = normalizeQuincena(newQuincena);

    if (!normalized) {
      logger.error('Quincena inválida:', newQuincena);
      return;
    }

    // Evitar actualizaciones redundantes
    if (normalized === lastRequestedQuincenaRef.current) {
      return;
    }

    // Actualización optimista de UI
    setOptimisticQuincena(normalized);
    lastRequestedQuincenaRef.current = normalized;

    // Marcar como cargando
    setLoadingLayers(prev => new Set([...prev, SEQUIA_CONFIG.layerName]));

    // Cancelar debounce anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Si hay caché, usar inmediatamente
    const cachedData = getFromCache(normalized);
    if (cachedData) {
      executeUpdate(normalized);
      return;
    }

    // Aplicar debounce adaptativo
    const timeSinceLastFetch = Date.now() - lastFetchTimeRef.current;
    const delay = timeSinceLastFetch < MIN_TIME_BETWEEN_FETCHES
      ? DEBOUNCE_MS
      : DEBOUNCE_MS / 2;

    debounceTimerRef.current = setTimeout(() => {
      // Verificar que no cambió durante el debounce
      if (lastRequestedQuincenaRef.current === normalized) {
        executeUpdate(normalized);
      }
    }, delay);

  }, [executeUpdate, setLoadingLayers, getFromCache]);

  /**
   * Cancela todas las actualizaciones pendientes.
   */
  const cancelPendingUpdates = useCallback(() => {
    // Cancelar petición en curso
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Cancelar debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Resetear estado
    setIsUpdating(false);
    setOptimisticQuincena(null);
    lastRequestedQuincenaRef.current = null;

    // Limpiar indicador de carga
    setLoadingLayers(prev => {
      const newSet = new Set(prev);
      newSet.delete(SEQUIA_CONFIG.layerName);
      return newSet;
    });
  }, [setLoadingLayers]);

  /**
   * Fuerza actualización ignorando debounce y caché.
   * @async
   * @param {string} quincena - Quincena a cargar
   * @returns {Promise<boolean>} true si fue exitoso
   */
  const forceUpdate = useCallback(async (quincena) => {
    cancelPendingUpdates();

    const normalized = normalizeQuincena(quincena);
    if (!normalized) {
      logger.error('forceUpdate: quincena inválida');
      return false;
    }

    setOptimisticQuincena(normalized);
    setLoadingLayers(prev => new Set([...prev, SEQUIA_CONFIG.layerName]));
    setIsUpdating(true);

    return executeUpdate(normalized);
  }, [cancelPendingUpdates, executeUpdate, setLoadingLayers]);

  /**
   * Limpia el caché de datos.
   */
  const clearCache = useCallback(() => {
    dataCache.current.clear();
    logger.debug('Cache de sequías limpiado');
  }, []);

  /**
   * Precarga quincenas adyacentes a la actual.
   * @async
   * @param {string} currentQuincena - Quincena actual
   * @param {string[]} quincenaList - Lista completa de quincenas
   */
  const prefetchAdjacent = useCallback(async (currentQuincena, quincenaList) => {
    if (!currentQuincena || !quincenaList || quincenaList.length < 2) return;

    const currentIndex = quincenaList.indexOf(currentQuincena);
    if (currentIndex === -1) return;

    // Identificar quincenas a precargar
    const toPreload = [];

    if (currentIndex > 0) {
      const prev = quincenaList[currentIndex - 1];
      if (!getFromCache(prev)) toPreload.push(prev);
    }

    if (currentIndex < quincenaList.length - 1) {
      const next = quincenaList[currentIndex + 1];
      if (!getFromCache(next)) toPreload.push(next);
    }

    // Precargar en segundo plano
    for (const quincena of toPreload) {
      const filter = createSequiaFilter(quincena);
      if (!filter) continue;

      try {
        const data = await fetchWfsLayer(
          SEQUIA_CONFIG.layerName,
          filter,
          SEQUIA_CONFIG.maxFeatures || 5000
        );

        if (data?.features) {
          addToCache(quincena, {
            type: 'FeatureCollection',
            features: data.features,
            _metadata: {
              quincena,
              filter,
              featureCount: data.features.length,
              lastUpdate: Date.now(),
              prefetched: true
            }
          });
        }
      } catch (e) {
        // Ignorar errores de prefetch silenciosamente
      }
    }
  }, [getFromCache, addToCache]);

  // =========================================================================
  // INFORMACIÓN DEL CACHÉ
  // =========================================================================

  /** Información del estado actual del caché */
  const cacheInfo = useMemo(() => ({
    size: dataCache.current.size,
    keys: Array.from(dataCache.current.keys())
  }), [isUpdating]);

  // =========================================================================
  // RETORNO
  // =========================================================================

  return {
    // Funciones principales
    handleTimelineChange,
    cancelPendingUpdates,
    forceUpdate,
    clearCache,
    prefetchAdjacent,

    // Estado
    optimisticQuincena,
    isUpdating,
    lastError,

    // Información de caché
    cacheInfo,
    currentQuincena: lastRequestedQuincenaRef.current
  };
};

export default useTimelineManager;
