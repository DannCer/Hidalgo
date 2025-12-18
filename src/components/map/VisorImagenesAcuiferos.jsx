/**
 * @fileoverview Visor de imágenes de acuíferos de Hidalgo.
 * 
 * Muestra una galería de imágenes de los 23 acuíferos del estado.
 * 
 * @module components/map/VisorImagenesAcuiferos
 */

import React, { useMemo } from 'react';
import VisorBaseImagenes from '../common/VisorBaseImagenes';
import '../../styles/visorImagenes.css';

// ============================================================================
// DATOS DE ACUÍFEROS
// ============================================================================

/**
 * Lista de acuíferos del estado de Hidalgo.
 * @constant {Array<{file: string, title: string}>}
 */
const ACUIFEROS_DATA = [
  { file: 'acuifero acaxochitlan.jpg', title: 'Acaxochitlan' },
  { file: 'acuifero Actopan-Santiago de Anaya.jpg', title: 'Actopan Santiago de Anaya' },
  { file: 'acuifero Ajacuba.jpg', title: 'Ajacuba' },
  { file: 'acuifero alamo tuxpan.jpg', title: 'Alamo Tuxpan' },
  { file: 'acuifero amajac.jpg', title: 'Amajac' },
  { file: 'acuifero apan.jpg', title: 'Apan' },
  { file: 'acuifero atlapexco candelaria.jpg', title: 'Atlapexco Candelaria' },
  { file: 'acuifero atotonilco jaltocan.jpg', title: 'Atotonilco Jaltocan' },
  { file: 'acuifero calabozo.jpg', title: 'Calabozo' },
  { file: 'acuifero chapantongo alfajayucan.jpg', title: 'Chapantongo Alfajayucan' },
  { file: 'acuifero cuautitlan pachuca.jpg', title: 'Cuautitlan Pachuca' },
  { file: 'acuifero el astillero.jpg', title: 'El Astillero' },
  { file: 'acuifero huasca zoquital.jpg', title: 'Huasca Zoquital' },
  { file: 'acuifero huichapan-tecozautla.jpg', title: 'Huichapan Tecozautla' },
  { file: 'acuifero Ixmiquilpan.jpg', title: 'Ixmiquilpan' },
  { file: 'acuifero metztitlan.jpg', title: 'Metztitlan' },
  { file: 'acuifero orizatlan.jpg', title: 'Orizatlan' },
  { file: 'acuifero tecocomulco.jpg', title: 'Tecocomulco' },
  { file: 'acuifero Tepeji del Rio.jpg', title: 'Tepeji del Rio' },
  { file: 'acuifero valle de tulancingo.jpg', title: 'Valle de Tulancingo' },
  { file: 'acuifero valle del mezquital.jpg', title: 'Valle del Mezquital' },
  { file: 'acuifero xochitlan - huejutla.jpg', title: 'Xochitlan Huejutla' },
  { file: 'acuifero Zimapan.jpg', title: 'Zimapan' },
];

/** @constant {string} Ruta base de las imágenes */
const BASE_PATH = '/assets/img/acuiferos/';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Visor de imágenes de acuíferos.
 * 
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.show - Si el visor está visible
 * @param {Function} props.onHide - Callback para cerrar el visor
 * @returns {JSX.Element} Visor de acuíferos
 */
const VisorImagenesAcuiferos = ({ show, onHide }) => {
  /** Imágenes con rutas completas */
  const imagenesAcuiferos = useMemo(() =>
    ACUIFEROS_DATA.map(item => ({
      src: `${BASE_PATH}${item.file}`,
      title: item.title
    })),
  []);

  return (
    <VisorBaseImagenes
      show={show}
      onHide={onHide}
      images={imagenesAcuiferos}
      title="Acuíferos de Hidalgo"
      footerShortcutText="← → navegar | +/- zoom | F pantalla completa"
    />
  );
};

export default React.memo(VisorImagenesAcuiferos);