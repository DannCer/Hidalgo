// src/components/observatorio/hooks/useLayerManagement.js
// ============================================
import { useState, useCallback, useRef } from 'react';
import { fetchWfsLayer } from '../../../utils/wfsService';
import { SEQUIA_CONFIG } from '../../../utils/constants';
import { logger } from '../../../config/env';
import { normalizeQuincena, createSequiaFilter } from '../../../utils/dataUtils';

/**
 * Hook para gestionar capas activas del mapa
 */
export const useLayerManagement = (sequiaQuincena) => {
  const [activeLayers, setActiveLayers] = useState({});
  const [loadingLayers, setLoadingLayers] = useState(new Set());
  const [currentFilters, setCurrentFilters] = useState({});
  
  // Ref para tracking de última quincena usada
  const lastUsedQuincenaRef = useRef(null);

  /**
   * Activa o desactiva una capa
   */
  const handleLayerToggle = useCallback(async (layerConfig, isChecked) => {
    const layersToToggle = Array.isArray(layerConfig.layerName)
      ? layerConfig.layerName
      : [layerConfig.layerName];

    const overrideQuincena = layerConfig.currentQuincena ?? null;
    
    if (isChecked) {
      // =====================================================
      // ACTIVAR CAPAS
      // =====================================================
      setLoadingLayers(prev => new Set([...prev, ...layersToToggle]));

      try {
        const results = await Promise.allSettled(
          layersToToggle.map(async (name) => {
            // =====================================================
            // CASO ESPECIAL: CAPA DE SEQUÍAS
            // =====================================================
            if (name === SEQUIA_CONFIG.layerName) {
              const effectiveQuincena = overrideQuincena || sequiaQuincena;
              
              // ⚠️ VALIDACIÓN CRÍTICA: No activar sin quincena
              if (!effectiveQuincena) {
                logger.error('No se puede activar capa de sequías sin quincena');
                throw new Error('Quincena requerida para capa de sequías');
              }

              // Normalizar y crear filtro
              const normalized = normalizeQuincena(effectiveQuincena);
              const cqlFilter = createSequiaFilter(normalized);
              
              // ⚠️ VALIDACIÓN CRÍTICA: No hacer fetch sin filtro
              if (!cqlFilter) {
                logger.error('No se pudo crear filtro CQL para sequías');
                throw new Error('Filtro CQL requerido para capa de sequías');
              }

              logger.debug(`Activando sequías con filtro: ${cqlFilter}`);
              
              // Guardar filtro
              setCurrentFilters(prev => ({ 
                ...prev, 
                [SEQUIA_CONFIG.layerName]: cqlFilter 
              }));
              
              // Guardar última quincena usada
              lastUsedQuincenaRef.current = normalized;

              // Fetch CON FILTRO (nunca sin filtro)
              const data = await fetchWfsLayer(
                name, 
                cqlFilter, 
                SEQUIA_CONFIG.maxFeatures || 5000
              );

              // Agregar metadata
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

            // =====================================================
            // OTRAS CAPAS (sin filtro especial)
            // =====================================================
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

        // Solo actualizar si hay datos válidos
        if (Object.keys(newLayersData).length > 0) {
          setActiveLayers(prev => ({ ...prev, ...newLayersData }));
        }

      } catch (error) {
        logger.error('Error general cargando capas:', error);
      } finally {
        setLoadingLayers(prev => {
          const newSet = new Set(prev);
          layersToToggle.forEach(name => newSet.delete(name));
          return newSet;
        });
      }
      
    } else {
      // =====================================================
      // DESACTIVAR CAPAS
      // =====================================================
      setActiveLayers(prev => {
        const newLayers = { ...prev };
        layersToToggle.forEach(name => {
          delete newLayers[name];
        });
        return newLayers;
      });
      
      setCurrentFilters(prev => {
        const newFilters = { ...prev };
        layersToToggle.forEach(name => {
          delete newFilters[name];
        });
        return newFilters;
      });
      
      // Limpiar ref si se desactiva sequía
      if (layersToToggle.includes(SEQUIA_CONFIG.layerName)) {
        lastUsedQuincenaRef.current = null;
      }
    }
  }, [sequiaQuincena]); // Solo sequiaQuincena como dependencia

  /**
   * Cambia la quincena de la capa de sequías
   * NOTA: Este método es legacy, preferir usar useTimelineManager
   */
  const handleTimelineChange = useCallback(async (layerName, newQuincena) => {
    if (layerName !== SEQUIA_CONFIG.layerName) {
      logger.warn('Timeline change para capa diferente a sequías:', layerName);
      return;
    }
    
    // Normalizar quincena
    const normalized = normalizeQuincena(newQuincena);
    
    // ⚠️ VALIDACIÓN: No proceder sin quincena válida
    if (!normalized) {
      logger.error('Quincena inválida:', newQuincena);
      return;
    }

    // Crear filtro
    const newFilter = createSequiaFilter(normalized);
    
    // ⚠️ VALIDACIÓN: No proceder sin filtro válido
    if (!newFilter) {
      logger.error('No se pudo crear filtro para:', normalized);
      return;
    }
    
    // Actualizar filtro
    setCurrentFilters(prev => ({ 
      ...prev, 
      [SEQUIA_CONFIG.layerName]: newFilter 
    }));

    // Recargar datos con el nuevo filtro
    setLoadingLayers(prev => new Set([...prev, SEQUIA_CONFIG.layerName]));
    
    try {
      logger.debug(`Timeline change: ${normalized}, filtro: ${newFilter}`);
      
      const data = await fetchWfsLayer(
        SEQUIA_CONFIG.layerName, 
        newFilter, 
        SEQUIA_CONFIG.maxFeatures || 5000
      );
      
      if (data && data.features) {
        logger.debug(`Sequía ${normalized}: ${data.features.length} features`);
        
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
  }, []); // Sin dependencias innecesarias

  /**
   * Verifica si la capa de sequías está activa
   */
  const isSequiaActive = useCallback(() => {
    return SEQUIA_CONFIG.layerName in activeLayers;
  }, [activeLayers]);

  /**
   * Obtiene la última quincena usada
   */
  const getLastUsedQuincena = useCallback(() => {
    return lastUsedQuincenaRef.current;
  }, []);

  return {
    // Estados
    activeLayers,
    setActiveLayers,
    loadingLayers,
    setLoadingLayers,
    currentFilters,
    setCurrentFilters,
    
    // Handlers
    handleLayerToggle,
    handleTimelineChange,
    
    // Helpers
    isSequiaActive,
    getLastUsedQuincena
  };
};

export default useLayerManagement;
