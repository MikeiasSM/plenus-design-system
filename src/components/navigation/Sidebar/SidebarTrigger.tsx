import type { MouseEvent } from 'react';
import { ButtonIcon, type ButtonIconProps } from '../../actions/ButtonIcon';
import { useMergedRefs } from '../../../hooks/useMergedRefs';
import { useSidebarContext } from './Sidebar.context';
import styles from './Sidebar.module.css';

/** As propriedades do `ButtonIcon`, menos o ícone e o nome, que são do botão de abrir. O ref e as nativas vão ao `<button>`. */
export type SidebarTriggerProps = Omit<ButtonIconProps, 'icon' | 'label'>;

/**
 * O botão de abrir a navegação: a gaveta na largura estreita, o submenu recolhido na larga. Não aparece quando não há o
 * que abrir. O `onClick` do consumidor roda antes; `event.preventDefault()` nele cancela a abertura.
 */
export function SidebarTrigger({ className, onClick, ref, size = 'sm', variant = 'ghost', ...props }: SidebarTriggerProps) {
  const { expandPanel, expandRef, icons, labels, menuOpen, narrow, panelId, panelKind, setMenuOpen, submenuOpen } = useSidebarContext();
  const expandButtonRef = useMergedRefs(ref, expandRef);
  const classes = [styles.frameButton, className].filter(Boolean).join(' ');

  function handleClick(event: MouseEvent<HTMLButtonElement>, open: () => void) {
    onClick?.(event);

    if (!event.defaultPrevented) {
      open();
    }
  }

  if (narrow) {
    return (
      <ButtonIcon
        {...props}
        aria-expanded={menuOpen}
        aria-haspopup="dialog"
        className={classes}
        icon={icons.open}
        label={labels.openMenu}
        onClick={(event) => handleClick(event, () => setMenuOpen(true))}
        ref={ref}
        size={size}
        variant={variant}
      />
    );
  }

  if (panelKind === 'items' && !submenuOpen) {
    return (
      <ButtonIcon
        {...props}
        aria-controls={panelId}
        aria-expanded={false}
        className={classes}
        icon={icons.open}
        label={labels.openSubmenu}
        onClick={(event) => handleClick(event, expandPanel)}
        ref={expandButtonRef}
        size={size}
        variant={variant}
      />
    );
  }

  return null;
}
