// src/components/observatorio/hooks/useTimelineManager.js
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { fetchWfsLayer } from '../../../utils/wfsService';
import { SEQUIA_CONFIG } from '../../../utils/constants';
import { normalizeQuincena, createSequiaFilter } from '../../../utils/dataUtils';
import { logger } from '../../../config/env';

// Configuración de tiempos
const DEBOUNCE_MS = 300;  // Tiempo de espera antes de hacer fetch
const MIN_TIME_BETWEEN_FETCHES = 200;  // Throttle mínimo

/**
 * Hook optimizado para gestionar el timeline de sequías
 */
export const useTimelineManager = (
  activeLayers,
  setActiveLayers,
  setLoadingLayers,
  setCurrentFilters
) => {
  // ===================================================================
  // ESTADOS REACTIVOS (causan re-renders)
  // ===================================================================
  const [isUpdating, setIsUpdating] = useState(false);
  const [optimisticQuincena, setOptimisticQuincena] = useState(null);
  const [lastError, setLastError] = useState(null);

  // ===================================================================
  // REFS ESTABLES (NO causan re-renders)
  // ===================================================================
  const abortControllerRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const lastRequestedQuincenaRef = useRef(null);
  const lastFetchTimeRef = useRef(0);
  
  // ===================================================================
  // CACHE DE DATOS POR QUINCENA (evita re-fetch)
  // ===================================================================
  const dataCache = useRef(new Map());
  
  // Límite de cache (últimas 10 quincenas)
  const MAX_CACHE_SIZE = 10;

  // ===================================================================
  // LIMPIEZA AL DESMONTAR
  // ===================================================================
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

  // ===================================================================
  // FUNCIÓN: AGREGAR A CACHE
  // ===================================================================
  const addToCache = useCallback((quincena, data) => {
    // Limpiar cache si excede el límite
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

  // ===================================================================
  // FUNCIÓN: OBTENER DE CACHE
  // ===================================================================
  const getFromCache = useCallback((quincena) => {
    const cached = dataCache.current.get(quincena);
    if (cached) {
      logger.debug(`Cache HIT para quincena ${quincena}`);
      return cached.data;
    }
    return null;
  }, []);

  // ===================================================================
  // FUNCIÓN CORE: EJECUTAR ACTUALIZACIÓN
  // ===================================================================
  const executeUpdate = useCallback(async (normalizedQuincena) => {
    // VALIDACIÓN CRÍTICA: Nunca hacer fetch sin quincena
    if (!normalizedQuincena) {
      logger.error('executeUpdate: quincena inválida, abortando');
      setIsUpdating(false);
      return false;
    }

    // Crear filtro CQL
    const filter = createSequiaFilter(normalizedQuincena);
    
    // VALIDACIÓN CRÍTICA: Nunca hacer fetch sin filtro
    if (!filter) {
      logger.error('executeUpdate: no se pudo crear filtro, abortando');
      setLastError('No se pudo crear filtro para la quincena');
      setIsUpdating(false);
      return false;
    }

    // Verificar cache primero
    const cachedData = getFromCache(normalizedQuincena);
    if (cachedData) {
      // Usar datos cacheados
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

    // Cancelar request anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Crear nuevo AbortController
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Actualizar estados
    setIsUpdating(true);
    setLastError(null);
    lastRequestedQuincenaRef.current = normalizedQuincena;

    // Actualizar filtro inmediatamente
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

      // Verificar si esta sigue siendo la quincena solicitada
      if (lastRequestedQuincenaRef.current !== normalizedQuincena) {
        logger.debug('Respuesta descartada: quincena cambió');
        return false;
      }

      // Registrar tiempo de última actualización
      lastFetchTimeRef.current = Date.now();

      // Verificar datos válidos
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

      // Guardar en cache
      addToCache(normalizedQuincena, layerData);

      // Actualizar capa
      setActiveLayers(prev => ({
        ...prev,
        [SEQUIA_CONFIG.layerName]: layerData
      }));

      return true;

    } catch (error) {
      // Ignorar errores de abort (son esperados)
      if (error.name === 'AbortError') {
        logger.debug('Request abortada (esperado)');
        return false;
      }

      logger.error('Error actualizando sequías:', error);
      setLastError(error.message);
      return false;

    } finally {
      // Solo limpiar estados si esta es la última request
      if (lastRequestedQuincenaRef.current === normalizedQuincena) {
        setIsUpdating(false);
        setLoadingLayers(prev => {
          const newSet = new Set(prev);
          newSet.delete(SEQUIA_CONFIG.layerName);
          return newSet;
        });
      }

      // Limpiar controller si es el actual
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [setActiveLayers, setCurrentFilters, setLoadingLayers, getFromCache, addToCache]);

  // ===================================================================
  // HANDLER PRINCIPAL: CAMBIO DE QUINCENA (con debounce estable)
  // ===================================================================
  const handleTimelineChange = useCallback((layerName, newQuincena) => {
    // Solo manejar capa de sequías
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

    // Si es la misma quincena, ignorar
    if (normalized === lastRequestedQuincenaRef.current) {
      return;
    }

    // 🎯 ACTUALIZACIÓN OPTIMISTA INMEDIATA
    setOptimisticQuincena(normalized);
    lastRequestedQuincenaRef.current = normalized;

    // Marcar como cargando
    setLoadingLayers(prev => new Set([...prev, SEQUIA_CONFIG.layerName]));

    // Cancelar debounce anterior (IMPORTANTE: usar ref, no crear nuevo debounce)
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Verificar si hay datos en cache (respuesta inmediata)
    const cachedData = getFromCache(normalized);
    if (cachedData) {
      // Si está en cache, ejecutar inmediatamente
      executeUpdate(normalized);
      return;
    }

    // Si NO está en cache, aplicar debounce para evitar spam de requests
    const timeSinceLastFetch = Date.now() - lastFetchTimeRef.current;
    const delay = timeSinceLastFetch < MIN_TIME_BETWEEN_FETCHES 
      ? DEBOUNCE_MS 
      : DEBOUNCE_MS / 2;

    debounceTimerRef.current = setTimeout(() => {
      // Verificar que esta sigue siendo la quincena pendiente
      if (lastRequestedQuincenaRef.current === normalized) {
        executeUpdate(normalized);
      }
    }, delay);

  }, [executeUpdate, setLoadingLayers, getFromCache]);

  // ===================================================================
  // FUNCIÓN: CANCELAR UPDATES PENDIENTES
  // ===================================================================
  const cancelPendingUpdates = useCallback(() => {
    // Cancelar request HTTP
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Cancelar debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    
    // Limpiar estados
    setIsUpdating(false);
    setOptimisticQuincena(null);
    lastRequestedQuincenaRef.current = null;
    
    // Quitar de loading
    setLoadingLayers(prev => {
      const newSet = new Set(prev);
      newSet.delete(SEQUIA_CONFIG.layerName);
      return newSet;
    });
  }, [setLoadingLayers]);

  // ===================================================================
  // FUNCIÓN: FORZAR ACTUALIZACIÓN INMEDIATA (sin debounce)
  // ===================================================================
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

  // ===================================================================
  // FUNCIÓN: LIMPIAR CACHE
  // ===================================================================
  const clearCache = useCallback(() => {
    dataCache.current.clear();
    logger.debug('Cache de sequías limpiado');
  }, []);

  // ===================================================================
  // FUNCIÓN: PRECARGAR QUINCENAS ADYACENTES
  // ===================================================================
  const prefetchAdjacent = useCallback(async (currentQuincena, quincenaList) => {
    if (!currentQuincena || !quincenaList || quincenaList.length < 2) return;
    
    const currentIndex = quincenaList.indexOf(currentQuincena);
    if (currentIndex === -1) return;

    // Precargar anterior y siguiente (si no están en cache)
    const toPreload = [];
    
    if (currentIndex > 0) {
      const prev = quincenaList[currentIndex - 1];
      if (!getFromCache(prev)) toPreload.push(prev);
    }
    
    if (currentIndex < quincenaList.length - 1) {
      const next = quincenaList[currentIndex + 1];
      if (!getFromCache(next)) toPreload.push(next);
    }

    // Precargar en background (sin actualizar UI)
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

  // ===================================================================
  // INFO DE CACHE (para debugging)
  // ===================================================================
  const cacheInfo = useMemo(() => ({
    size: dataCache.current.size,
    keys: Array.from(dataCache.current.keys())
  }), [isUpdating]); // Trigger recalc cuando cambia isUpdating

  // ===================================================================
  // RETURN
  // ===================================================================
  return {
    // Handlers
    handleTimelineChange,
    cancelPendingUpdates,
    forceUpdate,
    clearCache,
    prefetchAdjacent,

    // Estados reactivos
    optimisticQuincena,
    isUpdating,
    lastError,

    // Info
    cacheInfo,
    currentQuincena: lastRequestedQuincenaRef.current
  };
};

export default useTimelineManager;
