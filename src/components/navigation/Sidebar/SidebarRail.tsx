import type { ComponentPropsWithRef, MouseEvent, ReactNode } from 'react';
import { Tooltip } from '../../overlays/Tooltip';
import { tooltipPlacement, useSidebarContext } from './Sidebar.context';
import { SidebarBrandContext } from './SidebarBrand.context';
import { SidebarAction, type SidebarActionProps } from './SidebarAction';
import styles from './Sidebar.module.css';

export interface SidebarRailProps extends Omit<ComponentPropsWithRef<'nav'>, 'aria-label'> {
  /** A marca do produto, no topo. */
  brand?: ReactNode;
  /** Grupo fixo no pé do trilho: itens de sistema e a conta. */
  footer?: ReactNode;
  /** Grupo no alto do trilho, abaixo da marca e antes dos módulos, como uma busca: `Sidebar.RailItem`. */
  header?: ReactNode;
  /** Nome da navegação entre módulos. */
  label?: string;
}

/** Trilho de módulos: folha estreita à esquerda, só com ícones. Os módulos são `Sidebar.RailItem`. */
export function SidebarRail({ brand, children, className, footer, header, label, ...props }: SidebarRailProps) {
  const { labels } = useSidebarContext();

  return (
    <nav {...props} aria-label={label ?? labels.modules} className={[styles.rail, className].filter(Boolean).join(' ')}>
      {brand && (
        <div className={styles.brand}>
          <SidebarBrandContext value="rail">{brand}</SidebarBrandContext>
        </div>
      )}
      {header !== undefined && header !== null && <ul className={[styles.railGroup, styles.railHeader].join(' ')}>{header}</ul>}
      <ul className={styles.railGroup}>{children}</ul>
      <ul className={[styles.railGroup, styles.railFooter].join(' ')}>{footer}</ul>
    </nav>
  );
}

export interface SidebarRailItemProps extends Omit<SidebarActionProps, 'aria-label' | 'children'> {
  /** O módulo da página atual. Clicar nele alterna o submenu. */
  current?: boolean;
  icon: ReactNode;
  /** Nome acessível e dica do módulo. */
  label: string;
  /** O módulo atual alterna o submenu ao clicar, sem navegar. Com `false`, ele navega como os outros. Padrão `true`. */
  toggleSubmenu?: boolean;
}

export function SidebarRailItem({ className, current = false, icon, label, onClick, toggleSubmenu = true, ...props }: SidebarRailItemProps) {
  const { collapsePanel, expandPanel, narrow, panelId, panelKind, setMenuOpen, side, submenuOpen, tooltipDelay } = useSidebarContext();
  const toggles = current && toggleSubmenu && panelKind === 'items';

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    onClick?.(event);

    if (event.defaultPrevented) {
      return;
    }

    if (narrow && panelKind !== 'items') {
      setMenuOpen(false);
      return;
    }

    if (toggles) {
      event.preventDefault();
      if (!narrow) {
        (submenuOpen ? collapsePanel : expandPanel)();
      }
    }
  }

  return (
    <li>
      <Tooltip content={label} delay={tooltipDelay} placement={tooltipPlacement(side)}>
        <SidebarAction
          {...props}
          aria-controls={toggles && !narrow ? panelId : props['aria-controls']}
          aria-current={current ? 'page' : props['aria-current']}
          aria-expanded={toggles && !narrow ? submenuOpen : props['aria-expanded']}
          aria-label={label}
          className={[styles.railItem, className].filter(Boolean).join(' ')}
          onClick={handleClick}
        >
          {icon}
        </SidebarAction>
      </Tooltip>
    </li>
  );
}

export interface SidebarRailAccountProps extends Omit<ComponentPropsWithRef<'button'>, 'aria-label'> {
  /** O avatar do usuário. O ponto de aviso, se houver, é do produto. */
  children: ReactNode;
  /** Nome acessível e dica: a conta e o que mais o produto quiser avisar. */
  label: string;
}

/** Avatar da conta no trilho. Só aparece com o submenu recolhido; abre o submenu já na conta. */
export function SidebarRailAccount({ children, className, label, onClick, ...props }: SidebarRailAccountProps) {
  const { accountId, isPanelVisible, openAccountFromRail, panelKind, side, tooltipDelay } = useSidebarContext();

  if (panelKind === 'none' || isPanelVisible(panelKind)) {
    return null;
  }

  return (
    <li>
      <Tooltip content={label} delay={tooltipDelay} placement={tooltipPlacement(side)}>
        <button
          {...props}
          aria-controls={accountId}
          aria-expanded={false}
          className={[styles.railAccount, className].filter(Boolean).join(' ')}
          onClick={(event) => {
            onClick?.(event);
            if (!event.defaultPrevented) {
              openAccountFromRail();
            }
          }}
          type="button"
        >
          <span aria-hidden="true" className={styles.railAccountAvatar}>
            {children}
          </span>
          <span className={styles.visuallyHidden}>{label}</span>
        </button>
      </Tooltip>
    </li>
  );
}
