/**
 * @fileoverview Hook para gestión de datos de sequías.
 * 
 * Maneja la carga y gestión de las quincenas disponibles para
 * la capa de sequías, incluyendo configuración del timeline
 * y utilidades de navegación temporal.
 * 
 * @module hooks/useSequiaData
 */

import { useState, useEffect, useRef } from 'react';
import { fetchUniqueValuesCached } from '../utils/wfsService';
import { SEQUIA_CONFIG } from '../utils/constants';
import { sortQuincenas } from '../utils/dataUtils';
import { logger } from '../config/env';

/**
 * Hook para gestionar datos de la capa de sequías.
 * 
 * Carga automáticamente la lista de quincenas disponibles desde GeoServer
 * y proporciona funcionalidades para navegar entre ellas.
 * 
 * @returns {Object} Estado y funciones para manejo de datos de sequías
 * 
 * @example
 * const {
 *   sequiaQuincenaList,    // ['2024-01-01', '2024-01-15', ...]
 *   sequiaQuincena,        // '2024-06-15' (quincena actual)
 *   setSequiaQuincena,     // Cambiar quincena seleccionada
 *   isLoadingQuincenas,    // true mientras carga
 *   timelineConfigs        // Configuración para componente Timeline
 * } = useSequiaData();
 */
export const useSequiaData = () => {
  // =========================================================================
  // ESTADO
  // =========================================================================
  
  /** @type {[string[], Function]} Lista de quincenas disponibles */
  const [sequiaQuincenaList, setSequiaQuincenaList] = useState([]);
  
  /** @type {[string|null, Function]} Quincena actualmente seleccionada */
  const [sequiaQuincena, setSequiaQuincena] = useState(null);
  
  /** @type {[Object, Function]} Configuración para componentes timeline */
  const [timelineConfigs, setTimelineConfigs] = useState({});
  
  /** @type {[boolean, Function]} Estado de carga */
  const [isLoadingQuincenas, setIsLoadingQuincenas] = useState(true);
  
  /** @type {[string|null, Function]} Mensaje de error */
  const [error, setError] = useState(null);

  // =========================================================================
  // REFS
  // =========================================================================
  
  /** Controlador para cancelar peticiones */
  const abortControllerRef = useRef(null);
  
  /** Indica si el componente está montado */
  const isMountedRef = useRef(true);
  
  /** Contador de reintentos */
  const retryCountRef = useRef(0);

  // =========================================================================
  // EFECTOS
  // =========================================================================

  // Cleanup al desmontar
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Cargar lista de quincenas
  useEffect(() => {
    const fetchSequiaQuincenas = async () => {
      // Evitar recargar si ya tenemos datos
      if (sequiaQuincenaList.length > 0) return;

      // Cancelar petición anterior si existe
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoadingQuincenas(true);
      setError(null);

      try {
        // Obtener quincenas únicas con caché
        const uniqueQuincenas = await fetchUniqueValuesCached(
          SEQUIA_CONFIG.layerName,
          SEQUIA_CONFIG.fieldName,
          10000,
          controller.signal,
          SEQUIA_CONFIG.cacheTimeout
        );

        // Verificar si el componente sigue montado
        if (!isMountedRef.current) return;

        if (!uniqueQuincenas || uniqueQuincenas.length === 0) {
          throw new Error('No se encontraron quincenas disponibles');
        }

        // Ordenar cronológicamente (más antigua primero)
        const sortedQuincenas = sortQuincenas(uniqueQuincenas, true);

        setSequiaQuincenaList(sortedQuincenas);

        // Seleccionar la más reciente por defecto
        const defaultQuincena = sortedQuincenas[sortedQuincenas.length - 1];
        setSequiaQuincena(defaultQuincena);

        // Reset contador de reintentos
        retryCountRef.current = 0;

        logger.debug(`✅ Cargadas ${sortedQuincenas.length} quincenas. Última: ${defaultQuincena}`);

      } catch (err) {
        // Ignorar si es cancelación o componente desmontado
        if (!isMountedRef.current || err.name === 'AbortError') return;

        logger.error('❌ Error obteniendo quincenas:', err);
        setError(err.message);

        // Reintentar con backoff exponencial
        const maxRetries = 3;
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 8000);

          logger.warn(`⚠️ Reintentando en ${delay}ms (intento ${retryCountRef.current}/${maxRetries})`);

          setTimeout(() => {
            if (isMountedRef.current) {
              setIsLoadingQuincenas(false);
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

  // Actualizar configuración del timeline cuando cambian las quincenas
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

  // =========================================================================
  // FUNCIONES AUXILIARES
  // =========================================================================

  /**
   * Fuerza recarga de la lista de quincenas.
   */
  const refreshQuincenas = () => {
    setSequiaQuincenaList([]);
    retryCountRef.current = 0;
    setError(null);
  };

  /**
   * Verifica si una quincena está en la lista disponible.
   * @param {string} quincena - Quincena a verificar
   * @returns {boolean}
   */
  const isValidQuincena = (quincena) => {
    return sequiaQuincenaList.includes(quincena);
  };

  /**
   * Obtiene el índice de una quincena en la lista.
   * @param {string} quincena - Quincena a buscar
   * @returns {number} Índice o -1 si no existe
   */
  const getQuincenaIndex = (quincena) => {
    return sequiaQuincenaList.indexOf(quincena);
  };

  /**
   * Obtiene la quincena anterior a la actual.
   * @returns {string|null}
   */
  const getPreviousQuincena = () => {
    const currentIndex = getQuincenaIndex(sequiaQuincena);
    if (currentIndex > 0) {
      return sequiaQuincenaList[currentIndex - 1];
    }
    return null;
  };

  /**
   * Obtiene la quincena siguiente a la actual.
   * @returns {string|null}
   */
  const getNextQuincena = () => {
    const currentIndex = getQuincenaIndex(sequiaQuincena);
    if (currentIndex < sequiaQuincenaList.length - 1) {
      return sequiaQuincenaList[currentIndex + 1];
    }
    return null;
  };

  // =========================================================================
  // RETORNO
  // =========================================================================

  return {
    // Estado principal
    sequiaQuincenaList,
    setSequiaQuincenaList,
    sequiaQuincena,
    setSequiaQuincena,
    timelineConfigs,
    setTimelineConfigs,
    isLoadingQuincenas,
    error,

    // Funciones
    refreshQuincenas,
    isValidQuincena,
    getQuincenaIndex,
    getPreviousQuincena,
    getNextQuincena,

    // Propiedades derivadas
    totalQuincenas: sequiaQuincenaList.length,
    hasQuincenas: sequiaQuincenaList.length > 0,
    firstQuincena: sequiaQuincenaList[0] || null,
    lastQuincena: sequiaQuincenaList[sequiaQuincenaList.length - 1] || null
  };
};