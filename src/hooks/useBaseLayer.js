/**
 * @fileoverview Hook para gestión de la capa base del mapa.
 * 
 * Este hook maneja la carga de la capa base (límite del estado de Hidalgo)
 * que se muestra como referencia geográfica en el mapa.
 * 
 * @module hooks/useBaseLayer
 */

import { useState, useEffect } from 'react';
import { fetchWfsLayer } from '../utils/wfsService';
import { logger } from '../config/env';
import { BASE_LAYERS } from '../config/env';

/**
 * Hook para cargar y gestionar la capa base del estado.
 * 
 * La capa base muestra el contorno del estado de Hidalgo y se utiliza
 * como referencia visual. Se carga automáticamente al montar el componente.
 * 
 * @returns {Object} Estado y funciones de la capa base
 * @returns {Object|null} returns.baseLayerData - Datos GeoJSON de la capa base
 * @returns {boolean} returns.isLoading - Indica si está cargando
 * @returns {Error|null} returns.error - Error si ocurrió alguno
 * @returns {Function} returns.reload - Función para recargar la capa
 * 
 * @example
 * const { baseLayerData, isLoading, error, reload } = useBaseLayer();
 * 
 * if (isLoading) return <Spinner />;
 * if (error) return <Error message={error.message} onRetry={reload} />;
 * return <GeoJSON data={baseLayerData} />;
 */
export const useBaseLayer = () => {
    /** @type {[Object|null, Function]} Datos GeoJSON de la capa base */
    const [baseLayerData, setBaseLayerData] = useState(null);
    
    /** @type {[boolean, Function]} Estado de carga */
    const [isLoading, setIsLoading] = useState(true);
    
    /** @type {[Error|null, Function]} Error si ocurrió */
    const [error, setError] = useState(null);

    /**
     * Carga la capa base desde GeoServer.
     * Se ejecuta automáticamente al montar y puede llamarse manualmente para recargar.
     * @async
     */
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

    // Cargar al montar el componente
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
