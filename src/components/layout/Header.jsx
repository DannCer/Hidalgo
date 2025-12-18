/**
 * @fileoverview Componente de encabezado principal de la aplicación.
 * 
 * Muestra el logo del Gobierno de Hidalgo y enlaces de navegación.
 * Incluye versión responsiva con menú hamburguesa para móviles.
 * 
 * @module components/layout/Header
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/header.css';

// ============================================================================
// CONFIGURACIÓN DE NAVEGACIÓN
// ============================================================================

/**
 * Enlaces de navegación principal.
 * @constant {Array<{text: string, url: string}>}
 */
const navLinks = [
  { text: 'Trámites y Servicios', url: 'https://ruts.hidalgo.gob.mx/' },
  { text: 'Gobierno', url: 'https://gobierno.hidalgo.gob.mx/' },
  { text: 'Buzón Ciudadano', url: 'https://www.hidalgo.gob.mx/#buzon' },
  { text: 'Aviso de privacidad', url: 'https://gobierno.hidalgo.gob.mx/AvisoPrivacidad' },
];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Encabezado principal con navegación y logo institucional.
 * 
 * Características:
 * - Logo del Gobierno de Hidalgo con enlace a inicio
 * - Enlaces de navegación externa
 * - Menú responsivo para dispositivos móviles
 * - Overlay para cerrar menú móvil
 * 
 * @component
 * @returns {JSX.Element} Encabezado de la aplicación
 * 
 * @example
 * <Header />
 */
const Header = () => {
  /** @type {[boolean, Function]} Estado del menú móvil */
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  /** Alterna la visibilidad del menú móvil */
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  
  /** Cierra el menú móvil */
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="main-header">
      {/* ================================================================== */}
      {/* MENÚ MÓVIL (visible solo en pantallas pequeñas) */}
      {/* ================================================================== */}
      <div className={`site-mobile-menu ${isMobileMenuOpen ? 'mobile-menu-active' : ''}`}>
        <div className="site-mobile-menu-header">
          {/* Botón cerrar */}
          <div className="site-mobile-menu-close">
            <button
              className="mobile-menu-close-btn"
              onClick={closeMobileMenu}
              aria-label="Cerrar menú"
            >
              <span className="close-icon">×</span>
            </button>
          </div>
          {/* Logo en menú móvil */}
          <Link to="/" className="mobile-menu-logo">
            <img src="/assets/img/logo_gobhidalgo.png" alt="Logo Gobierno Hidalgo" />
          </Link>
        </div>
        {/* Enlaces de navegación móvil */}
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

      {/* ================================================================== */}
      {/* NAVEGACIÓN PRINCIPAL (escritorio y móvil) */}
      {/* ================================================================== */}
      <nav className="site-nav">
        <div className="container-max">
          <div className="row align-items-center">
            <div className="col-12">
              <div className="row align-items-center">

                {/* Logo principal */}
                <div className="col-6 col-sm-2 logo">
                  <Link to="/">
                    <img src="/assets/img/logo_gobhidalgo.png" alt="Logo Gobierno Hidalgo" />
                  </Link>
                </div>

                {/* Botón hamburguesa (solo móvil) */}
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

                {/* Enlaces de navegación (escritorio) */}
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

      {/* Overlay para cerrar menú móvil al hacer clic fuera */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={closeMobileMenu} />
      )}
    </header>
  );
};

export default Header;