import React, { useEffect, useState } from 'react';
import { GeoJSON } from 'react-leaflet';
import L from 'leaflet';

const HighlightLayer = ({ data }) => {
  const [highlightColor, setHighlightColor] = useState('#00FFFF');

  useEffect(() => {
    const cssColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-primary')
        .trim();

    if (cssColor) {
        setHighlightColor(cssColor);
    }
  }, []);


  if (!data || !Array.isArray(data) || data.length === 0) return null;


  const getStyle = () => ({
    stroke: false,
    fillColor: highlightColor,
    fillOpacity: 0.5,
    interactive: false
  });


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