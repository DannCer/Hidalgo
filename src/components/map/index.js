/**
 * @fileoverview Archivo índice (barrel file) para exportar componentes del módulo de mapas.
 * Centraliza las exportaciones para facilitar las importaciones en otros módulos.
 * Organiza los componentes por funcionalidad y responsabilidad.
 * 
 * @module components/map/index
 * @version 1.0.0
 */

// Componentes principales del mapa
export { default as MapView } from './MapView';           // Vista principal del mapa
export { default as MapContent } from './MapContent';     // Contenido y controles del mapa

// Componentes de capas y renderizado
export { default as GeoJsonLayers } from './GeoJsonLayers';     // Gestor de capas GeoJSON
export { default as HighlightLayer } from './HighlightLayer';   // Capa de resaltado

// Componentes de controles y utilidades
export { default as BaseLayerControls } from './BaseLayerControls';   // Selector de capas base
export { default as Timeline } from './Timeline';                     // Línea de tiempo
export { default as ControlSidebarWrapper } from './ControlSidebarWrapper'; // Sidebar personalizado

// Componentes de interfaz y menús
export { default as LayerMenu } from './LayerMenu';           // Menú de capas
export { default as Legend } from './Legend';                 // Leyenda del mapa
export { default as PopupContent } from './PopupContent';     // Contenido de popups

// Componentes de modales y visualizadores
export { default as AttributeTableModal } from './AttributeTableModal';         // Modal de tabla de atributos
export { default as AttributeTableContent } from './AttributeTableContent';     // Contenido de tabla de atributos
export { default as DiccionarioDatosModal } from './DiccionarioDatosModal';    // Modal de diccionario de datos
export { default as VisorImagenesAcuiferos } from './VisorImagenesAcuiferos';  // Visor de imágenes de acuíferos
export { default as VisorInfografias } from './VisorInfografias';              // Visor de infografías
export { default as VisorMapasFertilidad } from './VisorMapasFertilidad';      // Visor de mapas de fertilidad

// Componentes de manejo de eventos
export { default as MapClickHandler } from './MapClickHandler';   // Manejador de clics en el mapa
export { default as KeepPopupInView } from './KeepPopupInView';   // Mantener popups visibles
export { default as Download } from './Download';                 // Funcionalidad de descarga