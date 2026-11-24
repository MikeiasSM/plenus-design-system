import { useState, type HTMLAttributes } from 'react';
import { Button, type ButtonSize } from '../Button';
import { ButtonIcon } from '../ButtonIcon';
import { IconChevronDown } from '../../icons';
import { Menu, type MenuItem, type MenuSection } from '../../overlays/Menu';
import styles from './SplitButton.module.css';

export type SplitButtonVariant = 'primary' | 'secondary';

export interface SplitButtonProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'role'> {
  /** Trava as duas partes: a ação principal e o botão do menu. Um item desabilitado no menu não trava a principal. */
  disabled?: boolean;
  /** As variações da ação, no formato do `Menu`: atalho, grupo com divisor, item desabilitado e tom de perigo. */
  items: readonly (MenuItem | MenuSection)[];
  /** Texto da ação principal, que também dá nome ao grupo. Não muda sozinho para a última escolha do menu. */
  label: string;
  /** Nome do botão que abre o menu, e do próprio menu. O padrão é `Mais opções de <label em minúsculas>`. */
  menuLabel?: string;
  /** A ação principal. */
  onAction?: () => void;
  /** Recebe o `key` do item escolhido no menu, depois do `onSelect` do próprio item. */
  onMenuAction?: (key: string) => void;
  /** Os tamanhos do `Button`: 32, 36 ou 40px. */
  size?: ButtonSize;
  variant?: SplitButtonVariant;
}

/** Liga cada item, nos grupos e nos submenus, ao `onMenuAction`, sem perder o `onSelect` que ele já tenha. */
function comAviso(
  entradas: readonly (MenuItem | MenuSection)[],
  avisar: (key: string) => void,
): (MenuItem | MenuSection)[] {
  return entradas.map((entrada) => {
    if (!('label' in entrada)) {
      return { ...entrada, items: comAviso(entrada.items, avisar) as MenuItem[] };
    }

    if (entrada.items) {
      return { ...entrada, items: comAviso(entrada.items, avisar) };
    }

    return {
      ...entrada,
      onSelect: () => {
        entrada.onSelect?.();
        avisar(entrada.key);
      },
    };
  });
}

/**
 * A ação principal e as variações dela, num grupo de dois botões colados: a principal à vista, com o próprio nome, e
 * as demais no menu do segundo botão.
 */
export function SplitButton({
  className,
  disabled = false,
  items,
  label,
  menuLabel,
  onAction,
  onMenuAction,
  size = 'md',
  variant = 'primary',
  ...props
}: SplitButtonProps) {
  const [aberto, setAberto] = useState(false);
  const nomeDoMenu = menuLabel ?? `Mais opções de ${label.toLocaleLowerCase('pt-BR')}`;

  // Desabilitado com o menu aberto, o menu fecha: o gatilho travado não teria como fechá-lo.
  if (disabled && aberto) {
    setAberto(false);
  }

  return (
    <div
      {...props}
      aria-label={props['aria-label'] ?? label}
      className={[styles.splitButton, styles[variant], className].filter(Boolean).join(' ')}
      role="group"
    >
      <Button className={styles.main} disabled={disabled} onClick={() => onAction?.()} size={size} variant={variant}>
        {label}
      </Button>
      <Menu
        items={onMenuAction ? comAviso(items, onMenuAction) : items}
        label={nomeDoMenu}
        onOpenChange={setAberto}
        open={aberto && !disabled}
        placement="bottom end"
      >
        <ButtonIcon
          className={styles.more}
          disabled={disabled}
          icon={<IconChevronDown />}
          label={nomeDoMenu}
          size={size}
          variant={variant}
        />
      </Menu>
    </div>
  );
}
