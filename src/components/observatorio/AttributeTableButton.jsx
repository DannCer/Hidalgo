import React from 'react';

const AttributeTableButton = ({ onClick, layerName, displayName }) => {
  return (
    <button
      onClick={onClick}
      disabled={!layerName}
      className="download-btn primary" 
      title={`Ver tabla de atributos de ${displayName || layerName}`}
      aria-label={`Ver tabla de atributos de ${displayName || layerName}`}
    >
      <span aria-hidden="true">📊 Ver Tabla</span>
    </button>
  );
};

export default AttributeTableButton;