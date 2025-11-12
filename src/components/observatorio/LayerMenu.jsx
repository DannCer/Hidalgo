import React, { useState, useEffect, useCallback } from 'react';
import { Accordion, Form } from 'react-bootstrap';
import Draggable from 'react-draggable';
import { accordionData } from '../ui/AccordionData';
import AttributeTableButton from './AttributeTableButton';
import DownloadButton from './DownloadButton';
import '../styles/layerMenu.css';

const FIXED_LAYERS = ['Hidalgo:00_Estado'];

const EXCLUDED_CARDS = [
  'Marco legal',
  'Sitios de interés',
  'Programas de ordenamiento ecológico territorial',
  'Atlas de riesgos municipales',
  'Programa estatal hídrico',
];

const LayerMenu = ({ onLayerToggle, activeLayers, sectionIndex, sectionId, onShowTable }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [localChecked, setLocalChecked] = useState({});

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
      if (text.includes('sitios de monitoreo')) {
        return {
          layers: ['Hidalgo:01_spsitios', 'Hidalgo:01_sbsitios'],
          displayName: 'Sitios_Monitoreo',
        };
      }
      if (
        text.includes('parámetros e indicadores') ||
        text.includes('parametros e indicadores')
      ) {
        return {
          layers: ['Hidalgo:01_sbcalidadagua', 'Hidalgo:01_spcalidadagua'],
          displayName: 'Parametros_IndicadoresCA',
        };
      }
      return { layers: getLayersArray(link.layerName), displayName: link.text };
    },
    [getLayersArray]
  );

  // 🔁 Sincroniza checkboxes locales con las capas activas
  useEffect(() => {
    const updatedChecked = Object.keys(activeLayers).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setLocalChecked(updatedChecked);
  }, [activeLayers]);

  // ✅ Valida que el link tenga campos esenciales
  const isLinkValid = (link) => link.layerName && link.crs && link.geomType;

  const [activeSection, setActiveSection] = useState(
    sectionIndex || sectionId || accordionData[0]?.id || '0'
  );

  useEffect(() => {
    if (sectionId) setActiveSection(sectionId);
  }, [sectionId]);

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
          <Accordion
            alwaysOpen
            activeKey={activeSection}
            onSelect={(eventKey) => setActiveSection(eventKey)}
          >
            {accordionData
              .filter((section) => section.id !== 'programa-hidrico')
              .map((section) => (
                <Accordion.Item eventKey={section.id} key={section.id}>
                  <Accordion.Header>{section.title}</Accordion.Header>
                  <Accordion.Body>
                    {section.cards
                      .filter((card) => !EXCLUDED_CARDS.includes(card.title.trim()))
                      .map((card, cardIndex) => (
                        <div key={cardIndex} className="layermenu-card">
                          <strong className="layermenu-card-title">{card.title}</strong>

                          {card.links
                            .filter(
                              (link) =>
                                !(
                                  link.path &&
                                  (link.path.startsWith('http') || link.path.endsWith('.pdf'))
                                )
                            )
                            .map((link, linkIndex) => {
                              const { layers, displayName } = getGroupedDownloadLayers(link);
                              const fixed = isFixedLayer(link.layerName);
                              const active = isAnyLayerActive(link.layerName);
                              const isDisabled = !isLinkValid(link);

                              return (
                                <div
                                  key={linkIndex}
                                  className={`layermenu-item ${isDisabled ? 'disabled' : ''
                                    } ${active ? 'layermenu-active' : ''}`}
                                >
                                  <Form.Check
                                    type="checkbox"
                                    id={`layer-${section.id}-${cardIndex}-${linkIndex}`}
                                    label={link.text}
                                    disabled={fixed || isDisabled}
                                    checked={
                                      fixed ||
                                      active ||
                                      localChecked[layers.join(',')] ||
                                      false
                                    }
                                    onChange={(e) => {
                                      if (!fixed && !isDisabled) {
                                        const checked = e.target.checked;
                                        setLocalChecked((prev) => ({
                                          ...prev,
                                          [layers.join(',')]: checked,
                                        }));
                                        onLayerToggle({ ...link, layerName: layers }, checked);
                                      }
                                    }}
                                  />

                                  {!isDisabled && (
                                    <div className="layermenu-buttons">
                                      <AttributeTableButton
                                        layerName={layers[0]}
                                        displayName={displayName}
                                        onClick={() =>
                                          onShowTable(layers, displayName)
                                        }
                                      />
                                      <DownloadButton
                                        layerName={layers}
                                        displayName={displayName}
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      ))}

                    {section.cards.filter(
                      (card) => !EXCLUDED_CARDS.includes(card.title.trim())
                    ).length === 0 && (
                        <small className="text-muted">
                          No hay capas en esta sección.
                        </small>
                      )}
                  </Accordion.Body>
                </Accordion.Item>
              ))}
          </Accordion>

        )}
      </div>
    </Draggable >
  );
};

export default LayerMenu;
