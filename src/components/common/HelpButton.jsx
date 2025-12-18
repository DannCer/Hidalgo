import React from 'react';
import PropTypes from 'prop-types';

/**
 * Botón de ayuda genérico para mostrar información contextual
 * Previene la propagación de eventos para no interferir con otros controles
 * 
 * @component
 * @param {Function} onClick - Función callback al hacer clic
 * @param {string} [title='Ver información'] - Texto del tooltip
 * @returns {JSX.Element} Botón circular con signo de interrogación
 */
const HelpButton = ({ onClick, title = 'Ver información' }) => {
  /**
   * Maneja el clic previniendo la propagación del evento
   * @param {Event} e - Evento de clic
   */
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className="help-btn"
      title={title}
      aria-label={title}
      type="button"
    >
      {/* Signo de interrogación como indicador universal de ayuda */}
      ?
    </button>
  );
};

HelpButton.propTypes = {
  /** Función obligatoria ejecutada al hacer clic */
  onClick: PropTypes.func.isRequired,
  /** Texto para tooltip y etiqueta ARIA */
  title: PropTypes.string,
};

export default HelpButton;