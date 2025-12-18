/**
 * @fileoverview Componente principal del visor de mapas.
 * 
 * MapView es el componente orquestador que integra todos los hooks y
 * sub-componentes del sistema de visualización geoespacial. Coordina:
 * - Carga de capas base y temáticas
 * - Gestión de timeline de sequías
 * - Popups informativos y resaltado de features
 * - Leyenda dinámica con variantes
 * - Tabla de atributos
 * 
 * @module components/map/MapView
 */

import React, { useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { MapContainer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import PropTypes from 'prop-types';

// ============================================================================
// LAZY LOADING DE COMPONENTES PESADOS
// ============================================================================

/** Menú lateral de capas (carga diferida) */
const LayerMenu = lazy(() => import('./LayerMenu'));

/** Leyenda del mapa (carga diferida) */
const Legend = lazy(() => import('./Legend'));

/** Modal de tabla de atributos (carga diferida) */
const AttributeTableModal = lazy(() => import('./AttributeTableModal'));

// ============================================================================
// IMPORTACIONES ESTÁNDAR
// ============================================================================

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

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

/**
 * Componente de loading para Suspense.
 * @param {Object} props - Propiedades
 * @param {string} [props.message='Cargando...'] - Mensaje a mostrar
 */
const LoadingFallback = ({ message = 'Cargando...' }) => (
    <div className="loading-fallback">
        <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">{message}</span>
        </div>
    </div>
);

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Componente principal del visor de mapas interactivo.
 * 
 * Orquesta todos los hooks y componentes del sistema:
 * - useBaseLayer: Carga capa límite del estado
 * - useSequiaData: Datos del timeline de sequías
 * - useLayerManagement: Activación/desactivación de capas
 * - useTimelineManager: Optimizaciones del timeline
 * - useVariants: Variantes de visualización
 * - useHighlightManager: Resaltado de features
 * - usePopupManager: Popups informativos
 * - useTableModal: Modal de tabla de atributos
 * 
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {string|string[]} [props.initialLayer] - Capa(s) a cargar inicialmente
 * @param {string} [props.sectionIndex] - Índice de sección a expandir en el menú
 * @returns {JSX.Element} Visor de mapas completo
 * 
 * @example
 * // Uso básico
 * <MapView />
 * 
 * @example
 * // Con capa inicial
 * <MapView initialLayer="Hidalgo:01_cuencas" sectionIndex="1" />
 */
const MapView = ({ initialLayer, sectionIndex }) => {

    // =========================================================================
    // HOOKS - DATOS BASE
    // =========================================================================

    /** Capa base del estado (contorno de Hidalgo) */
    const { baseLayerData } = useBaseLayer();

    /** Datos y configuración del timeline de sequías */
    const {
        sequiaQuincenaList,
        sequiaQuincena,
        setSequiaQuincena,
        timelineConfigs,
        setTimelineConfigs
    } = useSequiaData();

    /** Gestión de capas activas y estados de carga */
    const {
        activeLayers,
        setActiveLayers,
        loadingLayers,
        setLoadingLayers,
        currentFilters,
        setCurrentFilters,
        handleLayerToggle: originalHandleLayerToggle
    } = useLayerManagement(sequiaQuincena);

    /** Optimizaciones del timeline (debounce, caché) */
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

    // =========================================================================
    // HOOKS - VISUALIZACIÓN
    // =========================================================================

    /** Variantes de visualización para capas con múltiples estilos */
    const {
        currentVariants,
        productionVariant,
        usoConsuntivoVariant,
        riesgosVariant,
        handleVariantChange
    } = useVariants();

    /** Resaltado de features seleccionados */
    const {
        highlightData,
        setHighlightData,
        clearHighlightsForLayers,
        clearAllHighlights
    } = useHighlightManager(activeLayers);

    /** Popups informativos en el mapa */
    const {
        popupData,
        setPopupData,
        closePopup
    } = usePopupManager(activeLayers, baseLayerData, clearAllHighlights);

    /** Modal de tabla de atributos */
    const {
        tableModalState,
        handleShowTable,
        handleCloseTable
    } = useTableModal(currentFilters);

    // =========================================================================
    // HANDLERS
    // =========================================================================

    /**
     * Handler extendido para toggle de capas.
     * Limpia resaltados y popups cuando se desactiva una capa.
     */
    const handleLayerToggle = useCallback((layerConfig, isActive) => {
        // Al desactivar, limpiar resaltados asociados
        if (!isActive) {
            const layerName = layerConfig.layerName || layerConfig;
            const layerNames = Array.isArray(layerName) ? layerName : [layerName];

            const hadHighlights = clearHighlightsForLayers(layerNames);

            // Cerrar popup si se limpiaron todos los highlights
            if (hadHighlights && highlightData.length <= layerNames.length) {
                closePopup();
            }
        }

        // Ejecutar toggle original
        originalHandleLayerToggle(layerConfig, isActive);
    }, [originalHandleLayerToggle, clearHighlightsForLayers, highlightData.length, closePopup]);

    // =========================================================================
    // NAVEGACIÓN Y CARGA INICIAL
    // =========================================================================

    /** Navegación desde otras páginas */
    const { navLayer, sectionId } = useNavigation({
        sequiaQuincenaList,
        sequiaQuincena,
        setSequiaQuincena,
        handleLayerToggle
    });

    /** Carga de capa inicial si se especifica */
    useInitialLayers({
        initialLayer,
        setActiveLayers,
        setLoadingLayers
    });

    // =========================================================================
    // HANDLER DE TIMELINE
    // =========================================================================

    /**
     * Handler para cambios en el timeline de sequías.
     * Actualiza el estado local y delega al manager optimizado.
     */
    const handleTimelineChange = useCallback((layerName, newQuincena) => {
        if (layerName !== SEQUIA_CONFIG.layerName) return;

        // Limpiar formato de quincena
        const cleanedQuincena = newQuincena.toString()
            .replace('Z', '')
            .replace('T00:00:00.000', '')
            .trim();

        // Actualizar estado local (optimistic update)
        setSequiaQuincena(cleanedQuincena);
        setTimelineConfigs(prev => ({
            ...prev,
            [SEQUIA_CONFIG.layerName]: {
                ...prev[SEQUIA_CONFIG.layerName],
                currentValue: cleanedQuincena
            }
        }));

        // Delegar al manager optimizado
        timelineManagerChange(layerName, cleanedQuincena);
    }, [setSequiaQuincena, setTimelineConfigs, timelineManagerChange]);

    /** Handler para cerrar popup y limpiar resaltados */
    const handleClosePopup = useCallback(() => {
        closePopup();
        clearAllHighlights();
    }, [closePopup, clearAllHighlights]);

    // =========================================================================
    // EFECTOS
    // =========================================================================

    // Forzar actualización de estilos cuando cambia la capa de sequías
    useEffect(() => {
        const sequiaLayer = activeLayers[SEQUIA_CONFIG.layerName];
        if (sequiaLayer?._metadata?.lastUpdate) {
            requestAnimationFrame(() => {
                forceStyleUpdate();
            });
        }
    }, [activeLayers[SEQUIA_CONFIG.layerName]?._metadata?.lastUpdate]);

    // =========================================================================
    // VALORES COMPUTADOS
    // =========================================================================

    /** Quincena efectiva (optimista si está cargando) */
    const effectiveSequiaQuincena = optimisticQuincena || sequiaQuincena;

    /** Capas para la leyenda (incluye capa base) */
    const layersForLegend = useMemo(() => {
        const legendLayers = { ...activeLayers };
        if (baseLayerData) {
            legendLayers[BASE_LAYERS.ESTADO] = baseLayerData;
        }
        return legendLayers;
    }, [activeLayers, baseLayerData]);

    /** Configuración del mapa desde env */
    const mapConfig = config.map;

    // =========================================================================
    // RENDER
    // =========================================================================

    return (
        <div className="map-view-container">
            {/* Panel lateral con menú de capas */}
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

            {/* Contenedor del mapa Leaflet */}
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

                {/* Leyenda dinámica */}
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

            {/* Modal de tabla de atributos */}
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

// ============================================================================
// PROP TYPES
// ============================================================================

MapView.propTypes = {
    /** Capa(s) a cargar inicialmente al entrar al observatorio */
    initialLayer: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.string)
    ]),
    /** Índice de sección del acordeón a expandir */
    sectionIndex: PropTypes.string
};

MapView.defaultProps = {
    initialLayer: null,
    sectionIndex: null
};

export default React.memo(MapView);
