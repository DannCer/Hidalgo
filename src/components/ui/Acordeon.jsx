/**
 * @fileoverview Componente Acordeón del Geovisor - Observatorio Estatal Hídrico de Hidalgo.
 * 
 * Implementa un sistema de acordeón modular y reusable para organizar contenido
 * en secciones colapsables con comportamiento híbrido configurable.
 * 
 * Características principales:
 * - Permite iniciar con múltiples secciones abiertas (ej: Introducción y Contexto)
 * - Al hacer clic en otra sección, las demás se colapsan automáticamente
 * - Permite colapsar secciones haciendo clic en su header
 * - Datos externos o predefinidos desde AccordionData
 * - Carga asíncrona con estados de loading
 * - Comunicación de eventos mediante callbacks
 * - Sección especial de Introducción con componente dedicado
 * - Accesibilidad mejorada con roles ARIA
 * 
 * @module components/ui/Acordeon
 * @version 2.0.0
 * @author Observatorio Estatal Hídrico de Hidalgo
 */

import React, { memo, useState, useCallback, useMemo, useContext } from 'react';
import { Accordion, Spinner, AccordionContext } from 'react-bootstrap';
import PropTypes from 'prop-types';
import { accordionData as defaultData } from '../../data/AccordionData';
import InfoCard from './InfoCard';
import IntroductionSection from './IntroductionSection';
import '../../styles/acordeon.css';

/**
 * Botón personalizado para el toggle del acordeón.
 * Permite control total sobre el comportamiento de apertura/cierre.
 * Usa AccordionContext para determinar el estado collapsed/expanded del ícono.
 * 
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {React.ReactNode} props.children - Contenido del botón
 * @param {string} props.eventKey - Key del item del acordeón
 * @param {Function} props.onToggle - Callback personalizado para el toggle
 */
const CustomToggle = ({ children, eventKey, onToggle }) => {
  const { activeEventKey } = useContext(AccordionContext);
  
  // Determinar si esta sección está activa (puede ser array o string)
  const isActive = Array.isArray(activeEventKey) 
    ? activeEventKey.includes(eventKey)
    : activeEventKey === eventKey;

  const handleClick = () => {
    onToggle(eventKey);
  };

  return (
    <button
      type="button"
      className={`accordion-button accordion-header-custom ${!isActive ? 'collapsed' : ''}`}
      onClick={handleClick}
      aria-expanded={isActive}
    >
      {children}
    </button>
  );
};

/**
 * Componente principal de acordeón con comportamiento híbrido configurable.
 * Permite iniciar con múltiples secciones abiertas, pero al interactuar
 * se comporta como acordeón tradicional (una sección activa a la vez).
 * 
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {Array} [props.data] - Datos externos para el acordeón. Si no se proporciona,
 *                               utiliza los datos por defecto de AccordionData
 * @param {string|string[]} [props.defaultActiveSections] - ID(s) de sección(es) activa(s) por defecto.
 *                                                          Puede ser un string único o array de IDs.
 *                                                          Ej: ['introduccion', 'contexto']
 * @param {boolean} [props.showEmptyMessage=true] - Controla la visibilidad del mensaje cuando no hay datos
 * @param {string} [props.className=''] - Clases CSS adicionales para personalización
 * @param {boolean} [props.flush=false] - Aplica estilo flush (sin bordes externos) al acordeón
 * @param {boolean} [props.loading=false] - Indica estado de carga para mostrar spinner
 * @param {Function} [props.onSectionChange] - Callback ejecutado al cambiar secciones activas.
 *                                             Recibe array con IDs de secciones activas
 * @returns {JSX.Element} Componente de acordeón con secciones colapsables
 * 
 * @example
 * // Inicia con Introducción y Contexto abiertas
 * <Acordeon defaultActiveSections={['introduccion', 'contexto']} />
 * 
 * @example
 * // Uso con una sola sección activa inicial
 * <Acordeon defaultActiveSections="introduccion" />
 */
