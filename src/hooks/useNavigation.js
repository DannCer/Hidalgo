

import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchUniqueValues } from '../utils/wfsService';
import { SEQUIA_CONFIG } from '../config/env';
import { logger } from '../config/env';

const NAVIGATION_DELAY = 100;

const normalizeQuincena = (quincena) => {
    return quincena.toString()
        .replace('Z', '')
        .replace('T00:00:00.000', '')
        .trim();
};

export const useNavigation = ({
    sequiaQuincenaList,
    sequiaQuincena,
    setSequiaQuincena,
    handleLayerToggle
}) => {
    const location = useLocation();
    const navLayerProcessed = useRef(null);
    const isProcessing = useRef(false);


    const navLayer = location.state?.layerName || null;
    const sectionId = location.state?.sectionId || null;


    const activateNavigationLayer = useCallback(async () => {
        if (!navLayer || isProcessing.current) return;


        const layerKey = Array.isArray(navLayer) ? navLayer.join(',') : navLayer;
        if (navLayerProcessed.current === layerKey) return;

        navLayerProcessed.current = layerKey;
        isProcessing.current = true;

        const layerToActivate = Array.isArray(navLayer) ? navLayer : [navLayer];
        const isSequia = layerToActivate.includes(SEQUIA_CONFIG.layerName);

        try {
            let targetQuincena = null;


            if (isSequia) {
                if (sequiaQuincenaList.length > 0) {

                    targetQuincena = sequiaQuincena || sequiaQuincenaList[sequiaQuincenaList.length - 1];
                } else {

                    logger.debug('Cargando quincenas para navegación...');
                    const uniqueQuincenas = await fetchUniqueValues(
                        SEQUIA_CONFIG.layerName,
                        SEQUIA_CONFIG.fieldName,
                        10000
                    );
                    const normalized = uniqueQuincenas.map(normalizeQuincena);

                    if (normalized.length > 0) {
                        targetQuincena = normalized[normalized.length - 1];
                        setSequiaQuincena(targetQuincena);
                    }
                }
            }


            const config = {
                layerName: navLayer,
                _source: 'navigation'
            };

            if (isSequia && targetQuincena) {
                config.currentQuincena = targetQuincena;
            }


            setTimeout(() => {
                handleLayerToggle(config, true);
                isProcessing.current = false;
            }, NAVIGATION_DELAY);

        } catch (err) {
            logger.error('Error en navegación:', err);
            navLayerProcessed.current = null;
            isProcessing.current = false;
        }
    }, [
        navLayer,
        sequiaQuincenaList,
        sequiaQuincena,
        setSequiaQuincena,
        handleLayerToggle
    ]);


    useEffect(() => {
        activateNavigationLayer();
    }, [activateNavigationLayer]);


    useEffect(() => {
        return () => {

            if (!location.state?.layerName) {
                navLayerProcessed.current = null;
            }
        };
    }, [location.pathname]);

    return {
        navLayer,
        sectionId,
        isProcessing: isProcessing.current
    };
};

export default useNavigation;
