import { createContext, useContext, type ReactNode } from 'react';

const ChartsContext = createContext<boolean | undefined>(undefined);

export interface ChartsProviderProps {
  children: ReactNode;
  /** Botão "Ver como tabela" de todos os gráficos da subárvore. A prop `showTableToggle` do gráfico vale mais. Ligado por padrão. */
  showTableToggle?: boolean;
}

/** Define o padrão dos gráficos da subárvore. O provider mais próximo vale, e a prop do gráfico vale mais que ele. */
export function ChartsProvider({ children, showTableToggle }: ChartsProviderProps) {
  const inherited = useContext(ChartsContext);

  return <ChartsContext value={showTableToggle ?? inherited}>{children}</ChartsContext>;
}

/** O `showTableToggle` do gráfico, depois o do `ChartsProvider` mais próximo, depois ligado. */
export function useShowTableToggle(showTableToggle?: boolean): boolean {
  const provided = useContext(ChartsContext);

  return showTableToggle ?? provided ?? true;
}
