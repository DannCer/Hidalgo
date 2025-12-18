/**
 * @fileoverview Componente IntroductionSection del Geovisor.
 * Sección especial de introducción con diseño personalizado para mostrar:
 * - Descripción del Observatorio Estatal Hídrico
 * - Tarjetas de perfil de autoridades con citas
 * - Logos institucionales (ancho completo)
 * 
 * @module components/ui/IntroductionSection
 * @version 1.1.0
 * @author Observatorio Estatal Hídrico de Hidalgo
 */

import React, { memo, useState } from 'react';
import PropTypes from 'prop-types';
import '../../styles/introductionSection.css';

// Imagen de fallback para perfiles
const FALLBACK_PROFILE = '/assets/img/fallback-profile.webp';

// Logos institucionales con clases CSS independientes
const LOGOS = [
  { src: '/assets/img/Introduccion/HidalgoMA.webp', alt: 'Secretaría de Medio Ambiente', className: 'intro-logo-Hidalgo' },
  { src: '/assets/img/Introduccion/LogoGIZ.webp', alt: 'Cooperación Alemana', className: 'intro-logo-GIZ' },
];

/**
 * Componente para mostrar una tarjeta de perfil con foto, nombre y cita
 * 
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {string} props.image - URL de la foto del perfil
 * @param {string} props.name - Nombre completo de la persona
 * @param {string} props.position - Cargo o posición
 * @param {string} props.quote - Cita o frase destacada
 */
const ProfileCard = memo(({ image, name, position, quote }) => {
  const [imgError, setImgError] = useState(false);

  const handleImageError = () => setImgError(true);

  /**
   * Renderiza el texto de posición con soporte para saltos de línea
   */
  const renderPosition = (text) => {
    if (!text) return null;
    
    // Si contiene saltos de línea, dividir y renderizar con <br />
    if (text.includes('\n')) {
      return text.split('\n').map((line, index, array) => (
        <React.Fragment key={index}>
          {line}
          {index < array.length - 1 && <br />}
        </React.Fragment>
      ));
    }
    
    return text;
  };

  return (
    <div className="intro-profile-card">
      <div className="intro-profile-image-container">
        <img
          src={imgError ? FALLBACK_PROFILE : image}
          alt={`Foto de ${name}`}
          className="intro-profile-image"
          onError={handleImageError}
          loading="lazy"
        />
      </div>
      <div className="intro-profile-info">
        <h4 className="intro-profile-name">{name}</h4>
        <p className="intro-profile-position">{renderPosition(position)}</p>
      </div>
      {quote && (
        <blockquote className="intro-profile-quote">
          <p>"{quote}"</p>
        </blockquote>
      )}
    </div>
  );
});

ProfileCard.displayName = 'ProfileCard';

ProfileCard.propTypes = {
  image: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  position: PropTypes.string.isRequired,
  quote: PropTypes.string,
};

/**
 * Componente para mostrar el panel de descripción del Observatorio
 * Soporta texto con HTML para negritas
 * 
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {string} props.text - Texto descriptivo (puede contener HTML)
 */
const DescriptionPanel = memo(({ text }) => {
  // Procesar el texto para resaltar términos clave si no tiene HTML
  const processedText = text.includes('<strong>') 
    ? text 
    : text
        .replace(/Observatorio Estatal Hídrico/g, '<strong>Observatorio Estatal Hídrico</strong>')
        .replace(/Programa Estatal Hídrico 2040 de Hidalgo/g, '<strong>Programa Estatal Hídrico 2040 de Hidalgo</strong>');

  return (
    <div className="intro-description-panel">
      <p 
        className="intro-description-text"
        dangerouslySetInnerHTML={{ __html: processedText }}
      />
    </div>
  );
});

DescriptionPanel.displayName = 'DescriptionPanel';

DescriptionPanel.propTypes = {
  text: PropTypes.string.isRequired,
};

/**
 * Componente para mostrar los logos institucionales en ancho completo
 * Cada logo puede tener su propia clase CSS para control de tamaño independiente
 * 
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.logos - Array de objetos con src, alt y className de cada logo
 */
