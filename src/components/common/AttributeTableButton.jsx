import React from 'react';
import PropTypes from 'prop-types';

const AttributeTableButton = ({ onClick, layerName, displayName, disabled = false }) => {
  const isDisabled = disabled || !layerName;
  const buttonText = displayName || layerName || 'capa';
  
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`download-btn primary ${isDisabled ? 'disabled' : ''}`}
      title={isDisabled ? 
        `Tabla no disponible para ${buttonText}` : 
        `Ver tabla de atributos de ${buttonText}`
      }
      aria-label={isDisabled ? 
        `Tabla no disponible para ${buttonText}` : 
        `Ver tabla de atributos de ${buttonText}`
      }
    >
      <span aria-hidden="true">📊</span>
      <span>Tabla</span>
    </button>
  );
};

AttributeTableButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  layerName: PropTypes.string,
  displayName: PropTypes.string,
  disabled: PropTypes.bool,
};

AttributeTableButton.defaultProps = {
  layerName: '',
  displayName: '',
  disabled: false,
};

export default AttributeTableButton;