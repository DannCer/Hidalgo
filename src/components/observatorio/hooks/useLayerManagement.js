// src/components/observatorio/hooks/useLayerManagement.js
import { useState, useCallback } from 'react';
import { fetchWfsLayer } from '../../../utils/wfsService';
import { SEQUIA_CONFIG } from '../mapConfig';

export const useLayerManagement = (sequiaQuincena) => {
  const [activeLayers, setActiveLayers] = useState({});
  const [loadingLayers, setLoadingLayers] = useState(new Set());
  const [currentFilters, setCurrentFilters] = useState({});

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
              let cqlFilter = null;
              const effectiveQuincena = overrideQuincena || sequiaQuincena;
              
              if (effectiveQuincena) {
                const norm = effectiveQuincena.toString().replace('Z', '').trim();
                cqlFilter = `${SEQUIA_CONFIG.fieldName}='${norm}'`;
                setCurrentFilters(prev => ({ ...prev, [SEQUIA_CONFIG.layerName]: cqlFilter }));
              } else {
                console.warn('⚠️ No hay quincena disponible para sequías');
              }

              return fetchWfsLayer(name, cqlFilter, 5000);
            }

            return fetchWfsLayer(name);
          })
        );

        const newLayersData = {};
        layersToToggle.forEach((name, index) => {
          if (results[index].status === 'fulfilled' && results[index].value) {
            newLayersData[name] = results[index].value;
            const count = results[index].value.features?.length || 0;
          } else {
            console.error(`❌ Error cargando ${name}:`, results[index].reason);
          }
        });

        setActiveLayers(prev => ({ ...prev, ...newLayersData }));

      } catch (error) {
        console.error('❌ Error general cargando capas:', error);
      } finally {
        setLoadingLayers(prev => {
          const newSet = new Set(prev);
          layersToToggle.forEach(name => newSet.delete(name));
          return newSet;
        });
      }
    } else {
      // Desactivar capas
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
    }
  }, [sequiaQuincena]);

  const handleTimelineChange = useCallback(async (layerName, newQuincena) => {    
    
    if (layerName !== SEQUIA_CONFIG.layerName) {
      console.warn('⚠️ Timeline change para capa diferente a sequías:', layerName);
      return;
    }
    
    // Normalizar la nueva quincena
    const cleanedQuincena = newQuincena.toString()
      .replace('Z', '')
      .replace('T00:00:00.000', '')
      .trim();
    
    const newFilter = `${SEQUIA_CONFIG.fieldName}='${cleanedQuincena}'`;
    
    // Actualizar filtro
    setCurrentFilters(prev => ({ 
      ...prev, 
      [SEQUIA_CONFIG.layerName]: newFilter 
    }));

        // Recargar datos con el nuevo filtro
    setLoadingLayers(prev => new Set([...prev, SEQUIA_CONFIG.layerName]));
    
    try {
      const data = await fetchWfsLayer(SEQUIA_CONFIG.layerName, newFilter, 5000);
      
      if (data && data.features) {
        const count = data.features.length;
        
        setActiveLayers(prev => ({ 
          ...prev, 
          [SEQUIA_CONFIG.layerName]: data 
        }));
      } else {
        console.warn('⚠️ No se obtuvieron features para la quincena:', cleanedQuincena);
        setActiveLayers(prev => ({ 
          ...prev, 
          [SEQUIA_CONFIG.layerName]: { type: 'FeatureCollection', features: [] } 
        }));
      }
    } catch (error) {
      console.error('❌ Error recargando sequías:', error);
    } finally {
      setLoadingLayers(prev => {
        const newSet = new Set(prev);
        newSet.delete(SEQUIA_CONFIG.layerName);
        return newSet;
      });
    }
  }, [activeLayers]);

  return {
    activeLayers,
    setActiveLayers,
    loadingLayers,
    setLoadingLayers,
    currentFilters,
    setCurrentFilters,
    handleLayerToggle,
    handleTimelineChange
  };
};