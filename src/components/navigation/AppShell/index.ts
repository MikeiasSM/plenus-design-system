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
export type { AppShellPageFooterProps, AppShellPageProps } from './AppShellPage';

/** @deprecated Use `SidebarAccountProps`. Aceito ate a 0.8.0. */
export type AppShellAccountProps = SidebarAccountProps;
/** @deprecated Use `SidebarProps`. Aceito ate a 0.8.0. */
export type AppShellNavigationProps = SidebarProps;
/** @deprecated Use `SidebarGroupProps`. Aceito ate a 0.8.0. */
export type AppShellPanelGroupProps = SidebarGroupProps;
/** @deprecated Use `SidebarItemProps`. Aceito ate a 0.8.0. */
export type AppShellPanelItemProps = SidebarItemProps;
/** @deprecated Use `SidebarPanelProps`. Aceito ate a 0.8.0. */
export type AppShellPanelProps = SidebarPanelProps;
/** @deprecated Use `SidebarAccountMode`. Aceito ate a 0.8.0. */
export type AppShellAccountMode = SidebarAccountMode;
/** @deprecated Use `SidebarNestedMode`. Aceito ate a 0.8.0. */
export type AppShellNestedMode = SidebarNestedMode;
/** @deprecated Use `SidebarRailAccountProps`. Aceito ate a 0.8.0. */
export type AppShellRailAccountProps = SidebarRailAccountProps;
/** @deprecated Use `SidebarRailItemProps`. Aceito ate a 0.8.0. */
export type AppShellRailItemProps = SidebarRailItemProps;
/** @deprecated Use `SidebarRailProps`. Aceito ate a 0.8.0. */
export type AppShellRailProps = SidebarRailProps;
