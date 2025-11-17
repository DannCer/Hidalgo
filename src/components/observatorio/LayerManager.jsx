// src/components/observatorio/hooks/useLayerManagement.js
import { useState, useCallback, useRef } from 'react';
import { fetchWfsLayer, fetchUniqueValues } from '../../../utils/wfsService'; // ✅ CORREGIDO: Agregar fetchUniqueValues
import { SEQUIA_CONFIG } from '../mapConfig';

export const useLayerManagement = (sequiaQuincena) => {
  const [activeLayers, setActiveLayers] = useState({});
  const [loadingLayers, setLoadingLayers] = useState(new Set());
  const [currentFilters, setCurrentFilters] = useState({});

  // ✅ Ref para almacenar el AbortController de la petición actual
  const abortControllerRef = useRef(null);
  // ✅ Ref para rastrear la última quincena solicitada
  const lastRequestedQuincenaRef = useRef(null);
  //  Ref para última quincena exitosa
  const lastSuccessfulQuincenaRef = useRef(null);

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

    if (layerName !== SEQUIA_CONFIG.layerName) return;

    // Normalizar la nueva quincena
    const cleanedQuincena = newQuincena.toString()
      .replace('Z', '')
      .replace('T00:00:00.000', '')
      .trim();

    lastRequestedQuincenaRef.current = cleanedQuincena;

    const targetQuincena = cleanedQuincena;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoadingLayers(prev => new Set([...prev, SEQUIA_CONFIG.layerName]));

    try {

      await new Promise(resolve => setTimeout(resolve, 150));


      const newFilter = `${SEQUIA_CONFIG.fieldName}='${targetQuincena}'`;

      setCurrentFilters(prev => ({
        ...prev,
        [SEQUIA_CONFIG.layerName]: newFilter
      }));

      const data = await fetchWfsLayer(SEQUIA_CONFIG.layerName, newFilter, 5000, 0, controller.signal);

      if (data && data.features) {
        const count = data.features.length;

        //  Actualizar capa manteniendo las propiedades de estilo
        setActiveLayers(prev => {
          const updatedLayers = { ...prev };

          // Preservar cualquier metadata de estilo existente
          if (updatedLayers[SEQUIA_CONFIG.layerName]) {
            updatedLayers[SEQUIA_CONFIG.layerName] = {
              ...data,
              _metadata: {
                ...updatedLayers[SEQUIA_CONFIG.layerName]._metadata,
                lastUpdate: Date.now(),
                quincena: targetQuincena,
                featureCount: data.features.length
              }
            };
          } else {
            updatedLayers[SEQUIA_CONFIG.layerName] = {
              ...data,
              _metadata: {
                lastUpdate: Date.now(),
                quincena: targetQuincena,
                featureCount: data.features.length
              }
            };
          }

          return updatedLayers;
        });

        //  Guardar quincena exitosa
        lastSuccessfulQuincenaRef.current = targetQuincena;
      } else {
        console.warn('⚠️ No se obtuvieron features para la quincena:', targetQuincena);
        setActiveLayers(prev => ({
          ...prev,
          [SEQUIA_CONFIG.layerName]: {
            type: 'FeatureCollection',
            features: [],
            _metadata: {
              quincena: targetQuincena,
              empty: true,
              lastUpdate: Date.now()
            }
          }
        }));
      }
    } catch (error) {

      console.error('❌ Error recargando sequías:', error);
    } finally {
      if (lastRequestedQuincenaRef.current === targetQuincena) {
        setLoadingLayers(prev => {
          const newSet = new Set(prev);
          newSet.delete(SEQUIA_CONFIG.layerName);
          return newSet;
        });
      }

      // Limpiar el controller si es el actual
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
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

export const useSequiaManager = (setSequiaQuincenaList, setSequiaQuincena) => {
  const loadSequiaQuincenas = useCallback(async () => {
    try {
      const uniqueQuincenas = await fetchUniqueValues(
        SEQUIA_CONFIG.layerName,
        SEQUIA_CONFIG.fieldName,
        10000
      );

      const normalizedQuincenas = uniqueQuincenas.map(q =>
        q.toString().replace('Z', '').replace('T00:00:00.000', '').trim()
      );

      setSequiaQuincenaList(normalizedQuincenas);
      if (normalizedQuincenas.length > 0) {
        const latestQuincena = normalizedQuincenas[normalizedQuincenas.length - 1];
        setSequiaQuincena(latestQuincena);
      }
    } catch (err) {
      console.error('❌ Error obteniendo quincenas:', err);
    }
  }, [setSequiaQuincenaList, setSequiaQuincena]);

  return { loadSequiaQuincenas };
};