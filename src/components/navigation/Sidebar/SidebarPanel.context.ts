import { createContext, useContext } from 'react';

export type SidebarNestedMode = 'expand' | 'stack';
export type SidebarAccountMode = 'inline' | 'cover';

/** Onde o item está: na lista do módulo, dentro de um item com filhos ou na conta. Só a lista some na pilha. */
export type SidebarItemScope = 'list' | 'nested' | 'account';

export interface SidebarPanelContextValue {
  accountMode: SidebarAccountMode;
  enteredId: string | null;
  label: string;
  nestedMode: SidebarNestedMode;
  setEnteredId: (id: string | null) => void;
  visible: boolean;
}

export const SidebarPanelContext = createContext<SidebarPanelContextValue | null>(null);
export const SidebarItemScopeContext = createContext<SidebarItemScope>('list');

export function useSidebarPanel() {
  const context = useContext(SidebarPanelContext);

  if (!context) {
    throw new Error('Os itens do submenu só funcionam dentro de <Sidebar.Panel>.');
  }

  return context;
}

export function useSidebarItemScope() {
  return useContext(SidebarItemScopeContext);
}
