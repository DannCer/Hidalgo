import React, { useMemo, useEffect } from 'react';
import { GeoJSON } from 'react-leaflet';
import { getLayerOptions, forceStyleUpdate } from '../../utils/layerStyleFactory';
import { SEQUIA_CONFIG } from './mapConfig';

const GeoJsonLayers = React.memo(({
  activeLayers,
  productionVariant,
  usoConsuntivoVariant,
  riesgosVariant,
  sequiaQuincena
}) => {

  //  Forzar actualización de estilos cuando cambia la quincena
  useEffect(() => {
    if (sequiaQuincena && activeLayers[SEQUIA_CONFIG.layerName]) {
      forceStyleUpdate();
    }
  }, [sequiaQuincena, activeLayers[SEQUIA_CONFIG.layerName]]);

  const layerElements = useMemo(() => {

    return Object.entries(activeLayers).map(([layerName, geojsonData]) => {
      if (!geojsonData || !geojsonData.features || geojsonData.features.length === 0) {
        return null;
      }

      let variant = null;
      let variantKey = 'default';

      if (layerName === 'Hidalgo:03_drprodfisica') {
        variant = productionVariant;
        variantKey = productionVariant?.replace(/\s+/g, '_') || 'default';
      } else if (layerName === 'Hidalgo:03_usoconsuntivo') {
        variant = usoConsuntivoVariant;
        variantKey = usoConsuntivoVariant?.replace(/\s+/g, '_') || 'default';
      } else if (layerName === 'Hidalgo:04_riesgosmunicipales') {
        variant = riesgosVariant;
        variantKey = riesgosVariant?.replace(/\s+/g, '_') || 'default';
      }

      const isSequiaLayer = layerName === SEQUIA_CONFIG.layerName;
      const featureCount = geojsonData.features?.length || 0;

      const forceUpdate = isSequiaLayer;

      const uniqueKey = isSequiaLayer
        ? `${layerName}-${sequiaQuincena || 'no-quincena'}-${featureCount}-${Date.now()}`
        : `${layerName}-${variantKey}-${featureCount}`;


      try {
        const layerOptions = getLayerOptions(layerName, variant, forceUpdate);

        return (
          <GeoJSON
            key={uniqueKey}
            data={geojsonData}
            {...layerOptions}
            eventHandlers={{
              add: (e) => {
                if (isSequiaLayer) {
                  setTimeout(() => {
                    e.target.eachLayer(layer => {
                      if (layer.setStyle) {
                        const style = layerOptions.style;
                        if (style) {
                          layer.setStyle(typeof style === 'function' ? style(layer.feature) : style);
                        }
                      }
                    });
                  }, 100);
                }
              }
            }}
          />
        );
      } catch (error) {
        console.error(`❌ Error renderizando capa ${layerName}:`, error);
        return null;
      }
    }).filter(Boolean);

  }, [activeLayers, productionVariant, usoConsuntivoVariant, riesgosVariant, sequiaQuincena]);

  return <>{layerElements}</>;
});

GeoJsonLayers.displayName = 'GeoJsonLayers';

export default GeoJsonLayers;