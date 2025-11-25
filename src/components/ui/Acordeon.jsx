// src/components/Acordeon.jsx
import React, { memo, useState, useCallback, useMemo } from 'react';
import { Accordion, Spinner } from 'react-bootstrap';
import PropTypes from 'prop-types';
import { accordionData as defaultData } from './AccordionData';
import InfoCard from './InfoCard';
import '../styles/acordeon.css';

const Acordeon = memo(({ 
  data: externalData,
  defaultActiveSection,
  showEmptyMessage = true,
  className = '',
  flush = false,
  loading = false,
  onSectionChange
}) => {
  // Usar datos externos o default directamente, sin duplicar en estado
  const data = externalData ?? defaultData;
  
  // Calcular sección activa inicial una sola vez
  const initialSection = useMemo(() => {
    return defaultActiveSection || data?.[0]?.id || '0';
  }, [defaultActiveSection, data]);
  
  const [activeSection, setActiveSection] = useState(initialSection);

  // Memoizar el handler para evitar recreaciones
  const handleSectionChange = useCallback((sectionId) => {
    setActiveSection(sectionId);
    onSectionChange?.(sectionId);
  }, [onSectionChange]);

  // Early returns para estados especiales
  if (loading) {
    return (
      <div className="principal-layout">
        <div className="loading-state" role="status" aria-label="Cargando contenido">
          <Spinner animation="border" variant="primary" />
          <p className="loading-text">Cargando contenido...</p>
        </div>
      </div>
    );
  }

  if (!data?.length) {
    return showEmptyMessage ? (
      <div className="principal-layout">
        <p className="empty-message" role="status">
          No hay contenido disponible en este momento.
        </p>
      </div>
    ) : null;
  }

  const containerClassName = className 
    ? `principal-layout ${className}` 
    : 'principal-layout';

  return (
    <div className={containerClassName}>
      <Accordion
        activeKey={activeSection}
        onSelect={handleSectionChange}
        className="custom-accordion"
        flush={flush}
        role="region"
        aria-label="Secciones de contenido"
      >
        {data.map((section) => (
          <AccordionSection key={section.id} section={section} />
        ))}
      </Accordion>
    </div>
  );
});

// Extraer a componente separado para mejor memoización
const AccordionSection = memo(({ section }) => (
  <Accordion.Item 
    eventKey={section.id}
    className="accordion-item-custom"
    data-section-id={section.id}
  >
    <Accordion.Header className="accordion-header-custom">
      <span className="accordion-title">
        {section.title}
        {section.badge && (
          <span className="section-badge">{section.badge}</span>
        )}
      </span>
    </Accordion.Header>
    <Accordion.Body className="accordion-body-custom">
      {section.cards?.length ? (
        <div className="cards-container" role="list">
          {section.cards.map((card, index) => (
            <InfoCard
              key={card.id || `${section.id}-card-${index}`}
              image={card.image}
              title={card.title}
              links={card.links}
              sectionId={section.id}
            />
          ))}
        </div>
      ) : (
        <p className="empty-message">
          Contenido para esta sección estará disponible próximamente.
        </p>
      )}
    </Accordion.Body>
  </Accordion.Item>
));

AccordionSection.displayName = 'AccordionSection';

AccordionSection.propTypes = {
  section: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    badge: PropTypes.string,
    cards: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string,
      image: PropTypes.string,
      title: PropTypes.string,
      links: PropTypes.array
    }))
  }).isRequired
};

Acordeon.displayName = 'Acordeon';

Acordeon.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    badge: PropTypes.string,
    cards: PropTypes.array
  })),
  defaultActiveSection: PropTypes.string,
  showEmptyMessage: PropTypes.bool,
  className: PropTypes.string,
  flush: PropTypes.bool,
  loading: PropTypes.bool,
  onSectionChange: PropTypes.func,
};

export default Acordeon;