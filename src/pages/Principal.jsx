import React from 'react';
import Acordeon from '../components/ui/Acordeon';
import '../styles/principal.css';

/**
 * Componente Principal - Página de inicio del Observatorio Estatal Hídrico.
 * Representa la vista principal con el título, logo y componentes de navegación.
 * 
 * @returns {JSX.Element} Componente de la página principal
 */
const Principal = () => {
  return (
    <div className="principal-page">
      {/* Cabecera con título y logo */}
      <header className="principal-header">
        <img
          src="/assets/img/CINTILLO HGO Y SEMARNATH_COLOR.png"
          alt="Gobierno del Estado de Hidalgo - Secretaría de Medio Ambiente y Recursos Naturales"
          className="principal-logo"
        />
        <h1 className="principal-title">
          Observatorio Estatal Hídrico
        </h1>
      </header>
      
      {/* Componente Acordeón para navegación por secciones */}
      <Acordeon defaultActiveSections={['introduccion', 'contexto']} />
    </div>
  );
};

export default Principal;