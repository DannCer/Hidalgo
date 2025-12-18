import { useState, useCallback } from 'react';
import { getLayerInfo } from '../utils/wfsService';

/**
 * Hook personalizado para manejar el estado y lógica del modal de tablas.
 * Permite mostrar tablas de datos asociadas a una o más capas del mapa.
 * 
 * @param {Object} currentFilters - Filtros actuales aplicados en la aplicación
 * @returns {Object} Estado y funciones para controlar el modal de tablas
 */
export const useTableModal = (currentFilters) => {
  /**
   * Estado del modal de tablas
   * @property {boolean} isOpen - Indica si el modal está abierto
   * @property {Array} tabs - Array de objetos con información de cada pestaña
   * @property {string|null} displayName - Nombre para mostrar en el título del modal
   * @property {Object|null} filters - Filtros aplicables a las tablas
   */
  const [tableModalState, setTableModalState] = useState({
    isOpen: false,
    tabs: [],
    displayName: null,
  });

  /**
   * Abre el modal de tablas con las capas especificadas.
   * Maneja la lógica para agregar capas secundarias relacionadas automáticamente.
   * 
   * @param {string|string[]} layers - Nombre(s) de la(s) capa(s) principal(es)
   * @param {string} displayName - Nombre para mostrar en el título del modal
   */
  const handleShowTable = useCallback((layers, displayName) => {
    // Normalizar a array
    let layerNamesArray = Array.isArray(layers) ? [...layers] : [layers];

    /**
     * Mapeo de capas principales a sus capas secundarias relacionadas.
     * Cuando se selecciona una capa principal, se incluye automáticamente su secundaria.
     */
    const secondaryLayers = {
      'Hidalgo:03_usoconsuntivo': 'Hidalgo:03_usoagua',          // Municipal -> Estatal
      'Hidalgo:01_spsitios': 'Hidalgo:01_sbsitios',              // Superficial -> Subterráneo
      'Hidalgo:01_spcalidadagua': 'Hidalgo:01_sbcalidadagua',    // Superficial -> Subterráneo
      'Hidalgo:02_cloracionmpio': 'Hidalgo:02_cloracionedo'      // Municipal -> Estatal
    };

    // Agregar capas secundarias relacionadas
    layerNamesArray.forEach(layerName => {
      const secondLayer = secondaryLayers[layerName];
      if (secondLayer && !layerNamesArray.includes(secondLayer)) {
        layerNamesArray.push(secondLayer);
      }
    });

    /**
     * Títulos descriptivos para cada capa.
     * Si no hay título específico, se usa la información de la capa o su nombre.
     */
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

    /**
     * Preparar datos para cada pestaña del modal.
     * Cada pestaña representa una capa con su título y nombre.
     */
    const tabsData = layerNamesArray.map(layerName => {
      const layerInfo = getLayerInfo(layerName);
      // Priorizar título específico, luego texto de capa, luego nombre simplificado
      let title = layerTitles[layerName] || layerInfo?.text || layerName.split(':')[1] || layerName;
      return { layerName, title };
    });

    /**
     * Actualizar estado del modal con la nueva configuración.
     * Incluye los filtros actuales para aplicación en las tablas.
     */
    setTableModalState({
      isOpen: true,
      tabs: tabsData,
      displayName,
      filters: currentFilters
    });
  }, [currentFilters]);

  /**
   * Cierra el modal de tablas y limpia su estado.
   */
  const handleCloseTable = useCallback(() => {
    setTableModalState({ isOpen: false, tabs: [], displayName: null });
  }, []);

  return {
    tableModalState,    // Estado completo del modal
    handleShowTable,    // Función para abrir el modal
    handleCloseTable    // Función para cerrar el modal
  };
};