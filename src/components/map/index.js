// src/components/map/index.js
// Exportación centralizada de componentes del mapa

// Componente principal
export { default as MapView } from './MapView';
export { default as MapContent } from './MapContent';

// Capas
export { default as GeoJsonLayers } from './GeoJsonLayers';
export { default as HighlightLayer } from './HighlightLayer';

// Controles
export { default as BaseLayerControls } from './BaseLayerControls';
export { default as Timeline } from './Timeline';
export { default as ControlSidebarWrapper } from './ControlSidebarWrapper';

// Paneles
export { default as LayerMenu } from './LayerMenu';
export { default as Legend } from './Legend';
export { default as PopupContent } from './PopupContent';

// Tablas y modales
export { default as AttributeTableModal } from './AttributeTableModal';
export { default as AttributeTableContent } from './AttributeTableContent';
export { default as DiccionarioDatosModal } from './DiccionarioDatosModal';
export { default as VisorImagenesAcuiferos } from './VisorImagenesAcuiferos';
export { default as VisorInfografias } from './VisorInfografias';
export { default as VisorMapasFertilidad } from './VisorMapasFertilidad';

// Utilidades del mapa
export { default as MapClickHandler } from './MapClickHandler';
export { default as KeepPopupInView } from './KeepPopupInView';
export { default as Download } from './Download';