const Acordeon = memo(({
  data: externalData,
  defaultActiveSections,
  showEmptyMessage = true,
  className = '',
  flush = false,
  loading = false,
  onSectionChange
}) => {
  /**
   * Selección de fuente de datos: prioriza datos externos sobre datos por defecto.
   * Permite flexibilidad para usar el componente con diferentes conjuntos de datos.
   */
  const data = externalData ?? defaultData;

  /**
   * Calcula las secciones iniciales activas.
   * Utiliza las secciones especificadas en defaultActiveSections.
   * Normaliza el input a array para manejo consistente.
   * 
   * @returns {string[]} Array de IDs de secciones a expandir inicialmente
   */
  const initialSections = useMemo(() => {
    if (defaultActiveSections) {
      return Array.isArray(defaultActiveSections) 
        ? defaultActiveSections 
        : [defaultActiveSections];
    }
    return [];
  }, [defaultActiveSections]);

  /**
   * Estado que mantiene el array de secciones actualmente expandidas.
   * Inicia con múltiples secciones pero después se comporta como acordeón tradicional.
   */
  const [activeSections, setActiveSections] = useState(initialSections);

  /**
   * Maneja el cambio de secciones activas con comportamiento de acordeón tradicional.
   * - Si la sección clickeada está activa: la colapsa (cierra)
   * - Si la sección clickeada está inactiva: la abre y cierra todas las demás
   * Notifica cambios al componente padre mediante callback.
   * 
   * @param {string} sectionId - ID de la sección que se está toggling
   */
  const handleSectionChange = useCallback((sectionId) => {
    setActiveSections(prevSections => {
      const isCurrentlyActive = prevSections.includes(sectionId);
      
      let newSections;
      if (isCurrentlyActive) {
        // Si está activa, la cerramos (removemos del array)
        newSections = prevSections.filter(id => id !== sectionId);
      } else {
        // Si está inactiva, la abrimos y cerramos las demás (solo esta queda activa)
        newSections = [sectionId];
      }
      
      // Notificar al componente padre del cambio
      onSectionChange?.(newSections);
      return newSections;
    });
  }, [onSectionChange]);

  // =====================================================================
  // RENDERIZADO DE ESTADOS ESPECIALES
  // =====================================================================

  /**
   * Estado de carga: muestra indicador visual mientras se obtienen datos.
   * Incluye spinner animado y mensaje descriptivo con accesibilidad.
   */
  if (loading) {
    return (
      <div className="principal-layout">
        <div className="loading-state" role="status" aria-label="Cargando contenido del acordeón">
          <Spinner animation="border" variant="primary" />
          <p className="loading-text">Cargando contenido...</p>
        </div>
      </div>
    );
  }

  /**
   * Estado vacío: muestra mensaje informativo o retorna null según configuración.
   * Útil para manejar casos donde no hay datos disponibles.
   */
  if (!data?.length) {
    return showEmptyMessage ? (
      <div className="principal-layout">
        <p className="empty-message" role="status">
          No hay contenido disponible en este momento.
        </p>
      </div>
    ) : null;
  }

  // Construcción dinámica de clases CSS del contenedor
  const containerClassName = className
    ? `principal-layout ${className}`
    : 'principal-layout';

  // =====================================================================
  // RENDERIZADO PRINCIPAL
  // =====================================================================

  return (
    <div className={containerClassName}>
      {/* 
        Accordion controlado que permite iniciar con múltiples secciones abiertas.
        activeKey acepta array de IDs para controlar qué secciones están abiertas.
        alwaysOpen permite usar array en activeKey.
        El toggle se maneja con CustomToggle para control total.
      */}
      <Accordion
        activeKey={activeSections}
        className="custom-accordion"
        flush={flush}
        alwaysOpen
        role="region"
        aria-label="Menú de capas y secciones del Observatorio Hídrico"
      >
        {/* Renderizado iterativo de cada sección del acordeón */}
        {data.map((section) => (
          <AccordionSection 
            key={section.id} 
            section={section}
            onToggle={handleSectionChange}
          />
        ))}
      </Accordion>
    </div>
  );
});

/**
 * Componente interno que representa una sección individual del acordeón.
 * Detecta automáticamente si es la sección de introducción para usar
 * el componente especializado IntroductionSection.
 * 
 * Memoizado para optimizar rendimiento evitando re-renderizados
 * innecesarios cuando los datos de la sección no cambian.
 * 
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.section - Objeto con la configuración de la sección
 * @param {string} props.section.id - Identificador único de la sección
 * @param {string} props.section.title - Título mostrado en el header
 * @param {string} [props.section.badge] - Texto opcional para badge (ej: "Nuevo")
 * @param {Array} [props.section.cards] - Array de tarjetas con contenido
 * @param {Function} props.onToggle - Callback para manejar el toggle de la sección
 * @returns {JSX.Element} Item de acordeón con header y body configurados
 */
