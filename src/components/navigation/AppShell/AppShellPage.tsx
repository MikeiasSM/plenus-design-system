import type { ComponentPropsWithRef } from 'react';
import { ButtonIcon } from '../../actions/ButtonIcon';
import { IconSidebar } from '../../icons';
import { useAppShell } from './AppShell.context';
import styles from './AppShell.module.css';

export type AppShellPageProps = ComponentPropsWithRef<'main'>;

/** A folha da página. Ocupa o que sobra ao lado do trilho e do submenu. */
export function AppShellPage({ className, ...props }: AppShellPageProps) {
  return <main {...props} className={[styles.page, className].filter(Boolean).join(' ')} />;
}

/** Barra de 46px no topo da página. Abre o submenu recolhido, ou a gaveta no celular, e leva o que o produto puser ao lado. */
export function AppShellPageBar({ children, className, ...props }: ComponentPropsWithRef<'div'>) {
  const { expandPanel, expandRef, menuOpen, narrow, panelId, panelKind, setMenuOpen, submenuOpen } = useAppShell();
  const showsMenuButton = narrow;
  const showsExpandButton = !narrow && panelKind === 'items' && !submenuOpen;

  return (
    <div {...props} className={[styles.pageBar, className].filter(Boolean).join(' ')}>
      {showsMenuButton && (
        <ButtonIcon
          aria-expanded={menuOpen}
          aria-haspopup="dialog"
          className={styles.frameButton}
          icon={<IconSidebar />}
          label="Abrir menu"
          onClick={() => setMenuOpen(true)}
          size="sm"
          variant="ghost"
        />
      )}
      {showsExpandButton && (
        <ButtonIcon
          aria-controls={panelId}
          aria-expanded={false}
          className={styles.frameButton}
          icon={<IconSidebar />}
          label="Abrir submenu"
          onClick={expandPanel}
          ref={expandRef}
          size="sm"
          variant="ghost"
        />
      )}
      {children}
    </div>
  );
}

/** Corpo da página: a única área que rola. Mede a largura da folha para as regras de container do produto. */
export function AppShellPageBody({ className, ...props }: ComponentPropsWithRef<'div'>) {
  return <div {...props} className={[styles.pageBody, className].filter(Boolean).join(' ')} />;
}
