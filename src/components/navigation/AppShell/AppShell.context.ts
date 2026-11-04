import { createContext, useContext, type RefObject } from 'react';

/** O que o submenu traz: nada, itens de um módulo ou só a conta (módulo sem submenu). */
export type AppShellPanelKind = 'none' | 'items' | 'account';

export interface AppShellContextValue {
  accountId: string;
  accountOpen: boolean;
  collapsePanel: () => void;
  collapseRef: RefObject<HTMLButtonElement | null>;
  expandPanel: () => void;
  expandRef: RefObject<HTMLButtonElement | null>;
  isPanelVisible: (kind: AppShellPanelKind) => boolean;
  menuOpen: boolean;
  narrow: boolean;
  openAccountFromRail: () => void;
  panelId: string;
  panelKind: AppShellPanelKind;
  setAccountOpen: (open: boolean) => void;
  setMenuOpen: (open: boolean) => void;
  setPanelKind: (kind: AppShellPanelKind) => void;
  submenuOpen: boolean;
}

export const AppShellContext = createContext<AppShellContextValue | null>(null);

export function useAppShell() {
  const context = useContext(AppShellContext);

  if (!context) {
    throw new Error('As peças do AppShell só funcionam dentro de <AppShell>.');
  }

  return context;
}
