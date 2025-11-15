import React, { useState, useEffect, useCallback, useMemo } from 'react';
import L from "leaflet";
import ReactDOMServer from 'react-dom/server';
import { useLocation } from 'react-router-dom';
import {
  MapContainer,
  ScaleControl,
  LayersControl,
  TileLayer,
  ZoomControl,
  GeoJSON,
  Popup,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import LayerMenu from './LayerMenu';
import Legend from './Legend';
import {
  fetchFeaturesAtPoint,
  getLayerInfo,
  fetchWfsLayer,
  fetchUniqueValues
} from '../../utils/wfsService';
import { accordionData } from '../ui/AccordionData';
import { getLayerOptions, legendData } from '../../utils/mapStyles';
import AttributeTableModal from './AttributeTableModal';
import '../styles/mapView.css'

const { BaseLayer } = LayersControl;

// ✅ CONFIGURACIÓN CENTRALIZADA PARA SEQUÍAS
const SEQUIA_CONFIG = {
  layerName: 'Hidalgo:04_sequias',
  fieldName: 'Quincena' // ✅ Mayúscula según tu confirmación
};

const MAP_CONFIG = {
  center: [20.5, -99],
  zoom: 9,
  minZoom: 9,
  maxZoom: 19,
  maxBounds: [
    [22, -97.98],
    [19.3, -99.85],
  ],
  maxBoundsViscosity: 0.7,
  zoomDelta: 0.1,
  zoomSnap: 0.1
};

const PopupContent = ({ layerName, layerInfo, features, maxFeatures }) => (
  <div className="layer-popup-section">
    <h5>{layerInfo.text || layerName.split(':')[1] || layerName} ({features.length})</h5>
    {features.slice(0, maxFeatures).map((feature, idx) => (
      <div key={idx} className="feature-section">
        <h6>Elemento {idx + 1}</h6>
        <table className="popup-table">
          <tbody>
            {Object.entries(feature.properties).map(([key, value]) =>
              (key.toLowerCase() !== 'geom' && key.toLowerCase() !== 'geometry' && value != null) && (
                <tr key={key}>
                  <td className="property-name"><strong>{key}:</strong></td>
                  <td className="property-value">{String(value)}</td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    ))}
    {features.length > maxFeatures && (
      <div className="more-features">
        <em>... y {features.length - maxFeatures} elemento(s) más</em>
      </div>
    )}
  </div>
);

function MapClickHandler({ activeLayers, setPopupData, baseLayerData, sequiaQuincena }) {
  const map = useMapEvents({});
  const allLayersConfig = useMemo(
    () =>
      accordionData.flatMap((section) =>
        section.cards?.flatMap((card) => card.links?.filter((link) => link.layerName) || []) || []
      ),
    []
  );

  useEffect(() => {
    if (!map) return;

    const handleClick = async (e) => {
      const { lat, lng } = e.latlng;

      const layersToQuery = { ...activeLayers };
      if (baseLayerData) layersToQuery["Hidalgo:00_Estado"] = baseLayerData;

      const activeLayerNames = Object.keys(layersToQuery);
      if (activeLayerNames.length === 0) {
        setPopupData(null);
        return;
      }

      setPopupData({
        position: [lat, lng],
        content: '<div class="loading-popup">Consultando información...</div>',
      });

      try {
        const promises = activeLayerNames.map((layerName) => {
          const config = allLayersConfig.find((l) => {
            if (Array.isArray(l.layerName)) return l.layerName.includes(layerName);
            return l.layerName === layerName;
          });

          const geomType = config?.geomType || "polygon";

          // ✅ APLICAR FILTRO POR QUINCENA PARA SEQUÍAS
          let additionalFilter = null;
          if (layerName === SEQUIA_CONFIG.layerName && sequiaQuincena) {
            const normalizedQuincena = sequiaQuincena.toString().replace('Z', '').trim();
            additionalFilter = `${SEQUIA_CONFIG.fieldName}='${normalizedQuincena}'`;
            console.log(`🎯 Popup: Aplicando filtro de quincena para sequías: ${additionalFilter}`);
          }

          return fetchFeaturesAtPoint(layerName, e.latlng, geomType, 50, additionalFilter);
        });

        const results = await Promise.allSettled(promises);
        let finalContent = "";
        let totalFeaturesFound = 0;
        const MAX_FEATURES_PER_LAYER = 15;

        results.forEach((result, index) => {
          const layerName = activeLayerNames[index];
          if (result.status === "fulfilled" && result.value?.features?.length > 0) {
            const data = result.value;
            const layerInfo = getLayerInfo(layerName);
            totalFeaturesFound += data.features.length;

            finalContent += ReactDOMServer.renderToString(
              <PopupContent
                layerName={layerName}
                layerInfo={layerInfo}
                features={data.features}
                maxFeatures={MAX_FEATURES_PER_LAYER}
              />
            );
          }
        });

        if (totalFeaturesFound > 0) {
          const headerContent = ReactDOMServer.renderToString(
            <div className="popup-header">
              <h4>Información en el punto</h4>
              <p className="feature-summary">{totalFeaturesFound} elemento(s) encontrado(s)</p>
            </div>
          );

          setPopupData({
            position: [lat, lng],
            content: headerContent + finalContent,
          });
        } else {
          setPopupData(null);
        }
      } catch (error) {
        console.error("❌ Error en peticiones WFS:", error);
        setPopupData({
          position: [lat, lng],
          content: '<div class="error-popup">Error al consultar la información</div>',
        });
      }
    };

    map.on("click", handleClick);
    return () => map.off("click", handleClick);
  }, [map, activeLayers, baseLayerData, allLayersConfig, setPopupData, sequiaQuincena]); // ✅ Agregar sequiaQuincena como dependencia

  return null;
}

function KeepPopupInView() {
  const map = useMapEvents({});

  useEffect(() => {
    const adjustPopup = (e) => {
      const popup = e.popup;
      const popupEl = popup.getElement();
      if (!popupEl) return;

      const mapSize = map.getSize();
      const popupPos = map.latLngToContainerPoint(popup.getLatLng());
      const popupHeight = popupEl.offsetHeight;
      const popupWidth = popupEl.offsetWidth;

      let offsetX = 0;
      let offsetY = 0;

      if (popupPos.y - popupHeight / 2 < 0) {
        offsetY = Math.abs(popupPos.y - popupHeight / 2) + 10;
      }
      if (popupPos.y + popupHeight / 2 > mapSize.y) {
        offsetY = -(popupPos.y + popupHeight / 2 - mapSize.y) - 10;
      }
      if (popupPos.x - popupWidth / 2 < 0) {
        offsetX = Math.abs(popupPos.x - popupWidth / 2) + 10;
      }
      if (popupPos.x + popupWidth / 2 > mapSize.x) {
        offsetX = -(popupPos.x + popupWidth / 2 - mapSize.x) - 10;
      }

      if (offsetX !== 0 || offsetY !== 0) {
        const targetLatLng = map.containerPointToLatLng([
          popupPos.x + offsetX,
          popupPos.y + offsetY,
        ]);

        const startLatLng = popup.getLatLng();
        const duration = 250;
        const startTime = performance.now();

        const animate = (time) => {
          const progress = Math.min((time - startTime) / duration, 1);
          const lat = startLatLng.lat + (targetLatLng.lat - startLatLng.lat) * progress;
          const lng = startLatLng.lng + (targetLatLng.lng - startLatLng.lng) * progress;
          popup.setLatLng(L.latLng(lat, lng));
          if (progress < 1) requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
      }
    };

    map.on("popupopen", adjustPopup);
    return () => map.off("popupopen", adjustPopup);
  }, [map]);

  return null;
}

const GeoJsonLayers = React.memo(({
  activeLayers,
  productionVariant,
  usoConsuntivoVariant,
  riesgosVariant,
  sequiaQuincena
}) => {
  return (
    <>
      {Object.entries(activeLayers).map(([layerName, geojsonData]) => {
        if (!geojsonData) return null;

        let variant = null;
        let variantKey = 'default';

        if (layerName === 'Hidalgo:03_drprodfisica') {
          variant = productionVariant;
          variantKey = productionVariant;
        }

        if (layerName === 'Hidalgo:03_usoconsuntivo') {
          variant = usoConsuntivoVariant;
          variantKey = usoConsuntivoVariant;
        }

        if (layerName === 'Hidalgo:04_riesgosmunicipales') {
          variant = riesgosVariant;
          variantKey = riesgosVariant;
        }


        const uniqueKey = layerName === 'Hidalgo:04_sequias'
          ? `${layerName}-${variantKey}-${sequiaQuincena || 'no-quincena'}`
          : `${layerName}-${variantKey}`;

        const layerOptions = getLayerOptions(layerName, variant);

        return (
          <GeoJSON
            key={uniqueKey}
            data={geojsonData}
            {...layerOptions}
          />
        );
      })}
    </>
  );
});

GeoJsonLayers.displayName = 'GeoJsonLayers';

const MapView = ({ initialLayer, sectionIndex }) => {
  const [activeLayers, setActiveLayers] = useState({});
  const [baseLayerData, setBaseLayerData] = useState(null);
  const [popupData, setPopupData] = useState(null);
  const [loadingLayers, setLoadingLayers] = useState(new Set());
  const [tableModalState, setTableModalState] = useState({
    isOpen: false,
    tabs: [],
    displayName: null,
  });

  const location = useLocation();
  const sectionId = location.state?.sectionId || null;

  const [productionVariant, setProductionVariant] = useState('Productividad física (Kg/m³)');
  const [usoConsuntivoVariant, setUsoConsuntivoVariant] = useState('Total SB (hm³)');
  const [riesgosVariant, setRiesgosVariant] = useState('Sequía');

  const [currentFilters, setCurrentFilters] = useState({});

  // ✅ Estados para línea de tiempo de sequías
  const [sequiaQuincenaList, setSequiaQuincenaList] = useState([]);
  const [sequiaQuincena, setSequiaQuincena] = useState(null);
  const [timelineConfigs, setTimelineConfigs] = useState({});

  // ✅ Función auxiliar para detectar si una capa es de sequías
  const isSequiaLayer = useCallback((layerName) => {
    if (Array.isArray(layerName)) {
      return layerName.some(name => name === SEQUIA_CONFIG.layerName);
    }
    return layerName === SEQUIA_CONFIG.layerName;
  }, []);

  useEffect(() => {
    const loadBaseLayer = async () => {
      try {
        console.log('🗺️ Cargando capa base permanente: Hidalgo:00_Estado');
        const geojsonData = await fetchWfsLayer('Hidalgo:00_Estado');
        if (geojsonData) {
          setBaseLayerData(geojsonData);
          console.log('✅ Capa base permanente cargada.');
        }
      } catch (error) {
        console.error('💥 Error al cargar la capa base permanente:', error);
      }
    };
    loadBaseLayer();
  }, []);


  useEffect(() => {
    const fetchSequiaQuincenas = async () => {
      if (sequiaQuincenaList.length > 0) {
        console.log('ℹ️ Quincenas ya cargadas, omitiendo...');
        return;
      }

      try {
        console.log(`📅 Cargando solo valores únicos de Quincena...`);
        const uniqueQuincenas = await fetchUniqueValues(
          SEQUIA_CONFIG.layerName,
          SEQUIA_CONFIG.fieldName,
          10000
        );

        // ✅ NORMALIZAR también al establecer el estado inicial
        const normalizedQuincenas = uniqueQuincenas.map(q =>
          q.toString()
            .replace('Z', '')
            .replace('T00:00:00.000', '')
            .trim()
        );

        console.log(`📅 ${normalizedQuincenas.length} quincenas normalizadas:`, normalizedQuincenas);

        setSequiaQuincenaList(normalizedQuincenas);

        if (normalizedQuincenas.length > 0) {
          const defaultQuincena = normalizedQuincenas[normalizedQuincenas.length - 1];
          setSequiaQuincena(defaultQuincena);
          console.log(`✅ Quincena por defecto establecida: ${defaultQuincena}`);
        } else {
          console.warn('⚠️ No hay quincenas disponibles');
          setSequiaQuincena('');
        }
      } catch (err) {
        console.error("❌ Error al obtener quincenas:", err);
        setSequiaQuincenaList([]);
        setSequiaQuincena('');
      }
    };

    fetchSequiaQuincenas();
  }, []);

  // ✅ Actualizar configuración de timeline cuando cambien las quincenas
  useEffect(() => {
    if (sequiaQuincenaList.length > 0) {
      const config = {
        [SEQUIA_CONFIG.layerName]: {
          timePoints: sequiaQuincenaList,
          currentValue: sequiaQuincena || sequiaQuincenaList[sequiaQuincenaList.length - 1],
          formatType: 'quincena',
          type: 'discrete'
        }
      };

      setTimelineConfigs(config);

      console.log('🕐 Timeline configurada:', {
        layer: SEQUIA_CONFIG.layerName,
        timePoints: sequiaQuincenaList.length,
        currentValue: sequiaQuincena
      });
    }
  }, [sequiaQuincenaList, sequiaQuincena]);

  const activeLayerNames = useMemo(() => Object.keys(activeLayers), [activeLayers]);


  const handleLayerToggle = useCallback(async (layerConfig, isChecked) => {
    const layersToToggle = Array.isArray(layerConfig.layerName)
      ? layerConfig.layerName
      : [layerConfig.layerName];

    console.log(`${isChecked ? '➕' : '➖'} Toggle capas:`, layersToToggle, {
      tieneQuincena: !!sequiaQuincena,
      quincenaActual: sequiaQuincena
    });

    if (isChecked) {
      setLoadingLayers(prev => new Set([...prev, ...layersToToggle]));

      try {
        const results = await Promise.allSettled(
          layersToToggle.map(async (name) => {
            // ✅ ESTRATEGIA OPTIMIZADA PARA SEQUÍAS
            if (name === SEQUIA_CONFIG.layerName) {
              let cqlFilter = null;

              // Siempre aplicar filtro por quincena si está disponible
              if (sequiaQuincena) {
                const normalizedQuincena = sequiaQuincena.toString().replace('Z', '').trim();
                cqlFilter = `${SEQUIA_CONFIG.fieldName}='${normalizedQuincena}'`;

                // ✅ GUARDAR FILTRO ACTUAL
                setCurrentFilters(prev => ({
                  ...prev,
                  [SEQUIA_CONFIG.layerName]: cqlFilter
                }));

                console.log(`🔍 Cargando sequías CON FILTRO: ${cqlFilter}`);
              } else if (sequiaQuincenaList.length > 0) {
                // Si no hay quincena seleccionada pero hay disponibles, usar la primera
                const fallbackQuincena = sequiaQuincenaList[0].replace('Z', '').trim();
                cqlFilter = `${SEQUIA_CONFIG.fieldName}='${fallbackQuincena}'`;

                // ✅ GUARDAR FILTRO ACTUAL
                setCurrentFilters(prev => ({
                  ...prev,
                  [SEQUIA_CONFIG.layerName]: cqlFilter
                }));

                setSequiaQuincena(fallbackQuincena);
                console.log(`🔄 Usando quincena fallback: ${fallbackQuincena}`);
              } else {
                console.warn('⚠️ Cargando sequías SIN FILTRO - no hay quincenas disponibles');
              }

              return fetchWfsLayer(name, cqlFilter, 5000);
            }

            // Para otras capas, cargar normalmente
            return fetchWfsLayer(name);
          })
        );

        const newLayersData = {};
        const failedLayers = [];

        layersToToggle.forEach((name, index) => {
          if (results[index].status === 'fulfilled' && results[index].value) {
            newLayersData[name] = results[index].value;
            const featureCount = results[index].value.features?.length || 0;
            console.log(`✅ ${name} cargada: ${featureCount} features`);

            // Log detallado para sequías
            if (name === SEQUIA_CONFIG.layerName) {
              if (featureCount === 0) {
                console.warn(`⚠️ Capa de sequías cargada pero SIN FEATURES. Filtro: ${sequiaQuincena}`);
              } else {
                console.log(`🎯 Sequías cargadas exitosamente: ${featureCount} polígonos para ${sequiaQuincena}`);
              }
            }
          } else {
            console.error(`❌ Error cargando ${name}:`, results[index].reason);
            failedLayers.push(name);
          }
        });

        setActiveLayers(prev => ({ ...prev, ...newLayersData }));

        if (failedLayers.length > 0) {
          console.warn(`⚠️ Capas no cargadas: ${failedLayers.join(', ')}`);
        }
      } catch (error) {
        console.error(`💥 Error general al cargar capas:`, error);
      } finally {
        setLoadingLayers(prev => {
          const newSet = new Set(prev);
          layersToToggle.forEach(name => newSet.delete(name));
          return newSet;
        });
      }
    } else {
      // Desactivar capas - también limpiar filtros
      setActiveLayers(prev => {
        const newLayers = { ...prev };
        layersToToggle.forEach(name => {
          delete newLayers[name];
          // ✅ LIMPIAR FILTRO cuando se desactiva la capa
          setCurrentFilters(prev => {
            const newFilters = { ...prev };
            delete newFilters[name];
            return newFilters;
          });
        });
        return newLayers;
      });
    }
  }, [sequiaQuincena, sequiaQuincenaList]);


  const handleTimelineChange = useCallback(async (layerName, newQuincena) => {
    console.log(`🕐 Cambio de timeline: ${layerName} -> ${newQuincena}`);

    if (layerName !== SEQUIA_CONFIG.layerName) return;

    const cleanedQuincena = newQuincena.toString()
      .replace('Z', '')
      .replace('T00:00:00.000', '')
      .trim();

    console.log(`🔄 Quincena normalizada: "${newQuincena}" -> "${cleanedQuincena}"`);

    // ✅ Actualizar estado inmediatamente para la UI
    setSequiaQuincena(cleanedQuincena);

    // ✅ ACTUALIZAR FILTRO ACTUAL
    const newFilter = `${SEQUIA_CONFIG.fieldName}='${cleanedQuincena}'`;
    setCurrentFilters(prev => ({
      ...prev,
      [SEQUIA_CONFIG.layerName]: newFilter
    }));

    // ✅ Actualizar configuración del timeline
    setTimelineConfigs(prev => ({
      ...prev,
      [SEQUIA_CONFIG.layerName]: {
        ...prev[SEQUIA_CONFIG.layerName],
        currentValue: cleanedQuincena
      }
    }));

    // ✅ Solo recargar si la capa está activa
    if (activeLayers[SEQUIA_CONFIG.layerName]) {
      console.log(`🔄 Recargando capa de sequías con nueva quincena: ${cleanedQuincena}`);

      setLoadingLayers(prev => new Set([...prev, SEQUIA_CONFIG.layerName]));

      try {
        // ✅ Usar la versión normalizada en el filtro CQL
        const cqlFilter = `${SEQUIA_CONFIG.fieldName}='${cleanedQuincena}'`;
        const data = await fetchWfsLayer(SEQUIA_CONFIG.layerName, cqlFilter, 5000);

        if (data && data.features) {
          console.log(`✅ ${data.features.length} features cargados para ${cleanedQuincena}`);
          setActiveLayers(prev => ({
            ...prev,
            [SEQUIA_CONFIG.layerName]: data
          }));
        } else {
          console.warn(`⚠️ No se encontraron features para ${cleanedQuincena}`);
          setActiveLayers(prev => ({
            ...prev,
            [SEQUIA_CONFIG.layerName]: { type: 'FeatureCollection', features: [] }
          }));
        }
      } catch (error) {
        console.error(`❌ Error al recargar sequías:`, error);
      } finally {
        setLoadingLayers(prev => {
          const newSet = new Set(prev);
          newSet.delete(SEQUIA_CONFIG.layerName);
          return newSet;
        });
      }
    }
  }, [activeLayers]);


  useEffect(() => {
    const loadInitialLayers = async () => {
      if (!initialLayer) return;

      const layersToLoad = Array.isArray(initialLayer) ? initialLayer : [initialLayer];
      const filteredLayers = layersToLoad.filter(name => name !== 'Hidalgo:00_Estado');
      if (filteredLayers.length === 0) return;

      try {
        console.log(`🎯 Cargando capa(s) inicial(es): ${filteredLayers.join(', ')}`);
        setLoadingLayers(prev => new Set([...prev, ...filteredLayers]));

        const results = await Promise.allSettled(
          filteredLayers.map(name => fetchWfsLayer(name))
        );

        const newLayersData = {};
        results.forEach((result, index) => {
          const layerName = filteredLayers[index];
          if (result.status === 'fulfilled' && result.value) {
            newLayersData[layerName] = result.value;
          } else {
            console.error(`❌ Error cargando capa inicial ${layerName}:`, result.reason);
          }
        });

        setActiveLayers(prev => ({ ...prev, ...newLayersData }));
        console.log(`✅ Capa(s) inicial(es) cargada(s).`);

      } catch (error) {
        console.error(`💥 Error al cargar la(s) capa(s) inicial(es):`, error);
      } finally {
        setLoadingLayers(prev => {
          const newSet = new Set(prev);
          filteredLayers.forEach(name => newSet.delete(name));
          return newSet;
        });
      }
    };

    loadInitialLayers();
  }, [initialLayer]);

  useEffect(() => {
    if (activeLayerNames.length === 0 && !baseLayerData && popupData) {
      setPopupData(null);
    }
  }, [activeLayerNames.length, baseLayerData, popupData]);

  const layersForLegend = useMemo(() => {
    const legendLayers = { ...activeLayers };
    if (baseLayerData) {
      legendLayers['Hidalgo:00_Estado'] = baseLayerData;
    }
    return legendLayers;
  }, [activeLayers, baseLayerData]);

  const handleShowTable = (layers, displayName) => {
    let layerNamesArray = Array.isArray(layers) ? [...layers] : [layers];

    if (layerNamesArray.includes('Hidalgo:03_usoconsuntivot')) {
      const secondLayer = 'Hidalgo:03_usoagua';
      if (!layerNamesArray.includes(secondLayer)) {
        layerNamesArray.push(secondLayer);
      }
    } else if (layerNamesArray.includes('Hidalgo:01_spsitios')) {
      const secondLayer = 'Hidalgo:01_sbsitios';
      if (!layerNamesArray.includes(secondLayer)) {
        layerNamesArray.push(secondLayer);
      }
    } else if (layerNamesArray.includes('Hidalgo:01_spcalidadagua')) {
      const secondLayer = 'Hidalgo:01_sbcalidadagua';
      if (!layerNamesArray.includes(secondLayer)) {
        layerNamesArray.push(secondLayer);
      }
    } else if (layerNamesArray.includes('Hidalgo:02_cloracionmpio')) {
      const secondLayer = 'Hidalgo:02_cloracionedo';
      if (!layerNamesArray.includes(secondLayer)) {
        layerNamesArray.push(secondLayer);
      }
    }

    const tabsData = layerNamesArray.map(layerName => {
      const layerInfo = getLayerInfo(layerName);
      let title = layerInfo?.text || layerName.split(':')[1] || layerName;

      if (layerName === 'Hidalgo:03_usoagua') {
        title = 'Usos Consuntivos Estatal';
      } else if (layerName === 'Hidalgo:03_usoconsuntivot') {
        title = 'Usos Consuntivos Municipal';
      } else if (layerName === 'Hidalgo:01_sbsitios') {
        title = 'Sitios subterráneos';
      } else if (layerName === 'Hidalgo:01_spsitios') {
        title = 'Sitios superficiales';
      } else if (layerName === 'Hidalgo:01_sbcalidadagua') {
        title = 'Parámetros e indicadores subterráneos';
      } else if (layerName === 'Hidalgo:01_spcalidadagua') {
        title = 'Parámetros e indicadores superficiales';
      } else if (layerName === 'Hidalgo:02_cloracionmpio') {
        title = 'Cloración municipal';
      } else if (layerName === 'Hidalgo:02_cloracionedo') {
        title = 'Cloración estatal';
      }

      return { layerName, title };
    });

    setTableModalState({
      isOpen: true,
      tabs: tabsData,
      displayName: displayName,
      filters: currentFilters
    });
  };

  const handleCloseTable = () => {
    setTableModalState({ isOpen: false, tabs: [], displayName: null });
  };

  const handleVariantChange = (layerName, variant) => {
    if (layerName === 'Hidalgo:03_drprodfisica') {
      console.log(`🎨 Cambiando simbología de ${layerName} a: ${variant}`);
      setProductionVariant(variant);
    }

    if (layerName === 'Hidalgo:03_usoconsuntivo') {
      console.log(`💧 Cambiando simbología de Usos Consuntivos a: ${variant}`);
      setUsoConsuntivoVariant(variant);
    }

    if (layerName === 'Hidalgo:04_riesgosmunicipales') {
      console.log(`🌪️ Cambiando simbología de Riesgos a: ${variant}`);
      setRiesgosVariant(variant);
    }
  };

  const currentVariants = useMemo(() => ({
    'Hidalgo:03_drprodfisica': productionVariant,
    'Hidalgo:03_usoconsuntivo': usoConsuntivoVariant,
    'Hidalgo:04_riesgosmunicipales': riesgosVariant
  }), [productionVariant, usoConsuntivoVariant, riesgosVariant]);


  useEffect(() => {
    console.log('🔍 DEBUG Sequías:', {
      quincenaActual: sequiaQuincena,
      totalQuincenas: sequiaQuincenaList.length,
      timelineConfigs: timelineConfigs[SEQUIA_CONFIG.layerName],
      capaActiva: !!activeLayers[SEQUIA_CONFIG.layerName],
      featuresEnCapa: activeLayers[SEQUIA_CONFIG.layerName]?.features?.length || 0
    });
  }, [sequiaQuincena, sequiaQuincenaList, timelineConfigs, activeLayers]);

  return (
    <div className="map-view-container">
      {/*<div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 1000,
        background: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        border: '1px solid #ccc',
        maxWidth: '300px'
      }}>
        <div><strong>🔍 DEBUG Sequías:</strong></div>
        <div>Quincenas: {sequiaQuincenaList.length}</div>
        <div>Actual: {sequiaQuincena || 'Ninguna'}</div>
        <div>Cargada: {activeLayers[SEQUIA_CONFIG.layerName] ? '✅' : '❌'}</div>
        <div>Features: {activeLayers[SEQUIA_CONFIG.layerName]?.features?.length || 0}</div>
        <div style={{ marginTop: '5px', fontSize: '10px', color: '#666' }}>
          Últimas quincenas: {sequiaQuincenaList.slice(-3).join(', ')}
        </div>

        <div style={{ marginTop: '8px', display: 'flex', gap: '5px', flexDirection: 'column' }}>
          <button
            onClick={() => {
              setSequiaQuincenaList([]);
              console.log('🔄 Forzando recarga de quincenas...');
            }}
            style={{ padding: '2px 5px', fontSize: '10px' }}
          >
            Recargar Quincenas
          </button>

          <button
            onClick={() => {
              console.log('🔍 Estado actual:', {
                quincenaActual: sequiaQuincena,
                listaQuincenas: sequiaQuincenaList,
                capaActiva: !!activeLayers[SEQUIA_CONFIG.layerName],
                features: activeLayers[SEQUIA_CONFIG.layerName]?.features?.length
              });
            }}
            style={{ padding: '2px 5px', fontSize: '10px', background: '#e3f2fd' }}
          >
            Log Estado
          </button>
        </div>
      </div>*/}
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
          <LayersControl position="topright">
            <BaseLayer checked name="OpenStreetMap">
              <TileLayer
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
              />
            </BaseLayer>
            <BaseLayer name="ESRI Satélite">
              <TileLayer
                attribution='&copy; <a href="https://www.esri.com/">ESRI</a>'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxZoom={19}
              />
            </BaseLayer>
            <BaseLayer name="ESRI Calles">
              <TileLayer
                attribution='&copy; <a href="https://www.esri.com/">ESRI</a>'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
                maxZoom={19}
              />
            </BaseLayer>
            <BaseLayer name="Topográfico">
              <TileLayer
                attribution='&copy; <a href="https://opentopomap.org/">OpenTopoMap</a>'
                url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                maxZoom={17}
              />
            </BaseLayer>
          </LayersControl>

          <MapClickHandler
            activeLayers={activeLayers}
            setPopupData={setPopupData}
            baseLayerData={baseLayerData}
            sequiaQuincena={sequiaQuincena}
          />
          <KeepPopupInView />

          {popupData && (
            <Popup
              position={popupData.position}
              onClose={() => setPopupData(null)}
              className="custom-popup small-popup"
              maxWidth={300}
              maxHeight={550}
              autoPan={false}
            >
              <div
                dangerouslySetInnerHTML={{ __html: popupData.content }}
                className="popup-content compact"
              />
            </Popup>
          )}

          {baseLayerData && (
            <GeoJSON
              key="Hidalgo:00_Estado-base"
              data={baseLayerData}
              {...getLayerOptions('Hidalgo:00_Estado')}
            />
          )}

          <GeoJsonLayers
            activeLayers={activeLayers}
            productionVariant={productionVariant}
            usoConsuntivoVariant={usoConsuntivoVariant}
            riesgosVariant={riesgosVariant}
            sequiaQuincena={sequiaQuincena}
          />
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