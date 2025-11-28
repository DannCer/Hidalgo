import React from 'react';
// BORRAMOS IMPORTS DE IMÁGENES
import '../styles/footer.css';

const contactInfoLines = [
  'SECRETARÍA DE MEDIO AMBIENTE Y RECURSOS NATURALES',
  '',
  '771 714 1056 - 771 714 5087',
  '',
  'Vicente Segura No. 100',
  'Col. Adolfo Lopez Mateos CP. 42194',
  'Parque Ecológico Cubitos',
  '',
  'Pachuca de Soto, Hidalgo, México',
];

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-md-4 mb-4 mb-md-0">
            <div className="widget text-center text-md-start">
              {/* RUTA DIRECTA A PUBLIC */}
              <img
                src="/assets/img/LOGO MEDIO AMBIENTE VECTOR_COLOR.png"
                alt="Logo Gobierno Hidalgo"
                className="footer-logo img-fluid"
              />
            </div>
          </div>
          <div className="col-md-4 mb-4 mb-md-0">
            <div className="widget text-center">
              {/* RUTA DIRECTA A PUBLIC */}
              <img
                src="/assets/img/escudo_blanco.png"
                alt="Escudo del Estado de Hidalgo"
                className="footer-escudo img-fluid mb-3"
              />
            </div>
          </div>
          <div className="col-md-4">
            <div className="widget text-center text-md-end">
              <h2 className="footer-contact-title">Contacto</h2>
              <address className="footer-contact-info">
                {contactInfoLines.map((line, index) => (
                  <React.Fragment key={index}>
                    {line || <br />}
                    <br />
                  </React.Fragment>
                ))}
              </address>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-12">
            <hr className="footer-divider" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;