import React from 'react';
import { Modal, Tabs, Tab } from 'react-bootstrap';
import AttributeTableContent from './AttributeTableContent';
import DraggableModalDialog from './DraggableModalDialog'; 
import '../styles/attributeTableModal.css';

const AttributeTableModal = ({ show, onHide, tabs, displayName }) => { 
  if (!tabs || tabs.length === 0) {
    return null;
  }
  const modalTitle = displayName || tabs[0].title;

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
          Tabla de Atributos: {modalTitle}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '80vh', overflowY: 'auto' }}>
        {tabs.length > 1 ? (
          <Tabs defaultActiveKey={tabs[0].layerName} id="attribute-table-tabs" className="table-tabs">
            {tabs.map((tab) => (
              <Tab 
                eventKey={tab.layerName} 
                title={tab.title} 
                key={tab.layerName}
              >
                <AttributeTableContent layerName={tab.layerName} />
              </Tab>
            ))}
          </Tabs>
        ) : (
          <AttributeTableContent layerName={tabs[0].layerName} />
        )}
      </Modal.Body>
    </Modal>
  );
};

export default AttributeTableModal;