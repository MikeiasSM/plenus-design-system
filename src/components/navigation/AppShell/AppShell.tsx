import { useEffect, useId, useRef, useState, type ComponentPropsWithRef } from 'react';
import { useNarrowViewport } from '../../../hooks/useNarrowViewport';
import { useOpenState } from '../../../hooks/useOpenState';
import { AppShellContext, type AppShellPanelKind } from './AppShell.context';
import { AppShellAccount } from './AppShellAccount';
import { AppShellNavigation } from './AppShellNavigation';
import { AppShellPage, AppShellPageBar, AppShellPageBody } from './AppShellPage';
import { AppShellPanel, AppShellPanelGroup, AppShellPanelItem } from './AppShellPanel';
import { AppShellRail, AppShellRailAccount, AppShellRailItem } from './AppShellRail';
import styles from './AppShell.module.css';

export interface AppShellProps extends ComponentPropsWithRef<'div'> {
  /** Submenu aberto no início, no modo não controlado. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Submenu aberto, no modo controlado. Abrir empurra a página; recolher devolve a largura. */
  open?: boolean;
}

/** Moldura da aplicação em camadas: trilho de módulos, submenu do módulo e página. Ocupa o espaço que o pai lhe dá. */
function AppShellRoot({ children, className, defaultOpen = true, onOpenChange, open: controlledOpen, ...props }: AppShellProps) {
  const narrow = useNarrowViewport();
  const [submenuOpen, setSubmenuOpen] = useOpenState({ defaultOpen, onOpenChange, open: controlledOpen });
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [panelKind, setPanelKind] = useState<AppShellPanelKind>('none');
  const collapseRef = useRef<HTMLButtonElement>(null);
  const expandRef = useRef<HTMLButtonElement>(null);
  const focusAfterChange = useRef<'collapse' | 'expand' | null>(null);
  const panelId = useId();
  const accountId = useId();

  const isPanelVisible = (kind: AppShellPanelKind) => (kind === 'items' ? narrow || submenuOpen : kind === 'account' && accountOpen);

  // A gaveta é coisa do celular: ao voltar à largura, ela não fica aberta à espera.
  useEffect(() => {
    if (!narrow) {
      setMenuOpen(false);
    }
  }, [narrow]);

  // O botão que acionou some com a mudança: o foco vai ao botão que ocupa o lugar dele.
  useEffect(() => {
    const target = focusAfterChange.current === 'expand' ? expandRef.current : collapseRef.current;

    if (focusAfterChange.current) {
      target?.focus();
      focusAfterChange.current = null;
    }
  }, [submenuOpen]);

  function collapsePanel() {
    focusAfterChange.current = 'expand';
    setAccountOpen(false);
    setSubmenuOpen(false);
  }

  function expandPanel() {
    focusAfterChange.current = 'collapse';
    setSubmenuOpen(true);
  }

  function openAccountFromRail() {
    setSubmenuOpen(true);
    setAccountOpen(true);
  }

  return (
    <AppShellContext
      value={{
        accountId,
        accountOpen,
        collapsePanel,
        collapseRef,
        expandPanel,
        expandRef,
        isPanelVisible,
        menuOpen,
        narrow,
        openAccountFromRail,
        panelId,
        panelKind,
        setAccountOpen,
        setMenuOpen,
        setPanelKind,
        submenuOpen,
      }}
    >
      <div {...props} className={[styles.appShell, className].filter(Boolean).join(' ')}>
        {children}
      </div>
    </AppShellContext>
  );
}

export const AppShell = Object.assign(AppShellRoot, {
  Account: AppShellAccount,
  Navigation: AppShellNavigation,
  Page: AppShellPage,
  PageBar: AppShellPageBar,
  PageBody: AppShellPageBody,
  Panel: AppShellPanel,
  PanelGroup: AppShellPanelGroup,
  PanelItem: AppShellPanelItem,
  Rail: AppShellRail,
  RailAccount: AppShellRailAccount,
  RailItem: AppShellRailItem,
});
