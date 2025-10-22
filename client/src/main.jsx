import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';
import { ensureServiceWorker } from './utils/pushNotifications';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  ensureServiceWorker().catch((error) => {
    console.warn('Service worker registration failed', error);
  });
}
