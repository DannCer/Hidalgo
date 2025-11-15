import React from 'react';
import '../styles/timeline.css';

const Timeline = ({
  timePoints,
  currentTime,
  onTimeChange,
  formatLabel,
  type = 'discrete'
}) => {
  if (!timePoints || timePoints.length === 0) return null;

  const currentIndex = timePoints.indexOf(currentTime);

  return (
    <div className="timeline-container">
      <input
        type="range"
        min="0"
        max={timePoints.length - 1}
        value={currentIndex}
        onChange={(e) => onTimeChange(timePoints[e.target.value])}
        className="timeline-slider"
      />
      {/* Etiqueta actual */}
      <div className="timeline-current-label">
        {formatLabel ? formatLabel(currentTime) : currentTime}
      </div>
    </div>
  );
};

export default Timeline;