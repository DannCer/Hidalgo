/**
 * @fileoverview Componente MapClickHandler del Geovisor.
 * Manejador de eventos de clic en el mapa para consultar información de características.
 * Implementa consultas asíncronas a servicios WFS y renderizado de popups con datos obtenidos.
 * 
 * @module components/map/MapClickHandler
 * @version 1.0.0
 */

import { useMemo, useCallback } from 'react';
import { useMapEvents } from 'react-leaflet';
import ReactDOMServer from 'react-dom/server';
import PopupContent from './PopupContent';
import { fetchFeaturesAtPoint, getLayerInfo } from '../../utils/wfsService';
import { accordionData } from '../../data/AccordionData';
import { SEQUIA_CONFIG } from '../../utils/constants';

// Constantes de configuración
const MAX_FEATURES_PER_LAYER = 15;    // Máximo de características por capa en popup
const CLICK_TOLERANCE = 50;           // Tolerancia en píxeles para clics en polígonos/líneas

/**
 * Componente funcional que maneja eventos de clic en el mapa
 * No renderiza elementos visuales, solo agrega event listeners
 * 
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.activeLayers - Capas activas en el mapa
 * @param {Function} props.setPopupData - Función para actualizar datos del popup
 * @param {Function} props.setHighlightData - Función para resaltar características
 * @param {Object} props.baseLayerData - Datos de la capa base
 * @param {string} props.sequiaQuincena - Quincena para filtro de sequía
 * @returns {null} No renderiza elementos
 */
function MapClickHandler({
  activeLayers,
  setPopupData,
  setHighlightData,
  baseLayerData,
  sequiaQuincena
}) {
  const map = useMapEvents({}); // Hook para acceder a eventos del mapa

  /**
   * Memoiza la configuración de todas las capas disponibles
   * Extrae información de accordionData para obtener metadatos de capas
   */
  const allLayersConfig = useMemo(
    () =>
      accordionData.flatMap((section) =>
        section.cards?.flatMap((card) => card.links?.filter((link) => link.layerName) || []) || []
      ),
    []
  );

  /**
   * Obtiene una posición fija para popups (centro del mapa)
   * Utilizada para popups tipo sidebar que no siguen el cursor
   */
  const getFixedPopupPosition = useCallback(() => {
    return map?.getCenter() || [0, 0];
  }, [map]);

  /**
   * Genera filtro CQL para capa de sequía basado en quincena seleccionada
   * 
   * @param {string} layerName - Nombre de la capa
   * @returns {string|null} Filtro CQL o null si no aplica
   */
  const getSequiaFilter = useCallback((layerName) => {
    if (layerName === SEQUIA_CONFIG.layerName && sequiaQuincena) {
      const normalizedQuincena = sequiaQuincena.toString().replace('Z', '').trim();
      return `${SEQUIA_CONFIG.fieldName}='${normalizedQuincena}'`;
    }
    return null;
  }, [sequiaQuincena]);

  /**
   * Muestra un popup de carga mientras se obtienen datos
   * 
   * @param {L.LatLng} position - Posición donde mostrar el popup
   */
  const showLoadingPopup = useCallback((position) => {
    setPopupData({
      position,
      content: '<div class="p-3 text-center"><strong>Buscando información...</strong><br/><small>Por favor espere</small></div>',
      isSidebar: true
    });
    if (setHighlightData) setHighlightData([]);
  }, [setPopupData, setHighlightData]);

  /**
   * Muestra un popup de error cuando falla la consulta
   * 
   * @param {Error} error - Error ocurrido
   */
  const showErrorPopup = useCallback((error) => {
    console.error("Error al obtener datos:", error);
    setPopupData({
      position: getFixedPopupPosition(),
      content: '<div class="p-3 text-danger">Error al consultar el servicio de mapas.</div>',
      isSidebar: true
    });
    if (setHighlightData) setHighlightData([]);
  }, [setPopupData, getFixedPopupPosition, setHighlightData]);

  /**
   * Construye el contenido HTML del popup a partir de resultados de consulta
   * 
   * @param {Array} results - Resultados de las promesas de consulta
   * @param {Array} activeLayerNames - Nombres de capas activas
   * @returns {string|null} HTML renderizado o null si no hay resultados
   */
  const buildPopupContent = useCallback((results, activeLayerNames) => {
    // Procesar resultados exitosos manteniendo orden original
    const validResultsWithIndex = results
      .map((r, originalIndex) => ({ result: r, originalIndex }))
      .filter((item) => item.result.status === 'fulfilled' && item.result.value && item.result.value.features?.length > 0);

    if (validResultsWithIndex.length === 0) return null;

    // Renderizar React components a HTML string
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

  /**
   * Extrae todas las características de resultados para resaltado
   * 
   * @param {Array} results - Resultados de consultas
   * @param {Array} activeLayerNames - Nombres de capas activas
   * @returns {Array} Características con información de capa
   */
  const extractAllFeatures = useCallback((results, activeLayerNames) => {
    const allFeatures = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value?.features?.length > 0) {
        const layerName = activeLayerNames[index];

        // Limitar características para evitar sobrecarga
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

  /**
   * Manejador principal de clics en el mapa
   * Coordina consultas, procesamiento y visualización de resultados
   * 
   * @param {L.LeafletMouseEvent} e - Evento de clic de Leaflet
   */
  const handleMapClick = useCallback(async (e) => {
    // Obtener nombres de capas activas con datos
    const activeLayerNames = Object.keys(activeLayers).filter((name) => !!activeLayers[name]);

    // Si no hay capas activas, limpiar popup y resaltados
    if (activeLayerNames.length === 0) {
        setPopupData(null);
        if (setHighlightData) setHighlightData([]);
        return;
    }

    const popupPosition = getFixedPopupPosition();
    showLoadingPopup([popupPosition.lat, popupPosition.lng]);

    try {
      // Crear promesas de consulta para cada capa activa
      const promises = activeLayerNames.map((layerName) => {
        const config = allLayersConfig.find((l) => {
          if (Array.isArray(l.layerName)) {
            return l.layerName.includes(layerName);
          }
          return l.layerName === layerName;
        });

        // Determinar tipo de geometría para consulta (punto, línea, polígono)
        const geomType = config?.geomType || "polygon";
        const additionalFilter = getSequiaFilter(layerName);

        return fetchFeaturesAtPoint(
          layerName,
          e.latlng,           // Posición del clic
          geomType,           // Tipo de geometría
          CLICK_TOLERANCE,    // Tolerancia para clics
          additionalFilter    // Filtro adicional (ej: sequía)
        );
      });

      // Ejecutar todas las consultas en paralelo
      const results = await Promise.allSettled(promises);
      
      // Construir contenido del popup
      const content = buildPopupContent(results, activeLayerNames);
      
      // Extraer características para resaltado
      const allFeaturesToHighlight = extractAllFeatures(results, activeLayerNames);

      // Mostrar popup si hay resultados
      if (content && allFeaturesToHighlight.length > 0) {
        setPopupData({
          position: [popupPosition.lat, popupPosition.lng],
          content,
          isSidebar: true
        });

        // Resaltar características encontradas
        if (setHighlightData) {
          setHighlightData(allFeaturesToHighlight);
        }
      } else {
        // Ocultar popup si no hay resultados
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

  // Registrar manejador de evento de clic en el mapa
  useMapEvents({
    click: handleMapClick
  });

  return null; // Componente no renderiza elementos
}

export default MapClickHandler;