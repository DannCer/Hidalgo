import React from 'react';
import { useLocation } from 'react-router-dom';
import MapView from '../components/map/MapView';

const Observatorio = () => {
  const location = useLocation();

  const initialLayer = location.state?.layerName;
  const sectionIndex = location.state?.sectionIndex;

  return (
    <MapView
      initialLayer={initialLayer}
      sectionIndex={sectionIndex}
    />
  );
};

export default Observatorio;