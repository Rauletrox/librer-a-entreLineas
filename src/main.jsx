import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles.css';

async function bootstrap() {
  // Este proyecto académico se entrega como demostración mock, también en preview.
  // Configurar VITE_ENABLE_MOCKS=false únicamente cuando exista una API real.
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'false') {
    const { worker } = await import('./mocks/browser.js');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }
  createRoot(document.getElementById('root')).render(<React.StrictMode><BrowserRouter><App /></BrowserRouter></React.StrictMode>);
}
bootstrap().catch(() => {
  document.getElementById('root').textContent = 'No pudimos iniciar la tienda. Recarga la página y comprueba que el navegador permita Service Workers en localhost.';
});
