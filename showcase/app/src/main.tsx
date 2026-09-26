import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@plenus/styles/reset.css';
import { App } from './App';
import './showcase.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
