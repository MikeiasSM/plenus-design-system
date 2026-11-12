import { useEffect, useRef, type ReactNode } from 'react';
import { Drawer } from '../../overlays/Drawer';
import { useSidebarContext } from './Sidebar.context';
import { SidebarAccount } from './SidebarAccount';
import { SidebarBrand } from './SidebarBrand';
import { SidebarGroup, SidebarItem, SidebarPanel } from './SidebarPanel';
import { SidebarRail, SidebarRailAccount, SidebarRailItem } from './SidebarRail';
import { SidebarTrigger } from './SidebarTrigger';
import styles from './Sidebar.module.css';

export interface SidebarProps {
  /** O trilho e o submenu. */
  children: ReactNode;
  /** Nome da gaveta no celular. */
  menuLabel?: string;
}

/** Reúne trilho e submenu. Em largura estreita, os dois passam juntos a uma gaveta com a interação do `Drawer`. */
function SidebarRoot({ children, menuLabel = 'Menu' }: SidebarProps) {
  const { menuOpen, narrow, panelKind, setMenuOpen, side } = useSidebarContext();
  const previousPanelKind = useRef(panelKind);
  const menuRef = useRef<HTMLDivElement>(null);

  // A gaveta abre no item da página atual, o mais fundo que estiver à vista; sem ele, no módulo atual.
  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const currents = [...(menuRef.current?.querySelectorAll<HTMLElement>('[aria-current="page"]') ?? [])];
    currents.reverse().find((current) => !current.closest('[inert], [hidden]'))?.focus();
  }, [menuOpen]);

  // Quem sai de um módulo com submenu para um sem submenu não tem o que ver na gaveta.
  useEffect(() => {
    if (narrow && menuOpen && previousPanelKind.current === 'items' && panelKind !== 'items') {
      setMenuOpen(false);
    }
    previousPanelKind.current = panelKind;
  }, [menuOpen, narrow, panelKind, setMenuOpen]);

  if (!narrow) {
    return (
      <div className={styles.navigation} data-side={side}>
        {children}
      </div>
    );
  }

  return (
    <Drawer aria-label={menuLabel} className={styles.menuSurface} flush onOpenChange={setMenuOpen} open={menuOpen} side={side}>
      <div className={styles.menu} data-side={side} ref={menuRef}>{children}</div>
    </Drawer>
  );
}

export const Sidebar = Object.assign(SidebarRoot, {
  Account: SidebarAccount,
  Brand: SidebarBrand,
  Group: SidebarGroup,
  Item: SidebarItem,
  Panel: SidebarPanel,
  Rail: SidebarRail,
  RailAccount: SidebarRailAccount,
  RailItem: SidebarRailItem,
  Trigger: SidebarTrigger,
});
