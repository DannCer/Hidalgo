/**
 * @fileoverview Componente de leyenda dinámica del mapa.
 * 
 * Muestra la simbología de las capas activas con soporte para
 * variantes (diferentes clasificaciones de la misma capa).
 * 
 * @module components/map/Legend
 */

import React, { useState, useMemo } from 'react';
import HelpButton from '../common/HelpButton';
import PdfViewerModal from '../common/PdfViewerModal';
import '../../styles/legend.css';
import '../../styles/pdfViewer.css';

// ============================================================================
// CONSTANTES
// ============================================================================

/**
 * Mapeo de capas a sus leyendas consolidadas.
 * Permite que múltiples capas compartan la misma leyenda.
 * @constant {Object<string, string>}
 */
const LEGEND_MAPPING = {
  'Hidalgo:01_spsitios': 'Hidalgo:01_sitios',
  'Hidalgo:01_sbsitios': 'Hidalgo:01_sitios',
  'Hidalgo:01_sbcalidadagua': 'Hidalgo:01_calidadagua',
  'Hidalgo:01_spcalidadagua': 'Hidalgo:01_calidadagua',
};

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Determina si una capa es de tipo punto.
 * @param {string} legendType - Tipo de la leyenda principal
 * @param {string} [variantType] - Tipo de la variante (si aplica)
 * @returns {boolean} True si es tipo punto
 */
