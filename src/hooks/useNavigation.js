import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchUniqueValues } from '../utils/wfsService';
import { SEQUIA_CONFIG } from '../config/env';
import { logger } from '../config/env';

/**
 * Retardo entre operaciones de navegación para evitar conflictos
 */
const NAVIGATION_DELAY = 100;

/**
 * Normaliza el formato de quincena eliminando caracteres innecesarios
 * @param {string|number} quincena - Valor de quincena a normalizar
 * @returns {string} Quincena normalizada
 */
const normalizeQuincena = (quincena) => {
    return quincena.toString()
        .replace('Z', '')
        .replace('T00:00:00.000', '')
        .trim();
};

/**
 * Hook personalizado para manejar navegación entre capas y secciones de la aplicación.
 * Se activa cuando se navega desde otros componentes con parámetros en el estado de ruta.
 * 
 * @param {Object} params - Parámetros de configuración
 * @param {Array} params.sequiaQuincenaList - Lista de quincenas disponibles para sequía
 * @param {string} params.sequiaQuincena - Quincena actualmente seleccionada
 * @param {Function} params.setSequiaQuincena - Función para actualizar la quincena
 * @param {Function} params.handleLayerToggle - Función para activar/desactivar capas
 * @returns {Object} Información de navegación
 */
export const useNavigation = ({
    sequiaQuincenaList,
    sequiaQuincena,
    setSequiaQuincena,
    handleLayerToggle
}) => {
    const location = useLocation();
    
    // Referencias para control de estado interno
    const navLayerProcessed = useRef(null);  // Última capa procesada
    const isProcessing = useRef(false);      // Indica si hay proceso en curso

    // Extraer parámetros de navegación del estado de la ruta
    const navLayer = location.state?.layerName || null;  // Capa a activar
    const sectionId = location.state?.sectionId || null; // ID de sección destino

    /**
     * Función principal para activar capas de navegación
     * Maneja lógica específica para capas de sequía y otras capas
     */
    const activateNavigationLayer = useCallback(async () => {
        // Validaciones para evitar procesamiento innecesario
        if (!navLayer || isProcessing.current) return;

        // Crear clave única para identificar esta operación de navegación
        const layerKey = Array.isArray(navLayer) ? navLayer.join(',') : navLayer;
        if (navLayerProcessed.current === layerKey) return;

        // Marcar como procesada y en proceso
        navLayerProcessed.current = layerKey;
        isProcessing.current = true;

        // Normalizar a array para manejo uniforme
        const layerToActivate = Array.isArray(navLayer) ? navLayer : [navLayer];
        const isSequia = layerToActivate.includes(SEQUIA_CONFIG.layerName);

        try {
            let targetQuincena = null;

            // Lógica específica para capas de sequía
            if (isSequia) {
                if (sequiaQuincenaList.length > 0) {
                    // Usar quincena actual o la última disponible
                    targetQuincena = sequiaQuincena || sequiaQuincenaList[sequiaQuincenaList.length - 1];
                } else {
                    // Si no hay lista cargada, obtener quincenas del servicio
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

            // Configurar parámetros para activación de capa
            const config = {
                layerName: navLayer,
                _source: 'navigation'  // Identificador para evitar bucles
            };

            // Agregar quincena si es capa de sequía
            if (isSequia && targetQuincena) {
                config.currentQuincena = targetQuincena;
            }

            // Activar capa con retardo para evitar conflictos
            setTimeout(() => {
                handleLayerToggle(config, true);
                isProcessing.current = false;
            }, NAVIGATION_DELAY);

        } catch (err) {
            // Manejo de errores y limpieza de estado
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

    /**
     * Efecto para activar navegación cuando cambian los parámetros
     */
    useEffect(() => {
        activateNavigationLayer();
    }, [activateNavigationLayer]);

    /**
     * Efecto de limpieza para resetear estado al cambiar de ruta
     */
    useEffect(() => {
        return () => {
            // Solo resetear si no hay capa en el nuevo estado
            if (!location.state?.layerName) {
                navLayerProcessed.current = null;
            }
        };
    }, [location.pathname]);

    // Retorno de información de navegación
    return {
        navLayer,           // Capa objetivo de navegación
        sectionId,          // ID de sección destino
        isProcessing: isProcessing.current  // Estado de procesamiento
    };
};

export default useNavigation;