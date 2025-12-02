

import { useEffect, useRef } from 'react';
import { fetchWfsLayer } from '../utils/wfsService';
import { BASE_LAYERS } from '../config/env';
import { logger } from '../config/env';

export const useInitialLayers = ({
    initialLayer,
    setActiveLayers,
    setLoadingLayers
}) => {
    const loadedRef = useRef(false);

    useEffect(() => {

        if (!initialLayer || loadedRef.current) return;

        const loadInitialLayers = async () => {
            loadedRef.current = true;

            const layersToLoad = Array.isArray(initialLayer) ? initialLayer : [initialLayer];


            const filtered = layersToLoad.filter(n => n !== BASE_LAYERS.ESTADO);

            if (filtered.length === 0) return;


            setLoadingLayers(prev => new Set([...prev, ...filtered]));

            try {
                const results = await Promise.allSettled(
                    filtered.map(n => fetchWfsLayer(n))
                );

                const newData = {};
                results.forEach((res, i) => {
                    if (res.status === 'fulfilled' && res.value) {
                        newData[filtered[i]] = res.value;
                        logger.debug(`Capa inicial ${filtered[i]}: ${res.value.features?.length || 0} features`);
                    } else {
                        logger.error(`Error cargando capa inicial ${filtered[i]}:`, res.reason);
                    }
                });

                if (Object.keys(newData).length > 0) {
                    setActiveLayers(prev => ({ ...prev, ...newData }));
                }
            } catch (err) {
                logger.error('Error en loadInitialLayers:', err);
            } finally {
                setLoadingLayers(prev => {
                    const updated = new Set(prev);
                    filtered.forEach(n => updated.delete(n));
                    return updated;
                });
            }
        };

        loadInitialLayers();
    }, [initialLayer, setActiveLayers, setLoadingLayers]);

    return {
        isLoading: loadedRef.current === false && initialLayer !== null
    };
};

export default useInitialLayers;
