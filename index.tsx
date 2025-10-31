import './index.css';
import './i18n/config';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { initSentry } from './utils/sentry';
import { initPlausible } from './utils/analytics';
import App from './App';

// Inicializar Sentry (se habilitado)
initSentry().catch(console.warn);

// Inicializar Plausible (se habilitado)
initPlausible();

// Registrar Service Worker para PWA (será feito pelo VitePWA plugin)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    import('virtual:pwa-register').then(({ registerSW }) => {
      registerSW({
        immediate: true,
        onRegistered(registration) {
          console.log('[SW] Service Worker registrado:', registration);
        },
        onRegisterError(error) {
          console.warn('[SW] Erro ao registrar:', error);
        }
      });
    }).catch(() => {
      // VitePWA não disponível em dev ou se desabilitado
      console.log('[SW] VitePWA plugin não disponível');
    });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
