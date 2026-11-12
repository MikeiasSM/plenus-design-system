import { useContext, useEffect, type ComponentPropsWithRef } from 'react';
import { isDevelopment } from '../../../utils/isDevelopment';
import { Sidebar, SidebarProvider, type SidebarProviderProps } from '../Sidebar';
import { SidebarContext } from '../Sidebar/Sidebar.context';
import { AppShellPage, AppShellPageBar, AppShellPageBody, AppShellPageFooter } from './AppShellPage';
import styles from './AppShell.module.css';

export interface AppShellProps extends ComponentPropsWithRef<'div'>, Omit<SidebarProviderProps, 'children'> {
  /**
   * Submenu aberto no início, no modo não controlado (padrão `true`).
   * Ignorado quando já existe um `SidebarProvider` por fora: o estado é o dele.
   */
  defaultOpen?: boolean;
  /** Textos fixos da navegação. Ignorado quando já existe um `SidebarProvider` por fora. */
  labels?: SidebarProviderProps['labels'];
  /** Ignorado quando já existe um `SidebarProvider` por fora. */
  onOpenChange?: (open: boolean) => void;
  /**
   * Submenu aberto, no modo controlado. Abrir empurra a página; recolher devolve a largura.
   * Ignorado quando já existe um `SidebarProvider` por fora.
   */
  open?: boolean;
}

/** Moldura da aplicação: monta o `SidebarProvider` com o estado da navegação (`Sidebar`) e abriga a página. Ocupa a janela; numa caixa, redefina `--pl-shell-height`. */
function AppShellRoot({
  accountOpen,
  children,
  className,
  defaultAccountOpen,
  defaultMenuOpen,
  defaultOpen,
  labels,
  menuOpen,
  narrowBelow,
  onAccountOpenChange,
  onMenuOpenChange,
  onOpenChange,
  open,
  ...props
}: AppShellProps) {
  const outerSidebar = useContext(SidebarContext);
  const providerProps = {
    accountOpen,
    defaultAccountOpen,
    defaultMenuOpen,
    defaultOpen,
    labels,
    menuOpen,
    narrowBelow,
    onAccountOpenChange,
    onMenuOpenChange,
    onOpenChange,
    open,
  };
  const ignoresStateProps = outerSidebar !== null && Object.values(providerProps).some((value) => value !== undefined);

  useEffect(() => {
    if (ignoresStateProps && isDevelopment()) {
      console.warn('AppShell: há um <SidebarProvider> por fora, que guarda o estado e a configuração; as props de navegação do AppShell são ignoradas.');
    }
  }, [ignoresStateProps]);

  const frame = (
    <div {...props} className={[styles.appShell, className].filter(Boolean).join(' ')}>
      {children}
    </div>
  );

  if (outerSidebar) {
    return frame;
  }

  return (
    <SidebarProvider {...providerProps}>
      {frame}
    </SidebarProvider>
  );
}

export const AppShell = Object.assign(AppShellRoot, {
  /** @deprecated Use `Sidebar.Account`. Aceito ate a versao menor seguinte. */
  Account: Sidebar.Account,
  /** @deprecated Use `Sidebar`. Aceito ate a versao menor seguinte. */
  Navigation: Sidebar,
  Page: AppShellPage,
  PageBar: AppShellPageBar,
  PageBody: AppShellPageBody,
  PageFooter: AppShellPageFooter,
  /** @deprecated Use `Sidebar.Panel`. Aceito ate a versao menor seguinte. */
  Panel: Sidebar.Panel,
  /** @deprecated Use `Sidebar.Group`. Aceito ate a versao menor seguinte. */
  PanelGroup: Sidebar.Group,
  /** @deprecated Use `Sidebar.Item`. Aceito ate a versao menor seguinte. */
  PanelItem: Sidebar.Item,
  /** @deprecated Use `Sidebar.Rail`. Aceito ate a versao menor seguinte. */
  Rail: Sidebar.Rail,
  /** @deprecated Use `Sidebar.RailAccount`. Aceito ate a versao menor seguinte. */
  RailAccount: Sidebar.RailAccount,
  /** @deprecated Use `Sidebar.RailItem`. Aceito ate a versao menor seguinte. */
  RailItem: Sidebar.RailItem,
});
