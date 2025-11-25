// src/components/observatorio/MapView.jsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { MapContainer, ScaleControl, GeoJSON, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import PropTypes from 'prop-types';

// Componentes locales
import LayerMenu from './LayerMenu';
import Legend from './Legend';
import AttributeTableModal from './AttributeTableModal';
import MapClickHandler from './MapClickHandler';
import KeepPopupInView from './KeepPopupInView';
import GeoJsonLayers from './GeoJsonLayers';
import BaseLayerControls from './BaseLayerControls';
import ControlSidebarWrapper from './ControlSidebarWrapper';

// Servicios y Utilidades
import { fetchWfsLayer, fetchUniqueValues } from '../../utils/wfsService';
import { getLayerOptions, forceStyleUpdate } from '../../utils/layerStyleFactory';
import { legendData } from '../../utils/legendData';
import { SEQUIA_CONFIG, MAP_CONFIG } from './mapConfig';
import { useSequiaData } from './hooks/useSequiaData';
import { useLayerManagement } from './hooks/useLayerManagement';
import { useTableModal } from './hooks/useTableModal';
import { useTimelineManager } from './hooks/useTimelineManager';
import '../styles/mapView.css';

// Constants
const BASE_LAYER_NAME = 'Hidalgo:00_Estado';
const NAVIGATION_DELAY = 100;

