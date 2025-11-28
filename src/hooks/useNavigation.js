// src/components/observatorio/hooks/useNavigation.js
// ============================================
// Hook para manejar la navegación y activación de capas desde InfoCard
// ============================================
import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchUniqueValues } from '../utils/wfsService';
import { SEQUIA_CONFIG } from '../config/env';
import { logger } from '../config/env';

// Delay para permitir que el estado se estabilice antes de activar capas
const NAVIGATION_DELAY = 100;

/**
 * Normaliza el formato de quincena
 * @param {string} quincena - Quincena en cualquier formato
 * @returns {string} Quincena normalizada
 */
const normalizeQuincena = (quincena) => {
    return quincena.toString()
        .replace('Z', '')
        .replace('T00:00:00.000', '')
        .trim();
};

/**
 * Hook que maneja la navegación y activación automática de capas
 * @param {Object} params - Parámetros del hook
 * @param {string[]} params.sequiaQuincenaList - Lista de quincenas disponibles
 * @param {string} params.sequiaQuincena - Quincena actual seleccionada
 * @param {Function} params.setSequiaQuincena - Setter para la quincena
 * @param {Function} params.handleLayerToggle - Función para activar/desactivar capas
 * @returns {Object} { navLayer, sectionId, isProcessing }
 */
export const useNavigation = ({
    sequiaQuincenaList,
    sequiaQuincena,
    setSequiaQuincena,
    handleLayerToggle
}) => {
    const location = useLocation();
    const navLayerProcessed = useRef(null);
    const isProcessing = useRef(false);

    // Extraer datos de navegación del state de location
    const navLayer = location.state?.layerName || null;
    const sectionId = location.state?.sectionId || null;

    /**
     * Activa una capa desde navegación
     */
    const activateNavigationLayer = useCallback(async () => {
        if (!navLayer || isProcessing.current) return;
        
        // Evitar procesar la misma capa múltiples veces
        const layerKey = Array.isArray(navLayer) ? navLayer.join(',') : navLayer;
        if (navLayerProcessed.current === layerKey) return;
        
        navLayerProcessed.current = layerKey;
        isProcessing.current = true;

        const layerToActivate = Array.isArray(navLayer) ? navLayer : [navLayer];
        const isSequia = layerToActivate.includes(SEQUIA_CONFIG.layerName);

        try {
            let targetQuincena = null;

            // Si es capa de sequía, determinar la quincena a usar
            if (isSequia) {
                if (sequiaQuincenaList.length > 0) {
                    // Usar la quincena actual o la última disponible
                    targetQuincena = sequiaQuincena || sequiaQuincenaList[sequiaQuincenaList.length - 1];
                } else {
                    // Cargar quincenas si no están disponibles
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

            // Preparar configuración de capa
            const config = {
                layerName: navLayer,
                _source: 'navigation'
            };

            if (isSequia && targetQuincena) {
                config.currentQuincena = targetQuincena;
            }

            // Activar capa con pequeño delay para estabilidad
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

    // Effect para procesar navegación
    useEffect(() => {
        activateNavigationLayer();
    }, [activateNavigationLayer]);

    // Resetear el ref cuando cambia la ubicación completamente
    useEffect(() => {
        return () => {
            // Limpiar al desmontar o cambiar de ruta
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
