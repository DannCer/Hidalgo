/**
 * @fileoverview Componente de línea de tiempo para navegación temporal.
 * 
 * Slider interactivo para navegar entre diferentes puntos temporales
 * (quincenas, meses, años). Incluye debouncing adaptativo para evitar
 * múltiples solicitudes durante el arrastre.
 * 
 * @module components/map/Timeline
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { normalizeQuincena } from '../../utils/dataUtils';
import '../../styles/timeline.css';

// ============================================================================
// CONSTANTES
// ============================================================================

/** @constant {number} Tiempo de debounce por defecto en ms */
const DEFAULT_DEBOUNCE_MS = 150;

/** @constant {number} Umbral para detectar cambios rápidos en ms */
const RAPID_CHANGE_THRESHOLD = 50;

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Componente de línea de tiempo con slider.
 * 
 * Características:
 * - Navegación discreta entre puntos temporales
 * - Debouncing adaptativo según velocidad de arrastre
 * - Indicador visual de estado (cargando/pendiente)
 * - Barra de progreso
 * - Soporte táctil
 * 
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {Array<string>} props.timePoints - Array de puntos temporales
 * @param {string} props.currentTime - Valor temporal actual
 * @param {Function} props.onTimeChange - Callback cuando cambia el tiempo
 * @param {Function} [props.formatLabel] - Función para formatear etiquetas
 * @param {string} [props.type='discrete'] - Tipo de timeline
 * @param {number} [props.debounceMs=150] - Tiempo de debounce
 * @param {boolean} [props.isUpdating=false] - Si está actualizando datos
 * @param {boolean} [props.disabled=false] - Si está deshabilitado
 * @returns {JSX.Element|null} Componente Timeline o null si no hay datos
 * 
 * @example
 * <Timeline
 *   timePoints={['2024-01-01', '2024-01-15', '2024-02-01']}
 *   currentTime="2024-01-15"
 *   onTimeChange={(value) => handleChange(value)}
 *   formatLabel={(v) => formatQuincena(v)}
 * />
 */
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

  // ==========================================================================
  // ESTADOS
  // ==========================================================================

  /** @type {[number, Function]} Índice local del slider (UI optimista) */
  const [localIndex, setLocalIndex] = useState(0);
  
  /** @type {[boolean, Function]} Si el usuario está arrastrando */
  const [isDragging, setIsDragging] = useState(false);
  
  /** @type {[string|null, Function]} Valor pendiente de emitir */
  const [pendingValue, setPendingValue] = useState(null);

  // ==========================================================================
  // REFS
  // ==========================================================================

  /** @type {React.MutableRefObject<number|null>} Timer del debounce */
  const debounceTimerRef = useRef(null);
  
  /** @type {React.MutableRefObject<number>} Timestamp del último cambio */
  const lastChangeTimeRef = useRef(0);
  
  /** @type {React.MutableRefObject<string|null>} Último valor emitido */
  const lastEmittedValueRef = useRef(null);
  
  /** @type {React.MutableRefObject<number>} Contador de cambios rápidos */
  const changeCountRef = useRef(0);

  // ==========================================================================
  // VALORES MEMORIZADOS
  // ==========================================================================

  /**
   * Puntos temporales normalizados para comparación consistente.
   */
  const normalizedTimePoints = useMemo(() => {
    if (!timePoints || timePoints.length === 0) return [];
    return timePoints.map(tp => normalizeQuincena(tp)).filter(Boolean);
  }, [timePoints]);

  // ==========================================================================
  // EFECTOS
  // ==========================================================================

  /**
   * Sincroniza el índice local cuando cambia el tiempo externo.
   * No actualiza si el usuario está arrastrando (para evitar saltos).
   */
  useEffect(() => {
    if (!timePoints || timePoints.length === 0) return;
    if (isDragging) return;

    const normalizedCurrent = normalizeQuincena(currentTime);
    if (!normalizedCurrent) return;

    const index = normalizedTimePoints.indexOf(normalizedCurrent);

    if (index !== -1 && index !== localIndex) {
      setLocalIndex(index);
      lastEmittedValueRef.current = normalizedCurrent;
    } else if (index === -1 && normalizedTimePoints.length > 0) {
      // Si no se encuentra, ir al último índice
      const lastIndex = timePoints.length - 1;
      if (localIndex !== lastIndex) {
        setLocalIndex(lastIndex);
      }
    }
  }, [currentTime, normalizedTimePoints, timePoints, isDragging]);

  /**
   * Limpieza del timer de debounce al desmontar.
   */
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // ==========================================================================
  // MANEJADORES DE EVENTOS
  // ==========================================================================

  /**
   * Maneja el cambio del slider con debouncing adaptativo.
   * Ajusta el delay según la velocidad de cambio del usuario.
   * @param {React.ChangeEvent<HTMLInputElement>} e - Evento de cambio
   */
  const handleChange = useCallback((e) => {
    const newIndex = parseInt(e.target.value, 10);
    const now = Date.now();
    const timeSinceLastChange = now - lastChangeTimeRef.current;

    // Actualización inmediata de la UI
    setLocalIndex(newIndex);
    lastChangeTimeRef.current = now;
    changeCountRef.current++;

    // Limpiar timer anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Obtener y normalizar el valor
    const valueToEmit = timePoints?.[newIndex];
    if (!valueToEmit) return;

    const normalizedValue = normalizeQuincena(valueToEmit);

    // Evitar emitir el mismo valor
    if (normalizedValue === lastEmittedValueRef.current) {
      return;
    }

    setPendingValue(normalizedValue);

    // Debounce adaptativo: más rápido si el usuario va lento
    const isRapidChange = timeSinceLastChange < RAPID_CHANGE_THRESHOLD;
    const dynamicDelay = isRapidChange ? debounceMs : debounceMs / 2;

    // Emitir después del debounce
    debounceTimerRef.current = setTimeout(() => {
      if (onTimeChange && valueToEmit) {
        lastEmittedValueRef.current = normalizedValue;
        setPendingValue(null);
        onTimeChange(valueToEmit);
      }
    }, dynamicDelay);

  }, [timePoints, onTimeChange, debounceMs]);

  /**
   * Inicia el modo de arrastre.
   */
  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
    changeCountRef.current = 0;
  }, []);

  /**
   * Finaliza el modo de arrastre.
   * Si hubo muchos cambios rápidos, emite inmediatamente el valor final.
   */
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);

    // Si hubo arrastre largo, emitir inmediatamente
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

  // ==========================================================================
  // RENDER
  // ==========================================================================

  // No renderizar si no hay datos
  if (!timePoints || timePoints.length === 0) {
    return null;
  }

  // Calcular valores para la UI
  const progress = timePoints.length > 1
    ? (localIndex / (timePoints.length - 1)) * 100
    : 0;

  const isWaiting = isUpdating || pendingValue !== null;
  const currentValue = timePoints[localIndex];
  const displayLabel = formatLabel
    ? formatLabel(currentValue)
    : currentValue;

  return (
    <div
      className={`timeline-container ${isWaiting ? 'timeline-updating' : ''} ${isDragging ? 'timeline-dragging' : ''}`}
    >
      {/* Slider principal */}
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

      {/* Etiqueta del valor actual */}
      <div className="timeline-current-label">
        <span className="timeline-label-text">
          {displayLabel}
        </span>

        {/* Indicador de carga */}
        {isWaiting && (
          <span className="timeline-status-indicator">
            <span className="timeline-spinner">⏳</span>
          </span>
        )}
      </div>

      {/* Barra de progreso visual */}
      <div className="timeline-progress-bar">
        <div
          className="timeline-progress-fill"
          style={{ width: `${progress}%` }}
        />
        {isWaiting && (
          <div className="timeline-progress-pending" />
        )}
      </div>

      {/* Contador de posición */}
      <div className="timeline-position-info">
        {localIndex + 1} / {timePoints.length}
      </div>
    </div>
  );
};

export default React.memo(Timeline);
