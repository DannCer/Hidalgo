import React, { useState, useEffect } from 'react';
import '../../styles/footer.css';

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
  const currentYear = new Date().getFullYear();
  
  // Estado para guardar el número de visitas
  const [visitas, setVisitas] = useState(null);

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
        
        {/* --- SECCIÓN SUPERIOR (Logos y Contacto) --- */}
        <div className="row align-items-center pt-4">
          
          {/* Logo 1 */}
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

          {/* Logo 2 (Escudo) */}
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

          {/* Información de Contacto */}
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

        {/* --- SECCIÓN INFERIOR (Copyright y Contador) --- */}
        <div className="row pb-4">
          <div className="col-md-6 text-center text-md-start">
            <small className="text-white-50">
              &copy; {currentYear} Gobierno del Estado de Hidalgo. Todos los derechos reservados.
            </small>
          </div>
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