/**
 * @fileoverview Visor de imágenes con funcionalidad completa de galería.
 * 
 * Componente reutilizable para visualizar colecciones de imágenes con:
 * - Navegación entre imágenes (teclado, botones, miniaturas)
 * - Zoom con rueda del mouse y controles
 * - Arrastre para pan cuando hay zoom
 * - Modo pantalla completa
 * - Precarga inteligente de imágenes
 * - Descarga de imagen actual
 * 
 * @module components/common/VisorBaseImagenes
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Modal, Spinner, Alert, Button, Form } from 'react-bootstrap';

import '../../styles/visorImagenes.css'; 

// ============================================================================
// CONSTANTES DE CONFIGURACIÓN
// ============================================================================

/** @constant {number} Nivel mínimo de zoom */
const MIN_ZOOM = 1;

/** @constant {number} Nivel máximo de zoom */
const MAX_ZOOM = 5;

/** @constant {number} Incremento/decremento de zoom por paso */
const ZOOM_STEP = 0.25;

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Visor de imágenes con galería completa.
 * 
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.show - Si el modal está visible
 * @param {Function} props.onHide - Callback para cerrar el modal
 * @param {Array<{src: string, title: string}>} props.images - Array de imágenes
 * @param {string} props.title - Título del visor
 * @param {string} props.basePath - Ruta base de las imágenes (informativo)
 * @param {string} [props.sourceText='SEMARNATH'] - Texto de fuente en el footer
 * @param {string} [props.footerShortcutText] - Texto de atajos de teclado
 * @returns {JSX.Element|null} Modal del visor o null si no está visible
 * 
 * @example
 * <VisorBaseImagenes
 *   show={showVisor}
 *   onHide={() => setShowVisor(false)}
 *   images={[
 *     { src: '/img/foto1.jpg', title: 'Foto 1' },
 *     { src: '/img/foto2.jpg', title: 'Foto 2' }
 *   ]}
 *   title="Galería de Fotos"
 * />
 */
