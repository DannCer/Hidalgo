/**
 * @fileoverview Hook para gestión de capas del mapa.
 * 
 * Este hook centraliza toda la lógica de activación/desactivación de capas
 * geoespaciales, incluyendo el manejo especial de la capa de sequías que
 * requiere filtros temporales.
 * 
 * @module hooks/useLayerManagement
 */

import { useState, useCallback, useRef } from 'react';
import { fetchWfsLayer } from '../utils/wfsService';
import { SEQUIA_CONFIG } from '../utils/constants';
import { logger } from '../config/env';
import { normalizeQuincena, createSequiaFilter } from '../utils/dataUtils';

/**
 * Hook para gestionar capas activas del mapa.
 * 
 * Proporciona funcionalidad para:
 * - Activar/desactivar capas WFS
 * - Manejar estados de carga
 * - Gestionar filtros CQL (especialmente para sequías)
 * - Controlar cambios de timeline temporal
 * 
 * @param {string} sequiaQuincena - Quincena actualmente seleccionada para sequías
 * @returns {Object} Estado y funciones de gestión de capas
 * 
 * @example
 * const {
 *   activeLayers,      // { 'Hidalgo:00_Municipios': GeoJSON, ... }
 *   loadingLayers,     // Set(['Hidalgo:04_sequias'])
 *   handleLayerToggle, // (layerConfig, isChecked) => void
 * } = useLayerManagement(sequiaQuincena);
 */
