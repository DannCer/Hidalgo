/**
 * @fileoverview Layout para las páginas del Observatorio (visor de mapas).
 * 
 * Layout minimalista sin Footer, diseñado para maximizar el espacio
 * disponible para el visor de mapas. Solo incluye el Header.
 * 
 * @module components/layout/LayoutObservatorio
 */

import React from 'react';
import Header from './Header';

/**
 * Layout del Observatorio sin pie de página.
 * 
 * Usado en las páginas del visor de mapas donde se necesita
 * maximizar el área de visualización. El contenido ocupa
 * todo el espacio disponible sin padding ni margin.
 * 
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {React.ReactNode} props.children - Contenido (normalmente MapView)
 * @returns {JSX.Element} Layout con solo Header
 * 
 * @example
 * <LayoutObservatorio>
 *   <MapView sectionIndex="1" />
 * </LayoutObservatorio>
 */
const LayoutObservatorio = ({children}) => {
  return (
    <div>
      <Header />
      <main style={{padding: '0', margin: 0}}>{children}</main>
    </div>
  );
};

export default LayoutObservatorio;