const VisorBaseImagenes = ({ 
  show, 
  onHide, 
  images,
  title,
  basePath,
  sourceText = 'SEMARNATH',
  footerShortcutText = '← → navegar | F pantalla completa' 
}) => {
  // ==========================================================================
  // ESTADOS
  // ==========================================================================
  
  /** @type {[number, Function]} Índice de imagen actual */
  const [index, setIndex] = useState(0);
  
  /** @type {[boolean, Function]} Si está cargando las imágenes iniciales */
  const [loading, setLoading] = useState(true);
  
  /** @type {[Object, Function]} Mapa de imágenes cargadas por índice */
  const [imagesLoaded, setImagesLoaded] = useState({});
  
  /** @type {[boolean, Function]} Si está en modo pantalla completa */
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  /** @type {[boolean, Function]} Si se muestran las miniaturas */
  const [showThumbnails, setShowThumbnails] = useState(false);
  
  // Estados de zoom y pan
  /** @type {[number, Function]} Nivel de zoom actual */
  const [zoom, setZoom] = useState(1);
  
  /** @type {[{x: number, y: number}, Function]} Posición de pan */
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  /** @type {[boolean, Function]} Si está arrastrando la imagen */
  const [isDragging, setIsDragging] = useState(false);
  
  /** @type {[{x: number, y: number}, Function]} Punto de inicio del arrastre */
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // ==========================================================================
  // REFS
  // ==========================================================================
  
  /** @type {React.RefObject<HTMLImageElement>} Referencia a la imagen actual */
  const imageRef = useRef(null);
  
  /** @type {React.RefObject<HTMLDivElement>} Referencia al contenedor de imagen */
  const imageContainerRef = useRef(null);
  
  // ==========================================================================
  // FUNCIONES DE ZOOM
  // ==========================================================================

  /**
   * Restablece el zoom y posición a valores iniciales.
   */
  const resetZoom = useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  /**
   * Calcula los límites de posición para el pan.
   * @returns {{maxX: number, maxY: number}} Límites máximos de desplazamiento
   */
  const getPositionLimits = useCallback(() => {
    const container = imageContainerRef.current;
    const image = imageRef.current;
    
    if (!container || !image) return { maxX: 0, maxY: 0 };
    
    const containerRect = container.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();
    
    // Calcular dimensiones escaladas de la imagen
    const scaledWidth = image.naturalWidth * zoom * (imageRect.width / image.naturalWidth / zoom);
    const scaledHeight = image.naturalHeight * zoom * (imageRect.height / image.naturalHeight / zoom);
    
    const maxX = Math.max(0, (scaledWidth - containerRect.width) / 2);
    const maxY = Math.max(0, (scaledHeight - containerRect.height) / 2);
    
    return { maxX, maxY };
  }, [zoom]);

  /**
   * Incrementa el nivel de zoom.
   */
  const zoomIn = useCallback(() => {
    setZoom(prev => Math.min(MAX_ZOOM, prev + ZOOM_STEP));
  }, []);

  /**
   * Decrementa el nivel de zoom.
   */
  const zoomOut = useCallback(() => {
    setZoom(prev => {
      const newZoom = Math.max(MIN_ZOOM, prev - ZOOM_STEP);
      if (newZoom === 1) setPosition({ x: 0, y: 0 });
      return newZoom;
    });
  }, []);

  /**
   * Maneja el zoom con la rueda del mouse.
   * @param {WheelEvent} e - Evento de rueda
   */
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom + delta));
    if (newZoom === 1) setPosition({ x: 0, y: 0 });
    setZoom(newZoom);
  }, [zoom]);
  
  // ==========================================================================
  // FUNCIONES DE ARRASTRE (PAN)
  // ==========================================================================

  /**
   * Inicia el arrastre de la imagen.
   * @param {React.MouseEvent} e - Evento de mouse
   */
  const handleMouseDown = useCallback((e) => {
    if (zoom > 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  }, [zoom, position]);

  /**
   * Procesa el movimiento durante el arrastre.
   * @param {React.MouseEvent} e - Evento de mouse
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
   * Finaliza el arrastre de la imagen.
   */
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  /**
   * Estilos calculados para la imagen con zoom y posición.
   */
  const imageStyle = useMemo(() => ({
    transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
    cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
    transition: isDragging ? 'none' : 'transform 0.15s ease-out',
    transformOrigin: 'center center'
  }), [zoom, position, isDragging]);
  
  // ==========================================================================
  // VALORES DERIVADOS
  // ==========================================================================

  /** Imagen actualmente visible */
  const currentImage = images[index];
  
  /** Total de imágenes en la galería */
  const totalImages = images.length;
  
  // ==========================================================================
  // EFECTOS - PRECARGA DE IMÁGENES
  // ==========================================================================

  /**
   * Efecto para precargar las primeras imágenes al abrir el visor.
   */
  useEffect(() => {
    if (!show || totalImages === 0) return;
    setLoading(true);
    setIndex(0);
    resetZoom();
    
    // Precargar las primeras 3 imágenes
    const preloadInitial = async () => {
      const initialImages = images.slice(0, 3);
      const loaded = {};
      await Promise.all(
        initialImages.map((img, idx) => 
          new Promise(resolve => {
            const image = new Image();
            image.src = img.src;
            image.onload = () => { loaded[idx] = true; resolve(); };
            image.onerror = () => { loaded[idx] = false; resolve(); };
          })
        )
      );
      setImagesLoaded(loaded);
      setLoading(false);
    };
    preloadInitial();
  }, [show, totalImages, images, resetZoom]);

  /**
   * Efecto para precargar imágenes adyacentes durante la navegación.
   */
  useEffect(() => {
    if (!show || loading) return;
    const indicesToPreload = [index - 1, index + 1, index + 2].filter(
      i => i >= 0 && i < totalImages && !imagesLoaded[i]
    );
    indicesToPreload.forEach(idx => {
      const image = new Image();
      image.src = images[idx].src;
      image.onload = () => {
        setImagesLoaded(prev => ({ ...prev, [idx]: true }));
      };
    });
  }, [index, show, loading, totalImages, images, imagesLoaded]);

  // ==========================================================================
  // FUNCIONES DE NAVEGACIÓN
  // ==========================================================================

  /** Ir a la primera imagen */
  const goToFirst = useCallback(() => { setIndex(0); resetZoom(); }, [resetZoom]);
  
  /** Ir a la última imagen */
  const goToLast = useCallback(() => { setIndex(totalImages - 1); resetZoom(); }, [totalImages, resetZoom]);
  
  /** Ir a la imagen anterior (con wrap) */
  const goToPrev = useCallback(() => { 
    setIndex(prev => (prev > 0 ? prev - 1 : totalImages - 1)); 
    resetZoom(); 
  }, [totalImages, resetZoom]);
  
  /** Ir a la siguiente imagen (con wrap) */
  const goToNext = useCallback(() => { 
    setIndex(prev => (prev < totalImages - 1 ? prev + 1 : 0)); 
    resetZoom(); 
  }, [totalImages, resetZoom]);
  
  /** Navegar a imagen por miniatura */
  const handleThumbnailClick = useCallback((idx) => { setIndex(idx); resetZoom(); }, [resetZoom]);
  
  /** Marcar imagen como cargada */
  const handleImageLoad = useCallback((idx) => { setImagesLoaded(prev => prev[idx] ? prev : { ...prev, [idx]: true }); }, []);
  
  /** Alternar pantalla completa */
  const toggleFullscreen = useCallback(() => { setIsFullscreen(prev => !prev); }, []);

  /**
   * Descarga la imagen actual.
   */
  const handleDownload = useCallback(() => {
    if (!currentImage) return;
    const link = document.createElement('a');
    link.href = currentImage.src;
    link.download = `${title.toLowerCase().replace(/\s+/g, '-')}-${currentImage.title.toLowerCase().replace(/\s+/g, '-')}.jpg`;
    link.click();
  }, [currentImage, title]);

  // ==========================================================================
  // EFECTO - ATAJOS DE TECLADO
  // ==========================================================================

  /**
   * Efecto para manejar atajos de teclado.
   * Atajos disponibles:
   * - ← → : Navegar entre imágenes
   * - F : Pantalla completa
   * - + - : Zoom
   * - 0 : Restablecer zoom
   * - Home/End : Primera/última imagen
   * - Escape : Cerrar o restablecer
   */
  useEffect(() => {
    if (!show) return;
    
    const handleKeyDown = (e) => {
      switch(e.key) {
        case 'ArrowLeft': goToPrev(); break;
        case 'ArrowRight': goToNext(); break;
        case 'Escape': 
          if (zoom > 1) { resetZoom(); } 
          else if (isFullscreen) { setIsFullscreen(false); } 
          else { onHide(); }
          break;
        case 'f':
        case 'F': toggleFullscreen(); break;
        case '+':
        case '=': zoomIn(); break;
        case '-': zoomOut(); break;
        case '0': resetZoom(); break;
        case 'Home': goToFirst(); break;
        case 'End': goToLast(); break;
        default: break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [show, onHide, isFullscreen, zoom, resetZoom, zoomIn, zoomOut, goToPrev, goToNext, toggleFullscreen, goToFirst, goToLast]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  if (!show) return null;
  
  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      size="xl" 
      centered 
      className={`visor-imagenes-modal ${isFullscreen ? 'visor-fullscreen' : ''}`}
      backdrop="static"
      fullscreen={isFullscreen}
    >
      {/* Encabezado con título y botón de pantalla completa */}
      <Modal.Header closeButton className="visor-imagenes-header">
        <Modal.Title>
          {loading ? title : currentImage?.title || title}
        </Modal.Title>
        <div className="header-actions">
          <Button 
            variant="link" 
            className="header-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Salir de pantalla completa (F)' : 'Pantalla completa (F)'}
          >
            {isFullscreen ? '⊡' : '⛶'}
          </Button>
        </div>
      </Modal.Header>
      
      <Modal.Body className="visor-imagenes-body">
        {loading ? (
          /* Estado de carga inicial */
          <div className="loading-container">
            <Spinner animation="border" variant="light" />
            <p>Cargando imágenes...</p>
          </div>
        ) : totalImages === 0 ? (
          /* Sin imágenes disponibles */
          <Alert variant="warning" className="text-center m-3">
            No hay imágenes disponibles.
          </Alert>
        ) : (
          /* Contenido principal del visor */
          <div className="visor-content">
            <div className="visor-main">
              {/* Botón navegación anterior */}
              <button className="nav-btn nav-prev" onClick={goToPrev} title="Anterior (←)">
                ‹
              </button>
              
              {/* Contenedor de imagen con zoom y pan */}
              <div 
                className={`image-wrapper ${zoom > 1 ? 'zoomed' : ''}`}
                ref={imageContainerRef}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* Spinner mientras carga la imagen individual */}
                {!imagesLoaded[index] && (
                  <div className="image-loading">
                    <Spinner animation="border" variant="light" />
                  </div>
                )}
                <img
                  ref={imageRef}
                  className={imagesLoaded[index] ? 'loaded' : 'loading'}
                  src={currentImage?.src}
                  alt={currentImage?.title}
                  onLoad={() => handleImageLoad(index)}
                  style={imageStyle}
                  draggable={false}
                  title={zoom > 1 ? "Arrastra para mover" : "Usa la rueda del mouse para zoom"}
                />
                
                {/* Controles de zoom flotantes */}
                <div className="zoom-controls">
                  <Button variant="light" size="sm" onClick={zoomOut} disabled={zoom <= MIN_ZOOM} title="Alejar (-)">−
                  </Button>
                  <span className="zoom-level">{Math.round(zoom * 100)}%</span>
                  <Button variant="light" size="sm" onClick={zoomIn} disabled={zoom >= MAX_ZOOM} title="Acercar (+)">+
                  </Button>
                  {zoom > 1 && (
                    <Button variant="light" size="sm" onClick={resetZoom} title="Restablecer (0)">
                      ↺
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Botón navegación siguiente */}
              <button className="nav-btn nav-next" onClick={goToNext} title="Siguiente (→)">
                ›
              </button>
            </div>

            {/* Barra de progreso visual */}
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${((index + 1) / totalImages) * 100}%` }}
              />
            </div>

            {/* Controles de navegación inferiores */}
            <div className="visor-controls">
              <div className="controls-left">
                <Button variant="link" size="sm" onClick={goToFirst} disabled={index === 0} title="Primera (Home)">⏮</Button>
                <Button variant="link" size="sm" onClick={goToPrev} title="Anterior (←)">◀</Button>
                
                {/* Selector dropdown de imagen */}
                <Form.Select 
                  size="sm" 
                  value={index} 
                  onChange={(e) => { setIndex(Number(e.target.value)); resetZoom(); }}
                  className="image-selector"
                >
                  {images.map((img, idx) => (
                    <option key={idx} value={idx}>
                      {img.title}
                    </option>
                  ))}
                </Form.Select>
                
                <Button variant="link" size="sm" onClick={goToNext} title="Siguiente (→)">▶</Button>
                <Button variant="link" size="sm" onClick={goToLast} disabled={index === totalImages - 1} title="Última (End)">⏭</Button>
              </div>

              <div className="controls-center">
                <span className="counter">
                  {index + 1} / {totalImages}
                </span>
              </div>
              
              <div className="controls-right">
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setShowThumbnails(prev => !prev)}
                  className={showThumbnails ? 'active' : ''}
                  title="Mostrar/ocultar miniaturas"
                >
                  ▦
                </Button>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={handleDownload}
                  disabled={!imagesLoaded[index]}
                  title="Descargar imagen"
                >
                  ⬇ Descargar
                </Button>
              </div>
            </div>

            {/* Panel de miniaturas (colapsable) */}
            {showThumbnails && (
              <div className="thumbnails-container">
                <div className="thumbnails-scroll">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      className={`thumbnail ${idx === index ? 'active' : ''} ${imagesLoaded[idx] ? 'loaded' : ''}`}
                      onClick={() => handleThumbnailClick(idx)}
                      title={img.title}
                    >
                      <img src={img.src} alt={img.title} loading="lazy" />
                      <span className="thumbnail-index">{idx + 1}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal.Body>
      
      {/* Footer con fuente y atajos */}
      <Modal.Footer className="visor-imagenes-footer">
        <small className="text-muted">
          Fuente: {sourceText} | {footerShortcutText}
        </small>
      </Modal.Footer>
    </Modal>
  );
};

export default React.memo(VisorBaseImagenes);
