

import { useState, useCallback, useRef } from 'react';
import { fetchWfsLayer } from '../utils/wfsService';
import { SEQUIA_CONFIG } from '../utils/constants';
import { logger } from '../config/env';
import { normalizeQuincena, createSequiaFilter } from '../utils/dataUtils';

export const useLayerManagement = (sequiaQuincena) => {
  const [activeLayers, setActiveLayers] = useState({});
  const [loadingLayers, setLoadingLayers] = useState(new Set());
  const [currentFilters, setCurrentFilters] = useState({});


  const lastUsedQuincenaRef = useRef(null);


  const handleLayerToggle = useCallback(async (layerConfig, isChecked) => {
    const layersToToggle = Array.isArray(layerConfig.layerName)
      ? layerConfig.layerName
      : [layerConfig.layerName];

    const overrideQuincena = layerConfig.currentQuincena ?? null;

    if (isChecked) {



      setLoadingLayers(prev => new Set([...prev, ...layersToToggle]));

      try {
        const results = await Promise.allSettled(
          layersToToggle.map(async (name) => {



            if (name === SEQUIA_CONFIG.layerName) {
              const effectiveQuincena = overrideQuincena || sequiaQuincena;


              if (!effectiveQuincena) {
                logger.error('No se puede activar capa de sequías sin quincena');
                throw new Error('Quincena requerida para capa de sequías');
              }


              const normalized = normalizeQuincena(effectiveQuincena);
              const cqlFilter = createSequiaFilter(normalized);


              if (!cqlFilter) {
                logger.error('No se pudo crear filtro CQL para sequías');
                throw new Error('Filtro CQL requerido para capa de sequías');
              }

              logger.debug(`Activando sequías con filtro: ${cqlFilter}`);


              setCurrentFilters(prev => ({
                ...prev,
                [SEQUIA_CONFIG.layerName]: cqlFilter
              }));


              lastUsedQuincenaRef.current = normalized;


              const data = await fetchWfsLayer(
                name,
                cqlFilter,
                SEQUIA_CONFIG.maxFeatures || 5000
              );


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




            return fetchWfsLayer(name);
          })
        );


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


      if (layersToToggle.includes(SEQUIA_CONFIG.layerName)) {
        lastUsedQuincenaRef.current = null;
      }
    }
  }, [sequiaQuincena]);


  const handleTimelineChange = useCallback(async (layerName, newQuincena) => {
    if (layerName !== SEQUIA_CONFIG.layerName) {
      logger.warn('Timeline change para capa diferente a sequías:', layerName);
      return;
    }


    const normalized = normalizeQuincena(newQuincena);


    if (!normalized) {
      logger.error('Quincena inválida:', newQuincena);
      return;
    }


    const newFilter = createSequiaFilter(normalized);


    if (!newFilter) {
      logger.error('No se pudo crear filtro para:', normalized);
      return;
    }


    setCurrentFilters(prev => ({
      ...prev,
      [SEQUIA_CONFIG.layerName]: newFilter
    }));


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
  }, []);


  const isSequiaActive = useCallback(() => {
    return SEQUIA_CONFIG.layerName in activeLayers;
  }, [activeLayers]);


  const getLastUsedQuincena = useCallback(() => {
    return lastUsedQuincenaRef.current;
  }, []);

  return {

    activeLayers,
    setActiveLayers,
    loadingLayers,
    setLoadingLayers,
    currentFilters,
    setCurrentFilters,


    handleLayerToggle,
    handleTimelineChange,


    isSequiaActive,
    getLastUsedQuincena
  };
};

export default useLayerManagement;
