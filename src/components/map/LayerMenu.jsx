/**
 * @fileoverview Menú de capas del visor de mapas.
 * 
 * Panel lateral arrastrable que muestra todas las capas disponibles
 * organizadas por secciones temáticas. Permite activar/desactivar
 * capas, ver tablas de atributos y descargar datos.
 * 
 * @module components/map/LayerMenu
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Accordion, Form } from 'react-bootstrap';
import Draggable from 'react-draggable';
import { accordionData } from '../../data/AccordionData';
import AttributeTableButton from '../common/AttributeTableButton';
import DownloadButton from '../common/DownloadButton';
import DiccionarioButton from '../common/DiccionarioButton';
import Timeline from './Timeline';
import DiccionarioDatosModal from './DiccionarioDatosModal';
import '../../styles/layerMenu.css';
import '../../styles/diccionarioDatos.css';

// ============================================================================
// CONSTANTES
// ============================================================================

/** @constant {string[]} Capas que siempre están activas */
const FIXED_LAYERS = ['Hidalgo:00_Estado'];

/** @constant {string} Nombre de la capa de sequías */
const SEQUIA_LAYER = 'Hidalgo:04_sequias';

/** @constant {string[]} Tarjetas excluidas del menú de capas */
const EXCLUDED_CARDS = [
  'Marco legal',
  'Sitios de interés',
  'Programas de ordenamiento ecológico territorial',
  'Programa estatal hídrico',
  'Inspección y vigilancia',
  'Acuíferos de Hidalgo',
  'Gestión hídrica municipal',
  'Proceso para la integración del Programa Hídrico del Estado de Hidalgo',
  'Infografías de fertilidad'
];

// ============================================================================
// HOOKS PERSONALIZADOS
// ============================================================================

/**
 * Hook para manejar el resaltado de capas en el menú.
 * Cuando se selecciona una capa desde el mapa, resalta el item correspondiente.
 * 
 * @param {string|string[]|null} highlightLayer - Capa(s) a resaltar
 * @param {Object} layerToItemMap - Mapa de capas a items del menú
 * @param {string} activeSection - Sección activa del acordeón
 * @param {Function} setActiveSection - Setter para cambiar sección
 * @returns {string|null} ID del item resaltado o null
 */
const useLayerHighlight = (highlightLayer, layerToItemMap, activeSection, setActiveSection) => {
  const [highlightedItem, setHighlightedItem] = useState(null);
  const highlightProcessedRef = useRef(null);

  useEffect(() => {
    if (!highlightLayer) return;

    const layerKey = Array.isArray(highlightLayer) ? highlightLayer.join(',') : highlightLayer;

    // Evitar procesar el mismo highlight múltiples veces
    if (highlightProcessedRef.current === layerKey) return;
    highlightProcessedRef.current = layerKey;

    // Buscar el item correspondiente a la capa
    const findTarget = () => {
      const names = Array.isArray(highlightLayer) ? highlightLayer : [highlightLayer];
      for (const layerName of names) {
        const match = layerToItemMap[layerName];
        if (match) return match;
      }
      return null;
    };

    const target = findTarget();
    if (!target) {
      console.warn('⚠️ No se encontró target para capa:', highlightLayer);
      return;
    }

    // Cambiar a la sección correcta si es necesario
    if (target.sectionId !== activeSection) {
      setActiveSection(target.sectionId);
    }

    // Activar el resaltado
    setHighlightedItem(target.uniqueId);

    // Quitar el resaltado después de 3 segundos
    const timer = setTimeout(() => {
      setHighlightedItem(null);
      highlightProcessedRef.current = null;
    }, 3000);

    return () => clearTimeout(timer);
  }, [highlightLayer, layerToItemMap, activeSection, setActiveSection]);

  return highlightedItem;
};

/**
 * Hook que procesa y filtra las secciones del acordeón.
 * Excluye tarjetas no relevantes y enlaces externos.
 * 
 * @returns {Array} Secciones procesadas con filteredCards
 */
