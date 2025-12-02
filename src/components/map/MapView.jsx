

import React, { useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { MapContainer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import PropTypes from 'prop-types';

const LayerMenu = lazy(() => import('./LayerMenu'));
const Legend = lazy(() => import('./Legend'));
const AttributeTableModal = lazy(() => import('./AttributeTableModal'));

import MapContent from './MapContent';

import {
    useSequiaData,
    useLayerManagement,
    useTableModal,
    useTimelineManager,
    useBaseLayer,
    useHighlightManager,
    useVariants,
    useNavigation,
    usePopupManager,
    useInitialLayers
} from '../../hooks';

import { SEQUIA_CONFIG, BASE_LAYERS } from '../../config/env';
import { config, logger } from '../../config/env';
import { legendData } from '../../utils/legendData';
import { forceStyleUpdate } from '../../utils/layerStyleFactory';

import '../../styles/mapView.css';

const LoadingFallback = ({ message = 'Cargando...' }) => (
    <div className="loading-fallback">
        <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">{message}</span>
        </div>
    </div>
);

const MapView = ({ initialLayer, sectionIndex }) => {



    const { baseLayerData } = useBaseLayer();


    const {
        sequiaQuincenaList,
        sequiaQuincena,
        setSequiaQuincena,
        timelineConfigs,
        setTimelineConfigs
    } = useSequiaData();


    const {
        activeLayers,
        setActiveLayers,
        loadingLayers,
        setLoadingLayers,
        currentFilters,
        setCurrentFilters,
        handleLayerToggle: originalHandleLayerToggle
    } = useLayerManagement(sequiaQuincena);


    const {
        handleTimelineChange: timelineManagerChange,
        optimisticQuincena,
        isUpdating
    } = useTimelineManager(
        activeLayers,
        setActiveLayers,
        setLoadingLayers,
        setCurrentFilters
    );




    const {
        currentVariants,
        productionVariant,
        usoConsuntivoVariant,
        riesgosVariant,
        handleVariantChange
    } = useVariants();


    const {
        highlightData,
        setHighlightData,
        clearHighlightsForLayers,
        clearAllHighlights
    } = useHighlightManager(activeLayers);


    const {
        popupData,
        setPopupData,
        closePopup
    } = usePopupManager(activeLayers, baseLayerData, clearAllHighlights);


    const {
        tableModalState,
        handleShowTable,
        handleCloseTable
    } = useTableModal(currentFilters);




    const handleLayerToggle = useCallback((layerConfig, isActive) => {

        if (!isActive) {
            const layerName = layerConfig.layerName || layerConfig;
            const layerNames = Array.isArray(layerName) ? layerName : [layerName];

            const hadHighlights = clearHighlightsForLayers(layerNames);


            if (hadHighlights && highlightData.length <= layerNames.length) {
                closePopup();
            }
        }


        originalHandleLayerToggle(layerConfig, isActive);
    }, [originalHandleLayerToggle, clearHighlightsForLayers, highlightData.length, closePopup]);



    const { navLayer, sectionId } = useNavigation({
        sequiaQuincenaList,
        sequiaQuincena,
        setSequiaQuincena,
        handleLayerToggle
    });



    useInitialLayers({
        initialLayer,
        setActiveLayers,
        setLoadingLayers
    });




    const handleTimelineChange = useCallback((layerName, newQuincena) => {
        if (layerName !== SEQUIA_CONFIG.layerName) return;

        const cleanedQuincena = newQuincena.toString()
            .replace('Z', '')
            .replace('T00:00:00.000', '')
            .trim();


        setSequiaQuincena(cleanedQuincena);
        setTimelineConfigs(prev => ({
            ...prev,
            [SEQUIA_CONFIG.layerName]: {
                ...prev[SEQUIA_CONFIG.layerName],
                currentValue: cleanedQuincena
            }
        }));


        timelineManagerChange(layerName, cleanedQuincena);
    }, [setSequiaQuincena, setTimelineConfigs, timelineManagerChange]);


    const handleClosePopup = useCallback(() => {
        closePopup();
        clearAllHighlights();
    }, [closePopup, clearAllHighlights]);




    useEffect(() => {
        const sequiaLayer = activeLayers[SEQUIA_CONFIG.layerName];
        if (sequiaLayer?._metadata?.lastUpdate) {
            requestAnimationFrame(() => {
                forceStyleUpdate();
            });
        }
    }, [activeLayers[SEQUIA_CONFIG.layerName]?._metadata?.lastUpdate]);




    const effectiveSequiaQuincena = optimisticQuincena || sequiaQuincena;


    const layersForLegend = useMemo(() => {
        const legendLayers = { ...activeLayers };
        if (baseLayerData) {
            legendLayers[BASE_LAYERS.ESTADO] = baseLayerData;
        }
        return legendLayers;
    }, [activeLayers, baseLayerData]);


    const mapConfig = config.map;



    return (
        <div className="map-view-container">
            {}
            <Suspense fallback={<LoadingFallback message="Cargando menú..." />}>
                <LayerMenu
                    onLayerToggle={handleLayerToggle}
                    activeLayers={activeLayers}
                    loadingLayers={loadingLayers}
                    sectionIndex={sectionIndex}
                    sectionId={sectionId}
                    onShowTable={handleShowTable}
                    sequiaQuincena={effectiveSequiaQuincena}
                    sequiaQuincenaList={sequiaQuincenaList}
                    timelineConfigs={timelineConfigs}
                    onTimelineChange={handleTimelineChange}
                    highlightLayer={navLayer}
                    isTimelineUpdating={isUpdating}
                />
            </Suspense>

            {}
            <div className="map-container">
                <MapContainer
                    preferCanvas={true}
                    className="leaflet-map"
                    center={mapConfig.center}
                    zoom={mapConfig.zoom}
                    zoomControl={false}
                    minZoom={mapConfig.minZoom}
                    maxZoom={mapConfig.maxZoom}
                    maxBounds={mapConfig.maxBounds}
                    maxBoundsViscosity={mapConfig.maxBoundsViscosity}
                    scrollWheelZoom={true}
                    doubleClickZoom={false}
                    zoomDelta={mapConfig.zoomDelta}
                    zoomSnap={mapConfig.zoomSnap}
                >
                    <MapContent
                        baseLayerData={baseLayerData}
                        activeLayers={activeLayers}
                        highlightData={highlightData}
                        popupData={popupData}
                        productionVariant={productionVariant}
                        usoConsuntivoVariant={usoConsuntivoVariant}
                        riesgosVariant={riesgosVariant}
                        sequiaQuincena={effectiveSequiaQuincena}
                        setPopupData={setPopupData}
                        setHighlightData={setHighlightData}
                        handleClosePopup={handleClosePopup}
                    />
                </MapContainer>

                {}
                <Suspense fallback={null}>
                    <Legend
                        activeLayers={layersForLegend}
                        legendData={legendData}
                        loadingLayers={loadingLayers}
                        activeVariants={currentVariants}
                        onVariantChange={handleVariantChange}
                    />
                </Suspense>
            </div>

            {}
            <Suspense fallback={null}>
                <AttributeTableModal
                    show={tableModalState.isOpen}
                    onHide={handleCloseTable}
                    tabs={tableModalState.tabs}
                    displayName={tableModalState.displayName}
                    filters={tableModalState.filters || {}}
                />
            </Suspense>
        </div>
    );
};

MapView.propTypes = {
    initialLayer: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.string)
    ]),
    sectionIndex: PropTypes.string
};

MapView.defaultProps = {
    initialLayer: null,
    sectionIndex: null
};

export default React.memo(MapView);
