import { useEffect, useMemo, useCallback } from 'react';
import { useMapEvents } from 'react-leaflet';
import ReactDOMServer from 'react-dom/server';
import PopupContent from './PopupContent';
import { fetchFeaturesAtPoint, getLayerInfo } from '../../utils/wfsService';
import { accordionData } from '../ui/AccordionData';
import { SEQUIA_CONFIG } from './mapConfig';

// Constants
const MAX_FEATURES_PER_LAYER = 15;
const CLICK_TOLERANCE = 50;

function MapClickHandler({ activeLayers, setPopupData, baseLayerData, sequiaQuincena }) {
  const map = useMapEvents({});

  const allLayersConfig = useMemo(
    () =>
      accordionData.flatMap((section) =>
        section.cards?.flatMap((card) => card.links?.filter((link) => link.layerName) || []) || []
      ),
    []
  );

  const getFixedPopupPosition = useCallback(() => {
    return map?.getCenter() || [0, 0];
  }, [map]);

  const getSequiaFilter = useCallback((layerName) => {
    if (layerName === SEQUIA_CONFIG.layerName && sequiaQuincena) {
      const normalizedQuincena = sequiaQuincena.toString().replace('Z', '').trim();
      return `${SEQUIA_CONFIG.fieldName}='${normalizedQuincena}'`;
    }
    return null;
  }, [sequiaQuincena]);

  // ✅ FUNCIÓN CORREGIDA: Maneja layerInfo null de forma segura
  const buildPopupContent = useCallback((results, activeLayerNames) => {
    let totalFeaturesFound = 0;
    const featuresContent = [];

    results.forEach((result, index) => {
      const layerName = activeLayerNames[index];
      
      if (result.status === "fulfilled" && result.value?.features?.length > 0) {
        const data = result.value;
        
        // ✅ CORRECCIÓN: Obtener layerInfo de forma segura
        let layerInfo = null;
        try {
          layerInfo = getLayerInfo(layerName);
        } catch (error) {
          console.warn(`No se pudo obtener info para capa ${layerName}:`, error);
          layerInfo = null;
        }

        totalFeaturesFound += data.features.length;

        const content = ReactDOMServer.renderToString(
          <PopupContent
            layerName={layerName}
            layerInfo={layerInfo} // ✅ Puede ser null, pero PopupContent lo maneja
            features={data.features}
            maxFeatures={MAX_FEATURES_PER_LAYER}
          />
        );
        featuresContent.push(content);
      } else if (result.status === "rejected") {
        console.error(`Error en capa ${layerName}:`, result.reason);
      }
    });

    if (totalFeaturesFound === 0) {
      return null;
    }

    const headerContent = ReactDOMServer.renderToString(
      <div className="popup-header">
        <h4>Información en el punto</h4>
        <p className="feature-summary">
          {totalFeaturesFound} elemento(s) encontrado(s)
        </p>
      </div>
    );

    return headerContent + featuresContent.join('');
  }, []);

  const showLoadingPopup = useCallback(() => {
    const popupPosition = getFixedPopupPosition();
    setPopupData({
      position: [popupPosition.lat, popupPosition.lng],
      content: '<div class="loading-popup">Consultando información...</div>',
      isSidebar: true
    });
  }, [getFixedPopupPosition, setPopupData]);

  const showErrorPopup = useCallback((error) => {
    console.error("Error fatal en peticiones WFS:", error);
    const popupPosition = getFixedPopupPosition();
    setPopupData({
      position: [popupPosition.lat, popupPosition.lng],
      content: '<div class="error-popup">Error al consultar la información</div>',
      isSidebar: true
    });
  }, [getFixedPopupPosition, setPopupData]);

  const handleMapClick = useCallback(async (e) => {
    const layersToQuery = { ...activeLayers };
    if (baseLayerData) {
      layersToQuery["Hidalgo:00_Estado"] = baseLayerData;
    }

    const activeLayerNames = Object.keys(layersToQuery);

    if (activeLayerNames.length === 0) {
      setPopupData(null);
      return;
    }

    showLoadingPopup();

    try {
      const promises = activeLayerNames.map((layerName) => {
        const config = allLayersConfig.find((l) => {
          if (Array.isArray(l.layerName)) {
            return l.layerName.includes(layerName);
          }
          return l.layerName === layerName;
        });

        const geomType = config?.geomType || "polygon";
        const additionalFilter = getSequiaFilter(layerName);

        return fetchFeaturesAtPoint(
          layerName, 
          e.latlng, 
          geomType, 
          CLICK_TOLERANCE, 
          additionalFilter
        );
      });

      const results = await Promise.allSettled(promises);
      const popupPosition = getFixedPopupPosition();
      const content = buildPopupContent(results, activeLayerNames);

      if (content) {
        setPopupData({
          position: [popupPosition.lat, popupPosition.lng],
          content,
          isSidebar: true
        });
      } else {
        setPopupData(null);
      }
    } catch (error) {
      showErrorPopup(error);
    }
  }, [
    activeLayers, 
    baseLayerData, 
    allLayersConfig, 
    setPopupData, 
    showLoadingPopup, 
    showErrorPopup, 
    getFixedPopupPosition, 
    buildPopupContent, 
    getSequiaFilter
  ]);

  useEffect(() => {
    if (!map) return;

    map.on("click", handleMapClick);
    return () => {
      map.off("click", handleMapClick);
    };
  }, [map, handleMapClick]);

  return null;
}

export default MapClickHandler;