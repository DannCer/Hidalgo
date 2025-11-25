// src/components/observatorio/hooks/useTimelineManager.js
import { useState, useCallback, useRef, useEffect } from 'react';
import { fetchWfsLayer } from '../../../utils/wfsService';
import { forceStyleUpdate } from '../../../utils/layerStyleFactory';
import { SEQUIA_CONFIG } from '../../../utils/constants';
import { normalizeQuincena, createSequiaFilter, debounce } from '../../../utils/dataUtils';

/**
 * Hook optimizado para gestionar el timeline de sequías
 * Resuelve el problema de lag mediante:
 * - Debouncing inteligente
 * - Cancelación de requests
 * - Actualización optimista del UI
 * - Gestión eficiente de caché
 */
export const useTimelineManager = (activeLayers, setActiveLayers, setLoadingLayers, setCurrentFilters) => {
  // Referencias para control de requests
  const abortControllerRef = useRef(null);
  const lastRequestedRef = useRef(null);
  const pendingUpdateRef = useRef(null);
  
  // Estado local para UI inmediato
  const [optimisticQuincena, setOptimisticQuincena] = useState(null);

  // ===================================================================
  // LIMPIEZA AL DESMONTAR
  // ===================================================================
  
  useEffect(() => {
    return () => {
      // Cancelar requests pendientes
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Cancelar debounce pendiente
      if (pendingUpdateRef.current) {
        clearTimeout(pendingUpdateRef.current);
      }
    };
  }, []);

  // ===================================================================
  // FUNCIÓN CORE: ACTUALIZAR DATOS DE SEQUÍAS
  // ===================================================================
  
  const updateSequiaData = useCallback(async (normalizedQuincena, signal) => {
    const filter = createSequiaFilter(normalizedQuincena);
    
    if (!filter) {
      console.warn('⚠️ No se pudo crear filtro para quincena:', normalizedQuincena);
      return null;
    }

    try {
      // Actualizar filtro inmediatamente
      setCurrentFilters(prev => ({
        ...prev,
        [SEQUIA_CONFIG.layerName]: filter
      }));

      // Fetch data
      const data = await fetchWfsLayer(
        SEQUIA_CONFIG.layerName,
        filter,
        5000,
        0,
        signal
      );

      if (data?.features) {
        // Actualizar capa con metadata
        setActiveLayers(prev => ({
          ...prev,
          [SEQUIA_CONFIG.layerName]: {
            ...data,
            _metadata: {
              lastUpdate: Date.now(),
              quincena: normalizedQuincena,
              featureCount: data.features.length,
              filter
            }
          }
        }));

        return data;
      }

      return null;
    } catch (error) {
      if (!error.name || error.name !== 'AbortError') {
        console.error('❌ Error actualizando sequías:', error);
      }
      throw error;
    }
  }, [setActiveLayers, setCurrentFilters]);

  // ===================================================================
  // FUNCIÓN DEBOUNCED PARA CAMBIOS RÁPIDOS
  // ===================================================================
  
  const debouncedUpdate = useCallback(
    debounce(async (normalizedQuincena) => {
      // Verificar si esta es todavía la última quincena solicitada
      if (lastRequestedRef.current !== normalizedQuincena) {
        return;
      }

      // Cancelar request anterior
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Crear nuevo controller
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Marcar como cargando
      setLoadingLayers(prev => new Set([...prev, SEQUIA_CONFIG.layerName]));

      try {
        // Actualizar datos
        await updateSequiaData(normalizedQuincena, controller.signal);

        // Forzar actualización de estilos (dos veces para asegurar)
        forceStyleUpdate();
        setTimeout(() => {
          forceStyleUpdate();
        }, 100);

      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('❌ Error en debounced update:', error);
        }
      } finally {
        // Solo quitar loading si esta es la última request
        if (lastRequestedRef.current === normalizedQuincena) {
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
    }, SEQUIA_CONFIG.debounceMs),
    [updateSequiaData, setLoadingLayers]
  );

  // ===================================================================
  // HANDLER PRINCIPAL: CAMBIO DE QUINCENA
  // ===================================================================
  
  const handleTimelineChange = useCallback((layerName, newQuincena) => {
    // Solo manejar capa de sequías
    if (layerName !== SEQUIA_CONFIG.layerName) {
      console.warn('⚠️ Timeline change para capa no soportada:', layerName);
      return;
    }

    // Normalizar quincena
    const normalized = normalizeQuincena(newQuincena);
    
    if (!normalized) {
      console.error('❌ Quincena inválida:', newQuincena);
      return;
    }

    // Actualizar referencia de última solicitud
    lastRequestedRef.current = normalized;

    // 🎯 ACTUALIZACIÓN OPTIMISTA: UI responde instantáneamente
    setOptimisticQuincena(normalized);

    // Ejecutar actualización debounced
    debouncedUpdate(normalized);
  }, [debouncedUpdate]);

  // ===================================================================
  // FUNCIÓN PARA CANCELAR UPDATES PENDIENTES
  // ===================================================================
  
  const cancelPendingUpdates = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (debouncedUpdate.cancel) {
      debouncedUpdate.cancel();
    }
    lastRequestedRef.current = null;
    setOptimisticQuincena(null);
  }, [debouncedUpdate]);

  // ===================================================================
  // FUNCIÓN PARA FORZAR ACTUALIZACIÓN INMEDIATA
  // ===================================================================
  
  const forceUpdate = useCallback(async (quincena) => {
    cancelPendingUpdates();
    
    const normalized = normalizeQuincena(quincena);
    lastRequestedRef.current = normalized;
    setOptimisticQuincena(normalized);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoadingLayers(prev => new Set([...prev, SEQUIA_CONFIG.layerName]));

    try {
      await updateSequiaData(normalized, controller.signal);
      forceStyleUpdate();
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('❌ Error en force update:', error);
      }
    } finally {
      setLoadingLayers(prev => {
        const newSet = new Set(prev);
        newSet.delete(SEQUIA_CONFIG.layerName);
        return newSet;
      });
      abortControllerRef.current = null;
    }
  }, [cancelPendingUpdates, updateSequiaData, setLoadingLayers]);

  return {
    handleTimelineChange,
    optimisticQuincena,
    cancelPendingUpdates,
    forceUpdate,
    isUpdating: !!abortControllerRef.current
  };
};