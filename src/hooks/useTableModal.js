import { useState, useCallback } from 'react';
import { getLayerInfo } from '../utils/wfsService';

export const useTableModal = (currentFilters) => {
  const [tableModalState, setTableModalState] = useState({
    isOpen: false,
    tabs: [],
    displayName: null,
  });

  const handleShowTable = useCallback((layers, displayName) => {
    let layerNamesArray = Array.isArray(layers) ? [...layers] : [layers];


    const secondaryLayers = {
      'Hidalgo:03_usoconsuntivo': 'Hidalgo:03_usoagua',
      'Hidalgo:01_spsitios': 'Hidalgo:01_sbsitios',
      'Hidalgo:01_spcalidadagua': 'Hidalgo:01_sbcalidadagua',
      'Hidalgo:02_cloracionmpio': 'Hidalgo:02_cloracionedo'
    };

    layerNamesArray.forEach(layerName => {
      const secondLayer = secondaryLayers[layerName];
      if (secondLayer && !layerNamesArray.includes(secondLayer)) {
        layerNamesArray.push(secondLayer);
      }
    });

    const layerTitles = {
      'Hidalgo:03_usoagua': 'Usos Consuntivos Estatal',
      'Hidalgo:03_usoconsuntivo': 'Usos Consuntivos Municipal',
      'Hidalgo:01_sbsitios': 'Sitios subterráneos',
      'Hidalgo:01_spsitios': 'Sitios superficiales',
      'Hidalgo:01_sbcalidadagua': 'Parámetros e indicadores subterráneos',
      'Hidalgo:01_spcalidadagua': 'Parámetros e indicadores superficiales',
      'Hidalgo:02_cloracionmpio': 'Cloración municipal',
      'Hidalgo:02_cloracionedo': 'Cloración estatal'
    };

    const tabsData = layerNamesArray.map(layerName => {
      const layerInfo = getLayerInfo(layerName);
      let title = layerTitles[layerName] || layerInfo?.text || layerName.split(':')[1] || layerName;
      return { layerName, title };
    });

    setTableModalState({
      isOpen: true,
      tabs: tabsData,
      displayName,
      filters: currentFilters
    });
  }, [currentFilters]);

  const handleCloseTable = useCallback(() => {
    setTableModalState({ isOpen: false, tabs: [], displayName: null });
  }, []);

  return {
    tableModalState,
    handleShowTable,
    handleCloseTable
  };
};