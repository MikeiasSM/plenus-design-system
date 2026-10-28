import { createContext, useContext } from 'react';

export interface DataGridContextValue {
  label: string;
  search: string;
  setSearch: (search: string) => void;
}

export const DataGridContext = createContext<DataGridContextValue | null>(null);

export function useDataGridContext(part: string) {
  const context = useContext(DataGridContext);

  if (!context) {
    throw new Error(`${part} precisa estar dentro de um DataGrid.`);
  }

  return context;
}
