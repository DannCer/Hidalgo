import React from 'react';
import { useLocation } from 'react-router-dom';
import MapView from '../components/map/MapView';

/**
 * Componente Observatorio - Vista del mapa interactivo.
 * Actúa como contenedor para el componente MapView, pasando parámetros de navegación.
 * Recibe parámetros de la ruta para inicializar capas específicas.
 * 
 * @returns {JSX.Element} Componente contenedor del mapa
 */
const Observatorio = () => {
  // Hook para acceder al estado de la ruta actual
  const location = useLocation();

  // Extraer parámetros de navegación del estado de la ruta
  const initialLayer = location.state?.layerName;    // Capa inicial a cargar
  const sectionIndex = location.state?.sectionIndex; // Índice de sección para scroll

  return (
    // Componente principal del mapa con parámetros de inicialización
    <MapView
      initialLayer={initialLayer}   // Capa que se cargará automáticamente
      sectionIndex={sectionIndex}   // Índice para posicionamiento en panel lateral
    />
  );
};

export default Observatorio;