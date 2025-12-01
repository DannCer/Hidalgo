// src/components/common/VisorBaseImagenes.jsx

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Modal, Spinner, Alert, Button, Form } from 'react-bootstrap';
// Importa tus estilos base que contienen las variables
import '../../styles/visorImagenes.css'; 

// Configuración de zoom
const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.25;

const VisorBaseImagenes = ({ 
  show, 
  onHide, 
  images, // Array de objetos { src, title }
  title,  // Título base del modal
  basePath, // Ruta base para generar URLs (ya integrado en el array 'images')
  sourceText = 'SEMARNATH', // Texto de fuente
  footerShortcutText = '← → navegar | F pantalla completa' 
}) => {
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  
  // Estados de zoom y pan
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const imageRef = useRef(null);
  const imageContainerRef = useRef(null);
  
  // --- Funcionalidad de Zoom/Pan ---

  const resetZoom = useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const getPositionLimits = useCallback(() => {
    const container = imageContainerRef.current;
    const image = imageRef.current;
    
    if (!container || !image) return { maxX: 0, maxY: 0 };
    
    const containerRect = container.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();
    
    // Calcula el tamaño real escalado de la imagen para determinar los límites de arrastre
    const scaledWidth = image.naturalWidth * zoom * (imageRect.width / image.naturalWidth / zoom);
    const scaledHeight = image.naturalHeight * zoom * (imageRect.height / image.naturalHeight / zoom);
    
    const maxX = Math.max(0, (scaledWidth - containerRect.width) / 2);
    const maxY = Math.max(0, (scaledHeight - containerRect.height) / 2);
    
    return { maxX, maxY };
  }, [zoom]);

  // Manejar Zoom (Rueda y Botones)
  const zoomIn = useCallback(() => {
    setZoom(prev => Math.min(MAX_ZOOM, prev + ZOOM_STEP));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom(prev => {
      const newZoom = Math.max(MIN_ZOOM, prev - ZOOM_STEP);
      if (newZoom === 1) setPosition({ x: 0, y: 0 });
      return newZoom;
    });
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom + delta));
    if (newZoom === 1) setPosition({ x: 0, y: 0 });
    setZoom(newZoom);
  }, [zoom]);
  
  // Manejar Pan (Arrastre)
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
  
  // --- Funcionalidad de Navegación y Carga ---

  const currentImage = images[index];
  const totalImages = images.length;
  
  // Carga inicial y reset
  useEffect(() => {
    if (!show || totalImages === 0) return;
    setLoading(true);
    setIndex(0);
    resetZoom();
    
    // Pre-carga inicial (primeras 3)
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

  // Pre-carga adyacente
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

  // Handlers de navegación
  const goToFirst = useCallback(() => { setIndex(0); resetZoom(); }, [resetZoom]);
  const goToLast = useCallback(() => { setIndex(totalImages - 1); resetZoom(); }, [totalImages, resetZoom]);
  const goToPrev = useCallback(() => { 
    setIndex(prev => (prev > 0 ? prev - 1 : totalImages - 1)); 
    resetZoom(); 
  }, [totalImages, resetZoom]);
  const goToNext = useCallback(() => { 
    setIndex(prev => (prev < totalImages - 1 ? prev + 1 : 0)); 
    resetZoom(); 
  }, [totalImages, resetZoom]);
  const handleThumbnailClick = useCallback((idx) => { setIndex(idx); resetZoom(); }, [resetZoom]);
  const handleImageLoad = useCallback((idx) => { setImagesLoaded(prev => prev[idx] ? prev : { ...prev, [idx]: true }); }, []);
  const toggleFullscreen = useCallback(() => { setIsFullscreen(prev => !prev); }, []);

  // Manejo de Descarga
  const handleDownload = useCallback(() => {
    if (!currentImage) return;
    const link = document.createElement('a');
    link.href = currentImage.src;
    link.download = `${title.toLowerCase().replace(/\s+/g, '-')}-${currentImage.title.toLowerCase().replace(/\s+/g, '-')}.jpg`;
    link.click();
  }, [currentImage, title]);

  // Navegación con teclado
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


  if (!show) return null;
  
  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      size="xl" 
      centered 
      // CLASE BASE QUE DEFINE LOS ESTILOS DE VISORIMAGENES.CSS
      className={`visor-imagenes-modal ${isFullscreen ? 'visor-fullscreen' : ''}`}
      backdrop="static"
      fullscreen={isFullscreen}
    >
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
          <div className="loading-container">
            <Spinner animation="border" variant="light" /> {/* Usar variant light para fondo oscuro */}
            <p>Cargando imágenes...</p>
          </div>
        ) : totalImages === 0 ? (
          <Alert variant="warning" className="text-center m-3">
            No hay imágenes disponibles.
          </Alert>
        ) : (
          <div className="visor-content">
            <div className="visor-main">
              <button className="nav-btn nav-prev" onClick={goToPrev} title="Anterior (←)">
                ‹
              </button>
              
              <div 
                className={`image-wrapper ${zoom > 1 ? 'zoomed' : ''}`}
                ref={imageContainerRef}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
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
                
                {/* Controles de zoom (Estilos en visorImagenes.css) */}
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
              
              <button className="nav-btn nav-next" onClick={goToNext} title="Siguiente (→)">
                ›
              </button>
            </div>

            {/* Barra de Progreso (Estilos en visorImagenes.css) */}
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${((index + 1) / totalImages) * 100}%` }}
              />
            </div>

            {/* Controles de Navegación (Estilos en visorImagenes.css) */}
            <div className="visor-controls">
              <div className="controls-left">
                <Button variant="link" size="sm" onClick={goToFirst} disabled={index === 0} title="Primera (Home)">⏮</Button>
                <Button variant="link" size="sm" onClick={goToPrev} title="Anterior (←)">◀</Button>
                
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
                  variant="outline-primary" // ESTANDARIZADO POR GLOBAL.CSS
                  size="sm"
                  onClick={handleDownload}
                  disabled={!imagesLoaded[index]}
                  title="Descargar imagen"
                >
                  ⬇ Descargar
                </Button>
              </div>
            </div>

            {/* Miniaturas (Estilos en visorImagenes.css) */}
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
      
      <Modal.Footer className="visor-imagenes-footer">
        <small className="text-muted">
          Fuente: {sourceText} | {footerShortcutText}
        </small>
      </Modal.Footer>
    </Modal>
  );
};

export default React.memo(VisorBaseImagenes);