import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

const DEFAULT_CONFIG = {
  minZoom: 1,
  maxZoom: 5,
  zoomStep: 0.25
};

export const useImageZoom = (config = {}) => {
  const { minZoom, maxZoom, zoomStep } = { ...DEFAULT_CONFIG, ...config };

  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const imageRef = useRef(null);
  const containerRef = useRef(null);

  const resetZoom = useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const getPositionLimits = useCallback(() => {
    const container = containerRef.current;
    const image = imageRef.current;

    if (!container || !image) return { maxX: 0, maxY: 0 };

    const containerRect = container.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();

    const scaledWidth = image.naturalWidth * zoom * (imageRect.width / image.naturalWidth / zoom);
    const scaledHeight = image.naturalHeight * zoom * (imageRect.height / image.naturalHeight / zoom);

    const maxX = Math.max(0, (scaledWidth - containerRect.width) / 2);
    const maxY = Math.max(0, (scaledHeight - containerRect.height) / 2);

    return { maxX, maxY };
  }, [zoom]);

  useEffect(() => {
    if (zoom === 1) {
      setPosition({ x: 0, y: 0 });
    } else {
      const { maxX, maxY } = getPositionLimits();
      setPosition(prev => ({
        x: Math.min(maxX, Math.max(-maxX, prev.x)),
        y: Math.min(maxY, Math.max(-maxY, prev.y))
      }));
    }
  }, [zoom, getPositionLimits]);

  const zoomIn = useCallback(() => {
    setZoom(prev => Math.min(maxZoom, prev + zoomStep));
  }, [maxZoom, zoomStep]);

  const zoomOut = useCallback(() => {
    setZoom(prev => {
      const newZoom = Math.max(minZoom, prev - zoomStep);
      if (newZoom === 1) setPosition({ x: 0, y: 0 });
      return newZoom;
    });
  }, [minZoom, zoomStep]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -zoomStep : zoomStep;
    const newZoom = Math.min(maxZoom, Math.max(minZoom, zoom + delta));
    if (newZoom === 1) setPosition({ x: 0, y: 0 });
    setZoom(newZoom);
  }, [zoom, minZoom, maxZoom, zoomStep]);

  const handleMouseDown = useCallback((e) => {
    if (zoom > 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  }, [zoom, position]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || zoom <= 1) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    const { maxX, maxY } = getPositionLimits();
    setPosition({
      x: Math.min(maxX, Math.max(-maxX, newX)),
      y: Math.min(maxY, Math.max(-maxY, newY))
    });
  }, [isDragging, dragStart, zoom, getPositionLimits]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const imageStyle = useMemo(() => ({
    transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
    cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
    transition: isDragging ? 'none' : 'transform 0.15s ease-out',
    transformOrigin: 'center center'
  }), [zoom, position, isDragging]);

  const containerProps = useMemo(() => ({
    ref: containerRef,
    onWheel: handleWheel,
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseUp
  }), [handleWheel, handleMouseDown, handleMouseMove, handleMouseUp]);

  return {
    zoom,
    position,
    isDragging,
    zoomIn,
    zoomOut,
    resetZoom,
    setZoom,
    imageRef,
    containerRef,
    containerProps,
    imageStyle,
    minZoom,
    maxZoom,
    zoomStep,
    isZoomed: zoom > 1,
    zoomPercent: Math.round(zoom * 100)
  };
};

export default useImageZoom;
