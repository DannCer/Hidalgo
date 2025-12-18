/**
 * @fileoverview Exportaciones centralizadas del módulo de datos.
 * 
 * Este módulo agrupa todos los datos estáticos de la aplicación:
 * - Configuración del acordeón del menú de capas
 * - Parámetros de calidad del agua (superficiales y subterráneas)
 * 
 * @module data
 * 
 * @example
 * // Importar datos del acordeón
 * import { accordionData } from './data';
 * 
 * @example
 * // Importar parámetros de calidad del agua
 * import { parametrosSuperficiales, parametrosSubterraneos } from './data';
 */

/** Datos de configuración del acordeón del menú de capas */
export { accordionData } from './AccordionData';

/** Parámetros e indicadores de calidad de aguas superficiales */
export { default as parametrosSuperficiales } from './parametrosSuperficiales';

/** Parámetros e indicadores de calidad de aguas subterráneas */
export { default as parametrosSubterraneos } from './parametrosSubterraneos';