const LogosBar = memo(({ logos = LOGOS }) => (
  <div className="intro-logos-bar">
    {logos.map((logo, index) => (
      <img
        key={index}
        src={logo.src}
        alt={logo.alt}
        className={logo.className || 'intro-logo'}
        loading="lazy"
      />
    ))}
  </div>
));

LogosBar.displayName = 'LogosBar';

LogosBar.propTypes = {
  logos: PropTypes.arrayOf(
    PropTypes.shape({
      src: PropTypes.string.isRequired,
      alt: PropTypes.string.isRequired,
      className: PropTypes.string,
    })
  ),
};

/**
 * Componente principal de la sección de Introducción
 * Procesa los datos del accordion y los muestra en el formato especializado
 * 
 * Estructura del layout:
 * - Fila superior: Descripción (izquierda) + Perfiles (derecha)
 * - Fila inferior: Logos institucionales (ancho completo)
 * 
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.cards - Array de tarjetas con datos de introducción
 */
const IntroductionSection = memo(({ cards = [] }) => {
  // Separar la descripción de los perfiles
  const descriptionCard = cards.find(card => card.id === 'descripcion');
  const profileCards = cards.filter(card => card.id !== 'descripcion' && card.image);

  /**
   * Extrae nombre y posición del título de la card
   * Soporta tanto la estructura nueva (title + position) como la antigua (title combinado)
   */
  const parseProfileData = (card) => {
    // Si ya tiene position separada, usar directamente
    if (card.position) {
      return {
        name: card.title,
        position: card.position,
        quote: card.quote || card.links?.[0]?.text || '',
      };
    }

    // Parsear título combinado (formato antiguo)
    // Usar [\s\S] en lugar de . para capturar también saltos de línea
    const title = card.title || '';
    const cargoPatterns = [
      /^(.+?)\s+(Gobernador Constitucional[\s\S]*)$/i,
      /^(.+?)\s+(Gobernador[\s\S]*)$/i,
      /^(.+?)\s+(Secretari[oa]\s+de[\s\S]*)$/i,
      /^(.+?)\s+(Director[\s\S]*)$/i,
      /^(.+?)\s+(President[ea][\s\S]*)$/i,
    ];

    for (const pattern of cargoPatterns) {
      const match = title.match(pattern);
      if (match) {
        return {
          name: match[1].trim(),
          position: match[2].trim(),
          quote: card.quote || card.links?.[0]?.text || '',
        };
      }
    }

    // Si no hay patrón, usar todo como nombre
    return {
      name: title,
      position: '',
      quote: card.quote || card.links?.[0]?.text || '',
    };
  };

  /**
   * Limpia la cita de comillas extras al inicio y final
   */
  const cleanQuote = (text) => {
    if (!text) return '';
    // Remover comillas tipográficas y normales al inicio y final
    return text.replace(/^[""'"']+|[""'"']+$/g, '').trim();
  };

  return (
    <div className="intro-section">
      {/* Contenedor principal con descripción y perfiles */}
      <div className="intro-content">
        {/* Columna izquierda: Solo Descripción */}
        {descriptionCard && (
          <div className="intro-left-column">
            <DescriptionPanel text={descriptionCard.title} />
          </div>
        )}

        {/* Tarjetas de perfil */}
        <div className="intro-profiles-container">
          {profileCards.map((card, index) => {
            const { name, position, quote } = parseProfileData(card);

            return (
              <ProfileCard
                key={card.id || index}
                image={card.image}
                name={name}
                position={position}
                quote={cleanQuote(quote)}
              />
            );
          })}
        </div>
      </div>

      {/* Logos institucionales - Ancho completo fuera del contenedor de contenido */}
      <LogosBar />
    </div>
  );
});

IntroductionSection.displayName = 'IntroductionSection';

IntroductionSection.propTypes = {
  /** Array de tarjetas con datos de introducción */
  cards: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      title: PropTypes.string.isRequired,
      image: PropTypes.string,
      links: PropTypes.arrayOf(
        PropTypes.shape({
          text: PropTypes.string,
        })
      ),
    })
  ),
};

export default IntroductionSection;