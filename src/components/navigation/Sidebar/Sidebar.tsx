import { useEffect, useRef, type ComponentPropsWithRef, type ReactNode } from 'react';
import { Drawer } from '../../overlays/Drawer';
import { useSidebarContext } from './Sidebar.context';
import { SidebarAccount } from './SidebarAccount';
import { SidebarBrand } from './SidebarBrand';
import { SidebarGroup, SidebarItem, SidebarPanel } from './SidebarPanel';
import { SidebarRail, SidebarRailAccount, SidebarRailItem } from './SidebarRail';
import { SidebarTrigger } from './SidebarTrigger';
import styles from './Sidebar.module.css';

/**
 * As propriedades nativas, o `className`, o `style` e o `ref` vão ao elemento que reúne o trilho e o submenu e, em largura
 * estreita, à superfície da gaveta, que sai em portal: assim o `data-palette` de `createPalette` vale nos dois.
 */
export interface SidebarProps extends Omit<ComponentPropsWithRef<'div'>, 'aria-label' | 'children' | 'role' | 'title'> {
  /** O trilho e o submenu. */
  children: ReactNode;
  /** Nome da gaveta no celular. */
  menuLabel?: string;
}

/** Reúne trilho e submenu. Em largura estreita, os dois passam juntos a uma gaveta com a interação do `Drawer`. */
function SidebarRoot({ children, className, menuLabel, ...props }: SidebarProps) {
  const { accountId, accountOpen, labels, menuOpen, narrow, panelKind, setMenuOpen, side } = useSidebarContext();
  const previousPanelKind = useRef(panelKind);
  const menuRef = useRef<HTMLDivElement>(null);

  // A gaveta abre no item da página atual, o mais fundo que estiver à vista; sem ele, no módulo atual.
  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const accountOption = accountOpen ? document.getElementById(accountId)?.querySelector<HTMLElement>('a, button') : null;
    const currents = [...(menuRef.current?.querySelectorAll<HTMLElement>('[aria-current="page"]') ?? [])];
    (accountOption ?? currents.reverse().find((current) => !current.closest('[inert], [hidden]')))?.focus();
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
      <div {...props} className={[styles.navigation, className].filter(Boolean).join(' ')} data-side={side}>
        {children}
      </div>
    );
  }

  return (
    <Drawer
      {...props}
      aria-label={menuLabel ?? labels.menu}
      className={[styles.menuSurface, className].filter(Boolean).join(' ')}
      flush
      onOpenChange={setMenuOpen}
      open={menuOpen}
      side={side}
    >
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
