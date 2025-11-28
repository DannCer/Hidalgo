// src/components/observatorio/VisorImagenesAcuiferos.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal, Spinner, Alert, Button, Form } from 'react-bootstrap';
import '../styles/visorImagenes.css';

const ACUIFEROS_DATA = [
  { file: 'acuifero acaxochitlan.jpg', title: 'Acaxochitlan' },
  { file: 'acuifero Actopan-Santiago de Anaya.jpg', title: 'Actopan Santiago de Anaya' },
  { file: 'acuifero Ajacuba.jpg', title: 'Ajacuba' },
  { file: 'acuifero alamo tuxpan.jpg', title: 'Alamo Tuxpan' },
  { file: 'acuifero amajac.jpg', title: 'Amajac' },
  { file: 'acuifero apan.jpg', title: 'Apan' },
  { file: 'acuifero atlapexco candelaria.jpg', title: 'Atlapexco Candelaria' },
  { file: 'acuifero atotonilco jaltocan.jpg', title: 'Atotonilco Jaltocan' },
  { file: 'acuifero calabozo.jpg', title: 'Calabozo' },
  { file: 'acuifero chapantongo alfajayucan.jpg', title: 'Chapantongo Alfajayucan' },
  { file: 'acuifero cuautitlan pachuca.jpg', title: 'Cuautitlan Pachuca' },
  { file: 'acuifero el astillero.jpg', title: 'El Astillero' },
  { file: 'acuifero huasca zoquital.jpg', title: 'Huasca Zoquital' },
  { file: 'acuifero huichapan-tecozautla.jpg', title: 'Huichapan Tecozautla' },
  { file: 'acuifero Ixmiquilpan.jpg', title: 'Ixmiquilpan' },
  { file: 'acuifero metztitlan.jpg', title: 'Metztitlan' },
  { file: 'acuifero orizatlan.jpg', title: 'Orizatlan' },
  { file: 'acuifero tecocomulco.jpg', title: 'Tecocomulco' },
  { file: 'acuifero Tepeji del Rio.jpg', title: 'Tepeji del Rio' },
  { file: 'acuifero valle de tulancingo.jpg', title: 'Valle de Tulancingo' },
  { file: 'acuifero valle del mezquital.jpg', title: 'Valle del Mezquital' },
  { file: 'acuifero xochitlan - huejutla.jpg', title: 'Xochitlan Huejutla' },
  { file: 'acuifero Zimapan.jpg', title: 'Zimapan' },
];

const BASE_PATH = '/assets/img/acuiferos/';