const MapView = ({ initialLayer, sectionIndex }) => {
    // Estado base del mapa
    const [baseLayerData, setBaseLayerData] = useState(null);
    const [popupData, setPopupData] = useState(null);

    // Navegación
    const location = useLocation();
    const navLayer = location.state?.layerName || null;
    const sectionId = location.state?.sectionId || null;
    const navLayerProcessed = useRef(null);

    // Variantes de visualización
    const [productionVariant, setProductionVariant] = useState('Productividad física (Kg/m³)');
    const [usoConsuntivoVariant, setUsoConsuntivoVariant] = useState('Total SB (hm³)');
    const [riesgosVariant, setRiesgosVariant] = useState('Sequía');

    // Custom hooks
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
        handleLayerToggle
    } = useLayerManagement(sequiaQuincena);

    const {
        tableModalState,
        handleShowTable,
        handleCloseTable
    } = useTableModal(currentFilters);

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

    // Helper functions
    const normalizeQuincena = useCallback((quincena) => {
        return quincena.toString()
            .replace('Z', '')
            .replace('T00:00:00.000', '')
            .trim();
    }, []);

    // Timeline change handler
    const handleTimelineChange = useCallback((layerName, newQuincena) => {
        if (layerName !== SEQUIA_CONFIG.layerName) return;

        const cleanedQuincena = normalizeQuincena(newQuincena);

        // Update UI state immediately
        setSequiaQuincena(cleanedQuincena);
        setTimelineConfigs(prev => ({
            ...prev,
            [SEQUIA_CONFIG.layerName]: {
                ...prev[SEQUIA_CONFIG.layerName],
                currentValue: cleanedQuincena
            }
        }));

        // Delegate data loading to timeline manager
        timelineManagerChange(layerName, cleanedQuincena);
    }, [setSequiaQuincena, setTimelineConfigs, timelineManagerChange, normalizeQuincena]);

    // Effects
    useEffect(() => {
        const sequiaLayer = activeLayers[SEQUIA_CONFIG.layerName];
        if (sequiaLayer?._metadata?.lastUpdate) {
            requestAnimationFrame(() => {
                forceStyleUpdate();
            });
        }
    }, [activeLayers[SEQUIA_CONFIG.layerName]?._metadata?.lastUpdate]);

    // Load base layer
    useEffect(() => {
        const loadBaseLayer = async () => {
            try {
                const geojsonData = await fetchWfsLayer(BASE_LAYER_NAME);
                if (geojsonData) {
                    setBaseLayerData(geojsonData);
                }
            } catch (error) {
                console.error('❌ Error cargando capa base:', error);
            }
        };
        loadBaseLayer();
    }, []);

    // Handle navigation from InfoCard
    useEffect(() => {
        if (!navLayer || navLayerProcessed.current === navLayer) return;
        navLayerProcessed.current = navLayer;

        const activateLayer = async () => {
            const layerToActivate = Array.isArray(navLayer) ? navLayer : [navLayer];
            const isSequia = layerToActivate.includes(SEQUIA_CONFIG.layerName);

            try {
                let targetQuincena = null;

                if (isSequia) {
                    if (sequiaQuincenaList.length > 0) {
                        targetQuincena = sequiaQuincena || sequiaQuincenaList[sequiaQuincenaList.length - 1];
                    } else {
                        const uniqueQuincenas = await fetchUniqueValues(
                            SEQUIA_CONFIG.layerName,
                            SEQUIA_CONFIG.fieldName,
                            10000
                        );
                        const normalized = uniqueQuincenas.map(normalizeQuincena);

                        if (normalized.length > 0) {
                            targetQuincena = normalized[normalized.length - 1];
                            setSequiaQuincena(targetQuincena);
                        }
                    }
                }

                const config = { 
                    layerName: navLayer,
                    _source: 'navigation'
                };
                
                if (isSequia && targetQuincena) {
                    config.currentQuincena = targetQuincena;
                }

                setTimeout(() => {
                    handleLayerToggle(config, true);
                }, NAVIGATION_DELAY);
            } catch (err) {
                console.error('❌ Error en navegación:', err);
                navLayerProcessed.current = null;
            }
        };

        activateLayer();
    }, [
        navLayer, 
        sequiaQuincenaList.length, 
        sequiaQuincena, 
        handleLayerToggle, 
        setSequiaQuincena,
        normalizeQuincena
    ]);

    // Load initial layers
    useEffect(() => {
        const loadInitialLayers = async () => {
            if (!initialLayer) return;
            
            const layersToLoad = Array.isArray(initialLayer) ? initialLayer : [initialLayer];
            const filtered = layersToLoad.filter(n => n !== BASE_LAYER_NAME);
            if (filtered.length === 0) return;

            setLoadingLayers(prev => new Set([...prev, ...filtered]));
            
            try {
                const results = await Promise.allSettled(
                    filtered.map(n => fetchWfsLayer(n))
                );
                
                const newData = {};
                results.forEach((res, i) => {
                    if (res.status === 'fulfilled' && res.value) {
                        newData[filtered[i]] = res.value;
                    }
                });
                
                setActiveLayers(prev => ({ ...prev, ...newData }));
            } catch (err) {
                console.error('❌ Error loadInitialLayers:', err);
            } finally {
                setLoadingLayers(prev => {
                    const updated = new Set(prev);
                    filtered.forEach(n => updated.delete(n));
                    return updated;
                });
            }
        };
        
        loadInitialLayers();
    }, [initialLayer, setActiveLayers, setLoadingLayers]);

    // Cleanup popup when no layers are active
    useEffect(() => {
        const hasActiveLayers = Object.keys(activeLayers).length > 0 || baseLayerData;
        if (!hasActiveLayers && popupData) {
            setPopupData(null);
        }
    }, [activeLayers, baseLayerData, popupData]);

    // Memoized values
    const layersForLegend = useMemo(() => {
        const legendLayers = { ...activeLayers };
        if (baseLayerData) legendLayers[BASE_LAYER_NAME] = baseLayerData;
        return legendLayers;
    }, [activeLayers, baseLayerData]);

    const currentVariants = useMemo(() => ({
        'Hidalgo:03_drprodfisica': productionVariant,
        'Hidalgo:03_usoconsuntivo': usoConsuntivoVariant,
        'Hidalgo:04_riesgosmunicipales': riesgosVariant
    }), [productionVariant, usoConsuntivoVariant, riesgosVariant]);

    const effectiveSequiaQuincena = optimisticQuincena || sequiaQuincena;

    const geoJsonLayersProps = useMemo(() => ({
        activeLayers,
        productionVariant,
        usoConsuntivoVariant,
        riesgosVariant,
        sequiaQuincena: effectiveSequiaQuincena
    }), [activeLayers, productionVariant, usoConsuntivoVariant, riesgosVariant, effectiveSequiaQuincena]);

    // Event handlers
    const handleVariantChange = useCallback((layerName, variant) => {
        const variantSetters = {
            'Hidalgo:03_drprodfisica': setProductionVariant,
            'Hidalgo:03_usoconsuntivo': setUsoConsuntivoVariant,
            'Hidalgo:04_riesgosmunicipales': setRiesgosVariant
        };

        const setter = variantSetters[layerName];
        if (setter) {
            setter(variant);
            requestAnimationFrame(() => {
                forceStyleUpdate();
            });
        }
    }, []);

    return (
        <div className="map-view-container">
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

            <div className="map-container">
                <MapContainer
                    className="leaflet-map"
                    center={MAP_CONFIG.center}
                    zoom={MAP_CONFIG.zoom}
                    zoomControl={false}
                    minZoom={MAP_CONFIG.minZoom}
                    maxZoom={MAP_CONFIG.maxZoom}
                    maxBounds={MAP_CONFIG.maxBounds}
                    maxBoundsViscosity={MAP_CONFIG.maxBoundsViscosity}
                    scrollWheelZoom={true}
                    doubleClickZoom={false}
                    zoomDelta={MAP_CONFIG.zoomDelta}
                    zoomSnap={MAP_CONFIG.zoomSnap}
                >
                    <ZoomControl position="topright" zoomInTitle="Acercar" zoomOutTitle="Alejar" />
                    <ScaleControl maxWidth="150" position="bottomright" imperial={false} />

                    <BaseLayerControls />

                    <MapClickHandler
                        activeLayers={activeLayers}
                        setPopupData={setPopupData}
                        baseLayerData={baseLayerData}
                        sequiaQuincena={effectiveSequiaQuincena}
                    />

                    <KeepPopupInView />

                    <ControlSidebarWrapper popupData={popupData} setPopupData={setPopupData} />

                    {baseLayerData && (
                        <GeoJSON
                            key={`${BASE_LAYER_NAME}-base`}
                            data={baseLayerData}
                            {...getLayerOptions(BASE_LAYER_NAME)}
                        />
                    )}
                    
                    <GeoJsonLayers {...geoJsonLayersProps} />
                </MapContainer>

                <Legend
                    activeLayers={layersForLegend}
                    legendData={legendData}
                    loadingLayers={loadingLayers}
                    activeVariants={currentVariants}
                    onVariantChange={handleVariantChange}
                />
            </div>

            <AttributeTableModal
                show={tableModalState.isOpen}
                onHide={handleCloseTable}
                tabs={tableModalState.tabs}
                displayName={tableModalState.displayName}
                filters={tableModalState.filters || {}}
            />
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