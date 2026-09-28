import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@plenustech/design-system/styles.css';
import '@plenustech/design-system/reset.css';
import { App } from './App';
import './showcase.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
