import React from 'react';
import PropTypes from 'prop-types';

/**
 * Botón para abrir la tabla de atributos de una capa geográfica
 * Muestra información detallada de los elementos de la capa seleccionada
 * 
 * @component
 * @param {Function} onClick - Función callback al hacer clic
 * @param {string} [layerName] - Identificador de la capa
 * @param {string} [displayName] - Nombre amigable para mostrar
 * @param {boolean} [disabled=false] - Si el botón está deshabilitado
 * @returns {JSX.Element} Botón con icono de gráfico y texto "Tabla"
 */
const AttributeTableButton = ({ onClick, layerName, displayName, disabled = false }) => {
  // El botón se deshabilita si está explícitamente deshabilitado o no hay capa
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
      {/* Emoji de gráfico de barras para representar datos tabulares */}
      <span aria-hidden="true">📊</span>
      <span>Tabla</span>
    </button>
  );
};

AttributeTableButton.propTypes = {
  /** Función obligatoria ejecutada al hacer clic */
  onClick: PropTypes.func.isRequired,
  /** Identificador técnico de la capa (WFS layer name) */
  layerName: PropTypes.string,
  /** Nombre amigable para mostrar en tooltips y etiquetas */
  displayName: PropTypes.string,
  /** Estado de habilitación del botón */
  disabled: PropTypes.bool,
};

AttributeTableButton.defaultProps = {
  layerName: '',
  displayName: '',
  disabled: false,
};

export default AttributeTableButton;