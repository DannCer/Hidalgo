// src/components/map/VisorInfografias.jsx
import React, { useMemo } from 'react';
import VisorBaseImagenes from '../common/VisorBaseImagenes'; 
import '../../styles/visorImagenes.css';

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

const BASE_PATH = '/assets/img/Infografias/';

const VisorInfografias = ({ show, onHide }) => {
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