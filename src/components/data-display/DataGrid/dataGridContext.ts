import { createContext, useContext } from 'react';
import type { MenuSection } from '../../overlays/Menu';
import type { DataGridScrollRoot } from './scrollRoot';

export interface DataGridContextValue {
  label: string;
  search: string;
  setSearch: (search: string) => void;
  /** Seções do menu da tabela com o estado de agora: o menu as pede ao abrir. */
  tableMenu: () => MenuSection[];
}

export const DataGridContext = createContext<DataGridContextValue | null>(null);

export function useDataGridContext(part: string) {
  const context = useContext(DataGridContext);

  if (!context) {
    throw new Error(`${part} precisa estar dentro de um DataGrid.`);
  }

  return context;
}

/** Da grade de fora para todas as aninhadas; `version` muda a cada altura medida, para todas se reposicionarem. */
export interface DataGridScrollValue {
  root: DataGridScrollRoot;
  version: number;
}

export const DataGridScrollContext = createContext<DataGridScrollValue | null>(null);

/** Do detalhe para o conteúdo dele: uma grade aqui dentro é aninhada, sem rolagem própria. */
export interface DataGridLevelValue {
  level: number;
  path: string;
}

export const DataGridLevelContext = createContext<DataGridLevelValue | null>(null);
