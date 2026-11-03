import type { ComponentPropsWithRef, MouseEvent, ReactNode } from 'react';
import { Tooltip } from '../../overlays/Tooltip';
import { useAppShell } from './AppShell.context';
import { ShellAction, type ShellActionProps } from './ShellAction';
import styles from './AppShell.module.css';

export interface AppShellRailProps extends Omit<ComponentPropsWithRef<'nav'>, 'aria-label'> {
  /** A marca do produto, no topo. */
  brand?: ReactNode;
  /** Grupo fixo no pé do trilho: itens de sistema e a conta. */
  footer?: ReactNode;
  /** Nome da navegação entre módulos. */
  label?: string;
}

/** Trilho de módulos: folha estreita à esquerda, só com ícones. Os módulos são `AppShell.RailItem`. */
export function AppShellRail({ brand, children, className, footer, label = 'Módulos', ...props }: AppShellRailProps) {
  return (
    <nav {...props} aria-label={label} className={[styles.rail, className].filter(Boolean).join(' ')}>
      {brand && <div className={styles.brand}>{brand}</div>}
      <ul className={styles.railGroup}>{children}</ul>
      <ul className={[styles.railGroup, styles.railFooter].join(' ')}>{footer}</ul>
    </nav>
  );
}

export interface AppShellRailItemProps extends Omit<ShellActionProps, 'aria-label' | 'children'> {
  /** O módulo da página atual. Clicar nele alterna o submenu. */
  current?: boolean;
  icon: ReactNode;
  /** Nome acessível e dica do módulo. */
  label: string;
}

export function AppShellRailItem({ className, current = false, icon, label, onClick, ...props }: AppShellRailItemProps) {
  const { collapsePanel, expandPanel, narrow, panelKind, setMenuOpen, submenuOpen } = useAppShell();

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    onClick?.(event);

    if (event.defaultPrevented) {
      return;
    }

    if (narrow && panelKind !== 'items') {
      setMenuOpen(false);
      return;
    }

    if (current && panelKind === 'items') {
      event.preventDefault();
      if (!narrow) {
        (submenuOpen ? collapsePanel : expandPanel)();
      }
    }
  }

  return (
    <li>
      <Tooltip content={label} delay={150} placement="right">
        <ShellAction
          {...props}
          aria-current={current ? 'page' : undefined}
          aria-label={label}
          className={[styles.railItem, className].filter(Boolean).join(' ')}
          onClick={handleClick}
        >
          {icon}
        </ShellAction>
      </Tooltip>
    </li>
  );
}

export interface AppShellRailAccountProps extends Omit<ComponentPropsWithRef<'button'>, 'aria-label'> {
  /** O avatar do usuário. O ponto de aviso, se houver, é do produto. */
  children: ReactNode;
  /** Nome acessível e dica: a conta e o que mais o produto quiser avisar. */
  label: string;
}

/** Avatar da conta no trilho. Só aparece com o submenu recolhido; abre o submenu já na conta. */
export function AppShellRailAccount({ children, className, label, onClick, ...props }: AppShellRailAccountProps) {
  const { accountId, isPanelVisible, openAccountFromRail, panelKind } = useAppShell();

  if (panelKind === 'none' || isPanelVisible(panelKind)) {
    return null;
  }

  return (
    <li>
      <Tooltip content={label} delay={150} placement="right">
        <button
          {...props}
          aria-controls={accountId}
          aria-expanded={false}
          aria-label={label}
          className={[styles.railAccount, className].filter(Boolean).join(' ')}
          onClick={(event) => {
            onClick?.(event);
            if (!event.defaultPrevented) {
              openAccountFromRail();
            }
          }}
          type="button"
        >
          {children}
        </button>
      </Tooltip>
    </li>
  );
}
