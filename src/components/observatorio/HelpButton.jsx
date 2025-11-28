import React from 'react';
import PropTypes from 'prop-types';

/**
 * Botón de ayuda (signo de interrogación) 
 * para mostrar información adicional
 */
const HelpButton = ({ onClick, title = 'Ver información' }) => {
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
      ?
    </button>
  );
};

HelpButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  title: PropTypes.string,
};

export default HelpButton;
