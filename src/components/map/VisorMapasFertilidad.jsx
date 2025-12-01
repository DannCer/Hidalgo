// src/components/map/VisorMapasFertilidad.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Modal, Spinner, Alert, Button, Form, Row, Col } from 'react-bootstrap';
import '../../styles/visorImagenes.css';

// Datos de municipios y parámetros
const MUNICIPIOS = [
  { id: 'Almoloya', title: 'Almoloya' },
  { id: 'Apan', title: 'Apan' },
  { id: 'Cuautepec', title: 'Cuautepec de Hinojosa' },
  { id: 'EmilianoZapata', title: 'Emiliano Zapata' },
  { id: 'Singuilucan', title: 'Singuilucan' },
  { id: 'Tepeapulco', title: 'Tepeapulco' },
  { id: 'Tezontepec', title: 'Tezontepec' },
  { id: 'Tlanalapa', title: 'Tlanalapa' },
  { id: 'Zempoala', title: 'Zempoala' },
];

const PARAMETROS = [
  { id: 'Azufre', title: 'Azufre (S)' },
  { id: 'Boro', title: 'Boro (B)' },
  { id: 'Calcio', title: 'Calcio (Ca)' },
  { id: 'CIC', title: 'Cap. Intercambio Catiónico' },
  { id: 'Cobre', title: 'Cobre (Cu)' },
  { id: 'Fosforo', title: 'Fósforo (P)' },
  { id: 'Hierro', title: 'Hierro (Fe)' },
  { id: 'Magnesio', title: 'Magnesio (Mg)' },
  { id: 'Manganeso', title: 'Manganeso (Mn)' },
  { id: 'MateriaOrganica', title: 'Materia Orgánica' },
  { id: 'Nitratos', title: 'Nitratos (NO₃)' },
  { id: 'pH', title: 'pH' },
  { id: 'Potasio', title: 'Potasio (K)' },
  { id: 'Salinidad', title: 'Salinidad (CE)' },
  { id: 'Textura', title: 'Textura' },
  { id: 'Zinc', title: 'Zinc (Zn)' },
];

const BASE_PATH = '/assets/img/Mapas/';

// Configuración de zoom
const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.25;

