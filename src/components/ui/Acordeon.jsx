// src/components/Acordeon.jsx
import React, { memo } from 'react';
import { Accordion } from 'react-bootstrap';
import { accordionData } from './AccordionData';
import InfoCard from './InfoCard';
import '../styles/acordeon.css';

const Acordeon = memo(() => (
  <div className="principal-layout">
    <Accordion
      defaultActiveKey={accordionData[0]?.id || '0'}
      className="custom-accordion"
    >
      {accordionData.map((section) => (
        <Accordion.Item eventKey={section.id} key={section.id}>
          <Accordion.Header>
            <span className="accordion-title">{section.title}</span>
          </Accordion.Header>

          <Accordion.Body>
            {section.cards?.length ? (
              <div className="cards-container">
                {section.cards.map((card, i) => (
                  <InfoCard
                    key={card.id || `${section.id}-${i}`}
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
      ))}
    </Accordion>
  </div>
));

export default Acordeon;