import React from 'react'; // Ya no necesitamos useState aquí
import '../styles/legend.css';

// Recibimos activeVariants como prop nueva 👇
const Legend = ({ activeLayers, legendData, loadingLayers = new Set(), activeVariants = {}, onVariantChange }) => {
  const activeLayerNames = Object.keys(activeLayers);

  if (activeLayerNames.length === 0) return null;

  const layersWithLegend = activeLayerNames.filter(layerName =>
    legendData[layerName] &&
    (legendData[layerName].items?.length > 0 || legendData[layerName].variants)
  );

  if (layersWithLegend.length === 0) return null;

  // Función wrapper para comunicar el cambio al padre
  const handleVariantChange = (layerName, value) => {
    if (onVariantChange) onVariantChange(layerName, value);
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
          const hasVariants = !!layerLegend.variants;

          let currentLegend = layerLegend;
          let selectedVariant = null;
          let availableVariants = [];

          // Lógica corregida para determinar la variante activa
          if (hasVariants) {
            availableVariants = Object.keys(layerLegend.variants);
            
            // 1. Buscamos si el padre nos mandó una variante para esta capa específica
            // 2. Si no, usamos la primera disponible por defecto
            selectedVariant = activeVariants[layerName] || availableVariants[0];

            currentLegend = layerLegend.variants[selectedVariant];
          }

          // 🛡️ PROTECCIÓN CONTRA EL ERROR:
          // Si por alguna razón currentLegend es undefined (ej. cambio rápido de estado),
          // no renderizamos esta sección para evitar el crash "can't access property items".
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

                {/* Selector de variantes */}
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

              {/* Items de simbología */}
              <ul className="legend-items">
                {/* Aquí es donde fallaba antes si currentLegend era undefined */}
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