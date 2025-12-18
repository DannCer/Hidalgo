import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// ============================================================================
// IMPORTACIÓN DE PÁGINAS
// ============================================================================
import Principal from './pages/Principal';           // Página de inicio con tarjetas de navegación
import Observatorio from './pages/Observatorio';     // Página principal del mapa interactivo
import ComingSoon from './pages/CoomingSoon';        // Página placeholder para secciones en desarrollo
import NotFound from './pages/NotFound';             // Página 404 para rutas no encontradas

// ============================================================================
// IMPORTACIÓN DE LAYOUTS
// ============================================================================
import LayoutPrincipal from './components/layout/LayoutPrincipal';       // Layout para la página principal
import LayoutObservatorio from './components/layout/LayoutObservatorio'; // Layout para el observatorio (sin footer)

/**
 * Componente raíz de la aplicación.
 * 
 * Define el sistema de rutas de la aplicación:
 * - "/" : Página principal con navegación a diferentes secciones temáticas
 * - "/observatorio" : Visor de mapas con capas geoespaciales
 * - "/coming-soon" : Placeholder para funcionalidades en desarrollo
 * - "*" : Captura rutas no definidas (404)
 * 
 * @component
 * @returns {JSX.Element} Estructura de rutas de la aplicación
 * 
 * @example
 * // La aplicación se monta en el DOM desde index.jsx
 * <App />
 */
function App() {
  return (
    <Router>
      <Routes>
        {/* Página principal - muestra tarjetas con acceso a diferentes temáticas */}
        <Route 
          path="/" 
          element={
            <LayoutPrincipal>
              <Principal />
            </LayoutPrincipal>
          } 
        />
        
        {/* Observatorio - visor de mapas con capas WFS/WMS */}
        <Route 
          path="/observatorio" 
          element={
            <LayoutObservatorio>
              <Observatorio />
            </LayoutObservatorio>
          } 
        />
        
        {/* Página para secciones en construcción */}
        <Route path="/coming-soon" element={<ComingSoon />} />
        
        {/* Ruta catch-all para páginas no encontradas */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;