export const useLayerManagement = (sequiaQuincena) => {
  // =========================================================================
  // ESTADO
  // =========================================================================
  
  /**
   * Capas actualmente activas.
   * Objeto donde las keys son nombres de capa y los values son GeoJSON FeatureCollections.
   * @type {Object.<string, Object>}
   */
  const [activeLayers, setActiveLayers] = useState({});
  
  /**
   * Capas en proceso de carga.
   * Set con los nombres de capas que están siendo cargadas.
   * @type {Set<string>}
   */
  const [loadingLayers, setLoadingLayers] = useState(new Set());
  
  /**
   * Filtros CQL activos por capa.
   * Usado principalmente para sequías donde el filtro cambia con el timeline.
   * @type {Object.<string, string>}
   */
  const [currentFilters, setCurrentFilters] = useState({});

  /**
   * Referencia a la última quincena utilizada.
   * Permite comparar si realmente cambió la quincena.
   */
  const lastUsedQuincenaRef = useRef(null);

  // =========================================================================
  // HANDLERS PRINCIPALES
  // =========================================================================

  /**
   * Activa o desactiva una capa.
   * 
   * Maneja la lógica especial para la capa de sequías que requiere
   * filtros temporales. Para otras capas, simplemente carga/descarga los datos.
   * 
   * @param {Object} layerConfig - Configuración de la capa (de AccordionData)
   * @param {string|string[]} layerConfig.layerName - Nombre(s) de la capa
   * @param {string} [layerConfig.currentQuincena] - Override de quincena para sequías
   * @param {boolean} isChecked - true para activar, false para desactivar
   */
  const handleLayerToggle = useCallback(async (layerConfig, isChecked) => {
    // Normalizar a array (algunas capas agrupan múltiples layers)
    const layersToToggle = Array.isArray(layerConfig.layerName)
      ? layerConfig.layerName
      : [layerConfig.layerName];

    // Permitir override de quincena desde el config
    const overrideQuincena = layerConfig.currentQuincena ?? null;

    if (isChecked) {
      // =====================================================================
      // ACTIVAR CAPA(S)
      // =====================================================================

      // Marcar como cargando
      setLoadingLayers(prev => new Set([...prev, ...layersToToggle]));

      try {
        // Cargar todas las capas en paralelo
        const results = await Promise.allSettled(
          layersToToggle.map(async (name) => {

            // -------------------------------------------------------------
            // CASO ESPECIAL: Capa de sequías
            // -------------------------------------------------------------
            if (name === SEQUIA_CONFIG.layerName) {
              const effectiveQuincena = overrideQuincena || sequiaQuincena;

              // Validar que tenemos una quincena
              if (!effectiveQuincena) {
                logger.error('No se puede activar capa de sequías sin quincena');
                throw new Error('Quincena requerida para capa de sequías');
              }

              // Normalizar formato de quincena
              const normalized = normalizeQuincena(effectiveQuincena);
              const cqlFilter = createSequiaFilter(normalized);

              // Validar filtro
              if (!cqlFilter) {
                logger.error('No se pudo crear filtro CQL para sequías');
                throw new Error('Filtro CQL requerido para capa de sequías');
              }

              logger.debug(`Activando sequías con filtro: ${cqlFilter}`);

              // Guardar filtro actual
              setCurrentFilters(prev => ({
                ...prev,
                [SEQUIA_CONFIG.layerName]: cqlFilter
              }));

              // Actualizar referencia
              lastUsedQuincenaRef.current = normalized;

              // Cargar datos filtrados
              const data = await fetchWfsLayer(
                name,
                cqlFilter,
                SEQUIA_CONFIG.maxFeatures || 5000
              );

              // Agregar metadata útil
              return {
                ...data,
                _metadata: {
                  quincena: normalized,
                  filter: cqlFilter,
                  featureCount: data?.features?.length || 0,
                  lastUpdate: Date.now()
                }
              };
            }

            // -------------------------------------------------------------
            // CASO NORMAL: Otras capas
            // -------------------------------------------------------------
            return fetchWfsLayer(name);
          })
        );

        // Procesar resultados
        const newLayersData = {};
        layersToToggle.forEach((name, index) => {
          const result = results[index];

          if (result.status === 'fulfilled' && result.value) {
            newLayersData[name] = result.value;
            logger.debug(`Capa ${name}: ${result.value.features?.length || 0} features`);
          } else {
            logger.error(`Error cargando ${name}:`, result.reason);
          }
        });

        // Actualizar estado solo si hay datos
        if (Object.keys(newLayersData).length > 0) {
          setActiveLayers(prev => ({ ...prev, ...newLayersData }));
        }

      } catch (error) {
        logger.error('Error general cargando capas:', error);
      } finally {
        // Quitar de cargando
        setLoadingLayers(prev => {
          const newSet = new Set(prev);
          layersToToggle.forEach(name => newSet.delete(name));
          return newSet;
        });
      }

    } else {
      // =====================================================================
      // DESACTIVAR CAPA(S)
      // =====================================================================

      // Remover del estado
      setActiveLayers(prev => {
        const newLayers = { ...prev };
        layersToToggle.forEach(name => {
          delete newLayers[name];
        });
        return newLayers;
      });

      // Limpiar filtros
      setCurrentFilters(prev => {
        const newFilters = { ...prev };
        layersToToggle.forEach(name => {
          delete newFilters[name];
        });
        return newFilters;
      });

      // Limpiar referencia de quincena si es sequías
      if (layersToToggle.includes(SEQUIA_CONFIG.layerName)) {
        lastUsedQuincenaRef.current = null;
      }
    }
  }, [sequiaQuincena]);

  /**
   * Maneja cambios del timeline temporal.
   * 
   * Específico para la capa de sequías. Recarga los datos
   * con el nuevo filtro de quincena.
   * 
   * @param {string} layerName - Nombre de la capa (debe ser sequías)
   * @param {string} newQuincena - Nueva quincena seleccionada
   */
  const handleTimelineChange = useCallback(async (layerName, newQuincena) => {
    // Solo funciona para sequías
    if (layerName !== SEQUIA_CONFIG.layerName) {
      logger.warn('Timeline change para capa diferente a sequías:', layerName);
      return;
    }

    // Normalizar quincena
    const normalized = normalizeQuincena(newQuincena);

    if (!normalized) {
      logger.error('Quincena inválida:', newQuincena);
      return;
    }

    // Crear nuevo filtro
    const newFilter = createSequiaFilter(normalized);

    if (!newFilter) {
      logger.error('No se pudo crear filtro para:', normalized);
      return;
    }

    // Actualizar filtro inmediatamente (optimistic update)
    setCurrentFilters(prev => ({
      ...prev,
      [SEQUIA_CONFIG.layerName]: newFilter
    }));

    // Marcar como cargando
    setLoadingLayers(prev => new Set([...prev, SEQUIA_CONFIG.layerName]));

    try {
      logger.debug(`Timeline change: ${normalized}, filtro: ${newFilter}`);

      // Cargar datos con nuevo filtro
      const data = await fetchWfsLayer(
        SEQUIA_CONFIG.layerName,
        newFilter,
        SEQUIA_CONFIG.maxFeatures || 5000
      );

      if (data && data.features) {
        logger.debug(`Sequía ${normalized}: ${data.features.length} features`);

        // Actualizar capa con metadata
        setActiveLayers(prev => ({
          ...prev,
          [SEQUIA_CONFIG.layerName]: {
            ...data,
            _metadata: {
              quincena: normalized,
              filter: newFilter,
              featureCount: data.features.length,
              lastUpdate: Date.now()
            }
          }
        }));

        lastUsedQuincenaRef.current = normalized;
      } else {
        // Sin datos para esta quincena
        logger.warn('No se obtuvieron features para:', normalized);
        setActiveLayers(prev => ({
          ...prev,
          [SEQUIA_CONFIG.layerName]: {
            type: 'FeatureCollection',
            features: [],
            _metadata: {
              quincena: normalized,
              filter: newFilter,
              featureCount: 0,
              lastUpdate: Date.now(),
              isEmpty: true
            }
          }
        }));
      }
    } catch (error) {
      logger.error('Error recargando sequías:', error);
    } finally {
      setLoadingLayers(prev => {
        const newSet = new Set(prev);
        newSet.delete(SEQUIA_CONFIG.layerName);
        return newSet;
      });
    }
  }, []);

  // =========================================================================
  // UTILIDADES
  // =========================================================================

  /**
   * Verifica si la capa de sequías está activa.
   * @returns {boolean}
   */
  const isSequiaActive = useCallback(() => {
    return SEQUIA_CONFIG.layerName in activeLayers;
  }, [activeLayers]);

  /**
   * Obtiene la última quincena utilizada.
   * @returns {string|null}
   */
  const getLastUsedQuincena = useCallback(() => {
    return lastUsedQuincenaRef.current;
  }, []);

  // =========================================================================
  // RETORNO
  // =========================================================================
  
  return {
    // Estado
    activeLayers,
    setActiveLayers,
    loadingLayers,
    setLoadingLayers,
    currentFilters,
    setCurrentFilters,

    // Handlers
    handleLayerToggle,
    handleTimelineChange,

    // Utilidades
    isSequiaActive,
    getLastUsedQuincena
  };
};

export default useLayerManagement;
