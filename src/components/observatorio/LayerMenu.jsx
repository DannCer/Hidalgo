import React, { useState, useEffect, useCallback } from 'react';
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
  onTimelineChange
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [localChecked, setLocalChecked] = useState({});
  const [activeSection, setActiveSection] = useState(
    sectionIndex || sectionId || accordionData[0]?.id || '0'
  );

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
    (layerName) => getLayersArray(layerName).some((name) => name && activeLayers[name]),
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

      // ✅ Identificar sequías
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

  useEffect(() => {
    if (sectionId) setActiveSection(sectionId);
  }, [sectionId]);

  const formatDateLabel = (dateStr, formatType = 'quincena') => {
    if (!dateStr) return "";

    const meses = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    try {
      // Limpiar la fecha
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

  // ✅ Renderizar timeline
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
          onTimeChange={(value) => {
            console.log(`🎯 Timeline change: ${layerName} -> ${value}`);
            onTimelineChange(layerName, value);
          }}
          formatLabel={(value) => formatDateLabel(value, config.formatType)}
          type={config.type}
        />
      </div>
    );
  };

  // ✅ Log para debug
  useEffect(() => {
    console.log('🔄 LayerMenu render:', {
      timelineConfigs: Object.keys(timelineConfigs),
      activeLayers: Object.keys(activeLayers),
      sequiaQuincena: sequiaQuincena,
      sequiaQuincenaListLength: sequiaQuincenaList?.length
    });
  }, [timelineConfigs, activeLayers, sequiaQuincena, sequiaQuincenaList]);

  return (
    <Draggable handle=".layermenu-handle">
      <div className="layermenu-container" style={{ fontFamily: 'Montserrat, sans-serif' }}>
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
          <Accordion alwaysOpen activeKey={activeSection} onSelect={setActiveSection}>
            {accordionData
              .filter(section => section.id !== 'programa-hidrico')
              .map((section) => (
                <Accordion.Item eventKey={section.id} key={section.id}>
                  <Accordion.Header>{section.title}</Accordion.Header>
                  <Accordion.Body>
                    {section.cards
                      .filter(card => !EXCLUDED_CARDS.includes(card.title.trim()))
                      .map((card, cardIndex) => (
                        <div key={cardIndex} className="layermenu-card">
                          <strong className="layermenu-card-title">
                            {card.title}
                          </strong>

                          {card.links
                            .filter(link => !(link.path && (link.path.startsWith('http') || link.path.endsWith('.pdf'))))
                            .map((link, linkIndex) => {
                              const { layers, displayName } = getGroupedDownloadLayers(link);
                              const fixed = isFixedLayer(link.layerName);
                              const active = isAnyLayerActive(link.layerName);
                              const isDisabled = !link.layerName || !link.crs || !link.geomType;

                              // ✅ Verificar si es capa de sequías
                              const isSequiasLayer = layers.includes(SEQUIA_LAYER);
                              const hasTimeline = isSequiasLayer && timelineConfigs[SEQUIA_LAYER];

                              return (
                                <div
                                  key={linkIndex}
                                  className={`layermenu-item ${isDisabled ? 'disabled' : ''} ${active ? 'layermenu-active' : ''}`}
                                >
                                  <Form.Check
                                    type="checkbox"
                                    id={`layer-${section.id}-${cardIndex}-${linkIndex}`}
                                    label={link.text}
                                    disabled={fixed || isDisabled}
                                    checked={fixed || active || localChecked[layers.join(',')] || false}
                                    onChange={(e) => {
                                      if (!fixed && !isDisabled) {
                                        const checked = e.target.checked;
                                        setLocalChecked(prev => ({
                                          ...prev,
                                          [layers.join(',')]: checked
                                        }));

                                        // Pasar la configuración completa
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

                                  {/* ✅ LÍNEA DE TIEMPO - Mostrar siempre que la capa esté activa */}
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