// src/components/observatorio/hooks/useHighlightManager.js
// ============================================
// Hook para manejar el resaltado de features en el mapa
// ============================================
import { useState, useCallback, useEffect } from 'react';

/**
 * Hook que maneja el estado de highlights de features
 * @param {Object} activeLayers - Capas activas actualmente
 * @returns {Object} Estado y funciones para manejar highlights
 */
export const useHighlightManager = (activeLayers) => {
    const [highlightData, setHighlightData] = useState([]);

    /**
     * Limpia los highlights de capas específicas
     * @param {string|string[]} layerNames - Nombre(s) de capa(s) a limpiar
     * @returns {boolean} true si se eliminaron highlights
     */
    const clearHighlightsForLayers = useCallback((layerNames) => {
        const names = Array.isArray(layerNames) ? layerNames : [layerNames];
        
        let removed = false;
        setHighlightData(prev => {
            if (!prev || prev.length === 0) return prev;
            
            const filtered = prev.filter(item => !names.includes(item.layerName));
            removed = filtered.length !== prev.length;
            
            return filtered;
        });
        
        return removed;
    }, []);

    /**
     * Limpia todos los highlights
     */
    const clearAllHighlights = useCallback(() => {
        setHighlightData([]);
    }, []);

    /**
     * Agrega nuevos highlights
     * @param {Array} newHighlights - Array de { feature, layerName }
     */
    const addHighlights = useCallback((newHighlights) => {
        setHighlightData(newHighlights);
    }, []);

    /**
     * Verifica si hay highlights activos
     */
    const hasHighlights = highlightData.length > 0;

    /**
     * Effect: Limpiar highlights cuando cambian las capas activas
     * Elimina highlights de capas que ya no están activas
     */
    useEffect(() => {
        if (highlightData.length === 0) return;
        
        const activeLayerNames = Object.keys(activeLayers);
        
        // Filtrar highlights que pertenecen a capas que ya no están activas
        const validHighlights = highlightData.filter(item => 
            activeLayerNames.includes(item.layerName)
        );
        
        // Solo actualizar si hay cambios
        if (validHighlights.length !== highlightData.length) {
            setHighlightData(validHighlights);
        }
    }, [activeLayers]); // No incluir highlightData para evitar loops

    return {
        highlightData,
        setHighlightData,
        clearHighlightsForLayers,
        clearAllHighlights,
        addHighlights,
        hasHighlights
    };
};

export default useHighlightManager;
