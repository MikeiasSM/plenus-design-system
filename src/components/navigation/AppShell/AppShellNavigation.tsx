import { useEffect, useRef, type ReactNode } from 'react';
import { Drawer } from '../../overlays/Drawer';
import { useAppShell } from './AppShell.context';
import styles from './AppShell.module.css';

export interface AppShellNavigationProps {
  /** O trilho e o submenu. */
  children: ReactNode;
  /** Nome da gaveta no celular. */
  menuLabel?: string;
}

/** Reúne trilho e submenu. Em largura estreita, os dois passam juntos a uma gaveta com a interação do `Drawer`. */
export function AppShellNavigation({ children, menuLabel = 'Menu' }: AppShellNavigationProps) {
  const { menuOpen, narrow, panelKind, setMenuOpen } = useAppShell();
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
    return <div className={styles.navigation}>{children}</div>;
  }

  return (
    <Drawer aria-label={menuLabel} className={styles.menuSurface} flush onOpenChange={setMenuOpen} open={menuOpen} side="left">
      <div className={styles.menu} ref={menuRef}>{children}</div>
    </Drawer>
  );
}
