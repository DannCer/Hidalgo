/**
 * @fileoverview Componente InfoCard del Geovisor.
 * Tarjeta de información modular que muestra contenido visual con enlaces de acción.
 * Soporta múltiples tipos de enlaces (externos, internos, dropdowns, acciones especiales)
 * e integra visualizadores modales de manera lazy-loaded.
 * 
 * @module components/ui/InfoCard
 * @version 1.0.0
 */

import React, { useState, memo, useCallback, Suspense, lazy } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom'; // Para navegación interna
import { Card, Dropdown } from 'react-bootstrap';
import '../../styles/InfoCard.css';

// ========== IMPORTS LAZY-LOADED ==========
// Carga diferida de componentes pesados para mejorar performance inicial
const VisorImagenesAcuiferos = lazy(
  () => import('../map/VisorImagenesAcuiferos')
);

const VisorInfografias = lazy(
  () => import('../map/VisorInfografias')
);

const VisorMapasFertilidad = lazy(
  () => import('../map/VisorMapasFertilidad')
);

// Imagen de fallback cuando la imagen principal no carga
const FALLBACK_IMAGE = '/fallback-image.jpg';

// ========== FUNCIONES UTILITARIAS ==========

/**
 * Determina si una URL es externa (comienza con http:// o https://)
 * @param {string} path - Ruta a verificar
 * @returns {boolean} True si es URL externa
 */
const isExternalUrl = (path) => /^https?:\/\//i.test(path);

/**
 * Determina si un enlace es externo basado en su ruta o atributo target
 * @param {Object} link - Objeto de enlace
 * @returns {boolean} True si es enlace externo
 */
const isExternalLink = (link) =>
  isExternalUrl(link.path) || link.target === '_blank';

/**
 * Determina si un enlace representa una capa GIS para el observatorio
 * @param {Object} link - Objeto de enlace
 * @returns {boolean} True si es capa GIS
 */
const isGISLayer = (link) =>
  link.layerName && link.path === '/observatorio';

// ========== COMPONENTES DE ENLACE ==========

/**
 * Componente para enlaces externos que abren en nueva pestaña
 * Memoizado para evitar re-renderizados innecesarios
 */
const ExternalLink = memo(({ link }) => (
  <a
    href={link.path}
    className="custom-link"
    target="_blank"
    rel="noopener noreferrer" // Seguridad y performance
    aria-label={`Abrir ${link.text} en nueva pestaña`}
  >
    {link.icon && <span className="me-2" aria-hidden="true">{link.icon}</span>}
    {link.text}
  </a>
));
ExternalLink.displayName = 'ExternalLink';

/**
 * Componente para botones de acción especial (abrir modales, etc.)
 */
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

/**
 * Componente para enlaces de navegación interna en la aplicación
 */
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

/**
 * Componente para menús desplegables con sub-enlaces
 * Útil para agrupar opciones relacionadas
 */
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

// ========== CUSTOM HOOK ==========

/**
 * Hook personalizado para manejar la navegación interna de tarjetas
 * Centraliza la lógica de navegación y acciones especiales
 * 
 * @param {string} sectionId - ID de la sección padre para contexto
 * @param {string} title - Título de la tarjeta para mensajes de error
 * @returns {Function} Función para manejar clics en enlaces internos
 */
