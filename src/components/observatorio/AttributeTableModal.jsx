import React, { useState, useEffect } from 'react';
import { Modal, Tabs, Tab } from 'react-bootstrap';
import AttributeTableContent from './AttributeTableContent';
import DraggableModalDialog from './DraggableModalDialog'; 
import '../styles/attributeTableModal.css';

const AttributeTableModal = ({ 
  show, 
  onHide, 
  tabs = [], 
  displayName = 'Tabla de Atributos',
  filters = {}
}) => {
  const [activeTab, setActiveTab] = useState('');

  // ✅ NUEVO: Sincronizar activeTab cuando cambien las tabs o se abra el modal
  useEffect(() => {
    if (show && tabs && tabs.length > 0) {
      // Solo actualizar si el tab actual no existe en las nuevas tabs
      const currentTabExists = tabs.some(tab => tab.layerName === activeTab);
      if (!currentTabExists || !activeTab) {
        setActiveTab(tabs[0].layerName);
      }
    }
  }, [show, tabs]); // Se ejecuta cuando se abre el modal o cambian las tabs

  // ✅ RESET: Limpiar activeTab cuando se cierra el modal
  useEffect(() => {
    if (!show) {
      setActiveTab('');
    }
  }, [show]);

  // ✅ VERIFICACIÓN DE SEGURIDAD: Si no hay tabs, no renderizar el contenido
  if (!tabs || tabs.length === 0) {
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

  // Función para renderizar información del filtro
  const renderFilterInfo = (layerName) => {
    const filter = filters[layerName];
    if (!filter) return null;
    
    return (
      <div className="filter-info" style={{
        padding: '8px',
        margin: '10px 0',
        backgroundColor: '#e3f2fd',
        border: '1px solid #90caf9',
        borderRadius: '4px',
        fontSize: '14px'
      }}>
        <strong>🔍 Filtro aplicado:</strong> {filter}
      </div>
    );
  };

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
                {/* ✅ OPTIMIZACIÓN: Solo renderizar el contenido del tab activo */}
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