/**
 * @fileoverview Componente PopupContent del Geovisor.
 * Renderiza contenido estructurado para popups en el mapa, mostrando información
 * de características geográficas con formato especializado y filtrado inteligente.
 * 
 * @module components/map/PopupContent
 * @version 1.0.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import { formatDisplayValue } from '../../utils/dataUtils';

// Propiedades que deben excluirse de la visualización (geometrías)
const EXCLUDED_PROPERTIES = ['geom', 'geometry'];
const DEFAULT_MAX_FEATURES = 15;

// Propiedades que deben excluirse del formato numérico (IDs, códigos)
const EXCLUDE_FROM_NUMBER_FORMAT = [
  'clave de la cuenca',
  'clave_cuenca',
  'clave cuenca',
  'clave',
  'codigo',
  'código',
  'id',
  'cve',
  'cve_mun',
  'cve_ent',
  'cve_loc',
  'año',
  'ano',
  'year',
  'Año',
];

/**
 * Formatea un valor de propiedad para mostrar en el popup
 * Aplica reglas especiales para fechas, números y mayúsculas
 * 
 * @param {any} value - Valor a formatear
 * @param {string} propertyName - Nombre de la propiedad (para reglas específicas)
 * @returns {string} Valor formateado
 */
const formatPropertyValue = (value, propertyName = '') => {
  if (value == null) return '';

  const stringValue = String(value).trim();
  const lowerPropertyName = propertyName.toLowerCase();

  // Intentar formatear como fecha primero
  const formattedDate = formatDisplayValue(value, propertyName);
  if (formattedDate !== stringValue) {
    return formattedDate;
  }

  // Verificar si se debe excluir del formato numérico
  const shouldExcludeFromNumberFormat = EXCLUDE_FROM_NUMBER_FORMAT.some(
    excluded => lowerPropertyName.includes(excluded)
  );

  // Aplicar formato numérico si corresponde
  if (!shouldExcludeFromNumberFormat && !isNaN(value) && stringValue !== '') {
    return Number(value).toLocaleString();
  }

  // Capitalizar primera letra si es texto
  if (stringValue.length > 0) {
    return stringValue.charAt(0).toUpperCase() + stringValue.slice(1);
  }

  return stringValue;
};

/**
 * Obtiene el nombre de visualización de una capa
 * 
 * @param {string} layerName - Nombre técnico de la capa
 * @param {Object} layerInfo - Información adicional de la capa
 * @returns {string} Nombre para mostrar
 */
const getDisplayName = (layerName, layerInfo) => {
  return layerInfo?.text || layerName.split(':')[1] || layerName;
};

/**
 * Determina si una propiedad debe mostrarse en el popup
 * 
 * @param {string} key - Nombre de la propiedad
 * @param {any} value - Valor de la propiedad
 * @returns {boolean} True si debe mostrarse
 */
const shouldDisplayProperty = (key, value) => {
  const lowerKey = key.toLowerCase();
  return !EXCLUDED_PROPERTIES.includes(lowerKey) &&
         value != null &&
         String(value).trim() !== '';
};

/**
 * Componente principal para contenido de popups en el mapa
 * Organiza características por capa con límite de elementos y formato especializado
 * 
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {string} props.layerName - Nombre de la capa
 * @param {Object} props.layerInfo - Información adicional de la capa
 * @param {Array} props.features - Características a mostrar
 * @param {number} props.maxFeatures - Máximo de características por capa
 * @param {string} props.className - Clases CSS adicionales
 * @param {boolean} props.showFeatureCount - Mostrar conteo de características
 * @param {boolean} props.isLast - Si es la última capa en el popup
 * @returns {JSX.Element} Contenido formateado del popup
 */
const PopupContent = ({
  layerName,
  layerInfo = {},
  features = [],
  maxFeatures = DEFAULT_MAX_FEATURES,
  className = '',
  showFeatureCount = true,
  isLast = false
}) => {
  // Estado sin datos
  if (!features || features.length === 0) {
    return (
      <div className={`layer-popup-section ${className}`}>
        <div className="popup-empty-state">
          No se encontraron elementos en esta ubicación.
        </div>
      </div>
    );
  }

  const displayName = getDisplayName(layerName, layerInfo);
  const displayedFeatures = features.slice(0, maxFeatures);
  const hiddenFeaturesCount = features.length - displayedFeatures.length;

  return (
    <div className={`layer-popup-section ${className}`}>
      {/* Título de la sección con conteo de características */}
      {showFeatureCount && (
        <h5 className="popup-section-title">
          {displayName}
          <span className="feature-count">({features.length})</span>
        </h5>
      )}

      {/* Lista de características */}
      <div className="features-list">
        {displayedFeatures.map((feature, index) => (
          <FeatureItem
            key={`feature-${index}-${feature.id || index}`}
            feature={feature}
            index={index}
          />
        ))}
      </div>

      {/* Indicador de características ocultas */}
      {hiddenFeaturesCount > 0 && (
        <div className="more-features-notice">
          <em>... y {hiddenFeaturesCount} elemento(s) más</em>
        </div>
      )}

      {/* Separador entre capas (excepto última) */}
      {!isLast && (
        <hr className="layer-separator" />
      )}
    </div>
  );
};

/**
 * Componente para renderizar una característica individual
 * Muestra las propiedades formateadas en una tabla
 * 
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.feature - Característica a renderizar
 * @param {number} props.index - Índice de la característica
 * @returns {JSX.Element|null} Tabla con propiedades o null si no hay propiedades válidas
 */
const FeatureItem = ({ feature, index }) => {
  const properties = feature.properties || {};
  
  // Filtrar propiedades válidas para mostrar
  const validProperties = Object.entries(properties)
    .filter(([key, value]) => shouldDisplayProperty(key, value));

  if (validProperties.length === 0) {
    return null;
  }

  return (
    <div className="feature-item">
      <h6 className="feature-title">Elemento {index + 1}</h6>
      <div className="feature-properties">
        <table className="popup-table">
          <tbody>
            {validProperties.map(([key, value]) => (
              <tr key={key} className="property-row">
                <td className="property-name">
                  <strong>{key}:</strong>
                </td>
                <td className="property-value">
                  {formatPropertyValue(value, key)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Validación de tipos de propiedades
PopupContent.propTypes = {
  layerName: PropTypes.string.isRequired,
  layerInfo: PropTypes.shape({
    text: PropTypes.string
  }),
  features: PropTypes.arrayOf(
    PropTypes.shape({
      properties: PropTypes.object,
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    })
  ),
  maxFeatures: PropTypes.number,
  className: PropTypes.string,
  showFeatureCount: PropTypes.bool,
  isLast: PropTypes.bool
};

// Valores por defecto
PopupContent.defaultProps = {
  layerInfo: {},
  features: [],
  maxFeatures: DEFAULT_MAX_FEATURES,
  className: '',
  showFeatureCount: true,
  isLast: false
};

FeatureItem.propTypes = {
  feature: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired
};

export default PopupContent;