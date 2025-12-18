/**
 * @fileoverview Componente ControlSidebarWrapper del Geovisor.
 * Implementa un sidebar/popup personalizado en Leaflet con funcionalidades avanzadas:
 * - Personalización completa del contenido HTML
 * - Capacidad de arrastre (drag-and-drop)
 * - Manejo de eventos personalizados
 * - Integración con el estado de React
 * 
 * @module components/map/ControlSidebarWrapper
 * @version 1.0.0
 */

import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

/**
 * Componente wrapper para crear un control personalizado de sidebar en Leaflet
 * Renderiza contenido HTML personalizado en un popup/sidebar arrastrable
 * que se posiciona en la esquina superior derecha del mapa.
 * 
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {Object|null} props.popupData - Datos para mostrar en el popup
 * @param {string} props.popupData.content - Contenido HTML a mostrar
 * @param {Function} props.setPopupData - Función para actualizar/cerrar el popup
 * @returns {null} Componente sin renderizado visual directo (maneja controles Leaflet)
 */
const ControlSidebarWrapper = ({ popupData, setPopupData }) => {
    // Hook para acceder a la instancia del mapa Leaflet
    const map = useMap();
    
    // Referencias para persistir instancias entre renders
    const controlRef = useRef(null);      // Referencia al control Leaflet
    const draggableRef = useRef(null);    // Referencia a la funcionalidad de arrastre

    /**
     * Efecto principal que gestiona el ciclo de vida del control sidebar
     * Se ejecuta cuando cambian: el mapa, los datos del popup o la función setPopupData
     */
    useEffect(() => {
        // Salir si no hay mapa disponible
        if (!map) return;

        /**
         * Control Leaflet personalizado para mostrar contenido en sidebar
         * @class
         * @extends L.Control
         */
        const ControlSidebar = L.Control.extend({
            // Opciones del control: posición fija en esquina superior derecha
            options: {
                position: 'topright'
            },
            
            /**
             * Método llamado cuando el control se añade al mapa
             * Crea el contenedor HTML y configura eventos
             * @param {L.Map} map - Instancia del mapa Leaflet
             * @returns {HTMLElement} Contenedor del control
             */
            onAdd: function (map) {
                // Crear contenedor principal con clases CSS
                this._container = L.DomUtil.create('div', 'leaflet-control-sidebar');

                // Prevenir propagación de eventos para evitar interferencias
                L.DomEvent.disableClickPropagation(this._container);
                L.DomEvent.disableScrollPropagation(this._container);
                L.DomEvent.on(this._container, 'wheel', L.DomEvent.stopPropagation);

                // Inicializar con contenido vacío
                this._container.innerHTML = '';
                return this._container;
            },
            
            /**
             * Método llamado cuando el control se remueve del mapa
             * @param {L.Map} map - Instancia del mapa Leaflet
             */
            onRemove: function (map) {
                // Método vacío - la limpieza se maneja en el efecto de React
            }
        });

        // ========== INICIALIZACIÓN DEL CONTROL ==========
        // Crear instancia del control solo una vez
        if (!controlRef.current) {
            controlRef.current = new ControlSidebar();
            map.addControl(controlRef.current);
        }

        // Obtener contenedor HTML del control
        const container = controlRef.current.getContainer();
        
        // Variables para manejo de listeners (se limpian en cleanup)
        let closeButtonListener = null;
        let contentDiv = null;

        // ========== LÓGICA CON DATOS DEL POPUP ==========
        if (popupData) {
            /**
             * MODO ACTIVO: Hay contenido para mostrar
             */

            // Activar clase CSS para estilos específicos
            container.classList.add('sidebar-control-active');

            // Renderizar contenido HTML con estructura de popup
            container.innerHTML = `
                <div class="custom-popup sidebar-popup">
                    <!-- Botón de cierre con atributos ARIA -->
                    <a class="leaflet-popup-close-button" 
                       href="#close" 
                       role="button" 
                       aria-label="Close popup" 
                       data-close>×</a>
                    
                    <div class="leaflet-popup-content-wrapper">
                        <div class="leaflet-popup-content">
                            ${popupData.content}
                        </div>
                    </div>
                </div>
            `;

            // ========== CONFIGURACIÓN DE ARRASTRE ==========
            // Inicializar funcionalidad de arrastre si no existe
            if (!draggableRef.current) {
                // Usar Draggable de Leaflet para permitir movimiento del sidebar
                draggableRef.current = new L.Draggable(container);
            }
            
            // Habilitar arrastre
            draggableRef.current.enable();

            // ========== MANEJO DE EVENTOS ==========
            // Configurar listener para el botón de cierre
            const closeButton = container.querySelector('[data-close]');
            if (closeButton) {
                closeButtonListener = (e) => {
                    e.preventDefault();  // Prevenir navegación
                    setPopupData(null);  // Cerrar popup
                };
                closeButton.addEventListener('click', closeButtonListener);
            }

            // Prevenir scroll en el contenido del popup
            contentDiv = container.querySelector('.leaflet-popup-content');
            if (contentDiv) {
                L.DomEvent.on(contentDiv, 'wheel', L.DomEvent.stopPropagation);
            }

        } else {
            /**
             * MODO INACTIVO: No hay contenido para mostrar
             */

            // Remover clase de activación
            container.classList.remove('sidebar-control-active');

            // Deshabilitar funcionalidad de arrastre
            if (draggableRef.current) {
                draggableRef.current.disable();
                
                // Resetear transformaciones CSS aplicadas por arrastre
                container.style.transform = '';
            }

            // Limpiar contenido HTML si existe
            if (container.innerHTML !== '') {
                container.innerHTML = '';
            }
        }

        // ========== CLEANUP FUNCTION ==========
        /**
         * Función de limpieza que se ejecuta antes del próximo efecto
         * o cuando el componente se desmonta
         */
        return () => {
            // Remover listener del botón de cierre
            if (closeButtonListener) {
                const closeButton = container.querySelector('[data-close]');
                if (closeButton) {
                    closeButton.removeEventListener('click', closeButtonListener);
                }
            }
            
            // Remover listener de scroll
            if (contentDiv) {
                L.DomEvent.off(contentDiv, 'wheel', L.DomEvent.stopPropagation);
            }
        };

    }, [map, popupData, setPopupData]); // Dependencias del efecto

    // Componente no renderiza elementos DOM visibles
    return null;
};

export default ControlSidebarWrapper;