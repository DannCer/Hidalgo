import { useEffect } from 'react';
import { useMapEvents } from 'react-leaflet';
import L from 'leaflet';

function KeepPopupInView() {
  const map = useMapEvents({});

  useEffect(() => {
    const adjustPopup = (e) => {
      const popup = e.popup;
      const popupEl = popup.getElement();
      if (!popupEl) return;

      const mapSize = map.getSize();
      const popupPos = map.latLngToContainerPoint(popup.getLatLng());
      const popupHeight = popupEl.offsetHeight;
      const popupWidth = popupEl.offsetWidth;

      let offsetX = 0;
      let offsetY = 0;

      if (popupPos.y - popupHeight / 2 < 0) {
        offsetY = Math.abs(popupPos.y - popupHeight / 2) + 10;
      }
      if (popupPos.y + popupHeight / 2 > mapSize.y) {
        offsetY = -(popupPos.y + popupHeight / 2 - mapSize.y) - 10;
      }
      if (popupPos.x - popupWidth / 2 < 0) {
        offsetX = Math.abs(popupPos.x - popupWidth / 2) + 10;
      }
      if (popupPos.x + popupWidth / 2 > mapSize.x) {
        offsetX = -(popupPos.x + popupWidth / 2 - mapSize.x) - 10;
      }

      if (offsetX !== 0 || offsetY !== 0) {
        const targetLatLng = map.containerPointToLatLng([
          popupPos.x + offsetX,
          popupPos.y + offsetY,
        ]);

        const startLatLng = popup.getLatLng();
        const duration = 250;
        const startTime = performance.now();

        const animate = (time) => {
          const progress = Math.min((time - startTime) / duration, 1);
          const lat = startLatLng.lat + (targetLatLng.lat - startLatLng.lat) * progress;
          const lng = startLatLng.lng + (targetLatLng.lng - startLatLng.lng) * progress;
          popup.setLatLng(L.latLng(lat, lng));
          if (progress < 1) requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
      }
    };

    map.on("popupopen", adjustPopup);
    return () => map.off("popupopen", adjustPopup);
  }, [map]);

  return null;
}

export default KeepPopupInView;