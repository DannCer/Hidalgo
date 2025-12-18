/**
 * @fileoverview Componente modal para visualizar tablas de atributos con múltiples pestañas.
 * Proporciona una interfaz de modal arrastrable con soporte para múltiples capas,
 * mostrando cada una en pestañas separadas con sus respectivos filtros.
 * 
 * @module components/map/AttributeTableModal
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { Modal, Tabs, Tab } from 'react-bootstrap';
import AttributeTableContent from './AttributeTableContent';
import DraggableModalDialog from '../common/DraggableModalDialog';
import '../../styles/attributeTableModal.css';

/**
 * Modal para visualizar tablas de atributos con soporte multi-pestaña
 * Cada pestaña representa una capa diferente con sus propios filtros
 * 
 * @component
 * @param {boolean} show - Controla la visibilidad del modal
 * @param {Function} onHide - Función para cerrar el modal
 * @param {Array} [tabs=[]] - Array de objetos con configuración de pestañas
 * @param {string} [displayName='Tabla de Atributos'] - Nombre a mostrar en el título
 * @param {Object} [filters={}] - Objeto con filtros por capa (key: layerName)
 * @returns {JSX.Element} Modal con pestañas de tablas de atributos
 */
const AttributeTableModal = ({
  show,
  onHide,
  tabs = [],
  displayName = 'Tabla de Atributos',
  filters = {}
}) => {
  // Estado para controlar la pestaña activa
  const [activeTab, setActiveTab] = useState('');

  /**
   * Efecto para inicializar la pestaña activa cuando se muestra el modal
   * Se asegura de que siempre haya una pestaña seleccionada válida
   */
  useEffect(() => {
    if (show && tabs && tabs.length > 0) {
      // Verificar si la pestaña actual sigue existiendo
      const currentTabExists = tabs.some(tab => tab.layerName === activeTab);
      if (!currentTabExists || !activeTab) {
        // Seleccionar primera pestaña disponible
        setActiveTab(tabs[0].layerName);
      }
    }
  }, [show, tabs, activeTab]);

  /**
   * Efecto para limpiar la pestaña activa cuando se cierra el modal
   */
  useEffect(() => {
    if (!show) {
      setActiveTab('');
    }
  }, [show]);

  // ========== CASO SIN PESTAÑAS DISPONIBLES ==========
  if (!tabs || tabs.length === 0) {
    return (
      <Modal
        show={show}
        onHide={onHide}
        size="xl"
        centered
        dialogAs={DraggableModalDialog}
        aria-labelledby="attribute-table-modal-title"
      >
        <Modal.Header closeButton>
          <Modal.Title id="attribute-table-modal-title">
            <i className="bi bi-table me-2" aria-hidden="true"></i>
            Tabla de Atributos
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center text-muted p-4">
            No hay datos disponibles para mostrar.
          </div>
        </Modal.Body>
      </Modal>
    );
  }

  /**
   * Renderiza información sobre filtros aplicados a una capa
   * @param {string} layerName - Nombre de la capa
   * @returns {JSX.Element|null} Componente con información del filtro o null
   */
  const renderFilterInfo = (layerName) => {
    const filter = filters[layerName];
    if (!filter) return null;

    return (
      <div
        className="filter-info"
        role="status"
        aria-label={`Filtro aplicado: ${filter}`}
        style={{
          padding: '8px',
          margin: '10px 0',
          backgroundColor: '#e3f2fd',
          border: '1px solid #90caf9',
          borderRadius: '4px',
          fontSize: '14px'
        }}
      >
        <strong>
          <span role="img" aria-label="lupa">🔍</span> Filtro aplicado:
        </strong> {filter}
      </div>
    );
  };

  // ========== INTERFAZ PRINCIPAL ==========
  return (
    <Modal
      show={show}
      onHide={onHide}
      size="xl"
      centered
      dialogAs={DraggableModalDialog}
    >
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-table me-2"></i>
          Tabla de Atributos: {displayName}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '80vh', overflowY: 'auto' }}>
        {/* INTERFAZ CON MÚLTIPLES PESTAÑAS */}
        {tabs.length > 1 ? (
          <Tabs
            activeKey={activeTab}
            onSelect={setActiveTab}
            id="attribute-table-tabs"
            className="table-tabs"
            transition={false}
          >
            {tabs.map((tab) => (
              <Tab
                eventKey={tab.layerName}
                title={tab.title}
                key={tab.layerName}
              >
                {renderFilterInfo(tab.layerName)}
                {}
                {/* Renderizar contenido solo para pestaña activa */}
                {activeTab === tab.layerName && (
                  <AttributeTableContent
                    layerName={tab.layerName}
                    filter={filters[tab.layerName]}
                    transition={false}
                  />
                )}
              </Tab>
            ))}
          </Tabs>
        ) : (
          <>
          {/* INTERFAZ CON UNA SOLA PESTAÑA */}
            {renderFilterInfo(tabs[0].layerName)}
            <AttributeTableContent
              layerName={tabs[0].layerName}
              filter={filters[tabs[0].layerName]}
            />
          </>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default AttributeTableModal;