// src/components/observatorio/MapView.jsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { MapContainer, ScaleControl, GeoJSON, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Componentes locales
import LayerMenu from './LayerMenu';
import Legend from './Legend';
import AttributeTableModal from './AttributeTableModal';
import MapClickHandler from './MapClickHandler';
import KeepPopupInView from './KeepPopupInView';
import GeoJsonLayers from './GeoJsonLayers';
import BaseLayerControls from './BaseLayerControls';
import MapPopup from './MapPopup';
import ControlSidebarWrapper from './ControlSidebarWrapper';

// Servicios y Utilidades
import { fetchWfsLayer, fetchUniqueValues } from '../../utils/wfsService';
import { getLayerOptions, forceStyleUpdate } from '../../utils/layerStyleFactory'; // ✅ Añadir forceStyleUpdate
import { legendData } from '../../utils/legendData';
import { SEQUIA_CONFIG, MAP_CONFIG } from './mapConfig';
import { useSequiaData } from './hooks/useSequiaData';
import { useLayerManagement } from './hooks/useLayerManagement';
import { useTableModal } from './hooks/useTableModal';
import '../styles/mapView.css';

const BASE_LAYER_NAME = 'Hidalgo:00_Estado';

const MapView = ({ initialLayer, sectionIndex }) => {
    // Estado base del mapa
    const [baseLayerData, setBaseLayerData] = useState(null);
    const [popupData, setPopupData] = useState(null);
    const [styleUpdateTrigger, setStyleUpdateTrigger] = useState(0); //  Trigger para forzar actualización de estilos

    // Navegación
    const location = useLocation();
    const navLayer = location.state?.layerName || null;
    const sectionId = location.state?.sectionId || null;
    const navLayerProcessed = useRef(null);

    // Variantes de visualización
    const [productionVariant, setProductionVariant] = useState('Productividad física (Kg/m³)');
    const [usoConsuntivoVariant, setUsoConsuntivoVariant] = useState('Total SB (hm³)');
    const [riesgosVariant, setRiesgosVariant] = useState('Sequía');

    // Hook para manejar datos de sequías
    const {
        sequiaQuincenaList,
        sequiaQuincena,
        setSequiaQuincena,
        timelineConfigs,
        setTimelineConfigs
    } = useSequiaData();

    // Hook para manejar capas activas
    const {
        activeLayers,
        setActiveLayers,
        loadingLayers,
        setLoadingLayers,
        currentFilters,
        handleLayerToggle,
        handleTimelineChange: handleTimelineChangeFromHook
    } = useLayerManagement(sequiaQuincena);

    // Hook para modal de tabla
    const {
        tableModalState,
        handleShowTable,
        handleCloseTable
    } = useTableModal(currentFilters);

    //  Wrapper optimizado para timeline
    const handleTimelineChange = useCallback(async (layerName, newQuincena) => {
        
        // 1. Normalizar la quincena
        const cleanedQuincena = newQuincena.toString()
            .replace('Z', '')
            .replace('T00:00:00.000', '')
            .trim();


        // 2. Actualizar el estado en useSequiaData PRIMERO (feedback inmediato)
        setSequiaQuincena(cleanedQuincena);

        // 3. Actualizar timeline config para feedback visual inmediato
        setTimelineConfigs(prev => ({
            ...prev,
            [SEQUIA_CONFIG.layerName]: {
                ...prev[SEQUIA_CONFIG.layerName],
                currentValue: cleanedQuincena
            }
        }));

        // 4.  Forzar actualización de estilos ANTES de cargar datos
        forceStyleUpdate();
        setStyleUpdateTrigger(prev => prev + 1);

        try {
            // 5. Llamar al handler para recargar datos
            await handleTimelineChangeFromHook(layerName, cleanedQuincena);
            
            // 6.  Forzar actualización de estilos DESPUÉS de cargar datos
            setTimeout(() => {
                forceStyleUpdate();
                setStyleUpdateTrigger(prev => prev + 1);
            }, 200);
            
        } catch (error) {
            console.error('❌ Error en handleTimelineChange:', error);
        }
    }, [setSequiaQuincena, setTimelineConfigs, handleTimelineChangeFromHook]);

    //  Efecto para forzar actualización de estilos cuando cambian los datos de sequías
    useEffect(() => {
        if (activeLayers[SEQUIA_CONFIG.layerName] && sequiaQuincena) {
            
            // Pequeño delay para asegurar que el GeoJSON se ha renderizado
            const timer = setTimeout(() => {
                forceStyleUpdate();
                setStyleUpdateTrigger(prev => prev + 1);
            }, 100);
            
            return () => clearTimeout(timer);
        }
    }, [activeLayers[SEQUIA_CONFIG.layerName]?._metadata?.lastUpdate, sequiaQuincena]);

    // Cargar capa base permanente
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

    // Manejar navegación desde InfoCard (activar capa)
    useEffect(() => {
        if (!navLayer || navLayerProcessed.current === navLayer) return;
        navLayerProcessed.current = navLayer;

        const activateLayer = async () => {
            
            // Asegurar que navLayer es un array para manejo uniforme
            const layerToActivate = Array.isArray(navLayer) ? navLayer : [navLayer];
            const isSequia = layerToActivate.includes(SEQUIA_CONFIG.layerName);

            try {
                let targetQuincena = null;

                if (isSequia) {
                    // Lógica para determinar la quincena más reciente si es la capa de sequía
                    if (sequiaQuincenaList.length > 0) {
                        targetQuincena = sequiaQuincena || sequiaQuincenaList[sequiaQuincenaList.length - 1];
                    } else {
                        const uniqueQuincenas = await fetchUniqueValues(
                            SEQUIA_CONFIG.layerName,
                            SEQUIA_CONFIG.fieldName,
                            10000
                        );
                        const normalized = uniqueQuincenas.map(q =>
                            q.toString().replace('Z', '').replace('T00:00:00.000', '').trim()
                        );

                        if (normalized.length > 0) {
                            targetQuincena = normalized[normalized.length - 1];
                            setSequiaQuincena(targetQuincena);
                        }
                    }
                }

                // Configuración para el toggle
                const config = { 
                    layerName: navLayer,
                    _source: 'navigation'
                };
                
                if (isSequia && targetQuincena) {
                    config.currentQuincena = targetQuincena;
                }

                // Pequeño retraso para asegurar que el MapView esté completamente montado
                setTimeout(() => {
                    handleLayerToggle(config, true);
                }, 100);
            } catch (err) {
                console.error('❌ Error en navegación:', err);
                navLayerProcessed.current = null;
            }
        };

        activateLayer();
    }, [navLayer, sequiaQuincenaList.length, sequiaQuincena, handleLayerToggle, setSequiaQuincena]);

    // Cargar capas iniciales (si vienen por props)
    useEffect(() => {
        const loadInitialLayers = async () => {
            if (!initialLayer) return;
            
            // Asegurar que initialLayer es un array y filtrar la capa base si está incluida.
            const layersToLoad = Array.isArray(initialLayer) ? initialLayer : [initialLayer];
            const filtered = layersToLoad.filter(n => n !== BASE_LAYER_NAME);
            if (filtered.length === 0) return;

            setLoadingLayers(prev => new Set([...prev, ...filtered]));
            try {
                const results = await Promise.allSettled(filtered.map(n => fetchWfsLayer(n)));
                const newData = {};
                results.forEach((res, i) => {
                    if (res.status === 'fulfilled' && res.value) {
                        newData[filtered[i]] = res.value;
                    } else {
                        console.error(`❌ Error cargando ${filtered[i]}:`, res.reason);
                    }
                });
                setActiveLayers(prev => ({ ...prev, ...newData }));
            } catch (err) {
                console.error('❌ Error loadInitialLayers:', err);
            } finally {
                setLoadingLayers(prev => {
                    const s = new Set(prev);
                    filtered.forEach(n => s.delete(n));
                    return s;
                });
            }
        };
        loadInitialLayers();
    }, [initialLayer, setActiveLayers, setLoadingLayers]);

    // Limpiar popup cuando no hay capas activas
    useEffect(() => {
        if (Object.keys(activeLayers).length === 0 && !baseLayerData && popupData) {
            setPopupData(null);
        }
    }, [Object.keys(activeLayers).length, baseLayerData, popupData]);

    // Capas para leyenda (incluyendo la base)
    const layersForLegend = useMemo(() => {
        const legendLayers = { ...activeLayers };
        if (baseLayerData) legendLayers[BASE_LAYER_NAME] = baseLayerData;
        return legendLayers;
    }, [activeLayers, baseLayerData]);

    // Variantes actuales (usadas para controlar el estilo de las capas)
    const currentVariants = useMemo(() => ({
        'Hidalgo:03_drprodfisica': productionVariant,
        'Hidalgo:03_usoconsuntivo': usoConsuntivoVariant,
        'Hidalgo:04_riesgosmunicipales': riesgosVariant
    }), [productionVariant, usoConsuntivoVariant, riesgosVariant]);

    const handleVariantChange = useCallback((layerName, variant) => {
        if (layerName === 'Hidalgo:03_drprodfisica') setProductionVariant(variant);
        if (layerName === 'Hidalgo:03_usoconsuntivo') setUsoConsuntivoVariant(variant);
        if (layerName === 'Hidalgo:04_riesgosmunicipales') setRiesgosVariant(variant);
        
        //  Forzar actualización de estilos cuando cambia variante
        setTimeout(() => {
            forceStyleUpdate();
            setStyleUpdateTrigger(prev => prev + 1);
        }, 100);
    }, []);

    //  Incluir styleUpdateTrigger en las props de GeoJsonLayers
    const geoJsonLayersProps = useMemo(() => ({
        activeLayers,
        productionVariant,
        usoConsuntivoVariant,
        riesgosVariant,
        sequiaQuincena,
        styleUpdateTrigger 
    }), [activeLayers, productionVariant, usoConsuntivoVariant, riesgosVariant, sequiaQuincena, styleUpdateTrigger]);

    return (
        <div className="map-view-container">
            <LayerMenu
                onLayerToggle={handleLayerToggle}
                activeLayers={activeLayers}
                loadingLayers={loadingLayers}
                sectionIndex={sectionIndex}
                sectionId={sectionId}
                onShowTable={handleShowTable}
                sequiaQuincena={sequiaQuincena}
                sequiaQuincenaList={sequiaQuincenaList}
                timelineConfigs={timelineConfigs}
                onTimelineChange={handleTimelineChange}
                highlightLayer={navLayer}
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
                        sequiaQuincena={sequiaQuincena}
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
                    
                    {/*  Pasar props optimizadas */}
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

export default React.memo(MapView);