const useProcessedSections = () => {
  /** Filtra tarjetas excluidas */
  const filterCard = useCallback((card) => {
    return !EXCLUDED_CARDS.includes(card.title?.trim?.() || '');
  }, []);

  /** Filtra enlaces externos y acciones especiales */
  const filterLink = useCallback((link) => {
    // Excluir acciones especiales (visores de imágenes, etc.)
    if (link.action) {
      return false;
    }
    // Para dropdowns, verificar sublinks
    if (link.type === 'dropdown') {
      return link.sublinks?.some(sublink =>
        sublink.layerName && sublink.path === '/observatorio'
      );
    }
    // Excluir enlaces externos y PDFs
    return !(link.path && (link.path.startsWith('http') || link.path.endsWith('.pdf')));
  }, []);

  return useMemo(() => {
    return accordionData
      .filter(section => section.id !== 'programa-hidrico' && section.id !== 'introduccion')
      .map(section => {
        const filteredCards = (section.cards || [])
          .filter(filterCard)
          .map((card, cardIndex) => {
            const allLayersAndLinks = [];

            (card.links || []).forEach((link, linkIndex) => {
              if (link.type === 'dropdown' && link.sublinks) {
                // Procesar sublinks de dropdowns
                link.sublinks
                  .filter(sublink => sublink.layerName && sublink.path === '/observatorio')
                  .forEach((sublink, subIdx) => {
                    allLayersAndLinks.push({
                      ...sublink,
                      uniqueId: `${section.id}-${cardIndex}-${linkIndex}-${subIdx}`,
                    });
                  });
              } else if (filterLink(link)) {
                // Procesar links normales
                allLayersAndLinks.push({
                  ...link,
                  uniqueId: `${section.id}-${cardIndex}-${linkIndex}`,
                });
              }
            });

            return {
              ...card,
              filteredLinks: allLayersAndLinks,
              originalCardIndex: cardIndex,
            };
          });

        return {
          ...section,
          filteredCards,
        };
      });
  }, [filterCard, filterLink]);
};

/**
 * Hook que crea un mapa de nombres de capa a items del menú.
 * Facilita la búsqueda inversa para el resaltado.
 * 
 * @param {Array} processedSections - Secciones procesadas
 * @returns {Object} Mapa layerName -> {uniqueId, sectionId}
 */
