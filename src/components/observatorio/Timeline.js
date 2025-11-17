// src/components/observatorio/Timeline.jsx
import React from 'react';
import '../styles/timeline.css';

const Timeline = ({
  timePoints,
  currentTime,
  onTimeChange,
  formatLabel,
  type = 'discrete'
}) => {
  if (!timePoints || timePoints.length === 0) {
    console.warn('⚠️ Timeline: No hay timePoints disponibles');
    return null;
  }

  // Normalizar currentTime para comparación
  const normalizedCurrentTime = currentTime?.toString().replace('Z', '').trim();
  
  // Normalizar timePoints para comparación
  const normalizedTimePoints = timePoints.map(tp => 
    tp?.toString().replace('Z', '').trim()
  );

  // Buscar índice con valores normalizados
  let currentIndex = normalizedTimePoints.indexOf(normalizedCurrentTime);
  
  // Si no se encuentra, usar el último índice como fallback
  if (currentIndex === -1) {
    console.warn('⚠️ Timeline: currentTime no encontrado en timePoints', {
      currentTime: normalizedCurrentTime,
      availablePoints: normalizedTimePoints.slice(0, 5)
    });
    currentIndex = timePoints.length - 1;
  };

  const handleChange = (e) => {
    const newIndex = parseInt(e.target.value, 10);
    const newValue = timePoints[newIndex];        
    if (newValue) {
      onTimeChange(newValue);
    }
  };

  return (
    <div className="timeline-container">

      {/* Slider */}
      <input
        type="range"
        min="0"
        max={timePoints.length - 1}
        value={currentIndex}
        onChange={handleChange}
        className="timeline-slider"
        style={{
          '--slider-progress': `${(currentIndex / (timePoints.length - 1)) * 100}%`
        }}
      />

      {/* Etiqueta actual */}
      <div className="timeline-current-label">
        {formatLabel ? formatLabel(currentTime) : currentTime}
      </div>

      {/* Debug info (remover en producción) */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ fontSize: '0.7rem', color: '#999', marginTop: '4px', textAlign: 'center' }}>
          {currentIndex + 1} / {timePoints.length}
        </div>
      )}
    </div>
  );
};

export default Timeline;