const AccordionSection = memo(({ section, onToggle }) => {
  /**
   * Detecta si la sección actual es la de Introducción.
   * La sección de introducción usa un componente especializado
   * que muestra información institucional con formato diferenciado.
   */
  const isIntroduction = section.id === 'introduccion';

  return (
    <Accordion.Item
      eventKey={section.id}
      className="accordion-item-custom"
      data-section-id={section.id}
    >
      {/* Header clickeable con CustomToggle para control total */}
      <CustomToggle eventKey={section.id} onToggle={onToggle}>
        <span className="accordion-title">
          {section.title}
          {section.badge && (
            <span className="section-badge" aria-label={`Etiqueta: ${section.badge}`}>
              {section.badge}
            </span>
          )}
        </span>
      </CustomToggle>
      
      {/* Cuerpo colapsable con contenido de tarjetas */}
      <Accordion.Body className="accordion-body-custom">
        {section.cards?.length ? (
          isIntroduction ? (
            // Componente especializado para sección de Introducción
            <IntroductionSection cards={section.cards} />
          ) : (
            // Contenedor de tarjetas estándar para demás secciones
            <div className="cards-container" role="list" aria-label={`Tarjetas de ${section.title}`}>
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
          )
        ) : (
          // Mensaje placeholder para secciones sin contenido
          <p className="empty-message" role="status">
            Contenido para esta sección estará disponible próximamente.
          </p>
        )}
      </Accordion.Body>
    </Accordion.Item>
  );
});

// =========================================================================
// CONFIGURACIÓN DE DESARROLLO Y VALIDACIÓN DE TIPOS
// =========================================================================

// Display names para identificación en React DevTools
CustomToggle.displayName = 'CustomToggle';
AccordionSection.displayName = 'AccordionSection';
Acordeon.displayName = 'Acordeon';

/**
 * Validación de PropTypes para AccordionSection.
 * Define la estructura esperada del objeto section.
 */
AccordionSection.propTypes = {
  section: PropTypes.shape({
    /** Identificador único de la sección (requerido) */
    id: PropTypes.string.isRequired,
    /** Título visible en el header del acordeón (requerido) */
    title: PropTypes.string.isRequired,
    /** Texto opcional para badge informativo */
    badge: PropTypes.string,
    /** Array de tarjetas con contenido de la sección */
    cards: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string,
      image: PropTypes.string,
      title: PropTypes.string,
      links: PropTypes.array
    }))
  }).isRequired,
  /** Callback para manejar el toggle de la sección */
  onToggle: PropTypes.func.isRequired
};

/**
 * Validación de PropTypes para CustomToggle.
 */
CustomToggle.propTypes = {
  children: PropTypes.node.isRequired,
  eventKey: PropTypes.string.isRequired,
  onToggle: PropTypes.func.isRequired
};

/**
 * Validación exhaustiva de PropTypes para Acordeon.
 * Documenta todas las props disponibles y sus tipos esperados.
 */
Acordeon.propTypes = {
  /** 
   * Datos estructurados para las secciones del acordeón.
   * Si no se proporciona, usa datos por defecto de AccordionData.
   */
  data: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    badge: PropTypes.string,
    cards: PropTypes.array
  })),
  /** 
   * ID(s) de sección(es) activa(s) por defecto.
   * Acepta string único o array de strings.
   * Requerido para definir qué secciones inician abiertas.
   */
  defaultActiveSections: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string)
  ]),
  /** Controla visibilidad del mensaje cuando no hay datos */
  showEmptyMessage: PropTypes.bool,
  /** Clases CSS adicionales para estilización personalizada */
  className: PropTypes.string,
  /** Aplica estilo flush (sin bordes) al acordeón */
  flush: PropTypes.bool,
  /** Muestra estado de carga con spinner */
  loading: PropTypes.bool,
  /** 
   * Callback ejecutado al cambiar secciones activas.
   * Recibe array con IDs de todas las secciones actualmente abiertas.
   */
  onSectionChange: PropTypes.func,
};

export default Acordeon;