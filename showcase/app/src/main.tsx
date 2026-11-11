import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@plenustech/design-system/styles.css';
import '@plenustech/design-system/reset.css';
import { App } from './App';
import { Previa } from './estrutura/Previa';
import { ROTA_DA_PREVIA } from './estrutura/janela';
import './showcase.css';

/** `#/previa/<Componente>` e a pagina do iframe do playground: so a previa, sem a casca do Showcase. */
function lerPrevia() {
  const [rota = '', componente = ''] = window.location.hash.replace(/^#\/?/, '').split('/');

  if (rota !== ROTA_DA_PREVIA) {
    return undefined;
  }

  // Um `%` solto no endereco nao pode derrubar a pagina: o nome fica como veio e a previa diz que nao o conhece.
  try {
    return decodeURIComponent(componente);
  } catch {
    return componente;
  }
}

function Raiz() {
  const [previa, setPrevia] = useState(lerPrevia);

  useEffect(() => {
    const atualizar = () => setPrevia(lerPrevia());
    window.addEventListener('hashchange', atualizar);
    return () => window.removeEventListener('hashchange', atualizar);
  }, []);

  return previa === undefined ? <App /> : <Previa componente={previa} key={previa} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Raiz />
  </StrictMode>,
);
