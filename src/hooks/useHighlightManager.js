/**
 * @fileoverview Hook para gestión de resaltado de features.
 * 
 * Maneja el estado de los features resaltados cuando el usuario
 * hace hover o clic en elementos del mapa. Permite destacar
 * visualmente features específicos.
 * 
 * @module hooks/useHighlightManager
 */

import { useState, useCallback, useEffect } from 'react';

/**
 * Hook para gestionar resaltado visual de features en el mapa.
 * 
 * Proporciona funcionalidad para agregar, limpiar y gestionar
 * el resaltado de features cuando el usuario interactúa con el mapa.
 * 
 * @param {Object} activeLayers - Capas actualmente activas en el mapa
 * @returns {Object} Estado y funciones para manejo de resaltados
 * 
 * @example
 * const { highlightData, addHighlights, clearAllHighlights } = useHighlightManager(activeLayers);
 * 
 * // Resaltar un feature
 * addHighlights([{ layerName: 'Hidalgo:00_Municipios', feature: selectedFeature }]);
 * 
 * // Limpiar resaltados
 * clearAllHighlights();
 */
export const useHighlightManager = (activeLayers) => {
    /** 
     * Array de objetos con features resaltados.
     * @type {[Array<{layerName: string, feature: Object}>, Function]} 
     */
    const [highlightData, setHighlightData] = useState([]);

    /**
     * Limpia los resaltados de capas específicas.
     * @param {string|string[]} layerNames - Nombre(s) de capa(s) a limpiar
     * @returns {boolean} true si se eliminó al menos un resaltado
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
     * Limpia todos los resaltados del mapa.
     */
    const clearAllHighlights = useCallback(() => {
        setHighlightData([]);
    }, []);

    /**
     * Establece los features a resaltar (reemplaza los anteriores).
     * @param {Array<{layerName: string, feature: Object}>} newHighlights - Nuevos features a resaltar
     */
    const addHighlights = useCallback((newHighlights) => {
        setHighlightData(newHighlights);
    }, []);

    /** @type {boolean} Indica si hay features resaltados actualmente */
    const hasHighlights = highlightData.length > 0;

    // Limpiar resaltados de capas que ya no están activas
    useEffect(() => {
        if (highlightData.length === 0) return;

        const activeLayerNames = Object.keys(activeLayers);

        // Filtrar solo los resaltados de capas que siguen activas
        const validHighlights = highlightData.filter(item =>
            activeLayerNames.includes(item.layerName)
        );

        // Actualizar si cambió algo
        if (validHighlights.length !== highlightData.length) {
            setHighlightData(validHighlights);
        }
    }, [activeLayers]);

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
