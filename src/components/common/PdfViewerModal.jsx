/**
 * @fileoverview Modal para visualización de documentos PDF.
 * 
 * Muestra un PDF embebido en un iframe dentro de un modal arrastrable.
 * Usado para mostrar documentación, reportes y fichas técnicas.
 * 
 * @module components/common/PdfViewerModal
 */

import React from 'react';
import { Modal } from 'react-bootstrap';
import DraggableModalDialog from './DraggableModalDialog';
import '../../styles/pdfViewer.css';

/**
 * Modal para visualizar documentos PDF.
 * 
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.show - Si el modal está visible
 * @param {Function} props.onHide - Callback para cerrar el modal
 * @param {string} props.pdfUrl - URL del archivo PDF
 * @param {string} [props.title='Documento'] - Título del modal
 * @returns {JSX.Element} Modal con visor PDF
 * 
 * @example
 * <PdfViewerModal
 *   show={showPdf}
 *   onHide={() => setShowPdf(false)}
 *   pdfUrl="/docs/manual.pdf"
 *   title="Manual de Usuario"
 * />
 */
const PdfViewerModal = ({ show, onHide, pdfUrl, title = 'Documento' }) => {
  return (
    <Modal
      show={show}
      onHide={onHide}
      size="xl"
      centered
      dialogAs={DraggableModalDialog}
      className="pdf-viewer-modal"
    >
      <Modal.Header closeButton className="pdf-viewer-header">
        <Modal.Title>
          <i className="bi bi-file-pdf me-2"></i>
          {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="pdf-viewer-body">
        {/* Iframe para renderizar el PDF con visor nativo del navegador */}
        <iframe
          src={pdfUrl}
          title={title}
          className="pdf-iframe"
        />
      </Modal.Body>
    </Modal>
  );
};

export default PdfViewerModal;
