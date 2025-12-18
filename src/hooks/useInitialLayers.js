import { useEffect, useRef } from 'react';
import { fetchWfsLayer } from '../utils/wfsService';
import { BASE_LAYERS } from '../config/env';
import { logger } from '../config/env';

/**
 * Hook personalizado para cargar capas iniciales cuando el componente se monta.
 * Este hook maneja la carga asíncrona de una o más capas WFS al inicio de la aplicación.
 * 
 * @param {Object} params - Parámetros de configuración
 * @param {string|string[]} params.initialLayer - Nombre(s) de la(s) capa(s) a cargar
 * @param {Function} params.setActiveLayers - Función para actualizar el estado de capas activas
 * @param {Function} params.setLoadingLayers - Función para actualizar el estado de carga
 * @returns {Object} Objeto con estado de carga
 */
export const useInitialLayers = ({
    initialLayer,
    setActiveLayers,
    setLoadingLayers
}) => {
    // Referencia para evitar cargar las capas múltiples veces
    const loadedRef = useRef(false);

    useEffect(() => {
        // Validaciones para evitar cargas innecesarias
        if (!initialLayer || loadedRef.current) return;

        /**
         * Función asíncrona para cargar las capas iniciales
         */
        const loadInitialLayers = async () => {
            loadedRef.current = true;

            // Normalizar a array para manejar tanto una capa como múltiples
            const layersToLoad = Array.isArray(initialLayer) ? initialLayer : [initialLayer];

            // Filtrar capas que no deben cargarse (como la capa de estado base)
            const filtered = layersToLoad.filter(n => n !== BASE_LAYERS.ESTADO);
            if (filtered.length === 0) return;

            // Actualizar estado de carga
            setLoadingLayers(prev => new Set([...prev, ...filtered]));

            try {
                // Cargar todas las capas en paralelo
                const results = await Promise.allSettled(
                    filtered.map(n => fetchWfsLayer(n))
                );

                // Procesar resultados de cada capa
                const newData = {};
                results.forEach((res, i) => {
                    if (res.status === 'fulfilled' && res.value) {
                        // Almacenar datos de capa cargada exitosamente
                        newData[filtered[i]] = res.value;
                        logger.debug(`Capa inicial ${filtered[i]}: ${res.value.features?.length || 0} features`);
                    } else {
                        // Registrar errores de carga
                        logger.error(`Error cargando capa inicial ${filtered[i]}:`, res.reason);
                    }
                });

                // Actualizar capas activas solo si hay datos nuevos
                if (Object.keys(newData).length > 0) {
                    setActiveLayers(prev => ({ ...prev, ...newData }));
                }
            } catch (err) {
                // Manejo de errores generales
                logger.error('Error en loadInitialLayers:', err);
            } finally {
                // Limpiar estado de carga independientemente del resultado
                setLoadingLayers(prev => {
                    const updated = new Set(prev);
                    filtered.forEach(n => updated.delete(n));
                    return updated;
                });
            }
        };

        loadInitialLayers();
    }, [initialLayer, setActiveLayers, setLoadingLayers]);

    // Retornar estado de carga para componentes consumidores
    return {
        isLoading: loadedRef.current === false && initialLayer !== null
    };
};

export default useInitialLayers;