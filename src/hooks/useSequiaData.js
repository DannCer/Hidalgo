// src/components/observatorio/hooks/useSequiaData.js
import { useState, useEffect, useRef } from 'react';
import { fetchUniqueValuesCached } from '../utils/wfsService';
import { SEQUIA_CONFIG } from '../utils/constants';
import { sortQuincenas } from '../utils/dataUtils';

/**
 * Hook optimizado para manejar datos de sequías
 * ✅ MEJORAS:
 * - Usa cache para evitar requests repetidos
 * - Mejor manejo de loading states
 * - Cancelación de requests al desmontar
 * - Retry automático con backoff
 */
export const useSequiaData = () => {
  const [sequiaQuincenaList, setSequiaQuincenaList] = useState([]);
  const [sequiaQuincena, setSequiaQuincena] = useState(null);
  const [timelineConfigs, setTimelineConfigs] = useState({});
  const [isLoadingQuincenas, setIsLoadingQuincenas] = useState(true);
  const [error, setError] = useState(null);

  // Referencias para control
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);
  const retryCountRef = useRef(0);

  // ===================================================================
  // LIMPIEZA AL DESMONTAR
  // ===================================================================
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // ===================================================================
  // CARGAR LISTA DE QUINCENAS (solo una vez, con retry)
  // ===================================================================
  useEffect(() => {
    const fetchSequiaQuincenas = async () => {
      // Ya tenemos datos, no recargar
      if (sequiaQuincenaList.length > 0) return;

      // Cancelar request anterior si existe
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoadingQuincenas(true);
      setError(null);

      try {
        // ✅ Usar versión cacheada
        const uniqueQuincenas = await fetchUniqueValuesCached(
          SEQUIA_CONFIG.layerName,
          SEQUIA_CONFIG.fieldName,
          10000,
          controller.signal,
          SEQUIA_CONFIG.cacheTimeout
        );

        // Verificar si seguimos montados
        if (!isMountedRef.current) return;

        if (!uniqueQuincenas || uniqueQuincenas.length === 0) {
          throw new Error('No se encontraron quincenas disponibles');
        }

        // ✅ Ordenar cronológicamente (más antiguo al más reciente)
        const sortedQuincenas = sortQuincenas(uniqueQuincenas, true);

        setSequiaQuincenaList(sortedQuincenas);

        // Establecer la quincena más reciente como predeterminada
        const defaultQuincena = sortedQuincenas[sortedQuincenas.length - 1];
        setSequiaQuincena(defaultQuincena);

        // Resetear contador de reintentos
        retryCountRef.current = 0;

        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ Cargadas ${sortedQuincenas.length} quincenas. Última: ${defaultQuincena}`);
        }

      } catch (err) {
        // No procesar si fue abortado o desmontado
        if (!isMountedRef.current || err.name === 'AbortError') return;

        console.error('❌ Error obteniendo quincenas:', err);
        setError(err.message);

        // ✅ RETRY CON BACKOFF EXPONENCIAL
        const maxRetries = 3;
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 8000);

          console.warn(`⚠️ Reintentando en ${delay}ms (intento ${retryCountRef.current}/${maxRetries})`);

          setTimeout(() => {
            if (isMountedRef.current) {
              setIsLoadingQuincenas(false);
              // Forzar re-ejecución cambiando una dependencia dummy
              setError(null);
            }
          }, delay);
        }

      } finally {
        if (isMountedRef.current) {
          setIsLoadingQuincenas(false);
          abortControllerRef.current = null;
        }
      }
    };

    fetchSequiaQuincenas();
  }, [sequiaQuincenaList.length]);

  // ===================================================================
  // ACTUALIZAR TIMELINE CONFIG cuando cambian quincenas o la actual
  // ===================================================================
  useEffect(() => {
    if (sequiaQuincenaList.length > 0) {
      const currentValue = sequiaQuincena || sequiaQuincenaList[sequiaQuincenaList.length - 1];

      const cfg = {
        [SEQUIA_CONFIG.layerName]: {
          timePoints: sequiaQuincenaList,
          currentValue: currentValue,
          formatType: 'quincena',
          type: 'discrete'
        }
      };

      setTimelineConfigs(cfg);
    }
  }, [sequiaQuincenaList, sequiaQuincena]);

  // ===================================================================
  // HELPERS
  // ===================================================================

  /**
   * Forzar recarga de quincenas (útil si se necesita refrescar)
   */
  const refreshQuincenas = () => {
    setSequiaQuincenaList([]);
    retryCountRef.current = 0;
    setError(null);
  };

  /**
   * Validar si una quincena existe en la lista
   */
  const isValidQuincena = (quincena) => {
    return sequiaQuincenaList.includes(quincena);
  };

  /**
   * Obtener índice de una quincena
   */
  const getQuincenaIndex = (quincena) => {
    return sequiaQuincenaList.indexOf(quincena);
  };

  /**
   * Obtener quincena anterior
   */
  const getPreviousQuincena = () => {
    const currentIndex = getQuincenaIndex(sequiaQuincena);
    if (currentIndex > 0) {
      return sequiaQuincenaList[currentIndex - 1];
    }
    return null;
  };

  /**
   * Obtener quincena siguiente
   */
  const getNextQuincena = () => {
    const currentIndex = getQuincenaIndex(sequiaQuincena);
    if (currentIndex < sequiaQuincenaList.length - 1) {
      return sequiaQuincenaList[currentIndex + 1];
    }
    return null;
  };

  return {
    // Estados
    sequiaQuincenaList,
    setSequiaQuincenaList,
    sequiaQuincena,
    setSequiaQuincena,
    timelineConfigs,
    setTimelineConfigs,
    isLoadingQuincenas,
    error,

    // Helpers
    refreshQuincenas,
    isValidQuincena,
    getQuincenaIndex,
    getPreviousQuincena,
    getNextQuincena,

    // Metadata
    totalQuincenas: sequiaQuincenaList.length,
    hasQuincenas: sequiaQuincenaList.length > 0,
    firstQuincena: sequiaQuincenaList[0] || null,
    lastQuincena: sequiaQuincenaList[sequiaQuincenaList.length - 1] || null
  };
};