const VisorMapasFertilidad = ({ show, onHide }) => {
  const [selectedMunicipio, setSelectedMunicipio] = useState(MUNICIPIOS[0].id);
  const [selectedParametro, setSelectedParametro] = useState(PARAMETROS[0].id);
  const [loading, setLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Nuevo estado para el carrusel
  const [showThumbnails, setShowThumbnails] = useState(false);
  
  // Estados de zoom
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const imageRef = useRef(null);
  const imageContainerRef = useRef(null);

  // Generar URL de la imagen actual
  const currentImageUrl = useMemo(() => {
    return `${BASE_PATH}${selectedMunicipio}/${selectedParametro}.png`;
  }, [selectedMunicipio, selectedParametro]);

  // Obtener títulos actuales
  const currentMunicipioTitle = useMemo(() => 
    MUNICIPIOS.find(m => m.id === selectedMunicipio)?.title || selectedMunicipio,
  [selectedMunicipio]);

  const currentParametroTitle = useMemo(() => 
    PARAMETROS.find(p => p.id === selectedParametro)?.title || selectedParametro,
  [selectedParametro]);

  // Reset zoom
  const resetZoom = useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Calcular límites del pan
  const getPositionLimits = useCallback(() => {
    const container = imageContainerRef.current;
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

  // Cargar imagen cuando cambia la selección
  useEffect(() => {
    if (!show) return;
    
    setLoading(true);
    setImageLoaded(false);
    setImageError(false);
    resetZoom();
    
    const img = new Image();
    img.src = currentImageUrl;
    img.onload = () => {
      setImageLoaded(true);
      setLoading(false);
    };
    img.onerror = () => {
      setImageError(true);
      setLoading(false);
    };
  }, [show, currentImageUrl, resetZoom]);

  // Ajustar posición cuando cambia el zoom
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

  // Manejar zoom con rueda del mouse
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom + delta));
    
    if (newZoom === 1) {
      setPosition({ x: 0, y: 0 });
    }
    
    setZoom(newZoom);
  }, [zoom]);

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

  // Manejar arrastre
  const handleMouseDown = useCallback((e) => {
    if (zoom > 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
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

  // Navegación con teclado
  useEffect(() => {
    if (!show) return;
    
    const handleKeyDown = (e) => {
      const currentMunicipioIndex = MUNICIPIOS.findIndex(m => m.id === selectedMunicipio);
      const currentParametroIndex = PARAMETROS.findIndex(p => p.id === selectedParametro);
      
      switch(e.key) {
        case 'ArrowLeft':
          if (currentParametroIndex > 0) setSelectedParametro(PARAMETROS[currentParametroIndex - 1].id);
          break;
        case 'ArrowRight':
          if (currentParametroIndex < PARAMETROS.length - 1) setSelectedParametro(PARAMETROS[currentParametroIndex + 1].id);
          break;
        case 'ArrowUp':
          if (currentMunicipioIndex > 0) setSelectedMunicipio(MUNICIPIOS[currentMunicipioIndex - 1].id);
          break;
        case 'ArrowDown':
          if (currentMunicipioIndex < MUNICIPIOS.length - 1) setSelectedMunicipio(MUNICIPIOS[currentMunicipioIndex + 1].id);
          break;
        case 'Escape':
          if (zoom > 1) resetZoom();
          else if (isFullscreen) setIsFullscreen(false);
          else onHide();
          break;
        case 'f':
        case 'F':
          setIsFullscreen(prev => !prev);
          break;
        case '+':
        case '=':
          zoomIn();
          break;
        case '-':
          zoomOut();
          break;
        case '0':
          resetZoom();
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [show, onHide, selectedMunicipio, selectedParametro, isFullscreen, zoom, resetZoom, zoomIn, zoomOut]);

  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = currentImageUrl;
    link.download = `mapa-fertilidad-${selectedMunicipio}-${selectedParametro}.png`;
    link.click();
  }, [currentImageUrl, selectedMunicipio, selectedParametro]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // Estilo de la imagen con zoom y posición
  const imageStyle = {
    transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
    cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
    transition: isDragging ? 'none' : 'transform 0.15s ease-out',
    transformOrigin: 'center center'
  };

  if (!show) return null;

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      size="xl" 
      centered 
      className={`visor-imagenes-modal visor-fertilidad ${isFullscreen ? 'visor-fullscreen' : ''}`}
      backdrop="static"
      fullscreen={isFullscreen}
    >
      <Modal.Header closeButton className="visor-imagenes-header visor-fertilidad-header">
        <Modal.Title>
          Mapas de Fertilidad - {currentMunicipioTitle}
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
        {/* Filtros */}
        <div className="fertilidad-filters">
          <Row className="g-2 align-items-center">
            <Col xs={12} md={5}>
              <Form.Group className="d-flex align-items-center gap-2">
                <Form.Label className="mb-0 text-white text-nowrap">
                  <strong>Municipio:</strong>
                </Form.Label>
                <Form.Select 
                  size="sm"
                  value={selectedMunicipio}
                  onChange={(e) => setSelectedMunicipio(e.target.value)}
                  className="fertilidad-select"
                >
                  {MUNICIPIOS.map(m => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12} md={5}>
              <Form.Group className="d-flex align-items-center gap-2">
                <Form.Label className="mb-0 text-white text-nowrap">
                  <strong>Parámetro:</strong>
                </Form.Label>
                <Form.Select 
                  size="sm"
                  value={selectedParametro}
                  onChange={(e) => setSelectedParametro(e.target.value)}
                  className="fertilidad-select"
                >
                  {PARAMETROS.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12} md={2} className="text-end d-flex gap-2 justify-content-end">
              {/* Botón para Mostrar/Ocultar Miniaturas */}
              <Button
                variant="link"
                size="sm"
                onClick={() => setShowThumbnails(prev => !prev)}
                className={`text-white p-0 px-2 ${showThumbnails ? 'active' : ''}`}
                title="Mostrar/ocultar miniaturas de parámetros"
                style={{ fontSize: '1.2rem', textDecoration: 'none' }}
              >
                ▦
              </Button>

              <Button
                variant="light"
                size="sm"
                className="btn-download-fertilidad"
                onClick={handleDownload}
                disabled={!imageLoaded}
                title="Descargar mapa"
              >
                ⬇ Descargar
              </Button>
            </Col>
          </Row>
        </div>

        {/* Área de imagen */}
        <div className="visor-content">
          <div className="visor-main fertilidad-main">
            {loading ? (
              <div className="loading-container">
                <Spinner animation="border" variant="light" />
                <p>Cargando mapa...</p>
              </div>
            ) : imageError ? (
              <Alert variant="warning" className="text-center m-3">
                No se encontró el mapa para {currentMunicipioTitle} - {currentParametroTitle}
              </Alert>
            ) : (
              <div 
                className={`image-wrapper ${zoom > 1 ? 'zoomed' : ''}`}
                ref={imageContainerRef}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <img
                  ref={imageRef}
                  className={imageLoaded ? 'loaded' : 'loading'}
                  src={currentImageUrl}
                  alt={`Mapa de ${currentParametroTitle} - ${currentMunicipioTitle}`}
                  style={imageStyle}
                  draggable={false}
                  title={zoom > 1 ? "Arrastra para mover" : "Usa la rueda del mouse para zoom"}
                />
                
                {/* Controles de zoom */}
                <div className="zoom-controls">
                  <Button 
                    variant="light" 
                    size="sm" 
                    onClick={zoomOut} 
                    disabled={zoom <= MIN_ZOOM}
                    title="Alejar (-)"
                  >
                    −
                  </Button>
                  <span className="zoom-level">{Math.round(zoom * 100)}%</span>
                  <Button 
                    variant="light" 
                    size="sm" 
                    onClick={zoomIn} 
                    disabled={zoom >= MAX_ZOOM}
                    title="Acercar (+)"
                  >
                    +
                  </Button>
                  {zoom > 1 && (
                    <Button 
                      variant="light" 
                      size="sm" 
                      onClick={resetZoom}
                      title="Restablecer (0)"
                    >
                      ↺
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Carrusel de Miniaturas (Muestra los parámetros del municipio actual) */}
          {showThumbnails && (
            <div className="thumbnails-container">
              <div className="thumbnails-scroll">
                {PARAMETROS.map((param, idx) => (
                  <button
                    key={param.id}
                    className={`thumbnail ${param.id === selectedParametro ? 'active' : ''}`}
                    onClick={() => {
                        setSelectedParametro(param.id);
                        resetZoom(); // Resetear zoom al cambiar imagen
                    }}
                    title={param.title}
                  >
                    {/* Cargamos la miniatura del parámetro correspondiente al municipio actual */}
                    <img 
                      src={`${BASE_PATH}${selectedMunicipio}/${param.id}.png`} 
                      alt={param.title} 
                      loading="lazy" 
                    />
                    {/* Mostrar índice o abreviación si se prefiere */}
                    <span className="thumbnail-index">{idx + 1}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Indicador de parámetro actual */}
          <div className="fertilidad-indicator">
            <span className="badge bg-primary"> 
              {currentParametroTitle}
            </span>
          </div>
        </div>
      </Modal.Body>
      
      <Modal.Footer className="visor-imagenes-footer">
        <small className="text-muted">
          Fuente: SEMARNATH | ↑↓ municipio | ←→ parámetro | +/- zoom | F pantalla completa
        </small>
      </Modal.Footer>
    </Modal>
  );
};

export default React.memo(VisorMapasFertilidad);