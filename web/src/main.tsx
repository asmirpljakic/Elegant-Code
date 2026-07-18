import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store/store.ts'
import './index.css'
import App from './App.tsx'

// Enterprise rešenje za "ChunkLoadError" (kada se uradi novi Vercel Deploy a korisnik je i dalje na staroj verziji)
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Detektovana stara verzija aplikacije. Automatsko osvežavanje na novu verziju...');
  window.location.reload();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)
