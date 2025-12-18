import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

/**
 * Configuración por defecto para el zoom de imágenes
 */
const DEFAULT_CONFIG = {
  minZoom: 1,      // Zoom mínimo (tamaño original)
  maxZoom: 5,      // Zoom máximo (5x el tamaño original)
  zoomStep: 0.25   // Incremento/decremento por paso de zoom
};

/**
 * Hook personalizado para manejar funcionalidades de zoom y arrastre en imágenes.
 * Proporciona controles de zoom in/out, reset, y navegación mediante arrastre.
 * 
 * @param {Object} config - Configuración personalizada del zoom
 * @param {number} config.minZoom - Zoom mínimo permitido
 * @param {number} config.maxZoom - Zoom máximo permitido
 * @param {number} config.zoomStep - Tamaño del paso de zoom
 * @returns {Object} Objeto con funciones y estado de zoom
 */
export const useImageZoom = (config = {}) => {
  // Fusionar configuración personalizada con valores por defecto
  const { minZoom, maxZoom, zoomStep } = { ...DEFAULT_CONFIG, ...config };

  // Estados del hook
  const [zoom, setZoom] = useState(1);                    // Nivel actual de zoom
  const [position, setPosition] = useState({ x: 0, y: 0 }); // Posición de desplazamiento
  const [isDragging, setIsDragging] = useState(false);    // Estado de arrastre activo
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 }); // Punto inicial de arrastre

  // Referencias a elementos DOM
  const imageRef = useRef(null);      // Referencia al elemento imagen
  const containerRef = useRef(null);  // Referencia al contenedor

  /**
   * Restablece el zoom a su valor original (1x) y centra la imagen
   */
  const resetZoom = useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  /**
   * Calcula los límites de desplazamiento basados en el tamaño del contenedor y el zoom actual
   * @returns {Object} Objeto con límites máximos en X e Y
   */
  const getPositionLimits = useCallback(() => {
    const container = containerRef.current;
    const image = imageRef.current;

    if (!container || !image) return { maxX: 0, maxY: 0 };

    // Calcular dimensiones del contenedor e imagen
    const containerRect = container.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();

    // Calcular dimensiones escaladas de la imagen
    const scaledWidth = image.naturalWidth * zoom * (imageRect.width / image.naturalWidth / zoom);
    const scaledHeight = image.naturalHeight * zoom * (imageRect.height / image.naturalHeight / zoom);

    // Determinar límites de desplazamiento
    const maxX = Math.max(0, (scaledWidth - containerRect.width) / 2);
    const maxY = Math.max(0, (scaledHeight - containerRect.height) / 2);

    return { maxX, maxY };
  }, [zoom]);

  /**
   * Efecto para ajustar la posición cuando cambia el zoom
   * - En zoom 1x: centra la imagen
   * - En zoom >1x: mantiene posición dentro de límites
   */
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

  /**
   * Incrementa el nivel de zoom
   */
  const zoomIn = useCallback(() => {
    setZoom(prev => Math.min(maxZoom, prev + zoomStep));
  }, [maxZoom, zoomStep]);

  /**
   * Decrementa el nivel de zoom
   * Si llega a 1x, centra la imagen automáticamente
   */
  const zoomOut = useCallback(() => {
    setZoom(prev => {
      const newZoom = Math.max(minZoom, prev - zoomStep);
      if (newZoom === 1) setPosition({ x: 0, y: 0 });
      return newZoom;
    });
  }, [minZoom, zoomStep]);

  /**
   * Maneja eventos de rueda del mouse para zoom
   * @param {WheelEvent} e - Evento de rueda
   */
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -zoomStep : zoomStep;
    const newZoom = Math.min(maxZoom, Math.max(minZoom, zoom + delta));
    if (newZoom === 1) setPosition({ x: 0, y: 0 });
    setZoom(newZoom);
  }, [zoom, minZoom, maxZoom, zoomStep]);

  /**
   * Maneja inicio de arrastre
   * @param {MouseEvent} e - Evento de mouse down
   */
  const handleMouseDown = useCallback((e) => {
    if (zoom > 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  }, [zoom, position]);

  /**
   * Maneja movimiento durante arrastre
   * @param {MouseEvent} e - Evento de mouse move
   */
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

  /**
   * Maneja fin de arrastre
   */
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  /**
   * Estilo dinámico para la imagen basado en zoom y posición
   */
  const imageStyle = useMemo(() => ({
    transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
    cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
    transition: isDragging ? 'none' : 'transform 0.15s ease-out',
    transformOrigin: 'center center'
  }), [zoom, position, isDragging]);

  /**
   * Props para el contenedor que maneja eventos de interacción
   */
  const containerProps = useMemo(() => ({
    ref: containerRef,
    onWheel: handleWheel,
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseUp
  }), [handleWheel, handleMouseDown, handleMouseMove, handleMouseUp]);

  // Retorno de valores y funciones del hook
  return {
    zoom,                     // Nivel actual de zoom
    position,                 // Posición actual de desplazamiento
    isDragging,               // Indica si se está arrastrando
    zoomIn,                   // Función para aumentar zoom
    zoomOut,                  // Función para disminuir zoom
    resetZoom,                // Función para resetear zoom
    setZoom,                  // Función para establecer zoom específico
    imageRef,                 // Referencia al elemento imagen
    containerRef,             // Referencia al contenedor
    containerProps,           // Props para el contenedor
    imageStyle,               // Estilo para la imagen
    minZoom,                  // Zoom mínimo configurado
    maxZoom,                  // Zoom máximo configurado
    zoomStep,                 // Paso de zoom configurado
    isZoomed: zoom > 1,       // Indica si hay zoom aplicado
    zoomPercent: Math.round(zoom * 100) // Zoom en porcentaje
  };
};

export default useImageZoom;