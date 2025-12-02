
import React, { useState } from 'react';
import { Modal, Tabs, Tab, Table } from 'react-bootstrap';
import DraggableModalDialog from '../common/DraggableModalDialog';
import parametrosSuperficiales from '../../data/parametrosSuperficiales.js';
import parametrosSubterraneos from '../../data/parametrosSubterraneos.js';
import '../../styles/diccionarioDatos.css';

const DiccionarioDatosModal = ({ show, onHide }) => {
  const [activeTab, setActiveTab] = useState('superficiales');


  const convertToArray = (data) => {
    if (!data || !data[0]) return [];
    return Object.entries(data[0]).map(([parametro, descripcion]) => ({
      parametro,
      descripcion
    }));
  };

  const datosSuperficiales = convertToArray(parametrosSuperficiales);
  const datosSubterraneos = convertToArray(parametrosSubterraneos);

  const renderTable = (datos) => (
    <div className="diccionario-table-container">
      <Table striped bordered hover responsive className="diccionario-table">
        <thead>
          <tr>
            <th className="col-parametro">Parámetro</th>
            <th className="col-descripcion">Descripción</th>
          </tr>
        </thead>
        <tbody>
          {datos.map((item, index) => (
            <tr key={index}>
              <td className="parametro-cell">
                <code>{item.parametro}</code>
              </td>
              <td className="descripcion-cell">{item.descripcion}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      dialogAs={DraggableModalDialog}
      className="diccionario-modal"
      backdrop={false}
      enforceFocus={false}
      autoFocus={false}
    >
      <Modal.Header closeButton className="diccionario-header">
        <Modal.Title>
          <i className="bi bi-book me-2"></i>
          Diccionario de Datos
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="diccionario-body">
        <p className="diccionario-subtitle">
          Parámetros e indicadores de la calidad del agua
        </p>

        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="diccionario-tabs mb-3"
          fill
        >
          <Tab
            eventKey="superficiales"
            title={
              <span>
                <i className="bi bi-water me-2"></i>
                Aguas Superficiales
              </span>
            }
          >
            {activeTab === 'superficiales' && renderTable(datosSuperficiales)}
          </Tab>

          <Tab
            eventKey="subterraneos"
            title={
              <span>
                <i className="bi bi-moisture me-2"></i>
                Aguas Subterráneas
              </span>
            }
          >
            {activeTab === 'subterraneos' && renderTable(datosSubterraneos)}
          </Tab>
        </Tabs>
      </Modal.Body>
      <Modal.Footer className="diccionario-footer">
        <small className="text-muted">
          Total de parámetros: {activeTab === 'superficiales'
            ? datosSuperficiales.length
            : datosSubterraneos.length}
        </small>
      </Modal.Footer>
    </Modal>
  );
};

export default DiccionarioDatosModal;
