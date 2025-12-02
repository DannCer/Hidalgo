import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const ControlSidebarWrapper = ({ popupData, setPopupData }) => {
    const map = useMap();
    const controlRef = useRef(null);
    const draggableRef = useRef(null);

    useEffect(() => {
        if (!map) return;


        const ControlSidebar = L.Control.extend({
            options: {
                position: 'topright'
            },
            onAdd: function (map) {
                this._container = L.DomUtil.create('div', 'leaflet-control-sidebar');


                L.DomEvent.disableClickPropagation(this._container);
                L.DomEvent.disableScrollPropagation(this._container);
                L.DomEvent.on(this._container, 'wheel', L.DomEvent.stopPropagation);

                this._container.innerHTML = '';
                return this._container;
            },
            onRemove: function (map) {

            }
        });


        if (!controlRef.current) {
            controlRef.current = new ControlSidebar();
            map.addControl(controlRef.current);
        }

        const container = controlRef.current.getContainer();
        let closeButtonListener = null;
        let contentDiv = null;

        if (popupData) {
            container.classList.add('sidebar-control-active');


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


            if (!draggableRef.current) {

                draggableRef.current = new L.Draggable(container);
            }



            draggableRef.current.enable();





            const closeButton = container.querySelector('[data-close]');
            if (closeButton) {
                closeButtonListener = (e) => {
                    e.preventDefault();
                    setPopupData(null);
                };
                closeButton.addEventListener('click', closeButtonListener);
            }


            contentDiv = container.querySelector('.leaflet-popup-content');
            if (contentDiv) {
                L.DomEvent.on(contentDiv, 'wheel', L.DomEvent.stopPropagation);
            }

        } else {

            container.classList.remove('sidebar-control-active');


            if (draggableRef.current) {
                draggableRef.current.disable();



                container.style.transform = '';
            }

            if (container.innerHTML !== '') {
                container.innerHTML = '';
            }
        }


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

        };

    }, [map, popupData, setPopupData]);

    return null;
};

export default ControlSidebarWrapper;