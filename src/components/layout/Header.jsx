import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/header.css';

const navLinks = [
  { text: 'Trámites y Servicios', url: 'https://ruts.hidalgo.gob.mx/' },
  { text: 'Gobierno', url: 'https://gobierno.hidalgo.gob.mx/' },
  { text: 'Buzón Ciudadano', url: 'https://www.hidalgo.gob.mx/#buzon' },
  { text: 'Aviso de privacidad', url: 'https://gobierno.hidalgo.gob.mx/AvisoPrivacidad' },
];

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="main-header">
      {/* Menú móvil */}
      <div className={`site-mobile-menu ${isMobileMenuOpen ? 'mobile-menu-active' : ''}`}>
        <div className="site-mobile-menu-header">
          <div className="site-mobile-menu-close">
            <button
              className="mobile-menu-close-btn"
              onClick={closeMobileMenu}
              aria-label="Cerrar menú"
            >
              <span className="close-icon">×</span>
            </button>
          </div>
          <Link to="/" className="mobile-menu-logo">
             {/* RUTA DIRECTA A PUBLIC */}
            <img src="/assets/img/logo_gobhidalgo.png" alt="Logo Gobierno Hidalgo" />
          </Link>
        </div>
        <div className="site-mobile-menu-body">
          <ul className="mobile-menu-links">
            {navLinks.map((link) => (
              <li key={link.url}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mobile-menu-link"
                >
                  {link.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Navbar Desktop */}
      <nav className="site-nav">
        <div className="container-max">
          <div className="row align-items-center">
            <div className="col-12">
              <div className="row align-items-center">
                
                {/* Logo Desktop */}
                <div className="col-6 col-sm-2 logo">
                  <Link to="/">
                    {/* RUTA DIRECTA A PUBLIC */}
                    <img src="/assets/img/logo_gobhidalgo.png" alt="Logo Gobierno Hidalgo" />
                  </Link>
                </div>

                {/* Botón móvil */}
                <div className="col-6 d-sm-none text-end">
                  <button
                    className="mobile-menu-toggle"
                    onClick={toggleMobileMenu}
                    aria-label="Abrir menú de navegación"
                    aria-expanded={isMobileMenuOpen}
                  >
                    <span className="menu-toggle-icon">☰</span>
                  </button>
                </div>

                {/* Enlaces desktop */}
                <div className="col-10 text-center d-none d-sm-block">
                  <ul className="menu-derecha">
                    {navLinks.map((link) => (
                      <li key={link.url}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="nav-link"
                        >
                          {link.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Overlay para móvil */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={closeMobileMenu} />
      )}
    </header>
  );
};

export default Header;