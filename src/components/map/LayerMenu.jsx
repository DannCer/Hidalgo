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

const FIXED_LAYERS = ['Hidalgo:00_Estado'];
const SEQUIA_LAYER = 'Hidalgo:04_sequias';
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

const useLayerHighlight = (highlightLayer, layerToItemMap, activeSection, setActiveSection) => {
  const [highlightedItem, setHighlightedItem] = useState(null);
  const highlightProcessedRef = useRef(null);

  useEffect(() => {
    if (!highlightLayer) return;

    const layerKey = Array.isArray(highlightLayer) ? highlightLayer.join(',') : highlightLayer;


    if (highlightProcessedRef.current === layerKey) return;
    highlightProcessedRef.current = layerKey;


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


    if (target.sectionId !== activeSection) {
      setActiveSection(target.sectionId);
    }


    setHighlightedItem(target.uniqueId);


    const timer = setTimeout(() => {
      setHighlightedItem(null);
      highlightProcessedRef.current = null;
    }, 3000);

    return () => clearTimeout(timer);
  }, [highlightLayer, layerToItemMap, activeSection, setActiveSection]);

  return highlightedItem;
};

const useProcessedSections = () => {
  const filterCard = useCallback((card) => {
    return !EXCLUDED_CARDS.includes(card.title?.trim?.() || '');
  }, []);

  const filterLink = useCallback((link) => {

    if (link.action) {
      return false;
    }
    if (link.type === 'dropdown') {
      return link.sublinks?.some(sublink =>
        sublink.layerName && sublink.path === '/observatorio'
      );
    }
    return !(link.path && (link.path.startsWith('http') || link.path.endsWith('.pdf')));
  }, []);

  return useMemo(() => {
    return accordionData
      .filter(section => section.id !== 'programa-hidrico')
      .map(section => {
        const filteredCards = (section.cards || [])
          .filter(filterCard)
          .map((card, cardIndex) => {
            const allLayersAndLinks = [];

            (card.links || []).forEach((link, linkIndex) => {
              if (link.type === 'dropdown' && link.sublinks) {
                link.sublinks
                  .filter(sublink => sublink.layerName && sublink.path === '/observatorio')
                  .forEach((sublink, subIdx) => {
                    allLayersAndLinks.push({
                      ...sublink,
                      uniqueId: `${section.id}-${cardIndex}-${linkIndex}-${subIdx}`,
                    });
                  });
              } else if (filterLink(link)) {
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
  const containerRef = useRef(null);
  const itemRefs = useRef({});

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showDiccionario, setShowDiccionario] = useState(false);
  const [localChecked, setLocalChecked] = useState({});
  const [activeSection, setActiveSection] = useState(
    sectionIndex || sectionId || accordionData[0]?.id || '0'
  );

  const processedSections = useProcessedSections();
  const layerToItemMap = useLayerMapping(processedSections);
  const highlightedItem = useLayerHighlight(highlightLayer, layerToItemMap, activeSection, setActiveSection);


  const getLayersArray = useCallback(
    (layerName) => (Array.isArray(layerName) ? layerName : [layerName]),
    []
  );

  const isFixedLayer = useCallback(
    (layerName) => getLayersArray(layerName).some((layer) => FIXED_LAYERS.includes(layer)),
    [getLayersArray]
  );

  const isAnyLayerActive = useCallback(
    (layerName) => getLayersArray(layerName).some((name) => name && !!activeLayers[name]),
    [getLayersArray, activeLayers]
  );

  const getGroupedDownloadLayers = useCallback(
    (link) => {
      const text = link.text?.toLowerCase() || '';
      const layerName = link.layerName?.toString().toLowerCase() || '';

      if (text.includes('sitios de monitoreo')) {
        return {
          layers: ['Hidalgo:01_spsitios', 'Hidalgo:01_sbsitios'],
          displayName: 'Sitios_Monitoreo',
        };
      }
      if (text.includes('parámetros e indicadores') || text.includes('parametros e indicadores')) {
        return {
          layers: ['Hidalgo:01_sbcalidadagua', 'Hidalgo:01_spcalidadagua'],
          displayName: 'Parametros_IndicadoresCA',
        };
      }

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


  useEffect(() => {
    const updatedChecked = Object.keys(activeLayers).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setLocalChecked(updatedChecked);
  }, [activeLayers]);

  useEffect(() => {
    if (sectionId) setActiveSection(sectionId);
  }, [sectionId]);


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

    const handleToggle = (checked) => {
      if (!fixed && !isDisabled && !isLoading) {
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

        {!isDisabled && (
          <div className="layermenu-buttons">
            {}
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