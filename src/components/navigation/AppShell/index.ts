import type {
  SidebarAccountMode,
  SidebarAccountProps,
  SidebarGroupProps,
  SidebarItemProps,
  SidebarNestedMode,
  SidebarPanelProps,
  SidebarProps,
  SidebarRailAccountProps,
  SidebarRailItemProps,
  SidebarRailProps,
} from '../Sidebar';

export { AppShell } from './AppShell';
export type { AppShellProps } from './AppShell';
export type { AppShellPageProps } from './AppShellPage';

/** @deprecated Use `SidebarAccountProps`. Aceito ate a versao menor seguinte. */
export type AppShellAccountProps = SidebarAccountProps;
/** @deprecated Use `SidebarProps`. Aceito ate a versao menor seguinte. */
export type AppShellNavigationProps = SidebarProps;
/** @deprecated Use `SidebarGroupProps`. Aceito ate a versao menor seguinte. */
export type AppShellPanelGroupProps = SidebarGroupProps;
/** @deprecated Use `SidebarItemProps`. Aceito ate a versao menor seguinte. */
export type AppShellPanelItemProps = SidebarItemProps;
/** @deprecated Use `SidebarPanelProps`. Aceito ate a versao menor seguinte. */
export type AppShellPanelProps = SidebarPanelProps;
/** @deprecated Use `SidebarAccountMode`. Aceito ate a versao menor seguinte. */
export type AppShellAccountMode = SidebarAccountMode;
/** @deprecated Use `SidebarNestedMode`. Aceito ate a versao menor seguinte. */
export type AppShellNestedMode = SidebarNestedMode;
/** @deprecated Use `SidebarRailAccountProps`. Aceito ate a versao menor seguinte. */
export type AppShellRailAccountProps = SidebarRailAccountProps;
/** @deprecated Use `SidebarRailItemProps`. Aceito ate a versao menor seguinte. */
export type AppShellRailItemProps = SidebarRailItemProps;
/** @deprecated Use `SidebarRailProps`. Aceito ate a versao menor seguinte. */
export type AppShellRailProps = SidebarRailProps;
