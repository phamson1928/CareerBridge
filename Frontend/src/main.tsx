import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {AppRouter} from './router';
import {AppFeedbackProvider} from './components/Feedback/AppFeedbackProvider';
import './index.css';

// Automatically reload the page when a chunk mismatch happens after rebuild/deploy
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  window.location.reload();
});

window.addEventListener('error', (event) => {
  const msg = event?.message || '';
  if (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('error loading dynamically imported module') ||
    msg.includes('Strict MIME type checking is enforced')
  ) {
    const key = 'chunk_reload_lock';
    const last = sessionStorage.getItem(key);
    const now = Date.now();
    if (!last || now - Number(last) > 8000) {
      sessionStorage.setItem(key, String(now));
      window.location.reload();
    }
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppFeedbackProvider><AppRouter /></AppFeedbackProvider>
  </StrictMode>,
);
