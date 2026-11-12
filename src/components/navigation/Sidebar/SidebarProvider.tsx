import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useNarrowViewport } from '../../../hooks/useNarrowViewport';
import { useOpenState } from '../../../hooks/useOpenState';
import {
  defaultSidebarLabels,
  SidebarContext,
  useSidebarContext,
  type SidebarLabels,
  type SidebarPanelKind,
} from './Sidebar.context';

export interface SidebarProviderProps {
  /** Conta aberta, no modo controlado. */
  accountOpen?: boolean;
  children: ReactNode;
  /** Conta aberta no início, no modo não controlado. */
  defaultAccountOpen?: boolean;
  /** Gaveta do celular aberta no início, no modo não controlado. */
  defaultMenuOpen?: boolean;
  /** Submenu aberto no início, no modo não controlado. */
  defaultOpen?: boolean;
  /** Textos fixos dos botões; só os passados trocam o padrão em português. */
  labels?: Partial<SidebarLabels>;
  /** Gaveta do celular aberta, no modo controlado. */
  menuOpen?: boolean;
  onAccountOpenChange?: (open: boolean) => void;
  onMenuOpenChange?: (open: boolean) => void;
  onOpenChange?: (open: boolean) => void;
  /** Submenu aberto, no modo controlado. */
  open?: boolean;
}

/** O que `useSidebar()` devolve: o estado público da navegação e os meios de mudá-lo. */
export interface UseSidebarResult {
  /** Largura estreita: o trilho e o submenu passam a uma gaveta. */
  isMobile: boolean;
  /** Submenu aberto, na largura larga. */
  open: boolean;
  /** Gaveta aberta, na largura estreita. */
  openMobile: boolean;
  /** Abre ou recolhe o submenu sem mexer no foco. Ao recolher, fecha a conta. */
  setOpen: (open: boolean) => void;
  setOpenMobile: (open: boolean) => void;
  /** Na largura estreita alterna a gaveta; na larga, o submenu. */
  toggleSidebar: () => void;
}

function mergeDefined<T extends object>(defaults: T, overrides?: Partial<T>): T {
  const entries = Object.entries(overrides ?? {}).filter(([, value]) => value !== undefined);

  return { ...defaults, ...Object.fromEntries(entries) };
}

/** Guarda o estado da navegação (`Sidebar`) e o reparte com quem estiver dentro, sem desenhar nada. O `AppShell` monta um por dentro. */
export function SidebarProvider({
  accountOpen: controlledAccountOpen,
  children,
  defaultAccountOpen,
  defaultMenuOpen,
  defaultOpen = true,
  labels,
  menuOpen: controlledMenuOpen,
  onAccountOpenChange,
  onMenuOpenChange,
  onOpenChange,
  open: controlledOpen,
}: SidebarProviderProps) {
  const narrow = useNarrowViewport();
  const [submenuOpen, setSubmenuOpenState] = useOpenState({ defaultOpen, onOpenChange, open: controlledOpen });
  const [menuOpen, setMenuOpen] = useOpenState({ defaultOpen: defaultMenuOpen, onOpenChange: onMenuOpenChange, open: controlledMenuOpen });
  const [accountOpen, setAccountOpen] = useOpenState({
    defaultOpen: defaultAccountOpen,
    onOpenChange: onAccountOpenChange,
    open: controlledAccountOpen,
  });
  const [panelKind, setPanelKind] = useState<SidebarPanelKind>('none');
  const collapseRef = useRef<HTMLButtonElement>(null);
  const expandRef = useRef<HTMLButtonElement>(null);
  const focusAfterChange = useRef<'collapse' | 'expand' | null>(null);
  const resolvedLabels = mergeDefined(defaultSidebarLabels, labels);
  const panelId = useId();
  const accountId = useId();

  const isPanelVisible = (kind: SidebarPanelKind) => (kind === 'items' ? narrow || submenuOpen : kind === 'account' && accountOpen);

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

  function setSubmenuOpen(next: boolean) {
    if (!next) {
      setAccountOpen(false);
    }
    setSubmenuOpenState(next);
  }

  function collapsePanel() {
    focusAfterChange.current = 'expand';
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

  // O `setOpen` público descarta o foco pendente de um recolher ou expandir que o pai controlado ainda não aplicou.
  function setOpenWithoutFocus(next: boolean) {
    focusAfterChange.current = null;
    setSubmenuOpen(next);
  }

  return (
    <SidebarContext
      value={{
        accountId,
        accountOpen,
        collapsePanel,
        collapseRef,
        expandPanel,
        expandRef,
        isPanelVisible,
        labels: resolvedLabels,
        menuOpen,
        narrow,
        openAccountFromRail,
        panelId,
        panelKind,
        setAccountOpen,
        setMenuOpen,
        setPanelKind,
        setSubmenuOpen: setOpenWithoutFocus,
        submenuOpen,
      }}
    >
      {children}
    </SidebarContext>
  );
}

/** Lê e muda o estado da navegação. Só funciona dentro de `<SidebarProvider>` ou de `<AppShell>`. */
export function useSidebar(): UseSidebarResult {
  const { menuOpen, narrow, setMenuOpen, setSubmenuOpen, submenuOpen } = useSidebarContext();

  return {
    isMobile: narrow,
    open: submenuOpen,
    openMobile: menuOpen,
    setOpen: setSubmenuOpen,
    setOpenMobile: setMenuOpen,
    toggleSidebar: () => (narrow ? setMenuOpen(!menuOpen) : setSubmenuOpen(!submenuOpen)),
  };
}
