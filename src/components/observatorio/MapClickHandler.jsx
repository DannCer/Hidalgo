import { useEffect, useMemo } from 'react';
import { useMapEvents } from 'react-leaflet';
import ReactDOMServer from 'react-dom/server';
import PopupContent from './PopupContent';
import { fetchFeaturesAtPoint, getLayerInfo } from '../../utils/wfsService';
import { accordionData } from '../ui/AccordionData';
import { SEQUIA_CONFIG } from './mapConfig';

function MapClickHandler({ activeLayers, setPopupData, baseLayerData, sequiaQuincena }) {
  const map = useMapEvents({});

  const allLayersConfig = useMemo(
    () =>
      accordionData.flatMap((section) =>
        section.cards?.flatMap((card) => card.links?.filter((link) => link.layerName) || []) || []
      ),
    []
  );

  const getFixedPopupPosition = () => {
    if (!map) return map.getCenter();
    return map.getCenter();
  };

  useEffect(() => {
    if (!map) return;

    const handleClick = async (e) => {

      console.log("✅ Click detectado en:", e.latlng); // 1. CONFIRMACIÓN DE CLIC

      const layersToQuery = { ...activeLayers };
      if (baseLayerData) layersToQuery["Hidalgo:00_Estado"] = baseLayerData;

      const activeLayerNames = Object.keys(layersToQuery);

      if (activeLayerNames.length === 0) {
        console.log("⚠️ Sin capas activas para consultar."); // 2. VERIFICACIÓN DE SALIDA TEMPRANA
        setPopupData(null);
        return;
      }

      const popupPosition = getFixedPopupPosition();

      // Mostrar popup de carga
      setPopupData({
        position: [popupPosition.lat, popupPosition.lng],
        content: '<div class="loading-popup">Consultando información...</div>',
        isSidebar: true
      });

      console.log("⚙️ Iniciando consulta WFS para capas:", activeLayerNames); // 3. INICIO DE CONSULTA

      try {
        const promises = activeLayerNames.map((layerName) => {
          const config = allLayersConfig.find((l) => {
            if (Array.isArray(l.layerName)) return l.layerName.includes(layerName);
            return l.layerName === layerName;
          });

          const geomType = config?.geomType || "polygon";

          let additionalFilter = null;
          if (layerName === SEQUIA_CONFIG.layerName && sequiaQuincena) {
            const normalizedQuincena = sequiaQuincena.toString().replace('Z', '').trim();
            additionalFilter = `${SEQUIA_CONFIG.fieldName}='${normalizedQuincena}'`;
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
          } else if (result.status === "rejected") {
            console.error(`❌ Error en capa ${layerName}:`, result.reason); // 4. ERRORES POR CAPA
          }
        });

        if (totalFeaturesFound > 0) {
          console.log(`🎯 Elementos encontrados: ${totalFeaturesFound}`); // 5. ÉXITO EN LA CONSULTA
          const headerContent = ReactDOMServer.renderToString(
            <div className="popup-header">
              <h4>Información en el punto</h4>
              <p className="feature-summary">{totalFeaturesFound} elemento(s) encontrado(s)</p>
            </div>
          );

          // Popup final
          setPopupData({
            position: [popupPosition.lat, popupPosition.lng],
            content: headerContent + finalContent,
            isSidebar: true
          });
        } else {
          console.log("🔍 No se encontraron elementos en ninguna capa activa.");
          setPopupData(null);
        }
      } catch (error) {
        console.error("❌ Error fatal en peticiones WFS:", error);
        setPopupData({
          position: [popupPosition.lat, popupPosition.lng],
          content: '<div class="error-popup">Error al consultar la información</div>',
          isSidebar: true
        });
      }
    };

    map.on("click", handleClick);
    return () => map.off("click", handleClick);
  }, [map, activeLayers, baseLayerData, allLayersConfig, setPopupData, sequiaQuincena]);

  return null;
}

export default MapClickHandler;