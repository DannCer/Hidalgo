// src/components/observatorio/Timeline.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import '../styles/timeline.css';

/**
 * Timeline component optimizado para cambios rápidos
 * ✅ CORREGIDO: Todos los hooks se llaman incondicionalmente
 */
const Timeline = ({
  timePoints,
  currentTime,
  onTimeChange,
  formatLabel,
  type = 'discrete',
  debounceMs = 0,
  isUpdating = false
}) => {
  // ✅ HOOKS SIEMPRE PRIMERO - ANTES DE CUALQUIER RETURN
  const [localIndex, setLocalIndex] = useState(0);
  const debounceTimerRef = useRef(null);

  // ✅ useMemo para normalización (siempre se ejecuta)
  const normalizedTimePoints = React.useMemo(() => {
    if (!timePoints || timePoints.length === 0) return [];
    
    return timePoints.map(tp => 
      tp?.toString().replace('Z', '').replace('T00:00:00.000', '').trim()
    );
  }, [timePoints]);

  // ✅ Efecto para sincronizar con currentTime externo
  useEffect(() => {
    if (!timePoints || timePoints.length === 0) return;
    
    const normalizedCurrent = currentTime?.toString()
      .replace('Z', '')
      .replace('T00:00:00.000', '')
      .trim();
    
    const index = normalizedTimePoints.indexOf(normalizedCurrent);
    
    if (index !== -1 && index !== localIndex) {
      setLocalIndex(index);
    } else if (index === -1 && localIndex !== timePoints.length - 1) {
      // Fallback al último si no se encuentra
      console.warn('⚠️ Timeline: currentTime no encontrado, usando último', {
        currentTime: normalizedCurrent,
        available: normalizedTimePoints.slice(-3)
      });
      setLocalIndex(timePoints.length - 1);
    }
  }, [currentTime, normalizedTimePoints, timePoints, localIndex]);

  // ✅ Handler con debouncing opcional
  const handleChange = useCallback((e) => {
    const newIndex = parseInt(e.target.value, 10);
    
    // Actualizar UI inmediatamente
    setLocalIndex(newIndex);

    // Limpiar timer anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const executeChange = () => {
      if (timePoints && timePoints[newIndex]) {
        onTimeChange(timePoints[newIndex]);
      }
    };

    // Aplicar debounce solo si está configurado
    if (debounceMs > 0) {
      debounceTimerRef.current = setTimeout(executeChange, debounceMs);
    } else {
      executeChange();
    }
  }, [timePoints, onTimeChange, debounceMs]);

  // ✅ Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // ✅ AHORA SÍ - VALIDACIONES Y EARLY RETURNS DESPUÉS DE LOS HOOKS
  if (!timePoints || timePoints.length === 0) {
    console.warn('⚠️ Timeline: No hay timePoints disponibles');
    return null;
  }

  // Calcular progreso para el estilo
  const progress = timePoints.length > 1 
    ? (localIndex / (timePoints.length - 1)) * 100 
    : 0;

  return (
    <div className={`timeline-container ${isUpdating ? 'timeline-updating' : ''}`}>
      {/* Slider */}
      <input
        type="range"
        min="0"
        max={timePoints.length - 1}
        value={localIndex}
        onChange={handleChange}
        className="timeline-slider"
        disabled={isUpdating}
        style={{
          '--slider-progress': `${progress}%`
        }}
      />
      
      {/* Etiqueta actual */}
      <div className="timeline-current-label">
        {formatLabel ? formatLabel(timePoints[localIndex]) : timePoints[localIndex]}
        {isUpdating && <span className="timeline-spinner"> ⏳</span>}
      </div>
      
      {/* Debug info (solo en desarrollo) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="timeline-debug-info">
          {localIndex + 1} / {timePoints.length}
          {debounceMs > 0 && ` (debounce: ${debounceMs}ms)`}
        </div>
      )}
    </div>
  );
};

export default React.memo(Timeline);