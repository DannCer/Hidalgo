import React, { useMemo, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
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
  const lastSequiaUpdateRef = useRef({ quincena: null, count: 0 });

  // Track sequia layer updates for style refresh
  useEffect(() => {
    const sequiaLayer = activeLayers[SEQUIA_CONFIG.layerName];
    
    if (!sequiaLayer || !sequiaQuincena) return;

    const currentCount = sequiaLayer.features?.length || 0;
    const lastUpdate = lastSequiaUpdateRef.current;

    if (lastUpdate.quincena !== sequiaQuincena || lastUpdate.count !== currentCount) {
      lastSequiaUpdateRef.current = { 
        quincena: sequiaQuincena, 
        count: currentCount 
      };
      forceStyleUpdate();
    }
  }, [sequiaQuincena, activeLayers]);

  // Get variant configuration for specific layers
  const getVariantConfig = useCallback((layerName) => {
    const variantMap = {
      'Hidalgo:03_drprodfisica': productionVariant,
      'Hidalgo:03_usoconsuntivo': usoConsuntivoVariant,
      'Hidalgo:04_riesgosmunicipales': riesgosVariant
    };
    
    const variant = variantMap[layerName];
    return {
      variant,
      variantKey: variant?.replace(/\s+/g, '_') || 'default'
    };
  }, [productionVariant, usoConsuntivoVariant, riesgosVariant]);

  // Create sequia layer event handlers for dynamic styling
  const createSequiaEventHandlers = useCallback((layerOptions) => ({
    add: (e) => {
      requestAnimationFrame(() => {
        const style = layerOptions.style;
        if (!style) return;

        e.target.eachLayer(layer => {
          if (layer.setStyle && layer.feature) {
            const computedStyle = typeof style === 'function' 
              ? style(layer.feature) 
              : style;
            layer.setStyle(computedStyle);
          }
        });
      });
    }
  }), []);

  // Render all GeoJSON layers
  const layerElements = useMemo(() => {
    return Object.entries(activeLayers)
      .filter(([, geojsonData]) => geojsonData?.features?.length)
      .map(([layerName, geojsonData]) => {
        const { variant, variantKey } = getVariantConfig(layerName);
        const isSequiaLayer = layerName === SEQUIA_CONFIG.layerName;
        const featureCount = geojsonData.features.length;

        // Create unique key for proper re-rendering
        const uniqueKey = isSequiaLayer
          ? `${layerName}-${sequiaQuincena || 'no-quincena'}-${featureCount}`
          : `${layerName}-${variantKey}-${featureCount}`;

        try {
          const layerOptions = getLayerOptions(layerName, variant, isSequiaLayer);
          const eventHandlers = isSequiaLayer 
            ? createSequiaEventHandlers(layerOptions) 
            : undefined;

          return (
            <GeoJSON
              key={uniqueKey}
              data={geojsonData}
              {...layerOptions}
              eventHandlers={eventHandlers}
            />
          );
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error(`Error renderizando capa ${layerName}:`, error);
          }
          return null;
        }
      })
      .filter(Boolean);
  }, [
    activeLayers, 
    getVariantConfig, 
    sequiaQuincena, 
    createSequiaEventHandlers
  ]);

  return <>{layerElements}</>;
});

GeoJsonLayers.displayName = 'GeoJsonLayers';

GeoJsonLayers.propTypes = {
  activeLayers: PropTypes.object.isRequired,
  productionVariant: PropTypes.string,
  usoConsuntivoVariant: PropTypes.string,
  riesgosVariant: PropTypes.string,
  sequiaQuincena: PropTypes.string
};

GeoJsonLayers.defaultProps = {
  productionVariant: 'default',
  usoConsuntivoVariant: 'default',
  riesgosVariant: 'default',
  sequiaQuincena: null
};

export default GeoJsonLayers;