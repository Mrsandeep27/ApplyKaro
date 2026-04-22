import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ErrorBoundary } from './components/layout/error-boundary';
import './index.css';

// Dev: aggressively unregister any stale service worker from a previous build
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    if (regs.length > 0) {
      regs.forEach((r) => r.unregister());
      if ('caches' in window) caches.keys().then((k) => k.forEach((n) => caches.delete(n)));
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ErrorBoundary fallbackTitle="ApplyKaro hit a problem">
        <App />
      </ErrorBoundary>
    </BrowserRouter>
  </StrictMode>,
);
