/**
 * @fileoverview Componente de pie de página de la aplicación.
 * 
 * Muestra información de contacto de SEMARNATH, logos institucionales,
 * derechos de autor y contador de visitas del sitio.
 * 
 * @module components/layout/Footer
 */

import React, { useState, useEffect } from 'react';
import '../../styles/footer.css';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

/**
 * Líneas de información de contacto.
 * Las líneas vacías se usan como espaciadores visuales.
 * @constant {string[]}
 */
const contactInfoLines = [
  'SECRETARÍA DE MEDIO AMBIENTE Y RECURSOS NATURALES',
  '',
  '771 714 1056 - 771 714 5087',  
  'observatorioestatal.hidrico@hidalgo.gob.mx',
  '',
  'Vicente Segura No. 100',
  'Col. Adolfo Lopez Mateos CP. 42194',
  'Parque Ecológico Cubitos',
  '',
  'Pachuca de Soto, Hidalgo, México',
];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Pie de página con información institucional y contador de visitas.
 * 
 * Características:
 * - Logo de SEMARNATH
 * - Escudo del Gobierno de Hidalgo
 * - Información de contacto
 * - Derechos de autor con año dinámico
 * - Contador de visitas vía API externa
 * 
 * @component
 * @returns {JSX.Element} Pie de página
 * 
 * @example
 * <Footer />
 */
const Footer = () => {
  /** Año actual para derechos de autor */
  const currentYear = new Date().getFullYear();

  /** @type {[number|null, Function]} Contador de visitas del sitio */
  const [visitas, setVisitas] = useState(null);

  /**
   * Efecto para obtener el contador de visitas.
   * Usa la API de counterapi.dev para tracking de visitas.
   * Silenciosamente falla si está bloqueado por el navegador.
   */
  useEffect(() => {
    fetch('https://api.counterapi.dev/v1/observatorio-hidrico-hidalgo/visitas/up')
      .then(response => {
        if (!response.ok) throw new Error('Error de red');
        return response.json();
      })
      .then(data => {
        setVisitas(data.count);
      })
      .catch(err => {
        console.warn("El contador fue bloqueado por el navegador o red:", err);
        setVisitas(null);
      });
  }, []);

  return (
    <footer className="footer">
      <div className="container">

        {/* ================================================================ */}
        {/* SECCIÓN PRINCIPAL: Logos e información de contacto */}
        {/* ================================================================ */}
        <div className="row align-items-center pt-4">

          {/* Logo SEMARNATH (izquierda) */}
          <div className="col-md-4 mb-4 mb-md-0">
            <div className="widget text-center text-md-start">
              <img
                src="/assets/img/LOGO MEDIO AMBIENTE VECTOR_COLOR.png"
                alt="Logo Semarnath"
                className="footer-logo img-fluid"
                style={{ maxHeight: '80px' }}
              />
            </div>
          </div>

          {/* Escudo Gobierno de Hidalgo (centro) */}
          <div className="col-md-4 mb-4 mb-md-0">
            <div className="widget text-center">
              <img
                src="/assets/img/escudo_blanco.png"
                alt="Escudo Hidalgo"
                className="footer-escudo img-fluid mb-3"
                style={{ maxHeight: '190px' }}
              />
            </div>
          </div>

          {/* Información de contacto (derecha) */}
          <div className="col-md-4">
            <div className="widget text-center text-md-end">
              <h2 className="footer-contact-title text-white fw-bold mb-3">Contacto</h2>
              <address className="footer-contact-info text-white-50" style={{ fontStyle: 'normal', fontSize: '0.9rem' }}>
                {contactInfoLines.map((line, index) => (
                  <React.Fragment key={index}>
                    {line}
                    {line && <br />}
                  </React.Fragment>
                ))}
              </address>
            </div>
          </div>
        </div>

        {/* Línea divisoria */}
        <div className="row">
          <div className="col-12">
            <hr className="footer-divider border-white opacity-25" />
          </div>
        </div>

        {/* ================================================================ */}
        {/* SECCIÓN INFERIOR: Copyright y contador de visitas */}
        {/* ================================================================ */}
        <div className="row pb-4">
          {/* Derechos de autor */}
          <div className="col-md-6 text-center text-md-start">
            <small className="text-white-50">
              &copy; {currentYear} Gobierno del Estado de Hidalgo. Todos los derechos reservados.
            </small>
          </div>
          {/* Contador de visitas */}
          <div className="col-md-6 text-center text-md-end mt-2 mt-md-0">
            <small className="text-white-50 d-inline-flex align-items-center gap-2 justify-content-center justify-content-md-end">
              <span>Visitas totales:</span>
              <span className="badge bg-light text-dark fw-bold" style={{ minWidth: '60px' }}>
                {visitas ? visitas.toLocaleString() : 'Monitoreo Activo'}
              </span>
            </small>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;