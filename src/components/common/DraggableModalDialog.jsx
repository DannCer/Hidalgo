/**
 * @fileoverview Modal arrastrable basado en react-bootstrap.
 * 
 * Envuelve el Modal.Dialog de Bootstrap con funcionalidad de arrastre
 * usando react-draggable. El usuario puede mover el modal arrastrando
 * desde el encabezado (.modal-header).
 * 
 * @module components/common/DraggableModalDialog
 */

import React, { useRef } from 'react';
import { Modal } from 'react-bootstrap';
import Draggable from 'react-draggable';

/**
 * Componente de diálogo modal arrastrable.
 * 
 * Se usa como reemplazo del Modal.Dialog estándar de Bootstrap
 * para permitir que el usuario reposicione el modal en pantalla.
 * 
 * @component
 * @param {Object} props - Props heredadas de Modal.Dialog
 * @returns {JSX.Element} Modal arrastrable
 * 
 * @example
 * <Modal dialogAs={DraggableModalDialog}>
 *   <Modal.Header>Título</Modal.Header>
 *   <Modal.Body>Contenido</Modal.Body>
 * </Modal>
 */
const DraggableModalDialog = (props) => {
  /** @type {React.RefObject<HTMLDivElement>} Ref para react-draggable (evita findDOMNode) */
  const nodeRef = useRef(null);

  return (
    <Draggable handle=".modal-header" nodeRef={nodeRef}>
      <div ref={nodeRef}>
        <Modal.Dialog {...props} />
      </div>
    </Draggable>
  );
};

export default DraggableModalDialog;