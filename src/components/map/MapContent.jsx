/**
 * @fileoverview Componente MapContent del Geovisor.
 * Componente contenedor principal que organiza todos los elementos del mapa Leaflet.
 * Coordina controles, capas, eventos y funcionalidades del visor cartográfico.
 * 
 * @module components/map/MapContent
 * @version 1.0.0
 */

import React, { memo, useMemo } from 'react';
import { ScaleControl, GeoJSON, ZoomControl } from "react-leaflet";
import PropTypes from 'prop-types';

// Importación de componentes del mapa
import MapClickHandler from './MapClickHandler';
import KeepPopupInView from './KeepPopupInView';
import GeoJsonLayers from './GeoJsonLayers';
import BaseLayerControls from './BaseLayerControls';
import ControlSidebarWrapper from './ControlSidebarWrapper';
import HighlightLayer from './HighlightLayer';

// Utilidades y configuraciones
import { getLayerOptions } from '../../utils/layerStyleFactory';
import { BASE_LAYERS } from '../../config/env';

/**
 * Componente principal que renderiza y organiza todos los elementos del mapa
 * Utiliza memo para optimizar rendimiento y evitar re-renderizados innecesarios
 * 
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.baseLayerData - Datos de la capa base (estado de Hidalgo)
 * @param {Object} props.activeLayers - Capas activas organizadas por nombre
 * @param {Array} props.highlightData - Datos para resaltar elementos
 * @param {Object} props.popupData - Datos para mostrar en popup/sidebar
 * @param {string} props.productionVariant - Variante de producción seleccionada
 * @param {string} props.usoConsuntivoVariant - Variante de uso consuntivo
 * @param {string} props.riesgosVariant - Variante de riesgos
 * @param {string} props.sequiaQuincena - Quincena seleccionada para sequía
 * @param {Function} props.setPopupData - Función para actualizar datos del popup
 * @param {Function} props.setHighlightData - Función para actualizar resaltados
 * @param {Function} props.handleClosePopup - Función para cerrar popups
 * @returns {JSX.Element} Contenedor con todos los elementos del mapa
 */
const MapContent = memo(({
    baseLayerData,
    activeLayers,
    highlightData,
    popupData,

    productionVariant,
    usoConsuntivoVariant,
    riesgosVariant,
    sequiaQuincena,

    setPopupData,
    setHighlightData,
    handleClosePopup
}) => {
    /**
     * Memoiza las propiedades de GeoJsonLayers para evitar re-renderizados
     * Solo se recalcula cuando cambian las dependencias especificadas
     */
    const geoJsonLayersProps = useMemo(() => ({
        activeLayers,
        productionVariant,
        usoConsuntivoVariant,
        riesgosVariant,
        sequiaQuincena
    }), [activeLayers, productionVariant, usoConsuntivoVariant, riesgosVariant, sequiaQuincena]);

    return (
        <>
            {/* Control de zoom con posición personalizada */}
            <ZoomControl
                position="topright"
                zoomInTitle="Acercar"
                zoomOutTitle="Alejar"
            />

            {/* Escala gráfica en el mapa */}
            <ScaleControl
                maxWidth="150"
                position="bottomright"
                imperial={false}
            />

            {/* Controles para cambiar capas base (OpenStreetMap, etc.) */}
            <BaseLayerControls />

            {/* Manejador de clics en el mapa para mostrar información */}
            <MapClickHandler
                activeLayers={activeLayers}
                setPopupData={setPopupData}
                baseLayerData={baseLayerData}
                sequiaQuincena={sequiaQuincena}
                setHighlightData={setHighlightData}
            />

            {/* Componente para mantener popups visibles al hacer scroll/zoom */}
            <KeepPopupInView />

            {/* Sidebar/popup personalizado con contenido avanzado */}
            <ControlSidebarWrapper
                popupData={popupData}
                setPopupData={handleClosePopup}
            />

            {/* Capa para resaltar elementos seleccionados */}
            <HighlightLayer data={highlightData} />

            {/* Capa base del estado de Hidalgo (contorno) */}
            {baseLayerData && (
                <GeoJSON
                    key={`${BASE_LAYERS.ESTADO}-base`}
                    data={baseLayerData}
                    {...getLayerOptions(BASE_LAYERS.ESTADO)}
                />
            )}

            {/* Renderiza todas las capas GeoJSON activas */}
            <GeoJsonLayers {...geoJsonLayersProps} />
        </>
    );
});

// Nombre para debugging en React DevTools
MapContent.displayName = 'MapContent';

// Validación de tipos de propiedades
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