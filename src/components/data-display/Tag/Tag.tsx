import { useId, type HTMLAttributes, type ReactNode } from 'react';
import { IconCheck, IconClose } from '../../icons';
import styles from './Tag.module.css';

export type TagSize = 'sm' | 'md';

export interface TagProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  children: ReactNode;
  disabled?: boolean;
  /** Mostra o botao de remover, nomeado como "Remover" seguido do texto da etiqueta. */
  onRemove?: () => void;
  /** Com `selected`, a etiqueta vira um botao de alternar, como o filtro que se liga e desliga. */
  onSelectedChange?: (selected: boolean) => void;
  selected?: boolean;
  size?: TagSize;
}

export function Tag({
  children,
  className,
  disabled = false,
  onRemove,
  onSelectedChange,
  selected,
  size = 'md',
  ...props
}: TagProps) {
  const textId = useId();
  const removeId = useId();
  const toggleable = selected !== undefined;
  const classes = [styles.tag, styles[size], selected && styles.selected, disabled && styles.disabled, className]
    .filter(Boolean)
    .join(' ');

  return (
    <span {...props} className={classes}>
      {toggleable ? (
        <button
          aria-pressed={selected}
          className={styles.toggle}
          disabled={disabled}
          id={textId}
          onClick={() => onSelectedChange?.(!selected)}
          type="button"
        >
          {selected && <IconCheck className={styles.check} />}
          {children}
        </button>
      ) : (
        <span id={textId}>{children}</span>
      )}
      {onRemove && (
        <button
          aria-label="Remover"
          aria-labelledby={`${removeId} ${textId}`}
          className={styles.remove}
          disabled={disabled}
          id={removeId}
          onClick={onRemove}
          type="button"
        >
          <IconClose />
        </button>
      )}
    </span>
  );
}
