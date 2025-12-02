import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import LayoutPrincipal from '../components/layout/LayoutPrincipal';

const ComingSoon = () => {
  const navigate = useNavigate();
  const location = useLocation();


  const sectionName = location.state?.name || 'Sección';

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <LayoutPrincipal>
      <div
        className="principal-layout d-flex align-items-center justify-content-center text-center"
        style={{ minHeight: '70vh' }}
      >
        <Container>
          <Row className="justify-content-center">
            <Col md={8}>

              {}
              <motion.h2
                className="fw-bold mb-3"
                style={{ color: 'var(--color-primary)' }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.3 }}
              >
                {sectionName} en desarrollo
              </motion.h2>

              {}
              <motion.p
                style={{ color: 'var(--color-text-secondary)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.6 }}
              >
                Estamos trabajando para habilitar esta sección pronto.
              </motion.p>

              {}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1 }}
              >
                <Button
                  className="btn-primary mt-3 px-4 py-2"
                  onClick={handleGoHome}
                >
                  Volver al inicio
                </Button>
              </motion.div>
            </Col>
          </Row>
        </Container>
      </div>
    </LayoutPrincipal>
  );
};

export default ComingSoon;
