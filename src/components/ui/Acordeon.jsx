import React, { useState, memo } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Card, Accordion } from 'react-bootstrap';
import { accordionData } from './AccordionData';
import '../styles/acordeon.css';

const InfoCard = memo(({ image, title, links = [], sectionId }) => {
  const [imgError, setImgError] = useState(false);
  const navigate = useNavigate();

  const isExternal = (path) => /^https?:\/\//.test(path);

  const handleInternalClick = (link) => {
    if (!link.path || link.path.trim() === '' || !link.layerName) {
      navigate('/coming-soon', { state: { name: link.text || title } });
      return;
    }

    navigate(link.path, {
      state: {
        layerName: link.layerName,
        sectionId, // ✅ se pasa correctamente
        crs: link.crs,
      },
    });
  };

  return (
    <Card className="info-card shadow-sm">
      <Card.Img
        variant="top"
        src={imgError ? '/fallback-image.jpg' : image}
        onError={() => setImgError(true)}
        className="card-image"
        alt={title}
      />
      <Card.Body className="card-body-custom">
        <Card.Title className="card-title-custom">{title}</Card.Title>
        <div className="list-group">
          {links
            .filter((link) => link.text)
            .map((link, idx) => {
              if (isExternal(link.path) || link.target === '_blank') {
                return (
                  <a
                    key={`${sectionId}-${idx}`}
                    href={link.path}
                    className="custom-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.text}
                  </a>
                );
              }

              return (
                <button
                  key={`${sectionId}-${idx}`}
                  onClick={() => handleInternalClick(link)}
                  className="custom-link"
                >
                  {link.text}
                </button>
              );
            })}
        </div>
      </Card.Body>
    </Card>
  );
});

InfoCard.displayName = 'InfoCard';

InfoCard.propTypes = {
  image: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  links: PropTypes.array,
  sectionId: PropTypes.string.isRequired,
};

const Acordeon = memo(() => (
  <div className="principal-layout">
    <Accordion defaultActiveKey={accordionData[0]?.id || '0'} className="custom-accordion">
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
                    key={card.id || i}
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
