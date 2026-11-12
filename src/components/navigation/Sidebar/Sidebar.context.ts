import { createContext, useContext, type RefObject } from 'react';

/** O que o submenu traz: nada, itens de um módulo ou só a conta (módulo sem submenu). */
export type SidebarPanelKind = 'none' | 'items' | 'account';

export type SidebarSide = 'left' | 'right';

export function tooltipPlacement(side: SidebarSide) {
  return side === 'right' ? 'left' : 'right';
}

export interface SidebarLabels {
  /** Fecha a gaveta, no celular. */
  closeMenu: string;
  /** Recolhe o submenu, na largura larga. */
  collapseSubmenu: string;
  /** Abre a gaveta, no celular. */
  openMenu: string;
  /** Abre o submenu recolhido, na largura larga. */
  openSubmenu: string;
}

export const defaultSidebarLabels: SidebarLabels = {
  closeMenu: 'Fechar menu',
  collapseSubmenu: 'Recolher submenu',
  openMenu: 'Abrir menu',
  openSubmenu: 'Abrir submenu',
};

export interface SidebarContextValue {
  accountId: string;
  accountOpen: boolean;
  collapsePanel: () => void;
  collapseRef: RefObject<HTMLButtonElement | null>;
  expandPanel: () => void;
  expandRef: RefObject<HTMLButtonElement | null>;
  labels: SidebarLabels;
  isPanelVisible: (kind: SidebarPanelKind) => boolean;
  menuOpen: boolean;
  narrow: boolean;
  openAccountFromRail: () => void;
  panelId: string;
  panelKind: SidebarPanelKind;
  side: SidebarSide;
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
