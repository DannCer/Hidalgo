import { useMemo, useCallback } from 'react';
import { useMapEvents } from 'react-leaflet';
import ReactDOMServer from 'react-dom/server';
import PopupContent from './PopupContent';
import { fetchFeaturesAtPoint, getLayerInfo } from '../../utils/wfsService';
import { accordionData } from '../../data/AccordionData';
import { SEQUIA_CONFIG } from '../../utils/constants';

const MAX_FEATURES_PER_LAYER = 15;
const CLICK_TOLERANCE = 50;

function MapClickHandler({
  activeLayers,
  setPopupData,
  setHighlightData,
  baseLayerData,
  sequiaQuincena
}) {
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

  const showLoadingPopup = useCallback((position) => {
    setPopupData({
      position,
      content: '<div class="p-3 text-center"><strong>Buscando información...</strong><br/><small>Por favor espere</small></div>',
      isSidebar: true
    });
    if (setHighlightData) setHighlightData([]);
  }, [setPopupData, setHighlightData]);

  const showErrorPopup = useCallback((error) => {
    console.error("Error al obtener datos:", error);
    setPopupData({
      position: getFixedPopupPosition(),
      content: '<div class="p-3 text-danger">Error al consultar el servicio de mapas.</div>',
      isSidebar: true
    });
    if (setHighlightData) setHighlightData([]);
  }, [setPopupData, getFixedPopupPosition, setHighlightData]);

  const buildPopupContent = useCallback((results, activeLayerNames) => {

    const validResultsWithIndex = results
      .map((r, originalIndex) => ({ result: r, originalIndex }))
      .filter((item) => item.result.status === 'fulfilled' && item.result.value && item.result.value.features?.length > 0);

    if (validResultsWithIndex.length === 0) return null;

    const contentHtml = ReactDOMServer.renderToString(
      <div className="popup-content-wrapper">
        {validResultsWithIndex.map((item, displayIndex) => {
          const layerData = item.result.value;
          const layerName = activeLayerNames[item.originalIndex] || layerData.layerName;
          const layerInfo = getLayerInfo(layerName);
          const isLast = displayIndex === validResultsWithIndex.length - 1;

          return (
            <PopupContent
              key={`${layerName}-${item.originalIndex}`}
              layerName={layerName}
              layerInfo={layerInfo}
              features={layerData.features}
              isLast={isLast}
            />
          );
        })}
      </div>
    );

    return contentHtml;
  }, []);


  const extractAllFeatures = useCallback((results, activeLayerNames) => {
    const allFeatures = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value?.features?.length > 0) {
        const layerName = activeLayerNames[index];


        result.value.features.slice(0, MAX_FEATURES_PER_LAYER).forEach(feature => {
          allFeatures.push({
            feature,
            layerName
          });
        });
      }
    });

    return allFeatures;
  }, []);

  const handleMapClick = useCallback(async (e) => {
    const activeLayerNames = Object.keys(activeLayers).filter((name) => !!activeLayers[name]);

    if (activeLayerNames.length === 0) {
        setPopupData(null);
        if (setHighlightData) setHighlightData([]);
        return;
    }

    const popupPosition = getFixedPopupPosition();
    showLoadingPopup([popupPosition.lat, popupPosition.lng]);

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
      const content = buildPopupContent(results, activeLayerNames);


      const allFeaturesToHighlight = extractAllFeatures(results, activeLayerNames);

      if (content && allFeaturesToHighlight.length > 0) {

        setPopupData({
          position: [popupPosition.lat, popupPosition.lng],
          content,
          isSidebar: true
        });


        if (setHighlightData) {
          setHighlightData(allFeaturesToHighlight);
        }
      } else {

        setPopupData(null);
        if (setHighlightData) setHighlightData([]);
      }
    } catch (error) {
      showErrorPopup(error);
    }
  }, [
    activeLayers,
    allLayersConfig,
    setPopupData,
    setHighlightData,
    showLoadingPopup,
    showErrorPopup,
    getFixedPopupPosition,
    buildPopupContent,
    getSequiaFilter,
    extractAllFeatures
  ]);

  useMapEvents({
    click: handleMapClick
  });

  return null;
}

export default MapClickHandler;