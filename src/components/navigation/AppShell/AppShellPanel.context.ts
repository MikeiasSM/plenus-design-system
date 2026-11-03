import { createContext, useContext } from 'react';

export type AppShellNestedMode = 'expand' | 'stack';
export type AppShellAccountMode = 'inline' | 'cover';

/** Onde o item está: na lista do módulo, dentro de um item com filhos ou na conta. Só a lista some na pilha. */
export type AppShellItemScope = 'list' | 'nested' | 'account';

export interface AppShellPanelContextValue {
  accountMode: AppShellAccountMode;
  enteredId: string | null;
  label: string;
  nestedMode: AppShellNestedMode;
  setEnteredId: (id: string | null) => void;
}

export const AppShellPanelContext = createContext<AppShellPanelContextValue | null>(null);
export const AppShellItemScopeContext = createContext<AppShellItemScope>('list');

export function useAppShellPanel() {
  const context = useContext(AppShellPanelContext);

  if (!context) {
    throw new Error('Os itens do submenu só funcionam dentro de <AppShell.Panel>.');
  }

  return context;
}

export function useAppShellItemScope() {
  return useContext(AppShellItemScopeContext);
}
