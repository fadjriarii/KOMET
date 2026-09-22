import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './assets/index.css';

/**
 * Titik masuk aplikasi React (Vite).
 * Memuat gaya global Tailwind lalu merender root App.
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
