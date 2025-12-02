

import { useState, useEffect } from 'react';
import { fetchWfsLayer } from '../utils/wfsService';
import { logger } from '../config/env';
import { BASE_LAYERS } from '../config/env';

export const useBaseLayer = () => {
    const [baseLayerData, setBaseLayerData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadBaseLayer = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const geojsonData = await fetchWfsLayer(BASE_LAYERS.ESTADO);
            if (geojsonData) {
                setBaseLayerData(geojsonData);
                logger.debug('Capa base cargada:', geojsonData.features?.length, 'features');
            }
        } catch (err) {
            logger.error('Error cargando capa base:', err);
            setError(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadBaseLayer();
    }, []);

    return {
        baseLayerData,
        isLoading,
        error,
        reload: loadBaseLayer
    };
};

export default useBaseLayer;
