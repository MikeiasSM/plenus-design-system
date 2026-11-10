import { createContext, useContext, type RefObject } from 'react';

/** O que o submenu traz: nada, itens de um módulo ou só a conta (módulo sem submenu). */
export type SidebarPanelKind = 'none' | 'items' | 'account';

export interface SidebarContextValue {
  accountId: string;
  accountOpen: boolean;
  collapsePanel: () => void;
  collapseRef: RefObject<HTMLButtonElement | null>;
  expandPanel: () => void;
  expandRef: RefObject<HTMLButtonElement | null>;
  isPanelVisible: (kind: SidebarPanelKind) => boolean;
  menuOpen: boolean;
  narrow: boolean;
  openAccountFromRail: () => void;
  panelId: string;
  panelKind: SidebarPanelKind;
  setAccountOpen: (open: boolean) => void;
  setMenuOpen: (open: boolean) => void;
  setPanelKind: (kind: SidebarPanelKind) => void;
  /** Muda o submenu sem tocar no foco; ao recolher, fecha a conta. É o que o `useSidebar` expõe. */
  setSubmenuOpen: (open: boolean) => void;
  submenuOpen: boolean;
}

export const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebarContext() {
  const context = useContext(SidebarContext);

  if (!context) {
    throw new Error('A Sidebar e o useSidebar só funcionam dentro de <SidebarProvider> ou de <AppShell>.');
  }

  return context;
}
