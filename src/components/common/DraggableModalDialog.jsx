import React, { useRef } from 'react';
import { Modal } from 'react-bootstrap';
import Draggable from 'react-draggable';

const DraggableModalDialog = (props) => {
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