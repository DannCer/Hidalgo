/**
 * @fileoverview Visor de infografías municipales de fertilidad.
 * 
 * Muestra una galería de infografías sobre fertilidad del suelo
 * por municipio, usando el componente base VisorBaseImagenes.
 * 
 * @module components/map/VisorInfografias
 */

import React, { useMemo } from 'react';
import VisorBaseImagenes from '../common/VisorBaseImagenes';
import '../../styles/visorImagenes.css';

// ============================================================================
// DATOS DE INFOGRAFÍAS
// ============================================================================

/**
 * Lista de infografías municipales disponibles.
 * @constant {Array<{file: string, title: string}>}
 */
const INFOGRAFIAS_DATA = [
  { file: 'ALMOLOYA.jpg', title: 'Almoloya' },
  { file: 'APAN.jpg', title: 'Apan' },
  { file: 'CUAUTEPEC.jpg', title: 'Cuautepec' },
  { file: 'EMILIANOZAPATA.jpg', title: 'Emiliano Zapata' },
  { file: 'SINGUILUCAN.jpg', title: 'Singuilucan' },
  { file: 'TEPEAPULCO.jpg', title: 'Tepeapulco' },
  { file: 'TEZONTEPEC.jpg', title: 'Tezontepec' },
  { file: 'TLANALAPA.jpg', title: 'Tlanalapa' },
  { file: 'ZEMPOALA.jpg', title: 'Zempoala' },
];

/** @constant {string} Ruta base de las imágenes */
const BASE_PATH = '/assets/img/Infografias/';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Visor de infografías municipales de fertilidad.
 * 
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.show - Si el visor está visible
 * @param {Function} props.onHide - Callback para cerrar el visor
 * @returns {JSX.Element} Visor de infografías
 * 
 * @example
 * <VisorInfografias show={showVisor} onHide={() => setShowVisor(false)} />
 */
const VisorInfografias = ({ show, onHide }) => {
  /** Infografías con rutas completas */
  const infografias = useMemo(() =>
    INFOGRAFIAS_DATA.map(item => ({
      src: `${BASE_PATH}${item.file}`,
      title: item.title
    })),
  []);

  return (
    <VisorBaseImagenes
      show={show}
      onHide={onHide}
      images={infografias}
      title="Infografías Municipales"
      footerShortcutText="← → navegar | +/- zoom | F pantalla completa"
    />
  );
};

export default React.memo(VisorInfografias);