import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal, Spinner, Alert, Button, Form, Row, Col } from 'react-bootstrap';
import { useImageZoom } from '../../hooks/useImageZoom';
import '../../styles/visorImagenes.css';

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

const VisorMapasFertilidad = ({ show, onHide }) => {
  const [selectedMunicipio, setSelectedMunicipio] = useState(MUNICIPIOS[0].id);
  const [selectedParametro, setSelectedParametro] = useState(PARAMETROS[0].id);
  const [loading, setLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const {
    zoom, zoomIn, zoomOut, resetZoom, imageRef, containerRef,
    containerProps, imageStyle, minZoom, maxZoom, isZoomed, zoomPercent
  } = useImageZoom();

  const currentImageUrl = useMemo(() => {
    return `${BASE_PATH}${selectedMunicipio}/${selectedParametro}.png`;
  }, [selectedMunicipio, selectedParametro]);

  const currentMunicipioTitle = useMemo(() =>
    MUNICIPIOS.find(m => m.id === selectedMunicipio)?.title || selectedMunicipio,
  [selectedMunicipio]);

  const currentParametroTitle = useMemo(() =>
    PARAMETROS.find(p => p.id === selectedParametro)?.title || selectedParametro,
  [selectedParametro]);

  useEffect(() => {
    if (!show) return;
    setLoading(true);
    setImageLoaded(false);
    setImageError(false);
    resetZoom();

    const img = new Image();
    img.src = currentImageUrl;
    img.onload = () => { setImageLoaded(true); setLoading(false); };
    img.onerror = () => { setImageError(true); setLoading(false); };
  }, [show, currentImageUrl, resetZoom]);

  useEffect(() => {
    if (!show) return;

    const handleKeyDown = (e) => {
      const mIdx = MUNICIPIOS.findIndex(m => m.id === selectedMunicipio);
      const pIdx = PARAMETROS.findIndex(p => p.id === selectedParametro);

      switch(e.key) {
        case 'ArrowLeft':
          if (pIdx > 0) setSelectedParametro(PARAMETROS[pIdx - 1].id);
          break;
        case 'ArrowRight':
          if (pIdx < PARAMETROS.length - 1) setSelectedParametro(PARAMETROS[pIdx + 1].id);
          break;
        case 'ArrowUp':
          if (mIdx > 0) setSelectedMunicipio(MUNICIPIOS[mIdx - 1].id);
          break;
        case 'ArrowDown':
          if (mIdx < MUNICIPIOS.length - 1) setSelectedMunicipio(MUNICIPIOS[mIdx + 1].id);
          break;
        case 'Escape':
          if (isZoomed) resetZoom();
          else if (isFullscreen) setIsFullscreen(false);
          else onHide();
          break;
        case 'f': case 'F': setIsFullscreen(prev => !prev); break;
        case '+': case '=': zoomIn(); break;
        case '-': zoomOut(); break;
        case '0': resetZoom(); break;
        default: break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [show, onHide, selectedMunicipio, selectedParametro, isFullscreen, isZoomed, resetZoom, zoomIn, zoomOut]);

  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = currentImageUrl;
    link.download = `mapa-fertilidad-${selectedMunicipio}-${selectedParametro}.png`;
    link.click();
  }, [currentImageUrl, selectedMunicipio, selectedParametro]);

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
        <Modal.Title>🗺️ Mapas de Fertilidad - {currentMunicipioTitle}</Modal.Title>
        <div className="header-actions">
          <Button variant="link" className="header-btn" onClick={() => setIsFullscreen(prev => !prev)}
            title={isFullscreen ? 'Salir de pantalla completa (F)' : 'Pantalla completa (F)'}>
            {isFullscreen ? '⊡' : '⛶'}
          </Button>
        </div>
      </Modal.Header>

      <Modal.Body className="visor-imagenes-body">
        <div className="fertilidad-filters">
          <Row className="g-2 align-items-center">
            <Col xs={12} md={5}>
              <Form.Group className="d-flex align-items-center gap-2">
                <Form.Label className="mb-0 text-white text-nowrap"><strong>Municipio:</strong></Form.Label>
                <Form.Select size="sm" value={selectedMunicipio} onChange={(e) => setSelectedMunicipio(e.target.value)} className="fertilidad-select">
                  {MUNICIPIOS.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12} md={5}>
              <Form.Group className="d-flex align-items-center gap-2">
                <Form.Label className="mb-0 text-white text-nowrap"><strong>Parámetro:</strong></Form.Label>
                <Form.Select size="sm" value={selectedParametro} onChange={(e) => setSelectedParametro(e.target.value)} className="fertilidad-select">
                  {PARAMETROS.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12} md={2} className="text-end">
              <Button variant="outline-light" size="sm" onClick={handleDownload} disabled={!imageLoaded} title="Descargar mapa">⬇ Descargar</Button>
            </Col>
          </Row>
        </div>

        <div className="visor-content">
          <div className="visor-main fertilidad-main">
            {loading ? (
              <div className="loading-container"><Spinner animation="border" variant="primary" /><p>Cargando mapa...</p></div>
            ) : imageError ? (
              <Alert variant="warning" className="text-center m-3">No se encontró el mapa para {currentMunicipioTitle} - {currentParametroTitle}</Alert>
            ) : (
              <div className={`image-wrapper ${isZoomed ? 'zoomed' : ''}`} ref={containerRef} {...containerProps}>
                <img ref={imageRef} className={imageLoaded ? 'loaded' : 'loading'} src={currentImageUrl}
                  alt={`Mapa de ${currentParametroTitle} - ${currentMunicipioTitle}`} style={imageStyle} draggable={false}
                  title={isZoomed ? "Arrastra para mover" : "Usa la rueda del mouse para zoom"} />
                <div className="zoom-controls">
                  <Button variant="light" size="sm" onClick={zoomOut} disabled={zoom <= minZoom} title="Alejar (-)">−</Button>
                  <span className="zoom-level">{zoomPercent}%</span>
                  <Button variant="light" size="sm" onClick={zoomIn} disabled={zoom >= maxZoom} title="Acercar (+)">+</Button>
                  {isZoomed && <Button variant="light" size="sm" onClick={resetZoom} title="Restablecer (0)">↺</Button>}
                </div>
              </div>
            )}
          </div>
          <div className="fertilidad-indicator"><span className="badge bg-primary">{currentParametroTitle}</span></div>
        </div>
      </Modal.Body>

      <Modal.Footer className="visor-imagenes-footer">
        <small className="text-muted">Fuente: SEMARNATH | ↑↓ municipio | ←→ parámetro | +/- zoom | F pantalla completa</small>
      </Modal.Footer>
    </Modal>
  );
};

export default React.memo(VisorMapasFertilidad);
