/**
 * @fileoverview Punto de entrada de la aplicación React.
 * 
 * Este archivo inicializa la aplicación montándola en el DOM.
 * Importa los estilos globales y Bootstrap antes de renderizar
 * el componente App dentro de React.StrictMode.
 * 
 * @module index
 */

import React from 'react';
import ReactDOM from 'react-dom/client';

// ============================================================================
// IMPORTACIÓN DE ESTILOS GLOBALES
// ============================================================================
import './styles/variables.css';   // Variables CSS personalizadas
import './styles/global.css';      // Estilos globales de la aplicación
import 'bootstrap/dist/css/bootstrap.min.css';  // Framework CSS Bootstrap

// ============================================================================
// IMPORTACIÓN DEL COMPONENTE RAÍZ
// ============================================================================
import App from './App';

// ============================================================================
// MONTAJE DE LA APLICACIÓN
// ============================================================================

/**
 * Crea el root de React y monta la aplicación.
 * StrictMode activa verificaciones adicionales en desarrollo.
 */
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);