import { createContext, useContext } from 'react';

/** Onde a marca está: no trilho, só o símbolo; no submenu, o nome ou o logotipo. */
export type SidebarBrandPlace = 'rail' | 'panel';

/** Fornecido pelo `Sidebar.Rail` e pelo `Sidebar.Panel` ao redor do `brand`. Fora dos dois, vale a forma do submenu. */
export const SidebarBrandContext = createContext<SidebarBrandPlace>('panel');

export function useSidebarBrandPlace() {
  return useContext(SidebarBrandContext);
}
