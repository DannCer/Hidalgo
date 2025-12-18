/**
 * @fileoverview Componente GeoJsonLayers del Geovisor.
 * Componente optimizado para renderizar múltiples capas GeoJSON en el mapa.
 * Maneja actualizaciones eficientes, estilos dinámicos y variantes de visualización.
 * 
 * @module components/map/GeoJsonLayers
 * @version 1.0.0
 */

import React, { useMemo, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { GeoJSON, useMap } from 'react-leaflet';
import { getLayerOptions } from '../../utils/layerStyleFactory';
import { SEQUIA_CONFIG } from '../../utils/constants';
import { logger } from '../../config/env';

/**
 * Componente principal para renderizar capas GeoJSON con optimizaciones avanzadas
 * Utiliza refs para manejar actualizaciones de capas específicas sin re-renderizar todo
 * 
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.activeLayers - Objeto con capas activas organizadas por nombre
 * @param {string} props.productionVariant - Variante de producción seleccionada
 * @param {string} props.usoConsuntivoVariant - Variante de uso consuntivo
 * @param {string} props.riesgosVariant - Variante de riesgos
 * @param {string} props.sequiaQuincena - Quincena para capa de sequía
 * @returns {JSX.Element} Grupo de capas GeoJSON renderizadas
 */
const GeoJsonLayers = React.memo(({
  activeLayers,
  productionVariant,
  usoConsuntivoVariant,
  riesgosVariant,
  sequiaQuincena
}) => {
  const map = useMap(); // Hook para acceder a la instancia del mapa

  // Referencias para manejar capas específicas sin re-render
  const sequiaLayerRef = useRef(null);                  // Referencia a capa de sequía
  const lastSequiaDataRef = useRef({                   // Últimos datos de sequía para comparación
    quincena: null, 
    featureCount: 0, 
    updateId: null 
  });
  const otherLayersRef = useRef(new Map());            // Referencias a otras capas

  /**
   * Obtiene la configuración de variante para una capa específica
   * Asigna variantes a capas específicas basado en su nombre
   * 
   * @param {string} layerName - Nombre de la capa
   * @returns {Object} Objeto con variant y variantKey
   */
  const getVariantConfig = useCallback((layerName) => {
    // Mapa de capas específicas a sus variantes
    const variantMap = {
      'Hidalgo:03_drprodfisica': productionVariant,      // Producción física
      'Hidalgo:03_usoconsuntivo': usoConsuntivoVariant,  // Uso consuntivo
      'Hidalgo:04_riesgosmunicipales': riesgosVariant    // Riesgos municipales
    };

    const variant = variantMap[layerName];
    return {
      variant,
      variantKey: variant?.replace(/\s+/g, '_') || 'default' // Clave segura para URLs/keys
    };
  }, [productionVariant, usoConsuntivoVariant, riesgosVariant]);

  /**
   * Actualiza los estilos de la capa de sequía in-place (sin re-renderizar)
   * Utiliza requestAnimationFrame para optimizar rendimiento
   * 
   * @param {L.GeoJSON} layerInstance - Instancia de la capa Leaflet
   * @param {Object} geojsonData - Datos GeoJSON de la capa
   */
  const updateSequiaStyles = useCallback((layerInstance, geojsonData) => {
    if (!layerInstance || !geojsonData?.features) return;

    const layerOptions = getLayerOptions(SEQUIA_CONFIG.layerName, null, true);
    const styleFn = layerOptions.style;

    if (!styleFn) return;

    // Usar requestAnimationFrame para actualización eficiente
    requestAnimationFrame(() => {
      try {
        // Aplicar nuevos estilos a cada feature existente
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

  /**
   * Efecto para detectar cambios en la capa de sequía
   * Compara datos anteriores con actuales para decidir si actualizar
   */
  useEffect(() => {
    const sequiaLayer = activeLayers[SEQUIA_CONFIG.layerName];

    if (!sequiaLayer) {
      // Resetear datos si la capa ya no está activa
      lastSequiaDataRef.current = { quincena: null, featureCount: 0, updateId: null };
      return;
    }

    const metadata = sequiaLayer._metadata || {};
    const currentQuincena = metadata.quincena || sequiaQuincena;
    const currentCount = sequiaLayer.features?.length || 0;
    const currentUpdateId = metadata.lastUpdate;

    const lastData = lastSequiaDataRef.current;

    // Verificar si hubo cambios significativos
    const hasDataChanged =
      lastData.quincena !== currentQuincena ||
      lastData.featureCount !== currentCount ||
      lastData.updateId !== currentUpdateId;

    if (hasDataChanged) {
      logger.debug(`Sequía cambió: ${lastData.quincena} → ${currentQuincena}, features: ${currentCount}`);

      // Actualizar referencia de datos
      lastSequiaDataRef.current = {
        quincena: currentQuincena,
        featureCount: currentCount,
        updateId: currentUpdateId
      };

      // Actualizar estilos si la capa ya está renderizada
      if (sequiaLayerRef.current) {
        updateSequiaStyles(sequiaLayerRef.current, sequiaLayer);
      }
    }
  }, [activeLayers, sequiaQuincena, updateSequiaStyles]);

  /**
   * Manejador para cuando se añade la capa de sequía al mapa
   * Guarda referencia y aplica estilos iniciales
   */
  const handleSequiaLayerAdd = useCallback((e) => {
    sequiaLayerRef.current = e.target;

    const sequiaData = activeLayers[SEQUIA_CONFIG.layerName];
    if (sequiaData) {
      updateSequiaStyles(e.target, sequiaData);
    }
  }, [activeLayers, updateSequiaStyles]);

  /**
   * Manejador para cuando se remueve la capa de sequía del mapa
   * Limpia referencia para evitar memory leaks
   */
  const handleSequiaLayerRemove = useCallback(() => {
    sequiaLayerRef.current = null;
  }, []);

  /**
   * Memoiza la creación de elementos de capas GeoJSON
   * Filtra capas vacías y genera keys únicas para optimizar re-render
   */
  const layerElements = useMemo(() => {
    return Object.entries(activeLayers)
      // Filtrar capas con datos válidos
      .filter(([, geojsonData]) => geojsonData?.features?.length > 0)
      .map(([layerName, geojsonData]) => {
        const { variant, variantKey } = getVariantConfig(layerName);
        const isSequiaLayer = layerName === SEQUIA_CONFIG.layerName;
        const featureCount = geojsonData.features.length;

        // Generar keys únicas para optimizar re-render de React
        let uniqueKey;
        if (isSequiaLayer) {
          // Key estática para sequía (se actualiza in-place)
          uniqueKey = `${layerName}-sequia-layer`;
        } else {
          // Key dinámica con variante y conteo para otras capas
          uniqueKey = `${layerName}-${variantKey}-${featureCount}`;
        }

        try {
          // Obtener opciones de estilo para la capa
          const layerOptions = getLayerOptions(layerName, variant, isSequiaLayer);

          // Configurar event handlers solo para sequía
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
      .filter(Boolean); // Eliminar elementos nulos
  }, [
    activeLayers,
    getVariantConfig,
    handleSequiaLayerAdd,
    handleSequiaLayerRemove
  ]);

  /**
   * Efecto para actualizar datos de sequía cuando cambia el updateId
   * Maneja actualización de datos manteniendo la misma instancia de capa
   */
  useEffect(() => {
    const sequiaData = activeLayers[SEQUIA_CONFIG.layerName];

    if (sequiaLayerRef.current && sequiaData?.features?.length > 0) {
      const layerInstance = sequiaLayerRef.current;

      // Limpiar features existentes
      layerInstance.clearLayers();
      
      // Añadir nuevos datos
      layerInstance.addData(sequiaData);
      
      // Aplicar estilos
      updateSequiaStyles(layerInstance, sequiaData);
    }
  }, [activeLayers[SEQUIA_CONFIG.layerName]?._metadata?.lastUpdate, updateSequiaStyles]);

  return <>{layerElements}</>;
});

// Nombre para debugging en React DevTools
GeoJsonLayers.displayName = 'GeoJsonLayers';

// Validación de tipos de propiedades
GeoJsonLayers.propTypes = {
  activeLayers: PropTypes.object.isRequired,
  productionVariant: PropTypes.string,
  usoConsuntivoVariant: PropTypes.string,
  riesgosVariant: PropTypes.string,
  sequiaQuincena: PropTypes.string
};

// Valores por defecto
GeoJsonLayers.defaultProps = {
  productionVariant: 'default',
  usoConsuntivoVariant: 'default',
  riesgosVariant: 'default',
  sequiaQuincena: null
};

export default GeoJsonLayers;