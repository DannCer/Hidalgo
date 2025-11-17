// src/components/observatorio/MapPopup.jsx
import React from 'react';
import { Popup } from 'react-leaflet';

const MapPopup = ({ popupData, setPopupData }) => {
  if (!popupData) return null;

  // Determinar clase CSS basada en el tipo de popup
  const getPopupClassName = () => {
    const baseClass = "custom-popup";
    return popupData.isSidebar 
      ? `${baseClass} sidebar-popup compact-popup`
      : `${baseClass} default-popup`;
  };

  return (
    <Popup
      position={popupData.position}
      onClose={() => setPopupData(null)}
      className={getPopupClassName()}
      maxWidth={popupData.isSidebar ? 350 : 650}
      maxHeight={400}
      autoPan={false}
      closeOnEscapeKey={true}
      closeButton={true}
    >
      <div
        dangerouslySetInnerHTML={{ __html: popupData.content }}
        className="popup-content compact"
      />
    </Popup>
  );
};

export default MapPopup;