const isPointType = (legendType, variantType) => {
  const type = variantType || legendType;
  return type && (
    type === 'point' ||
    type === 'categorical-point' ||
    type === 'ranged-point' ||
    type.includes('point')
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Leyenda dinámica del visor de mapas.
 * 
 * Características:
 * - Muestra simbología de capas activas
 * - Soporte para variantes (selector dropdown)
 * - Colapsable
 * - Indicador de carga por capa
 * - Botón de ayuda para calidad del agua
 * 
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.activeLayers - Capas actualmente activas
 * @param {Object} props.legendData - Datos de leyenda por capa
 * @param {Set} [props.loadingLayers] - Capas en proceso de carga
 * @param {Object} [props.activeVariants={}] - Variantes activas por capa
 * @param {Function} [props.onVariantChange] - Callback al cambiar variante
 * @returns {JSX.Element|null} Componente de leyenda o null si no hay capas
 * 
 * @example
 * <Legend
 *   activeLayers={{ 'Hidalgo:01_cuencas': {...} }}
 *   legendData={legendConfig}
 *   loadingLayers={new Set()}
 *   activeVariants={{}}
 *   onVariantChange={(layer, variant) => handleChange(layer, variant)}
 * />
 */
const Legend = ({ activeLayers, legendData, loadingLayers = new Set(), activeVariants = {}, onVariantChange }) => {
    /** @type {[boolean, Function]} Si la leyenda está colapsada */
    const [isCollapsed, setIsCollapsed] = useState(false);
    
    /** @type {[boolean, Function]} Si se muestra el modal de PDF */
    const [showPdfModal, setShowPdfModal] = useState(false);

    /** Alterna el estado colapsado */
    const toggleCollapse = () => {
        setIsCollapsed(prev => !prev);
    };

    const activeLayerNames = Object.keys(activeLayers);

    /**
     * Capas que tienen leyenda definida.
     * Aplica el mapeo de consolidación y elimina duplicados.
     */
    const layersWithLegend = useMemo(() => {
        if (activeLayerNames.length === 0) return [];

        // Aplicar mapeo de consolidación
        const mappedLayers = activeLayerNames.map(layerName =>
            LEGEND_MAPPING[layerName] || layerName
        );

        // Eliminar duplicados
        const uniqueLayers = [...new Set(mappedLayers)];

        // Filtrar solo las que tienen leyenda definida
        return uniqueLayers.filter(layerName =>
            legendData[layerName] &&
            (legendData[layerName].items?.length > 0 || legendData[layerName].variants)
        );
    }, [activeLayers, legendData, activeLayerNames.length]);

    // No renderizar si no hay capas con leyenda
    if (layersWithLegend.length === 0) return null;

    /**
     * Maneja el cambio de variante de una capa.
     * @param {string} layerName - Nombre de la capa
     * @param {string} value - Nueva variante seleccionada
     */
    const handleVariantChange = (layerName, value) => {
        if (onVariantChange) onVariantChange(layerName, value);
    };

    return (
        <div className={`legend-container ${isCollapsed ? 'collapsed' : ''}`}>
            {/* Header colapsable */}
            <div className="legend-header" onClick={toggleCollapse}>
                <h4 className="legend-title">Simbología</h4>
                <span className="legend-badge">{layersWithLegend.length}</span>
            </div>

            {!isCollapsed && (
                <div className="legend-content">
                    {layersWithLegend.map(layerName => {
                        const layerLegend = legendData[layerName];

                        // Verificar si alguna capa original está cargando
                        const originalLayers = Object.keys(LEGEND_MAPPING).filter(
                            key => LEGEND_MAPPING[key] === layerName
                        );
                        const isLoading = originalLayers.some(layer => loadingLayers.has(layer)) ||
                                        loadingLayers.has(layerName);

                        const hasVariants = !!layerLegend.variants;

                        // Determinar leyenda actual (base o variante)
                        let currentLegend = layerLegend;
                        let selectedVariant = null;
                        let availableVariants = [];
                        let isPointLayer = isPointType(layerLegend.type);

                        if (hasVariants) {
                            availableVariants = Object.keys(layerLegend.variants);
                            selectedVariant = activeVariants[layerName] || availableVariants[0];
                            currentLegend = layerLegend.variants[selectedVariant];
                            isPointLayer = isPointType(layerLegend.type, currentLegend.type);
                        }

                        if (!currentLegend) return null;

                        return (
                            <div key={layerName} className={`legend-section ${isLoading ? 'loading' : ''}`}>
                                {/* Header de sección con título y selector de variante */}
                                <div className="legend-section-header">
                                    <h5 className="legend-layer-title">
                                        {layerLegend.title || layerName.split(':')[1] || layerName}
                                        {/* Botón de ayuda para calidad del agua */}
                                        {layerName.includes('calidadagua') && (
                                            <HelpButton
                                                onClick={() => setShowPdfModal(true)}
                                                title="Ver información sobre calidad del agua"
                                            />
                                        )}
                                        {/* Indicador de carga */}
                                        {isLoading && (
                                            <span className="legend-loading-indicator" title="Cargando...">
                                                <span className="loading-spinner"></span>
                                            </span>
                                        )}
                                    </h5>

                                    {/* Selector de variante */}
                                    {hasVariants && (
                                        <div className="legend-variant-wrapper">
                                            <select
                                                id={`variant-${layerName}`}
                                                className="legend-variant-select"
                                                value={selectedVariant}
                                                onChange={(e) => handleVariantChange(layerName, e.target.value)}
                                            >
                                                {availableVariants.map(v => (
                                                    <option key={v} value={v}>
                                                        {v}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                {/* Items de la leyenda */}
                                <ul className="legend-items">
                                    {currentLegend.items && currentLegend.items.map((item, index) => {
                                        const shouldShowAsPoint = isPointLayer;

                                        // Estilos dinámicos del swatch
                                        const swatchStyle = {
                                            backgroundColor: item.color || 'transparent',
                                            border: item.borderColor
                                                ? `2px solid ${item.borderColor}`
                                                : item.color === 'transparent'
                                                    ? '2px solid #ccc'
                                                    : '1px solid #333',
                                            width: item.size ? `${item.size}px` : '16px',
                                            height: item.size ? `${item.size}px` : '16px',
                                            borderRadius: shouldShowAsPoint ? '50%' : '0',
                                        };

                                        return (
                                            <li key={`${layerName}-${index}`} className="legend-item">
                                                <i
                                                    className={`legend-symbol ${shouldShowAsPoint ? 'point' : 'polygon'}`}
                                                    style={swatchStyle}
                                                    aria-hidden="true"
                                                ></i>
                                                <span className="legend-label">{item.label}</span>
                                            </li>
                                        );
                                    })}
                                </ul>

                                {/* Nota adicional */}
                                {currentLegend.note && (
                                    <div className="legend-note">
                                        <small>{currentLegend.note}</small>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal de PDF para información de calidad del agua */}
            <PdfViewerModal
                show={showPdfModal}
                onHide={() => setShowPdfModal(false)}
                pdfUrl="/assets/pdf/calidadAgua.pdf"
                title="Calidad del Agua - Información"
            />
        </div>
    );
};

export default React.memo(Legend);