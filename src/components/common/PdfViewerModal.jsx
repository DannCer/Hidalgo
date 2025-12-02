import React from 'react';
import { Modal } from 'react-bootstrap';
import DraggableModalDialog from './DraggableModalDialog';
import '../../styles/pdfViewer.css';

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
