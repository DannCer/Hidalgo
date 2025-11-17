import React, { useState, memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Card, Dropdown } from 'react-bootstrap';
import VisorImagenesAcuiferos from '../observatorio/VisorImagenesAcuiferos';
import '../styles/InfoCard.css';

const InfoCard = memo(({ image, title, links = [], sectionId }) => {
  const [imgError, setImgError] = useState(false);
  const [showVisorAcuiferos, setShowVisorAcuiferos] = useState(false);
  const navigate = useNavigate();

  const isExternal = useCallback((path) => /^https?:\/\//i.test(path), []);

  const handleSpecialAction = useCallback((link) => {
    switch (link.action) {
      case 'openVisorAcuiferos':
        setShowVisorAcuiferos(true);
        break;
      default:
        console.warn('Acción no reconocida:', link.action);
    }
  }, []);

  const handleInternalClick = useCallback((link) => {
    if (link.action) {
      handleSpecialAction(link);
      return;
    }

    const isValid = link?.path?.trim() && link.layerName;

    if (!isValid) {
      navigate('/coming-soon', { state: { name: link?.text || title } });
      return;
    }

    navigate(link.path, {
      state: {
        layerName: link.layerName,
        sectionId,
        crs: link.crs || null,
      },
    });
  }, [handleSpecialAction, navigate, sectionId, title]);

  const renderLink = useCallback((link, idx) => {
    const key = `${sectionId}-${idx}`;

    if (isExternal(link.path) || link.target === '_blank') {
      return (
        <a
          key={key}
          href={link.path}
          className="custom-link"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Abrir ${link.text} en nueva pestaña`}
        >
          {link.icon && <span className="me-2" aria-hidden="true">{link.icon}</span>}
          {link.text}
        </a>
      );
    }

    if (link.action) {
      return (
        <button
          key={key}
          onClick={() => handleSpecialAction(link)}
          className="custom-link special-action-link"
          aria-label={`Ejecutar acción: ${link.text}`}
        >
          {link.icon && <span className="me-2" aria-hidden="true">{link.icon}</span>}
          {link.text}
        </button>
      );
    }

    return (
      <button
        key={key}
        onClick={() => handleInternalClick(link)}
        className="custom-link"
        aria-label={`Navegar a ${link.text}`}
      >
        {link.text}
      </button>
    );
  }, [sectionId, isExternal, handleSpecialAction, handleInternalClick]);

  const renderDropdownLink = useCallback((link, idx) => {
    const key = `${sectionId}-dropdown-${idx}`;

    return (
      <Dropdown key={key} className="custom-dropdown" drop="down">
        <Dropdown.Toggle 
          variant="link" 
          className="custom-link dropdown-toggle-custom"
          id={`dropdown-${key}`}
          aria-label={`Desplegar menú de ${link.text}`}
        >
          {link.icon && <span className="me-2" aria-hidden="true">{link.icon}</span>}
          <span className="dropdown-text">{link.text}</span>
        </Dropdown.Toggle>

        <Dropdown.Menu className="dropdown-menu-custom" align="start">
          {link.sublinks?.map((sublink, subIdx) => (
            <Dropdown.Item
              key={`${key}-${subIdx}`}
              href={sublink.path}
              target={sublink.target || '_self'}
              rel={sublink.target === '_blank' ? 'noopener noreferrer' : undefined}
              className="dropdown-item-custom"
              aria-label={sublink.text}
            >
              {sublink.text}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    );
  }, [sectionId]);

  const handleImageError = useCallback(() => setImgError(true), []);

  return (
    <>
      <Card className="info-card shadow-sm">
        <Card.Img
          variant="top"
          src={imgError ? '/fallback-image.jpg' : image}
          onError={handleImageError}
          className="card-image"
          alt={`Imagen representativa de ${title}`}
          loading="lazy"
        />
        <Card.Body className="card-body-custom">
          <Card.Title className="card-title-custom">{title}</Card.Title>
          <div className="list-group" role="list">
            {links
              .filter((l) => l?.text)
              .map((link, idx) => (
                link.type === 'dropdown' 
                  ? renderDropdownLink(link, idx)
                  : renderLink(link, idx)
              ))
            }
          </div>
        </Card.Body>
      </Card>

      <VisorImagenesAcuiferos 
        show={showVisorAcuiferos}
        onHide={() => setShowVisorAcuiferos(false)}
      />
    </>
  );
});

InfoCard.displayName = 'InfoCard';

InfoCard.propTypes = {
  image: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  links: PropTypes.arrayOf(PropTypes.shape({
    text: PropTypes.string.isRequired,
    path: PropTypes.string,
    layerName: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.arrayOf(PropTypes.string)
    ]),
    crs: PropTypes.string,
    geomType: PropTypes.string,
    action: PropTypes.string,
    icon: PropTypes.node,
    target: PropTypes.string,
    type: PropTypes.string,
    sublinks: PropTypes.array
  })),
  sectionId: PropTypes.string.isRequired,
};

export default InfoCard;