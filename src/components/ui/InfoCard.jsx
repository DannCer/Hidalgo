// src/components/ui/InfoCard.jsx
import React, { useState, memo, useCallback, Suspense, lazy } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Card, Dropdown } from 'react-bootstrap';
import '../styles/InfoCard.css';

// Lazy load del modal
const VisorImagenesAcuiferos = lazy(
  () => import('../observatorio/VisorImagenesAcuiferos')
);

// ============================================
// Utilidades (fuera del componente)
// ============================================
const FALLBACK_IMAGE = '/fallback-image.jpg';

const isExternalUrl = (path) => /^https?:\/\//i.test(path);

const isExternalLink = (link) =>
  isExternalUrl(link.path) || link.target === '_blank';

const isGISLayer = (link) =>
  link.layerName && link.path === '/observatorio';

// ============================================
// Subcomponentes memoizados
// ============================================
const ExternalLink = memo(({ link }) => (
  <a
    href={link.path}
    className="custom-link"
    target="_blank"
    rel="noopener noreferrer"
    aria-label={`Abrir ${link.text} en nueva pestaña`}
  >
    {link.icon && <span className="me-2" aria-hidden="true">{link.icon}</span>}
    {link.text}
  </a>
));
ExternalLink.displayName = 'ExternalLink';

const ActionButton = memo(({ link, onClick }) => (
  <button
    onClick={onClick}
    className="custom-link special-action-link"
    aria-label={`Ejecutar acción: ${link.text}`}
  >
    {link.icon && <span className="me-2" aria-hidden="true">{link.icon}</span>}
    {link.text}
  </button>
));
ActionButton.displayName = 'ActionButton';

const InternalButton = memo(({ link, onClick }) => (
  <button
    onClick={onClick}
    className="custom-link"
    aria-label={`Navegar a ${link.text}`}
  >
    {link.icon && <span className="me-2" aria-hidden="true">{link.icon}</span>}
    {link.text}
  </button>
));
InternalButton.displayName = 'InternalButton';

const DropdownLink = memo(({ link, sectionId, idx, onInternalClick }) => {
  const dropdownKey = `${sectionId}-dropdown-${idx}`;

  return (
    <Dropdown className="custom-dropdown" drop="down">
      <Dropdown.Toggle
        variant="link"
        className="custom-link dropdown-toggle-custom"
        id={`dropdown-${dropdownKey}`}
        aria-label={`Desplegar menú de ${link.text}`}
      >
        {link.icon && <span className="me-2" aria-hidden="true">{link.icon}</span>}
        <span className="dropdown-text">{link.text}</span>
      </Dropdown.Toggle>

      <Dropdown.Menu className="dropdown-menu-custom" align="start">
        {link.sublinks?.map((sublink, subIdx) => {
          const isGIS = isGISLayer(sublink);
          return (
            <Dropdown.Item
              key={`${dropdownKey}-${subIdx}`}
              className="dropdown-item-custom"
              aria-label={sublink.text}
              onClick={isGIS ? () => onInternalClick(sublink) : undefined}
              href={isGIS ? undefined : sublink.path}
              target={isGIS ? undefined : (sublink.target || '_self')}
              rel={!isGIS && sublink.target === '_blank' ? 'noopener noreferrer' : undefined}
            >
              {sublink.text}
            </Dropdown.Item>
          );
        })}
      </Dropdown.Menu>
    </Dropdown>
  );
});
DropdownLink.displayName = 'DropdownLink';

// ============================================
// Custom Hook simplificado
// ============================================
const useCardNavigation = (sectionId, title) => {
  const navigate = useNavigate();

  const handleInternalClick = useCallback((link, onSpecialAction) => {
    if (link.action) {
      onSpecialAction?.(link.action);
      return;
    }

    const hasValidPath = link?.path?.trim() && link.layerName;

    if (!hasValidPath) {
      navigate('/coming-soon', { state: { name: link?.text || title } });
      return;
    }

    navigate(link.path, {
      state: {
        layerName: link.layerName,
        sectionId,
        crs: link.crs || null,
        geomType: link.geomType || null,
      },
    });
  }, [navigate, sectionId, title]);

  return handleInternalClick;
};

// ============================================
// Componente principal
// ============================================
const InfoCard = memo(({ image, title, links = [], sectionId }) => {
  const [imgError, setImgError] = useState(false);
  const [showVisor, setShowVisor] = useState(false);

  const handleInternalClick = useCardNavigation(sectionId, title);

  const handleImageError = () => setImgError(true);
  const openVisor = () => setShowVisor(true);
  const closeVisor = () => setShowVisor(false);

  const handleSpecialAction = useCallback((action) => {
    if (action === 'openVisorAcuiferos') {
      openVisor();
    } else {
      console.warn('Acción no reconocida:', action);
    }
  }, []);

  const imageSrc = imgError ? FALLBACK_IMAGE : image;
  const filteredLinks = links.filter((link) => link?.text);

  const renderLink = (link, idx) => {
    const key = `${sectionId}-${idx}`;

    if (link.type === 'dropdown') {
      return (
        <DropdownLink
          key={key}
          link={link}
          sectionId={sectionId}
          idx={idx}
          onInternalClick={(sublink) => handleInternalClick(sublink, handleSpecialAction)}
        />
      );
    }

    if (isExternalLink(link)) {
      return <ExternalLink key={key} link={link} />;
    }

    if (link.action) {
      return (
        <ActionButton
          key={key}
          link={link}
          onClick={() => handleSpecialAction(link.action)}
        />
      );
    }

    return (
      <InternalButton
        key={key}
        link={link}
        onClick={() => handleInternalClick(link, handleSpecialAction)}
      />
    );
  };

  return (
    <>
      <Card className="info-card shadow-sm">
        <Card.Img
          variant="top"
          src={imageSrc}
          onError={handleImageError}
          className="card-image"
          alt={`Imagen representativa de ${title}`}
          loading="lazy"
        />
        <Card.Body className="card-body-custom">
          <Card.Title className="card-title-custom">{title}</Card.Title>
          <div className="list-group" role="list" aria-label={`Enlaces de ${title}`}>
            {filteredLinks.map(renderLink)}
          </div>
        </Card.Body>
      </Card>

      {showVisor && (
        <Suspense fallback={null}>
          <VisorImagenesAcuiferos show={showVisor} onHide={closeVisor} />
        </Suspense>
      )}
    </>
  );
});

InfoCard.displayName = 'InfoCard';

InfoCard.propTypes = {
  image: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  sectionId: PropTypes.string.isRequired,
  links: PropTypes.arrayOf(
    PropTypes.shape({
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
    })
  ),
};

export default InfoCard;