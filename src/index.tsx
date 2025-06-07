import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { WebApp } from '@twa-dev/sdk';

// Initialize Telegram WebApp
WebApp.ready();

// Create root element if it doesn't exist
let rootElement = document.getElementById('root');
if (!rootElement) {
  rootElement = document.createElement('div');
  rootElement.id = 'root';
  document.body.appendChild(rootElement);
}

// Render the app
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 