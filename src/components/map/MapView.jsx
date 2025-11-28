// src/components/observatorio/MapView.jsx
// ============================================
// COMPONENTE PRINCIPAL DEL VISOR DE MAPAS
// ============================================
import React, { useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { MapContainer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import PropTypes from 'prop-types';

// Componentes con carga diferida (lazy loading)
const LayerMenu = lazy(() => import('./LayerMenu'));
const Legend = lazy(() => import('./Legend'));
const AttributeTableModal = lazy(() => import('./AttributeTableModal'));

// Componente interno del mapa (no lazy porque es crítico)
import MapContent from './MapContent';

// Hooks
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

// Configuración y utilidades
import { SEQUIA_CONFIG, BASE_LAYERS } from '../../config/env';
import { config, logger } from '../../config/env';
import { legendData } from '../../utils/legendData';
import { forceStyleUpdate } from '../../utils/layerStyleFactory';

// Estilos
import '../../styles/mapView.css';

// ============================================
// COMPONENTE DE LOADING
// ============================================
const LoadingFallback = ({ message = 'Cargando...' }) => (
    <div className="loading-fallback">
        <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">{message}</span>
        </div>
    </div>
);

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
const MapView = ({ initialLayer, sectionIndex }) => {
    // ========== HOOKS DE DATOS ==========
    
    // Capa base del estado
    const { baseLayerData } = useBaseLayer();
    
    // Datos de sequía y timeline
    const {
        sequiaQuincenaList,
        sequiaQuincena,
        setSequiaQuincena,
        timelineConfigs,
        setTimelineConfigs
    } = useSequiaData();

    // Gestión de capas activas
    const {
        activeLayers,
        setActiveLayers,
        loadingLayers,
        setLoadingLayers,
        currentFilters,
        setCurrentFilters,
        handleLayerToggle: originalHandleLayerToggle
    } = useLayerManagement(sequiaQuincena);

    // Timeline manager
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

    // ========== HOOKS DE UI ==========
    
    // Variantes de visualización
    const {
        currentVariants,
        productionVariant,
        usoConsuntivoVariant,
        riesgosVariant,
        handleVariantChange
    } = useVariants();

    // Gestión de highlights
    const {
        highlightData,
        setHighlightData,
        clearHighlightsForLayers,
        clearAllHighlights
    } = useHighlightManager(activeLayers);

    // Gestión de popup
    const {
        popupData,
        setPopupData,
        closePopup
    } = usePopupManager(activeLayers, baseLayerData, clearAllHighlights);

    // Modal de tabla de atributos
    const {
        tableModalState,
        handleShowTable,
        handleCloseTable
    } = useTableModal(currentFilters);

    // ========== WRAPPER DE LAYER TOGGLE ==========
    
    /**
     * Wrapper de handleLayerToggle que limpia highlights al desactivar capas
     */
    const handleLayerToggle = useCallback((layerConfig, isActive) => {
        // Si se desactiva una capa, limpiar sus highlights
        if (!isActive) {
            const layerName = layerConfig.layerName || layerConfig;
            const layerNames = Array.isArray(layerName) ? layerName : [layerName];
            
            const hadHighlights = clearHighlightsForLayers(layerNames);
            
            // Si se eliminaron todos los highlights, cerrar popup
            if (hadHighlights && highlightData.length <= layerNames.length) {
                closePopup();
            }
        }
        
        // Llamar al handler original
        originalHandleLayerToggle(layerConfig, isActive);
    }, [originalHandleLayerToggle, clearHighlightsForLayers, highlightData.length, closePopup]);

    // ========== NAVEGACIÓN ==========
    
    const { navLayer, sectionId } = useNavigation({
        sequiaQuincenaList,
        sequiaQuincena,
        setSequiaQuincena,
        handleLayerToggle
    });

    // ========== CARGA INICIAL ==========
    
    useInitialLayers({
        initialLayer,
        setActiveLayers,
        setLoadingLayers
    });

    // ========== HANDLERS ==========
    
    /**
     * Handler para cambios en el timeline de sequías
     */
    const handleTimelineChange = useCallback((layerName, newQuincena) => {
        if (layerName !== SEQUIA_CONFIG.layerName) return;

        const cleanedQuincena = newQuincena.toString()
            .replace('Z', '')
            .replace('T00:00:00.000', '')
            .trim();

        // Actualizar estado UI inmediatamente
        setSequiaQuincena(cleanedQuincena);
        setTimelineConfigs(prev => ({
            ...prev,
            [SEQUIA_CONFIG.layerName]: {
                ...prev[SEQUIA_CONFIG.layerName],
                currentValue: cleanedQuincena
            }
        }));

        // Delegar carga de datos al timeline manager
        timelineManagerChange(layerName, cleanedQuincena);
    }, [setSequiaQuincena, setTimelineConfigs, timelineManagerChange]);

    /**
     * Handler para cerrar el popup
     */
    const handleClosePopup = useCallback(() => {
        closePopup();
        clearAllHighlights();
    }, [closePopup, clearAllHighlights]);

    // ========== EFFECTS ==========
    
    // Forzar actualización de estilos cuando cambia la capa de sequía
    useEffect(() => {
        const sequiaLayer = activeLayers[SEQUIA_CONFIG.layerName];
        if (sequiaLayer?._metadata?.lastUpdate) {
            requestAnimationFrame(() => {
                forceStyleUpdate();
            });
        }
    }, [activeLayers[SEQUIA_CONFIG.layerName]?._metadata?.lastUpdate]);

    // ========== VALORES COMPUTADOS ==========
    
    // Quincena efectiva (optimistic update o actual)
    const effectiveSequiaQuincena = optimisticQuincena || sequiaQuincena;

    // Capas para la leyenda (incluye capa base)
    const layersForLegend = useMemo(() => {
        const legendLayers = { ...activeLayers };
        if (baseLayerData) {
            legendLayers[BASE_LAYERS.ESTADO] = baseLayerData;
        }
        return legendLayers;
    }, [activeLayers, baseLayerData]);

    // Configuración del mapa
    const mapConfig = config.map;

    // ========== RENDER ==========
    
    return (
        <div className="map-view-container">
            {/* Panel de capas (lazy loaded) */}
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

            {/* Contenedor del mapa */}
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

                {/* Leyenda (lazy loaded) */}
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

            {/* Modal de tabla de atributos (lazy loaded) */}
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

// ============================================
// PROP TYPES Y DEFAULTS
// ============================================

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

// ============================================
// EXPORT CON MEMO
// ============================================

export default React.memo(MapView);
