import { ButtonIcon } from '../../actions/ButtonIcon';
import { IconSidebar } from '../../icons';
import { useSidebarContext } from './Sidebar.context';
import styles from './Sidebar.module.css';

export interface SidebarTriggerProps {
  className?: string;
}

/** O botão de abrir a navegação: a gaveta na largura estreita, o submenu recolhido na larga. Não aparece quando não há o que abrir. */
export function SidebarTrigger({ className }: SidebarTriggerProps) {
  const { expandPanel, expandRef, menuOpen, narrow, panelId, panelKind, setMenuOpen, submenuOpen } = useSidebarContext();
  const classes = [styles.frameButton, className].filter(Boolean).join(' ');

  if (narrow) {
    return (
      <ButtonIcon
        aria-expanded={menuOpen}
        aria-haspopup="dialog"
        className={classes}
        icon={<IconSidebar />}
        label="Abrir menu"
        onClick={() => setMenuOpen(true)}
        size="sm"
        variant="ghost"
      />
    );
  }

  if (panelKind === 'items' && !submenuOpen) {
    return (
      <ButtonIcon
        aria-controls={panelId}
        aria-expanded={false}
        className={classes}
        icon={<IconSidebar />}
        label="Abrir submenu"
        onClick={expandPanel}
        ref={expandRef}
        size="sm"
        variant="ghost"
      />
    );
  }

  return null;
}
