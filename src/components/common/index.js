/**
 * @fileoverview Exportaciones centralizadas de componentes comunes.
 * 
 * Este módulo reexporta todos los componentes reutilizables de la carpeta common.
 * Permite imports más limpios desde otras partes de la aplicación.
 * 
 * @module components/common
 * 
 * @example
 * // En lugar de importar desde rutas individuales:
 * import AttributeTableButton from './components/common/AttributeTableButton';
 * 
 * // Se puede importar desde el índice:
 * import { AttributeTableButton, DownloadButton } from './components/common';
 */

// =============================================================================
// BOTONES DE ACCIÓN
// =============================================================================

/** Botón para abrir tabla de atributos */
export { default as AttributeTableButton } from './AttributeTableButton';

/** Botón para descargar capas como Shapefile */
export { default as DownloadButton } from './DownloadButton';

/** Botón para abrir diccionario de datos */
export { default as DiccionarioButton } from './DiccionarioButton';

/** Botón de ayuda contextual */
export { default as HelpButton } from './HelpButton';

// =============================================================================
// MODALES
// =============================================================================

/** Diálogo modal arrastrable */
export { default as DraggableModalDialog } from './DraggableModalDialog';

/** Modal para visualización de PDFs */
export { default as PdfViewerModal } from './PdfViewerModal';

// =============================================================================
// VISORES
// =============================================================================

/** Visor de galería de imágenes con zoom y navegación */
export { default as VisorBaseImagenes } from './VisorBaseImagenes';
