/**
 * @fileoverview Modal con diccionario de datos de calidad del agua.
 * 
 * Muestra los parámetros e indicadores de calidad del agua
 * para aguas superficiales y subterráneas en un modal con tabs.
 * 
 * @module components/map/DiccionarioDatosModal
 */

import React, { useState } from 'react';
import { Modal, Tabs, Tab, Table } from 'react-bootstrap';
import DraggableModalDialog from '../common/DraggableModalDialog';
import parametrosSuperficiales from '../../data/parametrosSuperficiales.js';
import parametrosSubterraneos from '../../data/parametrosSubterraneos.js';
import '../../styles/diccionarioDatos.css';

/**
 * Modal arrastrable con diccionario de parámetros de calidad del agua.
 * 
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.show - Si el modal está visible
 * @param {Function} props.onHide - Callback para cerrar el modal
 * @returns {JSX.Element} Modal con tabs de parámetros
 * 
 * @example
 * <DiccionarioDatosModal show={showDict} onHide={() => setShowDict(false)} />
 */
const DiccionarioDatosModal = ({ show, onHide }) => {
  /** @type {[string, Function]} Tab activo ('superficiales' o 'subterraneos') */
  const [activeTab, setActiveTab] = useState('superficiales');

  /**
   * Convierte los datos de parámetros a array para la tabla.
   * @param {Array<Object>} data - Datos de parámetros
   * @returns {Array<{parametro: string, descripcion: string}>} Array formateado
   */
  const convertToArray = (data) => {
    if (!data || !data[0]) return [];
    return Object.entries(data[0]).map(([parametro, descripcion]) => ({
      parametro,
      descripcion
    }));
  };

  /** Datos de aguas superficiales formateados */
  const datosSuperficiales = convertToArray(parametrosSuperficiales);
  
  /** Datos de aguas subterráneas formateados */
  const datosSubterraneos = convertToArray(parametrosSubterraneos);

  /**
   * Renderiza la tabla de parámetros.
   * @param {Array} datos - Datos a mostrar
   * @returns {JSX.Element} Tabla con parámetros
   */
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

        {/* Tabs para superficiales y subterráneas */}
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
