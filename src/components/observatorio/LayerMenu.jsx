import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Accordion, Form } from 'react-bootstrap';
import Draggable from 'react-draggable';
import { accordionData } from '../ui/AccordionData';
import AttributeTableButton from './AttributeTableButton';
import DownloadButton from './DownloadButton';
import Timeline from '../observatorio/Timeline';
import '../styles/layerMenu.css';

const FIXED_LAYERS = ['Hidalgo:00_Estado'];
const SEQUIA_LAYER = 'Hidalgo:04_sequias';

const EXCLUDED_CARDS = [
  'Marco legal',
  'Sitios de interés',
  'Programas de ordenamiento ecológico territorial',
  'Programa estatal hídrico',
  'Acuíferos de Hidalgo',
];

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
  const highlightProcessedRef = useRef(null);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [localChecked, setLocalChecked] = useState({});
  const [activeSection, setActiveSection] = useState(
    sectionIndex || sectionId || accordionData[0]?.id || '0'
  );
  const [highlightedItem, setHighlightedItem] = useState(null);

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

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

      const isSequias = text.includes('sequía') ||
        text.includes('sequia') ||
        text.includes('sequías') ||
        text.includes('sequias') ||
        layerName.includes('sequia');

      if (isSequias) {
        return {
          layers: [SEQUIA_LAYER],
          displayName: 'Sequias',
        };
      }

      return { layers: getLayersArray(link.layerName), displayName: link.text };
    },
    [getLayersArray]
  );

  // Sincroniza checkboxes locales con los activos
  useEffect(() => {
    const updatedChecked = Object.keys(activeLayers).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setLocalChecked(updatedChecked);
  }, [activeLayers]);

  // Mantener activeSection si llega por props
  useEffect(() => {
    if (sectionId) setActiveSection(sectionId);
  }, [sectionId]);

  const layerToItemKey = useMemo(() => {
    const map = {};
    accordionData.forEach((section) => {
      const filteredCards = (section.cards || []).filter(
        card => !EXCLUDED_CARDS.includes(card.title?.trim?.() || '')
      );

      filteredCards.forEach((card, cardIndex) => {
        const filteredLinks = (card.links || []).filter(
          link => !(link.path && (link.path.startsWith('http') || link.path.endsWith('.pdf')))
        );

        filteredLinks.forEach((link, linkIndex) => {
          if (!link.layerName) return;
          const layers = Array.isArray(link.layerName) ? link.layerName : [link.layerName];
          layers.forEach((ln) => {
            if (!ln) return;
            const key = `${section.id}-${cardIndex}-${linkIndex}`;
            if (!map[ln]) {
              map[ln] = { key, sectionId: section.id };
            }
          });
        });
      });
    });
    return map;
  }, []);

  const formatDateLabel = (dateStr, formatType = 'quincena') => {
    if (!dateStr) return "";

    const meses = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    try {
      const cleanDate = dateStr.toString().replace('Z', '').trim();

      if (formatType === 'quincena') {
        const [year, month, day] = cleanDate.split("-");
        const mes = meses[parseInt(month) - 1];
        const quincena = parseInt(day) <= 15 ? "1ª quincena" : "2ª quincena";
        return `${mes} · ${quincena} · ${year}`;
      } else if (formatType === 'month') {
        const [year, month] = cleanDate.split("-");
        return `${meses[parseInt(month) - 1]} ${year}`;
      } else if (formatType === 'year') {
        return cleanDate;
      }
      return cleanDate;
    } catch (error) {
      return dateStr;
    }
  };

  const renderTimeline = (layerName) => {
    const config = timelineConfigs[layerName];

    if (!config || !config.timePoints || config.timePoints.length === 0) {
      return (
        <div className="timeline-box">
          <div className="text-muted small">
            Cargando línea de tiempo...
          </div>
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

  // ✅ MEJORADO: Manejar navegación y highlight
  useEffect(() => {
    if (!highlightLayer) return;

    const layerKey = Array.isArray(highlightLayer) 
      ? highlightLayer.join(',') 
      : highlightLayer;
    
    if (highlightProcessedRef.current === layerKey) return;
    highlightProcessedRef.current = layerKey;


    const findTarget = () => {
      const names = Array.isArray(highlightLayer) ? highlightLayer : [highlightLayer];
      
      for (const ln of names) {
        const match = layerToItemKey[ln];
        if (match) {
          return match;
        }
      }
      return null;
    };

    const target = findTarget();
    
    if (!target) {
      console.error('⚠️ No se encontró target para:', highlightLayer);
      return;
    }


    

    // Destacar el item
    setHighlightedItem(target.key);

    // ✅ Función de scroll mejorada
    const attemptScroll = (attempts = 0) => {
      const maxAttempts = 15;
      const availableRefs = Object.keys(itemRefs.current);
      
      const el = itemRefs.current[target.key];
      
      if (el) {
        
        requestAnimationFrame(() => {
          el.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
        });
        
        return true;
      } else if (attempts < maxAttempts) {
        setTimeout(() => attemptScroll(attempts + 1), 200);
        return false;
      } else {
        console.error('❌ Elemento no encontrado después de', maxAttempts, 'intentos');
        console.error('❌ Key buscado:', target.key);
        console.error('❌ Keys disponibles:', availableRefs);
        return false;
      }
    };

    // Iniciar scroll con delay apropiado
    const scrollDelay = target.sectionId !== activeSection ? 400 : 100;
    setTimeout(() => {
      attemptScroll(0);
    }, scrollDelay);

    // Quitar highlight después de 3 segundos
    const timeoutId = setTimeout(() => {
      setHighlightedItem(null);
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [highlightLayer, layerToItemKey, activeSection]);

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
            onClick={toggleCollapse}
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
            {accordionData
              .filter(section => section.id !== 'programa-hidrico')
              .map((section) => (
                <Accordion.Item eventKey={section.id} key={section.id}>
                  <Accordion.Header>{section.title}</Accordion.Header>
                  <Accordion.Body>
                    {section.cards
                      .filter(card => !EXCLUDED_CARDS.includes(card.title?.trim?.() || ''))
                      .map((card, cardIndex) => (
                        <div key={cardIndex} className="layermenu-card">
                          <strong className="layermenu-card-title">
                            {card.title}
                          </strong>

                          {card.links
                            .filter(link => !(link.path && (link.path.startsWith('http') || link.path.endsWith('.pdf'))))
                            .map((link, linkIndex) => {
                              // ✅ itemKey generado con los mismos índices que layerToItemKey
                              const itemKey = `${section.id}-${cardIndex}-${linkIndex}`;
                              
                              const { layers, displayName } = getGroupedDownloadLayers(link);
                              const fixed = isFixedLayer(link.layerName);
                              const active = isAnyLayerActive(link.layerName);
                              const isDisabled = !link.layerName || !link.crs || !link.geomType;
                              const isLoading = layers.some(l => loadingLayers.has(l));

                              const isSequiasLayer = layers.includes(SEQUIA_LAYER);
                              const hasTimeline = isSequiasLayer && timelineConfigs[SEQUIA_LAYER];

                              const isHighlighted = highlightedItem === itemKey;

                              return (
                                <div
                                  key={linkIndex}
                                  ref={el => {
                                    if (el) {
                                      itemRefs.current[itemKey] = el;
                                    }
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
                                      id={`layer-${section.id}-${cardIndex}-${linkIndex}`}
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
                                      onChange={(e) => {
                                        if (!fixed && !isDisabled && !isLoading) {
                                          const checked = e.target.checked;
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
                                      }}
                                    />
                                  </div>

                                  {!isDisabled && (
                                    <div className="layermenu-buttons">
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

                                  {isSequiasLayer && active && hasTimeline && (
                                    renderTimeline(SEQUIA_LAYER)
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      ))}
                  </Accordion.Body>
                </Accordion.Item>
              ))}
          </Accordion>
        )}
      </div>
    </Draggable>
  );
};

export default LayerMenu;