import React from 'react';
import ReactDOM from 'react-dom/client'; // Nota el cambio: '/client'
import './styles/variables.css';
import './styles/global.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);