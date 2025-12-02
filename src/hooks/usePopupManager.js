

import { useState, useCallback, useEffect } from 'react';

export const usePopupManager = (activeLayers, baseLayerData, onClose) => {
    const [popupData, setPopupData] = useState(null);
    const [isVisible, setIsVisible] = useState(false);


    const openPopup = useCallback((data) => {
        setPopupData(data);
        setIsVisible(true);
    }, []);


    const closePopup = useCallback(() => {
        setPopupData(null);
        setIsVisible(false);
        if (onClose) {
            onClose();
        }
    }, [onClose]);


    const updatePopupData = useCallback((data) => {
        setPopupData(prev => ({
            ...prev,
            ...data
        }));
    }, []);


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
