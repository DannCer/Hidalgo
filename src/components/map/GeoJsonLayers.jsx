

import React, { useMemo, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { GeoJSON, useMap } from 'react-leaflet';
import { getLayerOptions } from '../../utils/layerStyleFactory';
import { SEQUIA_CONFIG } from '../../utils/constants';
import { logger } from '../../config/env';

const GeoJsonLayers = React.memo(({
  activeLayers,
  productionVariant,
  usoConsuntivoVariant,
  riesgosVariant,
  sequiaQuincena
}) => {
  const map = useMap();


  const sequiaLayerRef = useRef(null);
  const lastSequiaDataRef = useRef({ quincena: null, featureCount: 0, updateId: null });
  const otherLayersRef = useRef(new Map());




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




  const updateSequiaStyles = useCallback((layerInstance, geojsonData) => {
    if (!layerInstance || !geojsonData?.features) return;

    const layerOptions = getLayerOptions(SEQUIA_CONFIG.layerName, null, true);
    const styleFn = layerOptions.style;

    if (!styleFn) return;


    requestAnimationFrame(() => {
      try {
        layerInstance.eachLayer(layer => {
          if (layer.setStyle && layer.feature) {
            const computedStyle = typeof styleFn === 'function'
              ? styleFn(layer.feature)
              : styleFn;
            layer.setStyle(computedStyle);
          }
        });
        logger.debug('Estilos de sequía actualizados in-place');
      } catch (e) {
        logger.error('Error actualizando estilos:', e);
      }
    });
  }, []);




  useEffect(() => {
    const sequiaLayer = activeLayers[SEQUIA_CONFIG.layerName];

    if (!sequiaLayer) {

      lastSequiaDataRef.current = { quincena: null, featureCount: 0, updateId: null };
      return;
    }

    const metadata = sequiaLayer._metadata || {};
    const currentQuincena = metadata.quincena || sequiaQuincena;
    const currentCount = sequiaLayer.features?.length || 0;
    const currentUpdateId = metadata.lastUpdate;

    const lastData = lastSequiaDataRef.current;


    const hasDataChanged =
      lastData.quincena !== currentQuincena ||
      lastData.featureCount !== currentCount ||
      lastData.updateId !== currentUpdateId;

    if (hasDataChanged) {
      logger.debug(`Sequía cambió: ${lastData.quincena} → ${currentQuincena}, features: ${currentCount}`);

      lastSequiaDataRef.current = {
        quincena: currentQuincena,
        featureCount: currentCount,
        updateId: currentUpdateId
      };


      if (sequiaLayerRef.current) {
        updateSequiaStyles(sequiaLayerRef.current, sequiaLayer);
      }
    }
  }, [activeLayers, sequiaQuincena, updateSequiaStyles]);




  const handleSequiaLayerAdd = useCallback((e) => {
    sequiaLayerRef.current = e.target;

    const sequiaData = activeLayers[SEQUIA_CONFIG.layerName];
    if (sequiaData) {
      updateSequiaStyles(e.target, sequiaData);
    }
  }, [activeLayers, updateSequiaStyles]);




  const handleSequiaLayerRemove = useCallback(() => {
    sequiaLayerRef.current = null;
  }, []);




  const layerElements = useMemo(() => {
    return Object.entries(activeLayers)
      .filter(([, geojsonData]) => geojsonData?.features?.length > 0)
      .map(([layerName, geojsonData]) => {
        const { variant, variantKey } = getVariantConfig(layerName);
        const isSequiaLayer = layerName === SEQUIA_CONFIG.layerName;
        const featureCount = geojsonData.features.length;





        let uniqueKey;
        if (isSequiaLayer) {


          uniqueKey = `${layerName}-sequia-layer`;
        } else {

          uniqueKey = `${layerName}-${variantKey}-${featureCount}`;
        }

        try {
          const layerOptions = getLayerOptions(layerName, variant, isSequiaLayer);


          const eventHandlers = isSequiaLayer ? {
            add: handleSequiaLayerAdd,
            remove: handleSequiaLayerRemove
          } : undefined;

          return (
            <GeoJSON
              key={uniqueKey}
              data={geojsonData}
              {...layerOptions}
              eventHandlers={eventHandlers}
            />
          );
        } catch (error) {
          logger.error(`Error renderizando capa ${layerName}:`, error);
          return null;
        }
      })
      .filter(Boolean);
  }, [
    activeLayers,
    getVariantConfig,
    handleSequiaLayerAdd,
    handleSequiaLayerRemove


  ]);





  useEffect(() => {
    const sequiaData = activeLayers[SEQUIA_CONFIG.layerName];

    if (sequiaLayerRef.current && sequiaData?.features?.length > 0) {

      const layerInstance = sequiaLayerRef.current;


      layerInstance.clearLayers();


      layerInstance.addData(sequiaData);


      updateSequiaStyles(layerInstance, sequiaData);
    }
  }, [activeLayers[SEQUIA_CONFIG.layerName]?._metadata?.lastUpdate, updateSequiaStyles]);

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
