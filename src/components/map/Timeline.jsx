
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { normalizeQuincena } from '../../utils/dataUtils';
import '../../styles/timeline.css';

const DEFAULT_DEBOUNCE_MS = 150;
const RAPID_CHANGE_THRESHOLD = 50;

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



  const [localIndex, setLocalIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingValue, setPendingValue] = useState(null);




  const debounceTimerRef = useRef(null);
  const lastChangeTimeRef = useRef(0);
  const lastEmittedValueRef = useRef(null);
  const changeCountRef = useRef(0);




  const normalizedTimePoints = useMemo(() => {
    if (!timePoints || timePoints.length === 0) return [];
    return timePoints.map(tp => normalizeQuincena(tp)).filter(Boolean);
  }, [timePoints]);




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

      const lastIndex = timePoints.length - 1;
      if (localIndex !== lastIndex) {
        setLocalIndex(lastIndex);
      }
    }
  }, [currentTime, normalizedTimePoints, timePoints, isDragging]);




  const handleChange = useCallback((e) => {
    const newIndex = parseInt(e.target.value, 10);
    const now = Date.now();
    const timeSinceLastChange = now - lastChangeTimeRef.current;


    setLocalIndex(newIndex);
    lastChangeTimeRef.current = now;
    changeCountRef.current++;


    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }


    const valueToEmit = timePoints?.[newIndex];
    if (!valueToEmit) return;

    const normalizedValue = normalizeQuincena(valueToEmit);


    if (normalizedValue === lastEmittedValueRef.current) {
      return;
    }

    setPendingValue(normalizedValue);


    const isRapidChange = timeSinceLastChange < RAPID_CHANGE_THRESHOLD;
    const dynamicDelay = isRapidChange ? debounceMs : debounceMs / 2;


    debounceTimerRef.current = setTimeout(() => {
      if (onTimeChange && valueToEmit) {
        lastEmittedValueRef.current = normalizedValue;
        setPendingValue(null);
        onTimeChange(valueToEmit);
      }
    }, dynamicDelay);

  }, [timePoints, onTimeChange, debounceMs]);




  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
    changeCountRef.current = 0;
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);


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




  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);




  if (!timePoints || timePoints.length === 0) {
    return null;
  }




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
      {}
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

      {}
      <div className="timeline-current-label">
        <span className="timeline-label-text">
          {displayLabel}
        </span>

        {}
        {isWaiting && (
          <span className="timeline-status-indicator">
            <span className="timeline-spinner">⏳</span>
          </span>
        )}
      </div>

      {}
      <div className="timeline-progress-bar">
        <div
          className="timeline-progress-fill"
          style={{ width: `${progress}%` }}
        />
        {isWaiting && (
          <div className="timeline-progress-pending" />
        )}
      </div>

      {}
      <div className="timeline-position-info">
        {localIndex + 1} / {timePoints.length}
      </div>
    </div>
  );
};

export default React.memo(Timeline);
