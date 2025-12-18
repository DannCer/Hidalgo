import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import LayoutPrincipal from '../components/layout/LayoutPrincipal';

/**
 * Componente ComingSoon - Página para secciones en desarrollo.
 * Se muestra cuando el usuario intenta acceder a funcionalidades no implementadas aún.
 * Personaliza el mensaje según la sección a la que se intentó acceder.
 * 
 * @returns {JSX.Element} Componente de página en desarrollo
 */
const ComingSoon = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Obtener nombre de la sección desde el estado de navegación
  const sectionName = location.state?.name || 'Sección';

  /**
   * Maneja el evento de clic para regresar a la página principal
   */
  const handleGoHome = () => {
    navigate('/');
  };

  return (
    // Layout principal que incluye header y footer
    <LayoutPrincipal>
      {/* Contenedor principal centrado verticalmente */}
      <div
        className="principal-layout d-flex align-items-center justify-content-center text-center"
        style={{ minHeight: '70vh' }}
      >
        <Container>
          <Row className="justify-content-center">
            <Col md={8}>
              {/* Título dinámico con nombre de la sección */}
              <motion.h2
                className="fw-bold mb-3"
                style={{ color: 'var(--color-primary)' }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.3 }}
              >
                {sectionName} en desarrollo
              </motion.h2>

              {/* Mensaje informativo con animación */}
              <motion.p
                style={{ color: 'var(--color-text-secondary)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.6 }}
              >
                Estamos trabajando para habilitar esta sección pronto.
              </motion.p>

              {/* Botón de acción con animación */}
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