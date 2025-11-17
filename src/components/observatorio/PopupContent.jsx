import React from 'react';

const PopupContent = ({ layerName, layerInfo, features, maxFeatures }) => (
  <div className="layer-popup-section">
    <h5>{layerInfo.text || layerName.split(':')[1] || layerName} ({features.length})</h5>
    {features.slice(0, maxFeatures).map((feature, idx) => (
      <div key={idx} className="feature-section">
        <h6>Elemento {idx + 1}</h6>
        <table className="popup-table">
          <tbody>
            {Object.entries(feature.properties).map(([key, value]) =>
              (key.toLowerCase() !== 'geom' && key.toLowerCase() !== 'geometry' && value != null) && (
                <tr key={key}>
                  <td className="property-name"><strong>{key}:</strong></td>
                  <td className="property-value">{String(value)}</td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    ))}
    {features.length > maxFeatures && (
      <div className="more-features">
        <em>... y {features.length - maxFeatures} elemento(s) más</em>
      </div>
    )}
  </div>
);

export default PopupContent;