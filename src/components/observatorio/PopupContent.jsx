import React from 'react';
import PropTypes from 'prop-types';

// Constants
const EXCLUDED_PROPERTIES = ['geom', 'geometry'];
const DEFAULT_MAX_FEATURES = 15;

// Utility functions
const formatPropertyValue = (value) => {
  if (value == null) return '';
  
  const stringValue = String(value).trim();
  
  // Format numbers with commas
  if (!isNaN(value) && stringValue !== '') {
    return Number(value).toLocaleString();
  }
  
  // Capitalize first letter for strings
  if (stringValue.length > 0) {
    return stringValue.charAt(0).toUpperCase() + stringValue.slice(1);
  }
  
  return stringValue;
};

const getDisplayName = (layerName, layerInfo) => {
  return layerInfo?.text || layerName.split(':')[1] || layerName;
};

const shouldDisplayProperty = (key, value) => {
  const lowerKey = key.toLowerCase();
  return !EXCLUDED_PROPERTIES.includes(lowerKey) && 
         value != null && 
         String(value).trim() !== '';
};

const PopupContent = ({ 
  layerName, 
  layerInfo = {}, 
  features = [], 
  maxFeatures = DEFAULT_MAX_FEATURES,
  className = '',
  showFeatureCount = true
}) => {
  // Early return for empty features
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
      {/* Header */}
      {showFeatureCount && (
        <h5 className="popup-section-title">
          {displayName} 
          <span className="feature-count">({features.length})</span>
        </h5>
      )}
      
      {/* Features List */}
      <div className="features-list">
        {displayedFeatures.map((feature, index) => (
          <FeatureItem 
            key={`feature-${index}-${feature.id || index}`}
            feature={feature}
            index={index}
          />
        ))}
      </div>

      {/* Hidden Features Notice */}
      {hiddenFeaturesCount > 0 && (
        <div className="more-features-notice">
          <em>... y {hiddenFeaturesCount} elemento(s) más</em>
        </div>
      )}
    </div>
  );
};

// Sub-component for individual feature
const FeatureItem = ({ feature, index }) => {
  const properties = feature.properties || {};
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
                  {formatPropertyValue(value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// PropTypes
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
  showFeatureCount: PropTypes.bool
};

PopupContent.defaultProps = {
  layerInfo: {},
  features: [],
  maxFeatures: DEFAULT_MAX_FEATURES,
  className: '',
  showFeatureCount: true
};

FeatureItem.propTypes = {
  feature: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired
};

export default PopupContent;