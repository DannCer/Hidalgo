

import { useState, useCallback, useEffect } from 'react';

export const useHighlightManager = (activeLayers) => {
    const [highlightData, setHighlightData] = useState([]);


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


    const clearAllHighlights = useCallback(() => {
        setHighlightData([]);
    }, []);


    const addHighlights = useCallback((newHighlights) => {
        setHighlightData(newHighlights);
    }, []);


    const hasHighlights = highlightData.length > 0;


    useEffect(() => {
        if (highlightData.length === 0) return;

        const activeLayerNames = Object.keys(activeLayers);


        const validHighlights = highlightData.filter(item =>
            activeLayerNames.includes(item.layerName)
        );


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
