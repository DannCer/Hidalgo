import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Principal from './pages/Principal';
import Observatorio from './pages/Observatorio';
import LayoutPrincipal from './components/layout/LayoutPrincipal';
import LayoutObservatorio from './components/layout/LayoutObservatorio';
import ComingSoon from './pages/CoomingSoon';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LayoutPrincipal><Principal /></LayoutPrincipal>} />
        <Route path="/observatorio" element={<LayoutObservatorio><Observatorio /></LayoutObservatorio>} />
        <Route path="/coming-soon" element={<ComingSoon />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;