/**
 * @fileoverview Hook para gestión de popups del mapa.
 * 
 * Maneja el estado y comportamiento de los popups que se muestran
 * cuando el usuario hace clic en features del mapa.
 * 
 * @module hooks/usePopupManager
 */

import { useState, useCallback, useEffect } from 'react';

/**
 * Hook para gestionar popups informativos del mapa.
 * 
 * Proporciona funcionalidad para abrir, cerrar y actualizar popups
 * que muestran información de los features seleccionados.
 * 
 * @param {Object} activeLayers - Capas actualmente activas en el mapa
 * @param {Object|null} baseLayerData - Datos de la capa base
 * @param {Function} [onClose] - Callback opcional al cerrar el popup
 * @returns {Object} Estado y funciones para manejo de popups
 * 
 * @example
 * const { popupData, isVisible, openPopup, closePopup } = usePopupManager(
 *   activeLayers,
 *   baseLayerData,
 *   () => console.log('Popup cerrado')
 * );
 */
export const usePopupManager = (activeLayers, baseLayerData, onClose) => {
    /** @type {[Object|null, Function]} Datos del popup actual */
    const [popupData, setPopupData] = useState(null);
    
    /** @type {[boolean, Function]} Visibilidad del popup */
    const [isVisible, setIsVisible] = useState(false);

    /**
     * Abre el popup con los datos proporcionados.
     * @param {Object} data - Datos a mostrar en el popup
     * @param {Object} data.latlng - Posición del popup
     * @param {Array} data.features - Features a mostrar
     */
    const openPopup = useCallback((data) => {
        setPopupData(data);
        setIsVisible(true);
    }, []);

    /**
     * Cierra el popup y ejecuta callback si existe.
     */
    const closePopup = useCallback(() => {
        setPopupData(null);
        setIsVisible(false);
        if (onClose) {
            onClose();
        }
    }, [onClose]);

    /**
     * Actualiza parcialmente los datos del popup sin cerrarlo.
     * @param {Object} data - Datos a actualizar (se mezclan con existentes)
     */
    const updatePopupData = useCallback((data) => {
        setPopupData(prev => ({
            ...prev,
            ...data
        }));
    }, []);

    // Cerrar popup si no hay capas activas
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
