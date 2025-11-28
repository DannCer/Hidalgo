// src/components/observatorio/Timeline.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { normalizeQuincena } from '../../utils/dataUtils';
import '../styles/timeline.css';

// Configuración
const DEFAULT_DEBOUNCE_MS = 150;
const RAPID_CHANGE_THRESHOLD = 50; // ms entre cambios para considerar "rápido"

const Timeline = ({
  timePoints,
  currentTime,
  onTimeChange,
  formatLabel,
  type = 'discrete',
  debounceMs = DEFAULT_DEBOUNCE_MS,
  isUpdating = false,
  disabled = false
}) => {
  // ===================================================================
  // ESTADOS
  // ===================================================================
  const [localIndex, setLocalIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingValue, setPendingValue] = useState(null);

  // ===================================================================
  // REFS
  // ===================================================================
  const debounceTimerRef = useRef(null);
  const lastChangeTimeRef = useRef(0);
  const lastEmittedValueRef = useRef(null);
  const changeCountRef = useRef(0);

  // ===================================================================
  // NORMALIZAR TIME POINTS
  // ===================================================================
  const normalizedTimePoints = useMemo(() => {
    if (!timePoints || timePoints.length === 0) return [];
    return timePoints.map(tp => normalizeQuincena(tp)).filter(Boolean);
  }, [timePoints]);

  // ===================================================================
  // SINCRONIZAR CON CURRENTTIME EXTERNO
  // ===================================================================
  useEffect(() => {
    if (!timePoints || timePoints.length === 0) return;
    if (isDragging) return; // No sincronizar mientras se arrastra

    const normalizedCurrent = normalizeQuincena(currentTime);
    if (!normalizedCurrent) return;

    const index = normalizedTimePoints.indexOf(normalizedCurrent);
    
    if (index !== -1 && index !== localIndex) {
      setLocalIndex(index);
      lastEmittedValueRef.current = normalizedCurrent;
    } else if (index === -1 && normalizedTimePoints.length > 0) {
      // Fallback al último si no se encuentra
      const lastIndex = timePoints.length - 1;
      if (localIndex !== lastIndex) {
        setLocalIndex(lastIndex);
      }
    }
  }, [currentTime, normalizedTimePoints, timePoints, isDragging]);

  // ===================================================================
  // HANDLER DE CAMBIO CON DEBOUNCE INTELIGENTE
  // ===================================================================
  const handleChange = useCallback((e) => {
    const newIndex = parseInt(e.target.value, 10);
    const now = Date.now();
    const timeSinceLastChange = now - lastChangeTimeRef.current;
    
    // Actualizar UI inmediatamente
    setLocalIndex(newIndex);
    lastChangeTimeRef.current = now;
    changeCountRef.current++;

    // Limpiar timer anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Obtener valor a emitir
    const valueToEmit = timePoints?.[newIndex];
    if (!valueToEmit) return;

    const normalizedValue = normalizeQuincena(valueToEmit);
    
    // Evitar emitir el mismo valor dos veces
    if (normalizedValue === lastEmittedValueRef.current) {
      return;
    }

    setPendingValue(normalizedValue);

    // Calcular delay dinámico basado en velocidad de cambio
    const isRapidChange = timeSinceLastChange < RAPID_CHANGE_THRESHOLD;
    const dynamicDelay = isRapidChange ? debounceMs : debounceMs / 2;

    // Programar emisión del cambio
    debounceTimerRef.current = setTimeout(() => {
      if (onTimeChange && valueToEmit) {
        lastEmittedValueRef.current = normalizedValue;
        setPendingValue(null);
        onTimeChange(valueToEmit);
      }
    }, dynamicDelay);

  }, [timePoints, onTimeChange, debounceMs]);

  // ===================================================================
  // HANDLERS DE DRAG
  // ===================================================================
  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
    changeCountRef.current = 0;
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    
    // Si hubo muchos cambios rápidos, forzar emisión del último valor
    if (changeCountRef.current > 5 && pendingValue) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      const valueToEmit = timePoints?.[localIndex];
      if (valueToEmit && onTimeChange) {
        lastEmittedValueRef.current = normalizeQuincena(valueToEmit);
        setPendingValue(null);
        onTimeChange(valueToEmit);
      }
    }
  }, [localIndex, timePoints, onTimeChange, pendingValue]);

  // ===================================================================
  // LIMPIAR AL DESMONTAR
  // ===================================================================
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // ===================================================================
  // EARLY RETURN SI NO HAY DATOS
  // ===================================================================
  if (!timePoints || timePoints.length === 0) {
    return null;
  }

  // ===================================================================
  // CALCULAR ESTADO VISUAL
  // ===================================================================
  const progress = timePoints.length > 1 
    ? (localIndex / (timePoints.length - 1)) * 100 
    : 0;

  const isWaiting = isUpdating || pendingValue !== null;
  const currentValue = timePoints[localIndex];
  const displayLabel = formatLabel 
    ? formatLabel(currentValue) 
    : currentValue;

  // ===================================================================
  // RENDER
  // ===================================================================
  return (
    <div 
      className={`timeline-container ${isWaiting ? 'timeline-updating' : ''} ${isDragging ? 'timeline-dragging' : ''}`}
    >
      {/* Slider */}
      <input
        type="range"
        min="0"
        max={timePoints.length - 1}
        value={localIndex}
        onChange={handleChange}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        className="timeline-slider"
        disabled={disabled}
        style={{
          '--slider-progress': `${progress}%`
        }}
      />
      
      {/* Etiqueta actual */}
      <div className="timeline-current-label">
        <span className="timeline-label-text">
          {displayLabel}
        </span>
        
        {/* Indicador de estado */}
        {isWaiting && (
          <span className="timeline-status-indicator">
            <span className="timeline-spinner">⏳</span>
          </span>
        )}
      </div>
      
      {/* Barra de progreso visual (opcional) */}
      <div className="timeline-progress-bar">
        <div 
          className="timeline-progress-fill"
          style={{ width: `${progress}%` }}
        />
        {isWaiting && (
          <div className="timeline-progress-pending" />
        )}
      </div>
      
      {/* Info de posición */}
      <div className="timeline-position-info">
        {localIndex + 1} / {timePoints.length}
      </div>
    </div>
  );
};

export default React.memo(Timeline);
