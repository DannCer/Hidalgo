// src/components/observatorio/VisorImagenesAcuiferos.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Carousel, Spinner, Alert, Button } from 'react-bootstrap';
import '../styles/visorImagenes.css';

// Importar imágenes
import acuifero1 from '../../assets/img/acuiferos/acuifero acaxochitlan.jpg';
import acuifero2 from '../../assets/img/acuiferos/acuifero Actopan-Santiago de Anaya.jpg';
import acuifero3 from '../../assets/img/acuiferos/acuifero Ajacuba.jpg';
import acuifero4 from '../../assets/img/acuiferos/acuifero alamo tuxpan.jpg';
import acuifero5 from '../../assets/img/acuiferos/acuifero amajac.jpg';
import acuifero6 from '../../assets/img/acuiferos/acuifero apan.jpg';
import acuifero7 from '../../assets/img/acuiferos/acuifero atlapexco candelaria.jpg';
import acuifero8 from '../../assets/img/acuiferos/acuifero atotonilco jaltocan.jpg';
import acuifero9 from '../../assets/img/acuiferos/acuifero calabozo.jpg';
import acuifero10 from '../../assets/img/acuiferos/acuifero chapantongo alfajayucan.jpg';
import acuifero11 from '../../assets/img/acuiferos/acuifero cuautitlan pachuca.jpg';
import acuifero12 from '../../assets/img/acuiferos/acuifero el astillero.jpg';
import acuifero13 from '../../assets/img/acuiferos/acuifero huasca zoquital.jpg';
import acuifero14 from '../../assets/img/acuiferos/acuifero huichapan-tecozautla.jpg';
import acuifero15 from '../../assets/img/acuiferos/acuifero Ixmiquilpan.jpg';
import acuifero16 from '../../assets/img/acuiferos/acuifero metztitlan.jpg';
import acuifero17 from '../../assets/img/acuiferos/acuifero orizatlan.jpg';
import acuifero18 from '../../assets/img/acuiferos/acuifero tecocomulco.jpg';
import acuifero19 from '../../assets/img/acuiferos/acuifero Tepeji del Rio.jpg';
import acuifero20 from '../../assets/img/acuiferos/acuifero valle de tulancingo.jpg';
import acuifero21 from '../../assets/img/acuiferos/acuifero valle del mezquital.jpg';
import acuifero22 from '../../assets/img/acuiferos/acuifero xochitlan - huejutla.jpg';
import acuifero23 from '../../assets/img/acuiferos/acuifero Zimapan.jpg';

const VisorImagenesAcuiferos = ({ show, onHide }) => {
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState({});

  const imagenesAcuiferos = [
    {
      src: acuifero1,     
    },
    {
      src: acuifero2,     
    },
    {
      src: acuifero3,      
    },
    {
      src: acuifero4,      
    },
    {
      src: acuifero5,     
    },
    {
      src: acuifero6,     
    },
    {
      src: acuifero7,     
    },
    {
      src: acuifero8,     
    },
    {
      src: acuifero9,     
    },
    {
      src: acuifero10,     
    },
    {
      src: acuifero11,     
    },
    {
      src: acuifero12,     
    },
    {
      src: acuifero13,     
    },
    {
      src: acuifero14,     
    },
    {
      src: acuifero15,     
    },
    {
      src: acuifero16,     
    },
    {
      src: acuifero17,     
    },  
    {
      src: acuifero18,     
    },
    {
      src: acuifero19,     
    },
    {
      src: acuifero20,     
    },
    {
      src: acuifero21,     
    },
    {
      src: acuifero22,     
    },
    {
      src: acuifero23,     
    },
  ];

  useEffect(() => {
    if (show) {
      setLoading(true);
      // Preload images
      const loadImages = async () => {
        const loaded = {};
        await Promise.all(
          imagenesAcuiferos.map((img, idx) => {
            return new Promise((resolve) => {
              const image = new Image();
              image.src = img.src;
              image.onload = () => {
                loaded[idx] = true;
                resolve();
              };
              image.onerror = () => {
                loaded[idx] = false;
                resolve();
              };
            });
          })
        );
        setImagesLoaded(loaded);
        setLoading(false);
      };
      
      loadImages();
    }
  }, [show]);

  const handleSelect = (selectedIndex) => {
    setIndex(selectedIndex);
  };

  const handleDownload = (imageSrc, imageTitle) => {
    const link = document.createElement('a');
    link.href = imageSrc;
    link.download = `acuifero-${imageTitle.toLowerCase().replace(/\s+/g, '-')}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImageLoad = (idx) => {
    setImagesLoaded(prev => ({ ...prev, [idx]: true }));
  };

  if (!show) return null;

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      size="xl" 
      centered 
      className="visor-imagenes-modal"
      backdrop="static"
    >
      <Modal.Header closeButton className="visor-imagenes-header">
        <Modal.Title>
          Acuíferos de Hidalgo
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="visor-imagenes-body">
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Cargando imágenes de acuíferos...</p>
          </div>
        ) : imagenesAcuiferos.length === 0 ? (
          <Alert variant="warning" className="text-center m-3">
            No hay imágenes disponibles en este momento.
          </Alert>
        ) : (
          <>
            <Carousel 
              activeIndex={index} 
              onSelect={handleSelect}
              interval={null}
              indicators={true}
              className="visor-carousel"
              prevIcon={<span aria-hidden="true">‹</span>}
              nextIcon={<span aria-hidden="true">›</span>}
            >
              {imagenesAcuiferos.map((image, idx) => (
                <Carousel.Item key={idx}>
                  <div className="image-container">
                    {!imagesLoaded[idx] && (
                      <div className="d-flex justify-content-center align-items-center h-100">
                        <Spinner animation="border" variant="light" />
                      </div>
                    )}
                    <img
                      className={`d-block ${imagesLoaded[idx] ? 'loaded' : 'd-none'}`}
                      src={image.src}
                      alt={image.title}
                      onLoad={() => handleImageLoad(idx)}
                      style={{ 
                        opacity: imagesLoaded[idx] ? 1 : 0,
                        transition: 'opacity 0.3s ease-in-out'
                      }}
                    />
                  </div>  
                </Carousel.Item>
              ))}
            </Carousel>

            <div className="visor-controls">
              <div className="visor-info">
                <small className="text-muted">
                  Imagen {index + 1} de {imagenesAcuiferos.length}
                </small>
              </div>
              
              <div className="visor-actions">
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => handleDownload(imagenesAcuiferos[index]?.src, imagenesAcuiferos[index]?.title)}
                  disabled={!imagesLoaded[index]}
                >
                  📥 Descargar
                </Button>
              </div>
            </div>
          </>
        )}
      </Modal.Body>
      
      <Modal.Footer className="visor-imagenes-footer">
        <small className="text-muted">
          Fuente: Secretaría del Medio Ambiente y Recursos Naturales del Estado de Hidalgo (SEMARNATH)
        </small>
        <Button variant="primary" onClick={onHide}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default VisorImagenesAcuiferos;