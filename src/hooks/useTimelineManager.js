
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { fetchWfsLayer } from '../utils/wfsService';
import { SEQUIA_CONFIG } from '../utils/constants';
import { normalizeQuincena, createSequiaFilter } from '../utils/dataUtils';
import { logger } from '../config/env';

const DEBOUNCE_MS = 300;
const MIN_TIME_BETWEEN_FETCHES = 200;

export const useTimelineManager = (
  activeLayers,
  setActiveLayers,
  setLoadingLayers,
  setCurrentFilters
) => {



  const [isUpdating, setIsUpdating] = useState(false);
  const [optimisticQuincena, setOptimisticQuincena] = useState(null);
  const [lastError, setLastError] = useState(null);




  const abortControllerRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const lastRequestedQuincenaRef = useRef(null);
  const lastFetchTimeRef = useRef(0);




  const dataCache = useRef(new Map());


  const MAX_CACHE_SIZE = 10;




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




  const addToCache = useCallback((quincena, data) => {

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




  const getFromCache = useCallback((quincena) => {
    const cached = dataCache.current.get(quincena);
    if (cached) {
      logger.debug(`Cache HIT para quincena ${quincena}`);
      return cached.data;
    }
    return null;
  }, []);




  const executeUpdate = useCallback(async (normalizedQuincena) => {

    if (!normalizedQuincena) {
      logger.error('executeUpdate: quincena inválida, abortando');
      setIsUpdating(false);
      return false;
    }


    const filter = createSequiaFilter(normalizedQuincena);


    if (!filter) {
      logger.error('executeUpdate: no se pudo crear filtro, abortando');
      setLastError('No se pudo crear filtro para la quincena');
      setIsUpdating(false);
      return false;
    }


    const cachedData = getFromCache(normalizedQuincena);
    if (cachedData) {

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


    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }


    const controller = new AbortController();
    abortControllerRef.current = controller;


    setIsUpdating(true);
    setLastError(null);
    lastRequestedQuincenaRef.current = normalizedQuincena;


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


      if (lastRequestedQuincenaRef.current !== normalizedQuincena) {
        logger.debug('Respuesta descartada: quincena cambió');
        return false;
      }


      lastFetchTimeRef.current = Date.now();


      const features = data?.features || [];
      const featureCount = features.length;

      logger.debug(`Recibidos ${featureCount} features para ${normalizedQuincena}`);


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


      addToCache(normalizedQuincena, layerData);


      setActiveLayers(prev => ({
        ...prev,
        [SEQUIA_CONFIG.layerName]: layerData
      }));

      return true;

    } catch (error) {

      if (error.name === 'AbortError') {
        logger.debug('Request abortada (esperado)');
        return false;
      }

      logger.error('Error actualizando sequías:', error);
      setLastError(error.message);
      return false;

    } finally {

      if (lastRequestedQuincenaRef.current === normalizedQuincena) {
        setIsUpdating(false);
        setLoadingLayers(prev => {
          const newSet = new Set(prev);
          newSet.delete(SEQUIA_CONFIG.layerName);
          return newSet;
        });
      }


      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [setActiveLayers, setCurrentFilters, setLoadingLayers, getFromCache, addToCache]);




  const handleTimelineChange = useCallback((layerName, newQuincena) => {

    if (layerName !== SEQUIA_CONFIG.layerName) {
      logger.warn('Timeline change para capa no soportada:', layerName);
      return;
    }


    const normalized = normalizeQuincena(newQuincena);

    if (!normalized) {
      logger.error('Quincena inválida:', newQuincena);
      return;
    }


    if (normalized === lastRequestedQuincenaRef.current) {
      return;
    }


    setOptimisticQuincena(normalized);
    lastRequestedQuincenaRef.current = normalized;


    setLoadingLayers(prev => new Set([...prev, SEQUIA_CONFIG.layerName]));


    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }


    const cachedData = getFromCache(normalized);
    if (cachedData) {

      executeUpdate(normalized);
      return;
    }


    const timeSinceLastFetch = Date.now() - lastFetchTimeRef.current;
    const delay = timeSinceLastFetch < MIN_TIME_BETWEEN_FETCHES
      ? DEBOUNCE_MS
      : DEBOUNCE_MS / 2;

    debounceTimerRef.current = setTimeout(() => {

      if (lastRequestedQuincenaRef.current === normalized) {
        executeUpdate(normalized);
      }
    }, delay);

  }, [executeUpdate, setLoadingLayers, getFromCache]);




  const cancelPendingUpdates = useCallback(() => {

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }


    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }


    setIsUpdating(false);
    setOptimisticQuincena(null);
    lastRequestedQuincenaRef.current = null;


    setLoadingLayers(prev => {
      const newSet = new Set(prev);
      newSet.delete(SEQUIA_CONFIG.layerName);
      return newSet;
    });
  }, [setLoadingLayers]);




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




  const clearCache = useCallback(() => {
    dataCache.current.clear();
    logger.debug('Cache de sequías limpiado');
  }, []);




  const prefetchAdjacent = useCallback(async (currentQuincena, quincenaList) => {
    if (!currentQuincena || !quincenaList || quincenaList.length < 2) return;

    const currentIndex = quincenaList.indexOf(currentQuincena);
    if (currentIndex === -1) return;


    const toPreload = [];

    if (currentIndex > 0) {
      const prev = quincenaList[currentIndex - 1];
      if (!getFromCache(prev)) toPreload.push(prev);
    }

    if (currentIndex < quincenaList.length - 1) {
      const next = quincenaList[currentIndex + 1];
      if (!getFromCache(next)) toPreload.push(next);
    }


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

      }
    }
  }, [getFromCache, addToCache]);




  const cacheInfo = useMemo(() => ({
    size: dataCache.current.size,
    keys: Array.from(dataCache.current.keys())
  }), [isUpdating]);




  return {

    handleTimelineChange,
    cancelPendingUpdates,
    forceUpdate,
    clearCache,
    prefetchAdjacent,


    optimisticQuincena,
    isUpdating,
    lastError,


    cacheInfo,
    currentQuincena: lastRequestedQuincenaRef.current
  };
};

export default useTimelineManager;