const useCardNavigation = (sectionId, title) => {
  const navigate = useNavigate();

  const handleInternalClick = useCallback((link, onSpecialAction) => {
    // Primero verificar si es una acción especial
    if (link.action) {
      onSpecialAction?.(link.action);
      return;
    }

    // Validar que el enlace tenga datos suficientes para navegación GIS
    const hasValidPath = link?.path?.trim() && link.layerName;

    if (!hasValidPath) {
      // Redirigir a página "próximamente" si el enlace no es válido
      navigate('/coming-soon', { state: { name: link?.text || title } });
      return;
    }

    // Navegación GIS estándar con parámetros de capa
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

// ========== COMPONENTE PRINCIPAL ==========

/**
 * Componente principal de tarjeta de información
 * Combina imagen, título y múltiples tipos de enlaces con soporte para visualizadores modales
 * 
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {string} props.image - URL de la imagen principal de la tarjeta
 * @param {string} props.title - Título descriptivo de la tarjeta
 * @param {Array} props.links - Array de enlaces/acciones disponibles en la tarjeta
 * @param {string} props.sectionId - ID de la sección padre para contexto
 * @returns {JSX.Element} Tarjeta de información completamente interactiva
 */
const InfoCard = memo(({ image, title, links = [], sectionId }) => {
  // ========== ESTADOS LOCALES ==========
  const [imgError, setImgError] = useState(false); // Control de errores de imagen
  const [showVisor, setShowVisor] = useState(false); // Visor de acuíferos
  const [showVisorInfografias, setShowVisorInfografias] = useState(false); // Visor de infografías
  const [showVisorFertilidad, setShowVisorFertilidad] = useState(false); // Visor de fertilidad

  // ========== HOOKS Y MANEJADORES ==========
  const handleInternalClick = useCardNavigation(sectionId, title);

  /**
   * Maneja errores de carga de imagen, mostrando imagen de fallback
   */
  const handleImageError = () => setImgError(true);

  // Manejadores para abrir/cerrar visualizadores modales
  const openVisor = () => setShowVisor(true);
  const closeVisor = () => setShowVisor(false);
  const openVisorInfografias = () => setShowVisorInfografias(true);
  const closeVisorInfografias = () => setShowVisorInfografias(false);
  const openVisorFertilidad = () => setShowVisorFertilidad(true);
  const closeVisorFertilidad = () => setShowVisorFertilidad(false);

  /**
   * Maneja acciones especiales definidas en los enlaces
   * Ejecuta la función correspondiente según el tipo de acción
   * 
   * @param {string} action - Identificador de la acción a ejecutar
   */
  const handleSpecialAction = useCallback((action) => {
    if (action === 'openVisorAcuiferos') {
      openVisor();
    } else if (action === 'openVisorInfografias') {
      openVisorInfografias();
    } else if (action === 'openVisorFertilidad') {
      openVisorFertilidad();
    } else {
      console.warn('Acción no reconocida:', action);
    }
  }, []);

  // ========== CONFIGURACIÓN DE RENDERIZADO ==========
  const imageSrc = imgError ? FALLBACK_IMAGE : image;
  const filteredLinks = links.filter((link) => link?.text); // Filtrar enlaces válidos

  /**
   * Renderiza un enlace según su tipo y propiedades
   * 
   * @param {Object} link - Objeto de enlace a renderizar
   * @param {number} idx - Índice para key único
   * @returns {JSX.Element} Componente de enlace apropiado
   */
  const renderLink = (link, idx) => {
    const key = `${sectionId}-${idx}`;

    // Menú desplegable
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

    // Enlace externo
    if (isExternalLink(link)) {
      return <ExternalLink key={key} link={link} />;
    }

    // Botón de acción especial
    if (link.action) {
      return (
        <ActionButton
          key={key}
          link={link}
          onClick={() => handleSpecialAction(link.action)}
        />
      );
    }

    // Enlace interno estándar
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
      {/* Tarjeta principal */}
      <Card className="info-card shadow-sm">
        {/* Imagen con manejo de errores y lazy loading */}
        <Card.Img
          variant="top"
          src={imageSrc}
          onError={handleImageError}
          className="card-image"
          alt={`Imagen representativa de ${title}`}
          loading="lazy"
        />
        
        {/* Cuerpo de la tarjeta con título y enlaces */}
        <Card.Body className="card-body-custom">
          <Card.Title className="card-title-custom">{title}</Card.Title>
          <div className="list-group" role="list" aria-label={`Enlaces de ${title}`}>
            {filteredLinks.map(renderLink)}
          </div>
        </Card.Body>
      </Card>

      {/* ========== VISUALIZADORES MODALES (LAZY-LOADED) ========== */}
      
      {/* Visor de imágenes de acuíferos */}
      {showVisor && (
        <Suspense fallback={null}>
          <VisorImagenesAcuiferos show={showVisor} onHide={closeVisor} />
        </Suspense>
      )}

      {/* Visor de infografías */}
      {showVisorInfografias && (
        <Suspense fallback={null}>
          <VisorInfografias show={showVisorInfografias} onHide={closeVisorInfografias} />
        </Suspense>
      )}

      {/* Visor de mapas de fertilidad */}
      {showVisorFertilidad && (
        <Suspense fallback={null}>
          <VisorMapasFertilidad show={showVisorFertilidad} onHide={closeVisorFertilidad} />
        </Suspense>
      )}
    </>
  );
});

// Configuración de display name para debugging
InfoCard.displayName = 'InfoCard';

// Validación exhaustiva de tipos de propiedades
InfoCard.propTypes = {
  /** URL de la imagen principal de la tarjeta (requerida) */
  image: PropTypes.string.isRequired,
  /** Título descriptivo de la tarjeta (requerido) */
  title: PropTypes.string.isRequired,
  /** ID de la sección padre para contexto de navegación (requerido) */
  sectionId: PropTypes.string.isRequired,
  /** Array de enlaces y acciones disponibles en la tarjeta */
  links: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string.isRequired, // Texto visible del enlace
      path: PropTypes.string, // Ruta URL (para enlaces estándar)
      layerName: PropTypes.oneOfType([ // Nombre de capa GIS (string o array)
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.string)
      ]),
      crs: PropTypes.string, // Sistema de coordenadas de referencia
      geomType: PropTypes.string, // Tipo de geometría (point, line, polygon)
      action: PropTypes.string, // Identificador de acción especial
      icon: PropTypes.node, // Icono opcional junto al texto
      target: PropTypes.string, // Target del enlace (_blank, _self, etc.)
      type: PropTypes.string, // Tipo de enlace (dropdown, etc.)
      sublinks: PropTypes.array // Sub-enlaces para menús desplegables
    })
  ),
};

export default InfoCard;