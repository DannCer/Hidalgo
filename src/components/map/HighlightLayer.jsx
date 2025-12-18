/**
 * @fileoverview Capa de resaltado de features seleccionados.
 * 
 * Muestra un overlay visual sobre los features que el usuario
 * ha seleccionado mediante clic en el mapa.
 * 
 * @module components/map/HighlightLayer
 */

import React, { useEffect, useState } from 'react';
import { GeoJSON } from 'react-leaflet';
import L from 'leaflet';

/**
 * Capa que muestra resaltado sobre features seleccionados.
 * 
 * Usa el color primario de la aplicación (CSS var) con
 * transparencia para indicar selección sin ocultar el feature.
 * 
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {Array<{feature: Object, layerName: string}>} props.data - Features a resaltar
 * @returns {JSX.Element|null} Capas GeoJSON de resaltado o null
 * 
 * @example
 * <HighlightLayer data={[{ feature: geojson, layerName: 'municipios' }]} />
 */
const HighlightLayer = ({ data }) => {
  /** @type {[string, Function]} Color de resaltado (del CSS) */
  const [highlightColor, setHighlightColor] = useState('#00FFFF');

  /**
   * Efecto para obtener el color primario de las variables CSS.
   */
  useEffect(() => {
    const cssColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-primary')
        .trim();

    if (cssColor) {
        setHighlightColor(cssColor);
    }
  }, []);

  // No renderizar si no hay datos
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  /**
   * Obtiene el estilo para polígonos y líneas.
   * @returns {Object} Estilo de Leaflet
   */
  const getStyle = () => ({
    stroke: false,
    fillColor: highlightColor,
    fillOpacity: 0.5,
    interactive: false
  });

  /**
   * Convierte puntos GeoJSON a marcadores circulares.
   * @param {Object} geoJsonFeature - Feature GeoJSON
   * @param {L.LatLng} latlng - Coordenadas del punto
   * @returns {L.CircleMarker} Marcador circular
   */
  const pointToLayer = (geoJsonFeature, latlng) => {
    return L.circleMarker(latlng, {
      radius: 8,
      stroke: false,
      fillColor: highlightColor,
      fillOpacity: 0.8,
      interactive: false
    });
  };

  return (
    <>
      {data.map((item, index) => {
        if (!item || !item.feature) return null;

        const { feature, layerName } = item;

        return (
          <GeoJSON
            key={`highlight-${layerName}-${index}-${JSON.stringify(feature.properties)}`}
            data={feature}
            style={getStyle}
            pointToLayer={pointToLayer}
            interactive={false}
          />
        );
      })}
    </>
  );
};

export default HighlightLayer;