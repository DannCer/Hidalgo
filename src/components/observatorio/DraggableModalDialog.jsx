import React from 'react';
import { Modal } from 'react-bootstrap';
import Draggable from 'react-draggable';


const DraggableModalDialog = (props) => {
  return (
    <Draggable handle=".modal-header">
      <Modal.Dialog {...props} />
    </Draggable>
  );
};

export default DraggableModalDialog;