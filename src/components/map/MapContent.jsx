// src/components/observatorio/MapContent.jsx
// ============================================
// Componente interno del mapa (dentro de MapContainer)
// ============================================
import React, { memo, useMemo } from 'react';
import { ScaleControl, GeoJSON, ZoomControl } from "react-leaflet";
import PropTypes from 'prop-types';

// Componentes del mapa
import MapClickHandler from './MapClickHandler';
import KeepPopupInView from './KeepPopupInView';
import GeoJsonLayers from './GeoJsonLayers';
import BaseLayerControls from './BaseLayerControls';
import ControlSidebarWrapper from './ControlSidebarWrapper';
import HighlightLayer from './HighlightLayer';

// Utilidades
import { getLayerOptions } from '../../utils/layerStyleFactory';
import { BASE_LAYERS } from '../../config/env';

/**
 * Contenido interno del mapa
 * Separado del MapContainer para optimizar re-renders
 */
const MapContent = memo(({
    // Datos
    baseLayerData,
    activeLayers,
    highlightData,
    popupData,
    
    // Variantes
    productionVariant,
    usoConsuntivoVariant,
    riesgosVariant,
    sequiaQuincena,
    
    // Handlers
    setPopupData,
    setHighlightData,
    handleClosePopup
}) => {
    // Memoizar props de GeoJsonLayers
    const geoJsonLayersProps = useMemo(() => ({
        activeLayers,
        productionVariant,
        usoConsuntivoVariant,
        riesgosVariant,
        sequiaQuincena
    }), [activeLayers, productionVariant, usoConsuntivoVariant, riesgosVariant, sequiaQuincena]);

    return (
        <>
            {/* Controles de zoom */}
            <ZoomControl 
                position="topright" 
                zoomInTitle="Acercar" 
                zoomOutTitle="Alejar" 
            />
            
            {/* Escala */}
            <ScaleControl 
                maxWidth="150" 
                position="bottomright" 
                imperial={false} 
            />

            {/* Selector de capas base (satélite, calles, etc.) */}
            <BaseLayerControls />

            {/* Manejador de clics en el mapa */}
            <MapClickHandler
                activeLayers={activeLayers}
                setPopupData={setPopupData}
                baseLayerData={baseLayerData}
                sequiaQuincena={sequiaQuincena}
                setHighlightData={setHighlightData}
            />

            {/* Mantener popup en vista */}
            <KeepPopupInView />

            {/* Sidebar con información del popup */}
            <ControlSidebarWrapper 
                popupData={popupData} 
                setPopupData={handleClosePopup} 
            />

            {/* Capa de resaltado de features seleccionados */}
            <HighlightLayer data={highlightData} />

            {/* Capa base del estado */}
            {baseLayerData && (
                <GeoJSON
                    key={`${BASE_LAYERS.ESTADO}-base`}
                    data={baseLayerData}
                    {...getLayerOptions(BASE_LAYERS.ESTADO)}
                />
            )}

            {/* Capas GeoJSON activas */}
            <GeoJsonLayers {...geoJsonLayersProps} />
        </>
    );
});

MapContent.displayName = 'MapContent';

MapContent.propTypes = {
    baseLayerData: PropTypes.object,
    activeLayers: PropTypes.object.isRequired,
    highlightData: PropTypes.array.isRequired,
    popupData: PropTypes.object,
    productionVariant: PropTypes.string.isRequired,
    usoConsuntivoVariant: PropTypes.string.isRequired,
    riesgosVariant: PropTypes.string.isRequired,
    sequiaQuincena: PropTypes.string,
    setPopupData: PropTypes.func.isRequired,
    setHighlightData: PropTypes.func.isRequired,
    handleClosePopup: PropTypes.func.isRequired
};

export default MapContent;
