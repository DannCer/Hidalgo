import React from 'react';
import PropTypes from 'prop-types';

/**
 * Botón para abrir el modal del Diccionario de Datos
 * Muestra los parámetros e indicadores de calidad del agua
 */
const DiccionarioButton = ({ onClick, disabled = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`download-btn ${disabled ? 'disabled' : ''}`}
      title="Ver diccionario de datos de calidad del agua"
      aria-label="Ver diccionario de datos de calidad del agua"
    >
      <span aria-hidden="true">📖</span>
      <span>Info</span>
    </button>
  );
};

DiccionarioButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

DiccionarioButton.defaultProps = {
  disabled: false,
};

export default DiccionarioButton;
