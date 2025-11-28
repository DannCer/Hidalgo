// src/components/observatorio/hooks/usePopupManager.js
// ============================================
// Hook para manejar el estado del popup del mapa
// ============================================
import { useState, useCallback, useEffect } from 'react';

/**
 * Hook que maneja el estado y comportamiento del popup
 * @param {Object} activeLayers - Capas activas
 * @param {Object} baseLayerData - Datos de la capa base
 * @param {Function} onClose - Callback opcional al cerrar
 * @returns {Object} Estado y funciones del popup
 */
export const usePopupManager = (activeLayers, baseLayerData, onClose) => {
    const [popupData, setPopupData] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    /**
     * Abre el popup con datos
     * @param {Object} data - Datos a mostrar en el popup
     */
    const openPopup = useCallback((data) => {
        setPopupData(data);
        setIsVisible(true);
    }, []);

    /**
     * Cierra el popup y ejecuta callback si existe
     */
    const closePopup = useCallback(() => {
        setPopupData(null);
        setIsVisible(false);
        if (onClose) {
            onClose();
        }
    }, [onClose]);

    /**
     * Actualiza los datos del popup sin cambiar visibilidad
     * @param {Object} data - Nuevos datos
     */
    const updatePopupData = useCallback((data) => {
        setPopupData(prev => ({
            ...prev,
            ...data
        }));
    }, []);

    /**
     * Effect: Cerrar popup si no hay capas activas
     */
    useEffect(() => {
        const hasActiveLayers = Object.keys(activeLayers).length > 0 || baseLayerData;
        if (!hasActiveLayers && popupData) {
            closePopup();
        }
    }, [activeLayers, baseLayerData, popupData, closePopup]);

    return {
        popupData,
        setPopupData,
        isVisible,
        openPopup,
        closePopup,
        updatePopupData
    };
};

export default usePopupManager;
