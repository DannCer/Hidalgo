/**
 * @fileoverview Componente para mantener popups visibles en el mapa.
 * 
 * Ajusta automáticamente la posición de los popups para que no
 * queden cortados por los bordes del mapa. Usa animación suave.
 * 
 * @module components/map/KeepPopupInView
 */

import { useEffect } from 'react';
import { useMapEvents } from 'react-leaflet';
import L from 'leaflet';

/**
 * Hook-componente que mantiene los popups dentro del viewport.
 * 
 * Escucha el evento 'popupopen' y ajusta la posición del popup
 * si parte de él queda fuera del área visible del mapa.
 * Usa requestAnimationFrame para animación suave.
 * 
 * @component
 * @returns {null} No renderiza nada (solo efectos)
 * 
 * @example
 * <MapContainer>
 *   <KeepPopupInView />
 * </MapContainer>
 */
function KeepPopupInView() {
  const map = useMapEvents({});

  useEffect(() => {
    /**
     * Ajusta la posición del popup para mantenerlo visible.
     * @param {L.PopupEvent} e - Evento de apertura de popup
     */
    const adjustPopup = (e) => {
      const popup = e.popup;
      const popupEl = popup.getElement();
      if (!popupEl) return;

      // Obtener dimensiones y posiciones
      const mapSize = map.getSize();
      const popupPos = map.latLngToContainerPoint(popup.getLatLng());
      const popupHeight = popupEl.offsetHeight;
      const popupWidth = popupEl.offsetWidth;

      let offsetX = 0;
      let offsetY = 0;

      // Calcular offsets necesarios para cada borde
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

      // Animar el movimiento si es necesario
      if (offsetX !== 0 || offsetY !== 0) {
        const targetLatLng = map.containerPointToLatLng([
          popupPos.x + offsetX,
          popupPos.y + offsetY,
        ]);

        const startLatLng = popup.getLatLng();
        const duration = 250;
        const startTime = performance.now();

        /**
         * Función de animación usando interpolación lineal.
         * @param {number} time - Timestamp actual
         */
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