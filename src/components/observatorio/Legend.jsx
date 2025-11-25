import React, { useState, useMemo } from 'react'; 
import '../styles/legend.css';

// Mapeo de capas antiguas a nuevas claves unificadas
const LEGEND_MAPPING = {
  'Hidalgo:01_spsitios': 'Hidalgo:01_sitios',
  'Hidalgo:01_sbsitios': 'Hidalgo:01_sitios',
  'Hidalgo:01_sbcalidadagua': 'Hidalgo:01_calidadagua',
  'Hidalgo:01_spcalidadagua': 'Hidalgo:01_calidadagua',
};

const Legend = ({ activeLayers, legendData, loadingLayers = new Set(), activeVariants = {}, onVariantChange }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const toggleCollapse = () => {
        setIsCollapsed(prev => !prev);
    };

    const activeLayerNames = Object.keys(activeLayers);

    // Aplicar mapeo y eliminar duplicados
    const layersWithLegend = useMemo(() => {
        if (activeLayerNames.length === 0) return [];
        
        // Mapear capas a sus claves unificadas
        const mappedLayers = activeLayerNames.map(layerName => 
            LEGEND_MAPPING[layerName] || layerName
        );
        
        // Eliminar duplicados
        const uniqueLayers = [...new Set(mappedLayers)];
        
        // Filtrar solo las que tienen leyenda
        return uniqueLayers.filter(layerName =>
            legendData[layerName] &&
            (legendData[layerName].items?.length > 0 || legendData[layerName].variants)
        );
    }, [activeLayers, legendData, activeLayerNames.length]);

    if (layersWithLegend.length === 0) return null;

    const handleVariantChange = (layerName, value) => {
        if (onVariantChange) onVariantChange(layerName, value);
    };

    return (
        <div className={`legend-container ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="legend-header" onClick={toggleCollapse}>
                <h4 className="legend-title">Simbología</h4>
                <span className="legend-badge">{layersWithLegend.length}</span>
            </div>

            {!isCollapsed && (
                <div className="legend-content">
                    {layersWithLegend.map(layerName => {
                        const layerLegend = legendData[layerName];
                        
                        // Verificar si alguna de las capas originales está cargando
                        const originalLayers = Object.keys(LEGEND_MAPPING).filter(
                            key => LEGEND_MAPPING[key] === layerName
                        );
                        const isLoading = originalLayers.some(layer => loadingLayers.has(layer)) || 
                                        loadingLayers.has(layerName);
                        
                        const hasVariants = !!layerLegend.variants;

                        let currentLegend = layerLegend;
                        let selectedVariant = null;
                        let availableVariants = [];

                        if (hasVariants) {
                            availableVariants = Object.keys(layerLegend.variants);
                            selectedVariant = activeVariants[layerName] || availableVariants[0];
                            currentLegend = layerLegend.variants[selectedVariant];
                        }

                        if (!currentLegend) return null;

                        return (
                            <div key={layerName} className={`legend-section ${isLoading ? 'loading' : ''}`}>
                                <div className="legend-section-header">
                                    <h5 className="legend-layer-title">
                                        {layerLegend.title || layerName.split(':')[1] || layerName}
                                        {isLoading && (
                                            <span className="legend-loading-indicator" title="Cargando...">
                                                <span className="loading-spinner"></span>
                                            </span>
                                        )}
                                    </h5>

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

                                <ul className="legend-items">
                                    {currentLegend.items && currentLegend.items.map((item, index) => {
                                        const swatchStyle = {
                                            backgroundColor: item.color || 'transparent',
                                            border: item.borderColor
                                                ? `2px solid ${item.borderColor}`
                                                : item.color === 'transparent'
                                                    ? '2px solid #ccc'
                                                    : '1px solid #333',
                                            width: item.size ? `${item.size}px` : '16px',
                                            height: item.size ? `${item.size}px` : '16px',
                                            borderRadius: currentLegend.type === 'point' || layerLegend.type === 'point' ? '50%' : '0',
                                        };

                                        return (
                                            <li key={`${layerName}-${index}`} className="legend-item">
                                                <i
                                                    className={`legend-symbol ${currentLegend.type || layerLegend.type}`}
                                                    style={swatchStyle}
                                                    aria-hidden="true"
                                                ></i>
                                                <span className="legend-label">{item.label}</span>
                                            </li>
                                        );
                                    })}
                                </ul>

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
        </div>
    );
};

export default React.memo(Legend);