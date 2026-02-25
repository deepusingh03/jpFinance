import React from 'react';
import { Spinner, Modal } from 'react-bootstrap';

const SpinnerComp = ({ 
  show = true, 
  message = "Loading...", 
  backdrop = true,
  transparent = false 
}) => {
  if (!show) return null;

  return (
    <Modal
      show={show}
      backdrop={backdrop}
      keyboard={false}
      centered
      dialogClassName="border-0"
      contentClassName={transparent ? "bg-transparent border-0" : ""}
    >
      <Modal.Body className="text-center p-4">
        <Spinner 
          animation="border" 
          variant="primary" 
          style={{ width: '3rem', height: '3rem' }}
          className="mb-3"
        />
        <h5 className="text-dark">{message}</h5>
      </Modal.Body>
    </Modal>
  );
};

export default SpinnerComp;