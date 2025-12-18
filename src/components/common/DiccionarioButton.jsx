import React from 'react';
import PropTypes from 'prop-types';

/**
 * Botón para acceder al diccionario de datos de calidad del agua
 * Proporciona acceso rápido a la documentación/metadatos de los datos mostrados
 * 
 * @component
 * @param {Function} onClick - Función callback al hacer clic
 * @param {boolean} [disabled=false] - Si el botón está deshabilitado
 * @returns {JSX.Element} Botón con icono de libro e indicador "Info"
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
      {/* Emoji de libro para representar documentación */}
      <span aria-hidden="true">📖</span>
      <span>Info</span>
    </button>
  );
};

DiccionarioButton.propTypes = {
  /** Función obligatoria ejecutada al hacer clic en el botón */
  onClick: PropTypes.func.isRequired,
  /** Estado de habilitación del botón */
  disabled: PropTypes.bool,
};

DiccionarioButton.defaultProps = {
  disabled: false,
};

export default DiccionarioButton;