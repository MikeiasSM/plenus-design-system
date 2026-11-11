import type { ReactNode } from 'react';
import { Text } from '@plenustech/design-system';
import './MarcaDaAplicacao.css';

/** A marca da aplicação de exemplo no trilho: o ícone do produto num quadrado na cor principal. É decorativa; o nome está ao lado. */
export function MarcaDaAplicacao({ icone }: { icone: ReactNode }) {
  return (
    <span aria-hidden="true" className="marca-app">
      {icone}
    </span>
  );
}

/** O nome da aplicação de exemplo no alto do submenu. */
export function MarcaDoSubmenu() {
  return (
    <span className="marca-app-texto">
      <Text variant="title">Gestor</Text>
      <Text tone="tertiary" variant="micro">by Plenustech</Text>
    </span>
  );
}
