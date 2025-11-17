import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const ControlSidebarWrapper = ({ popupData, setPopupData }) => {
    const map = useMap();
    const controlRef = useRef(null);
    const draggableRef = useRef(null); // Referencia para el objeto Draggable

    useEffect(() => {
        if (!map) return;
        
        // 1. Definir el Control de Leaflet (solo se define una vez)
        const ControlSidebar = L.Control.extend({
            options: {
                position: 'topright'
            },
            onAdd: function (map) {
                this._container = L.DomUtil.create('div', 'leaflet-control-sidebar');
                
                // Detener la propagación de eventos para que no afecten al mapa
                L.DomEvent.disableClickPropagation(this._container);
                L.DomEvent.disableScrollPropagation(this._container); 
                L.DomEvent.on(this._container, 'wheel', L.DomEvent.stopPropagation);
                
                this._container.innerHTML = '';
                return this._container;
            },
            onRemove: function (map) {
                // Limpieza
            }
        });

        // 2. Instanciar e insertar el control (solo la primera vez)
        if (!controlRef.current) {
            controlRef.current = new ControlSidebar();
            map.addControl(controlRef.current);
        }

        const container = controlRef.current.getContainer();
        let closeButtonListener = null;
        let contentDiv = null;

        if (popupData) {
            container.classList.add('sidebar-control-active'); 
            
            // Inyectamos el HTML
            container.innerHTML = `
                <div class="custom-popup sidebar-popup">
                    <a class="leaflet-popup-close-button" href="#close" role="button" aria-label="Close popup" data-close>×</a>
                    <div class="leaflet-popup-content-wrapper">
                        <div class="leaflet-popup-content">
                            ${popupData.content}
                        </div>
                    </div>
                </div>
            `;
            
            // --- HABILITAR ARRASTRE (DRAG) ---
            if (!draggableRef.current) {
                // Creamos la instancia L.Draggable en el contenedor principal del control
                draggableRef.current = new L.Draggable(container);
            }

            // Activamos el arrastre. Usamos el header o wrapper como "handle" si lo deseas, 
            // pero si usamos el contenedor completo, solo necesitamos activar:
            draggableRef.current.enable();
            
            // Opcional: Centrar el Draggable en su posición inicial (después de que se le aplique el CSS topright)
            // L.DomUtil.setPosition(container, L.point(container.offsetLeft, container.offsetTop));


            // 4. Implementa el cierre del popup
            const closeButton = container.querySelector('[data-close]');
            if (closeButton) {
                closeButtonListener = (e) => {
                    e.preventDefault();
                    setPopupData(null);
                };
                closeButton.addEventListener('click', closeButtonListener);
            }
            
            // 5. Prevención de Scroll en el contenido interno
            contentDiv = container.querySelector('.leaflet-popup-content');
            if (contentDiv) {
                L.DomEvent.on(contentDiv, 'wheel', L.DomEvent.stopPropagation);
            }

        } else {
            // Ocultar/Vaciar si no hay datos
            container.classList.remove('sidebar-control-active');
            
            // Deshabilitar el arrastre cuando el popup está cerrado
            if (draggableRef.current) {
                draggableRef.current.disable();
                
                // Opcional: Reiniciar la posición a la esquina superior derecha
                // para que reaparezca correctamente al próximo clic.
                container.style.transform = ''; 
            }

            if (container.innerHTML !== '') {
                container.innerHTML = '';
            }
        }
        
        // Función de limpieza para desmontar o actualizar
        return () => {
            if (closeButtonListener) {
                const closeButton = container.querySelector('[data-close]');
                if (closeButton) {
                    closeButton.removeEventListener('click', closeButtonListener);
                }
            }
            if (contentDiv) {
                L.DomEvent.off(contentDiv, 'wheel', L.DomEvent.stopPropagation);
            }
            // NO limpiamos el control ni el Draggable si se usa la referencia persistente
        };

    }, [map, popupData, setPopupData]);

    return null;
};

export default ControlSidebarWrapper;