const VisorImagenesAcuiferos = ({ show, onHide }) => {
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);

  const imagenesAcuiferos = useMemo(() => 
    ACUIFEROS_DATA.map(item => ({
      src: `${BASE_PATH}${item.file}`,
      title: item.title
    })),
  []);

  // Precargar imágenes iniciales
  useEffect(() => {
    if (!show) return;
    
    setLoading(true);
    setIndex(0);
    
    const preloadInitial = async () => {
      const initialImages = imagenesAcuiferos.slice(0, 3);
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
  }, [show, imagenesAcuiferos]);

  // Precargar imágenes adyacentes
  useEffect(() => {
    if (!show || loading) return;
    
    const indicesToPreload = [index - 1, index + 1, index + 2].filter(
      i => i >= 0 && i < imagenesAcuiferos.length && !imagesLoaded[i]
    );
    
    indicesToPreload.forEach(idx => {
      const image = new Image();
      image.src = imagenesAcuiferos[idx].src;
      image.onload = () => {
        setImagesLoaded(prev => ({ ...prev, [idx]: true }));
      };
    });
  }, [index, show, loading, imagenesAcuiferos, imagesLoaded]);

  // Navegación con teclado
  useEffect(() => {
    if (!show) return;
    
    const handleKeyDown = (e) => {
      switch(e.key) {
        case 'ArrowLeft':
          setIndex(prev => (prev > 0 ? prev - 1 : imagenesAcuiferos.length - 1));
          break;
        case 'ArrowRight':
          setIndex(prev => (prev < imagenesAcuiferos.length - 1 ? prev + 1 : 0));
          break;
        case 'Escape':
          if (isFullscreen) {
            setIsFullscreen(false);
          } else {
            onHide();
          }
          break;
        case 'f':
        case 'F':
          setIsFullscreen(prev => !prev);
          break;
        case 'Home':
          setIndex(0);
          break;
        case 'End':
          setIndex(imagenesAcuiferos.length - 1);
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [show, onHide, imagenesAcuiferos.length, isFullscreen]);

  const handleThumbnailClick = useCallback((idx) => {
    setIndex(idx);
  }, []);

  const handleImageLoad = useCallback((idx) => {
    setImagesLoaded(prev => prev[idx] ? prev : { ...prev, [idx]: true });
  }, []);

  const handleDownload = useCallback(() => {
    const current = imagenesAcuiferos[index];
    if (!current) return;
    
    const link = document.createElement('a');
    link.href = current.src;
    link.download = `acuifero-${current.title.toLowerCase().replace(/\s+/g, '-')}.jpg`;
    link.click();
  }, [index, imagenesAcuiferos]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  const goToFirst = useCallback(() => setIndex(0), []);
  const goToLast = useCallback(() => setIndex(imagenesAcuiferos.length - 1), [imagenesAcuiferos.length]);
  const goToPrev = useCallback(() => setIndex(prev => (prev > 0 ? prev - 1 : imagenesAcuiferos.length - 1)), [imagenesAcuiferos.length]);
  const goToNext = useCallback(() => setIndex(prev => (prev < imagenesAcuiferos.length - 1 ? prev + 1 : 0)), [imagenesAcuiferos.length]);

  const currentImage = imagenesAcuiferos[index];

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
      <Modal.Header closeButton className="visor-imagenes-header">
        <Modal.Title>
          {loading ? 'Acuíferos de Hidalgo' : currentImage?.title || 'Acuíferos de Hidalgo'}
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
            <Spinner animation="border" variant="primary" />
            <p>Cargando imágenes...</p>
          </div>
        ) : imagenesAcuiferos.length === 0 ? (
          <Alert variant="warning" className="text-center m-3">
            No hay imágenes disponibles.
          </Alert>
        ) : (
          <div className="visor-content">
            <div className="visor-main">
              <button className="nav-btn nav-prev" onClick={goToPrev} title="Anterior (←)">
                ‹
              </button>
              
              <div className="image-wrapper">
                {!imagesLoaded[index] && (
                  <div className="image-loading">
                    <Spinner animation="border" variant="light" />
                  </div>
                )}
                <img
                  className={imagesLoaded[index] ? 'loaded' : 'loading'}
                  src={currentImage?.src}
                  alt={currentImage?.title}
                  onLoad={() => handleImageLoad(index)}
                  onClick={toggleFullscreen}
                  title="Clic para pantalla completa"
                />
              </div>
              
              <button className="nav-btn nav-next" onClick={goToNext} title="Siguiente (→)">
                ›
              </button>
            </div>

            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${((index + 1) / imagenesAcuiferos.length) * 100}%` }}
              />
            </div>

            <div className="visor-controls">
              <div className="controls-left">
                <Button variant="link" size="sm" onClick={goToFirst} disabled={index === 0} title="Primera (Home)">
                  ⏮
                </Button>
                <Button variant="link" size="sm" onClick={goToPrev} title="Anterior (←)">
                  ◀
                </Button>
                
                <Form.Select 
                  size="sm" 
                  value={index} 
                  onChange={(e) => setIndex(Number(e.target.value))}
                  className="image-selector"
                >
                  {imagenesAcuiferos.map((img, idx) => (
                    <option key={idx} value={idx}>
                      {img.title}
                    </option>
                  ))}
                </Form.Select>
                
                <Button variant="link" size="sm" onClick={goToNext} title="Siguiente (→)">
                  ▶
                </Button>
                <Button variant="link" size="sm" onClick={goToLast} disabled={index === imagenesAcuiferos.length - 1} title="Última (End)">
                  ⏭
                </Button>
              </div>

              <div className="controls-center">
                <span className="counter">
                  {index + 1} / {imagenesAcuiferos.length}
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

            {showThumbnails && (
              <div className="thumbnails-container">
                <div className="thumbnails-scroll">
                  {imagenesAcuiferos.map((img, idx) => (
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
          Fuente: SEMARNATH | ← → navegar | F pantalla completa
        </small>
      </Modal.Footer>
    </Modal>
  );
};

export default React.memo(VisorImagenesAcuiferos);