import { useId, useState, type ComponentPropsWithRef, type ReactNode } from 'react';
import { IconCheck, IconClose } from '../../icons';
import styles from './Tag.module.css';

export type TagSize = 'sm' | 'md';

export interface TagProps extends Omit<ComponentPropsWithRef<'span'>, 'children'> {
  children: ReactNode;
  defaultSelected?: boolean;
  disabled?: boolean;
  /** Mostra o botao de remover, nomeado como "Remover" seguido do texto da etiqueta. */
  onRemove?: () => void;
  /** Com `selected`, `defaultSelected` ou `onSelectedChange`, a etiqueta vira um botao de alternar, como o filtro que se liga e desliga. */
  onSelectedChange?: (selected: boolean) => void;
  selected?: boolean;
  size?: TagSize;
}

export function Tag({
  children,
  className,
  defaultSelected,
  disabled = false,
  onRemove,
  onSelectedChange,
  selected,
  size = 'md',
  ...props
}: TagProps) {
  const textId = useId();
  const removeId = useId();
  const [internalSelected, setInternalSelected] = useState(defaultSelected ?? false);
  const toggleable = selected !== undefined || defaultSelected !== undefined || onSelectedChange !== undefined;
  const currentSelected = selected ?? internalSelected;
  const classes = [styles.tag, styles[size], toggleable && currentSelected && styles.selected, disabled && styles.disabled, className]
    .filter(Boolean)
    .join(' ');

  function toggle() {
    if (selected === undefined) {
      setInternalSelected(!currentSelected);
    }
    onSelectedChange?.(!currentSelected);
  }

  return (
    <span {...props} className={classes}>
      {toggleable ? (
        <button
          aria-pressed={currentSelected}
          className={styles.toggle}
          disabled={disabled}
          id={textId}
          onClick={toggle}
          type="button"
        >
          {currentSelected && <IconCheck className={styles.check} />}
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
