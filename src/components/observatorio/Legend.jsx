import React, { useState } from 'react';
import '../styles/legend.css';

const Legend = ({ activeLayers, legendData, loadingLayers = new Set(), onVariantChange }) => {
  const activeLayerNames = Object.keys(activeLayers);
  const [variant, setVariant] = useState('prodfisica');

  // Si no hay capas activas, no mostrar la leyenda
  if (activeLayerNames.length === 0) return null;

  // Filtrar capas que tienen datos de leyenda
  const layersWithLegend = activeLayerNames.filter(layerName =>
    legendData[layerName] &&
    (legendData[layerName].items?.length > 0 || legendData[layerName].variants)
  );

  if (layersWithLegend.length === 0) return null;

  const handleVariantChange = (layerName, value) => {
    setVariant(value);
    if (onVariantChange) onVariantChange(layerName, value); // avisa al mapa para actualizar estilo
  };

  return (
    <div className="legend-container">
      <div className="legend-header">
        <h4 className="legend-title">Simbología</h4>
        <span className="legend-badge">{layersWithLegend.length}</span>
      </div>

      <div className="legend-content">
        {layersWithLegend.map(layerName => {
          const layerLegend = legendData[layerName];
          const isLoading = loadingLayers.has(layerName);

          // 🟢 Caso especial: capa con variantes
          const hasVariants = !!layerLegend.variants;
          const currentLegend = hasVariants
            ? layerLegend.variants[variant]
            : layerLegend;

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

                {/* 🔸 Selector visible solo para capas con variantes */}
                {hasVariants && (
                  <div className="legend-variant-wrapper">
                    <label htmlFor={`variant-${layerName}`} className="legend-variant-label">
                    </label>
                    <select
                      id={`variant-${layerName}`}
                      className="legend-variant-select"
                      value={variant}
                      onChange={(e) => handleVariantChange(layerName, e.target.value)}
                    >
                      <option value="prodfisica">Producción Física</option>
                      <option value="prodeconomica">Producción Económica</option>
                    </select>
                  </div>
                )}
              </div>

              <ul className="legend-items">
                {currentLegend.items.map((item, index) => {
                  const swatchStyle = {
                    backgroundColor: item.color || 'transparent',
                    border: item.borderColor
                      ? `2px solid ${item.borderColor}`
                      : item.color === 'transparent'
                        ? '2px solid #ccc'
                        : '1px solid #333',
                    width: item.size ? `${item.size}px` : '16px',
                    height: item.size ? `${item.size}px` : '16px',
                    borderRadius: layerLegend.type === 'point' ? '50%' : '0',
                  };

                  return (
                    <li key={`${layerName}-${index}`} className="legend-item">
                      <i
                        className={`legend-symbol ${layerLegend.type}`}
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
    </div>
  );
};

export default React.memo(Legend);