const useLayerMapping = (processedSections) => {
  return useMemo(() => {
    const map = {};

    processedSections.forEach((section) => {
      section.filteredCards.forEach((card) => {
        card.filteredLinks.forEach((link) => {
          if (!link.layerName) return;

          const layers = Array.isArray(link.layerName) ? link.layerName : [link.layerName];
          layers.forEach((layerName) => {
            if (layerName && !map[layerName]) {
              map[layerName] = {
                uniqueId: link.uniqueId,
                sectionId: section.id,
              };
            }
          });
        });
      });
    });

    return map;
  }, [processedSections]);
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Menú de capas del visor de mapas.
 * 
 * Panel lateral arrastrable con:
 * - Acordeón de secciones temáticas
 * - Toggle de capas con checkboxes
 * - Botones de tabla de atributos y descarga
 * - Timeline para capas temporales (sequías)
 * - Resaltado de capas seleccionadas
 * 
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {Function} props.onLayerToggle - Callback al activar/desactivar capa
 * @param {Object} props.activeLayers - Mapa de capas activas
 * @param {string} [props.sectionIndex] - Índice de sección inicial
 * @param {string} [props.sectionId] - ID de sección inicial
 * @param {Function} props.onShowTable - Callback para mostrar tabla
 * @param {Array} [props.sequiaQuincenaList=[]] - Lista de quincenas disponibles
 * @param {string} [props.sequiaQuincena] - Quincena activa de sequías
 * @param {Object} [props.timelineConfigs={}] - Configuraciones de timeline
 * @param {Function} props.onTimelineChange - Callback al cambiar timeline
 * @param {Set} [props.loadingLayers] - Capas en proceso de carga
 * @param {string|string[]|null} [props.highlightLayer=null] - Capa a resaltar
 * @returns {JSX.Element} Menú de capas
 */
const LayerMenu = ({
  onLayerToggle,
  activeLayers,
  sectionIndex,
  sectionId,
  onShowTable,
  sequiaQuincenaList = [],
  sequiaQuincena,
  timelineConfigs = {},
  onTimelineChange,
  loadingLayers = new Set(),
  highlightLayer = null,
}) => {
  // ==========================================================================
  // REFS Y ESTADOS
  // ==========================================================================
  
  /** @type {React.RefObject<HTMLDivElement>} Ref del contenedor principal */
  const containerRef = useRef(null);
  
  /** @type {React.MutableRefObject<Object>} Refs de los items para scroll */
  const itemRefs = useRef({});

  /** @type {[boolean, Function]} Si el menú está colapsado */
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  /** @type {[boolean, Function]} Si se muestra el modal de diccionario */
  const [showDiccionario, setShowDiccionario] = useState(false);
  
  /** @type {[Object, Function]} Estado local de checkboxes (optimistic UI) */
  const [localChecked, setLocalChecked] = useState({});
  
  /** @type {[string, Function]} Sección activa del acordeón */
  const [activeSection, setActiveSection] = useState(
    sectionIndex || sectionId || accordionData[0]?.id || '0'
  );

  // ==========================================================================
  // HOOKS PERSONALIZADOS
  // ==========================================================================
  
  /** Secciones procesadas y filtradas */
  const processedSections = useProcessedSections();
  
  /** Mapa de capas a items del menú */
  const layerToItemMap = useLayerMapping(processedSections);
  
  /** Item actualmente resaltado */
  const highlightedItem = useLayerHighlight(highlightLayer, layerToItemMap, activeSection, setActiveSection);

  // ==========================================================================
  // FUNCIONES AUXILIARES
  // ==========================================================================

  /**
   * Convierte un layerName a array.
   * @param {string|string[]} layerName - Nombre(s) de capa
   * @returns {string[]} Array de nombres
   */
  const getLayersArray = useCallback(
    (layerName) => (Array.isArray(layerName) ? layerName : [layerName]),
    []
  );

  /**
   * Verifica si alguna capa del array es fija.
   * @param {string|string[]} layerName - Nombre(s) de capa
   * @returns {boolean} True si alguna es fija
   */
  const isFixedLayer = useCallback(
    (layerName) => getLayersArray(layerName).some((layer) => FIXED_LAYERS.includes(layer)),
    [getLayersArray]
  );

  /**
   * Verifica si alguna capa del array está activa.
   * @param {string|string[]} layerName - Nombre(s) de capa
   * @returns {boolean} True si alguna está activa
   */
  const isAnyLayerActive = useCallback(
    (layerName) => getLayersArray(layerName).some((name) => name && !!activeLayers[name]),
    [getLayersArray, activeLayers]
  );

  /**
   * Obtiene las capas agrupadas para descarga.
   * Combina capas relacionadas (ej: sitios de monitoreo superficial y subterráneo).
   * @param {Object} link - Configuración del enlace
   * @returns {{layers: string[], displayName: string}} Capas y nombre para descarga
   */
  const getGroupedDownloadLayers = useCallback(
    (link) => {
      const text = link.text?.toLowerCase() || '';
      const layerName = link.layerName?.toString().toLowerCase() || '';

      // Agrupar sitios de monitoreo
      if (text.includes('sitios de monitoreo')) {
        return {
          layers: ['Hidalgo:01_spsitios', 'Hidalgo:01_sbsitios'],
          displayName: 'Sitios_Monitoreo',
        };
      }
      // Agrupar parámetros de calidad del agua
      if (text.includes('parámetros e indicadores') || text.includes('parametros e indicadores')) {
        return {
          layers: ['Hidalgo:01_sbcalidadagua', 'Hidalgo:01_spcalidadagua'],
          displayName: 'Parametros_IndicadoresCA',
        };
      }

      // Verificar si es capa de sequías
      const isSequias = text.includes('sequía') || text.includes('sequia') ||
                       layerName.includes('sequia');

      if (isSequias) {
        return {
          layers: [SEQUIA_LAYER],
          displayName: 'Sequias',
        };
      }

      return {
        layers: getLayersArray(link.layerName),
        displayName: link.text
      };
    },
    [getLayersArray]
  );

  // ==========================================================================
  // EFECTOS
  // ==========================================================================

  /** Sincronizar estado local de checkboxes con capas activas */
  useEffect(() => {
    const updatedChecked = Object.keys(activeLayers).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setLocalChecked(updatedChecked);
  }, [activeLayers]);

  /** Actualizar sección activa cuando cambia sectionId */
  useEffect(() => {
    if (sectionId) setActiveSection(sectionId);
  }, [sectionId]);

  /** Scroll automático al item resaltado */
  useEffect(() => {
    if (!highlightedItem) return;

    const element = itemRefs.current[highlightedItem];
    if (element) {
      const scrollTimer = setTimeout(() => {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }, 100);
      return () => clearTimeout(scrollTimer);
    }
  }, [highlightedItem]);

  // ==========================================================================
  // FUNCIONES DE RENDERIZADO
  // ==========================================================================

  /**
   * Formatea una fecha para mostrar en el timeline.
   * @param {string} dateStr - Fecha en formato ISO
   * @param {string} formatType - Tipo de formato ('quincena', 'month', 'year')
   * @returns {string} Fecha formateada
   */
  const formatDateLabel = (dateStr, formatType = 'quincena') => {
    if (!dateStr) return "";

    const meses = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    try {
      const cleanDate = dateStr.toString().replace('Z', '').trim();

      switch (formatType) {
        case 'quincena':
          const [year, month, day] = cleanDate.split("-");
          const mes = meses[parseInt(month) - 1];
          const quincena = parseInt(day) <= 15 ? "1ª quincena" : "2ª quincena";
          return `${mes} · ${quincena} · ${year}`;
        case 'month':
          const [y, m] = cleanDate.split("-");
          return `${meses[parseInt(m) - 1]} ${y}`;
        case 'year':
          return cleanDate;
        default:
          return cleanDate;
      }
    } catch (error) {
      return dateStr;
    }
  };

  /**
   * Renderiza el componente Timeline para una capa temporal.
   * @param {string} layerName - Nombre de la capa
   * @returns {JSX.Element} Componente Timeline
   */
  const renderTimeline = (layerName) => {
    const config = timelineConfigs[layerName];

    if (!config?.timePoints?.length) {
      return (
        <div className="timeline-box">
          <div className="text-muted small">Cargando línea de tiempo...</div>
        </div>
      );
    }

    return (
      <div className="timeline-box">
        <div className="timeline-header">
          <small className="text-muted">Selecciona quincena:</small>
        </div>
        <Timeline
          timePoints={config.timePoints}
          currentTime={config.currentValue || config.timePoints[0]}
          onTimeChange={(value) => onTimelineChange(layerName, value)}
          formatLabel={(value) => formatDateLabel(value, config.formatType)}
          type={config.type}
        />
      </div>
    );
  };

  /**
   * Renderiza un item de capa individual.
   * @param {Object} link - Configuración de la capa
   * @param {number} cardIndex - Índice de la tarjeta
   * @param {Object} section - Sección padre
   * @param {number} linkIndex - Índice del enlace
   * @returns {JSX.Element} Item de capa
   */
  const renderLayerItem = (link, cardIndex, section, linkIndex) => {
    const itemKey = link.uniqueId;
    const { layers, displayName } = getGroupedDownloadLayers(link);
    const fixed = isFixedLayer(link.layerName);
    const active = isAnyLayerActive(link.layerName);
    const isDisabled = !link.layerName || !link.crs || !link.geomType;
    const isLoading = layers.some(l => loadingLayers.has(l));
    const isSequiasLayer = layers.includes(SEQUIA_LAYER);
    const hasTimeline = isSequiasLayer && timelineConfigs[SEQUIA_LAYER];
    const isHighlighted = highlightedItem === itemKey;

    /**
     * Maneja el toggle del checkbox.
     * @param {boolean} checked - Nuevo estado
     */
    const handleToggle = (checked) => {
      if (!fixed && !isDisabled && !isLoading) {
        // Actualización optimista del estado local
        setLocalChecked(prev => ({
          ...prev,
          [layers.join(',')]: checked
        }));
        onLayerToggle(
          {
            ...link,
            layerName: layers,
            currentQuincena: isSequiasLayer ? sequiaQuincena : null
          },
          checked
        );
      }
    };

    // Verificar si es capa de calidad del agua
    const isCalidadAgua = layers.some(l => l && l.includes('calidadagua'));

    return (
      <div
        key={linkIndex}
        ref={el => {
          if (el) itemRefs.current[itemKey] = el;
        }}
        className={`layermenu-item
          ${isDisabled ? 'disabled' : ''}
          ${active ? 'layermenu-active' : ''}
          ${isHighlighted ? 'layermenu-highlighted' : ''}
          ${isLoading ? 'layermenu-loading' : ''}
        `}
      >
        {/* Header con checkbox */}
        <div className="layermenu-header-content">
          <Form.Check
            type="checkbox"
            id={`layer-${itemKey}`}
            label={
              <span>
                {link.text}
                {isLoading && (
                  <span className="ms-2 spinner-border spinner-border-sm text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </span>
                )}
              </span>
            }
            disabled={fixed || isDisabled || isLoading}
            checked={fixed || active || !!localChecked[layers.join(',')]}
            onChange={(e) => handleToggle(e.target.checked)}
          />
        </div>

        {/* Botones de acción */}
        {!isDisabled && (
          <div className="layermenu-buttons">
            {/* Botón de diccionario solo para calidad del agua */}
            {isCalidadAgua && (
              <DiccionarioButton onClick={() => setShowDiccionario(true)} />
            )}
            <AttributeTableButton
              layerName={layers[0]}
              displayName={displayName}
              onClick={() => onShowTable(layers, displayName)}
            />
            <DownloadButton
              layerName={layers}
              displayName={displayName}
              cqlFilter={isSequiasLayer && sequiaQuincena ?
                `Quincena = '${sequiaQuincena}'` : null}
            />
          </div>
        )}

        {/* Timeline para sequías (solo si está activa) */}
        {isSequiasLayer && active && hasTimeline && renderTimeline(SEQUIA_LAYER)}
      </div>
    );
  };

  return (
    <Draggable handle=".layermenu-handle">
      <div
        ref={containerRef}
        className="layermenu-container"
        style={{
          fontFamily: 'Montserrat, sans-serif',
          overflowY: 'auto',
          maxHeight: '70vh',
          zIndex: 6000
        }}
      >
        <div className="layermenu-handle">
          <strong>Menú de Capas</strong>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="layermenu-collapse-btn"
            aria-label={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {isCollapsed ? '＋' : '−'}
          </button>
        </div>

        {!isCollapsed && (
          <Accordion
            activeKey={activeSection}
            onSelect={(key) => setActiveSection(key)}
          >
            {processedSections.map((section) => (
              <Accordion.Item eventKey={section.id} key={section.id}>
                <Accordion.Header>{section.title}</Accordion.Header>
                <Accordion.Body>
                  {section.filteredCards.map((card, cardIndex) => (
                    <div key={cardIndex} className="layermenu-card">
                      <strong className="layermenu-card-title">
                        {card.title}
                      </strong>
                      {card.filteredLinks.map((link, linkIndex) =>
                        renderLayerItem(link, cardIndex, section, linkIndex)
                      )}
                    </div>
                  ))}
                </Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
        )}

        {}
        <DiccionarioDatosModal
          show={showDiccionario}
          onHide={() => setShowDiccionario(false)}
        />
      </div>
    </Draggable>
  );
};

export default LayerMenu;