import { useId, useRef, useState, type ComponentPropsWithRef, type ReactNode } from 'react';
import { IconCheck, IconClose } from '../../icons';
import { useFocusNeighborOnRemove } from '../../../hooks/useFocusNeighborOnRemove';
import { useMergedRefs } from '../../../hooks/useMergedRefs';
import { blockRepeatedPress, isRepeatedClick } from '../../../utils/press/press';
import styles from './Tag.module.css';

export type TagSize = 'sm' | 'md';
export type TagAppearance = 'outline' | 'filled';

export interface TagProps extends Omit<ComponentPropsWithRef<'span'>, 'children'> {
  /** `outline`, o padrão, tem contorno sobre a superfície; `filled` tem fundo neutro, sem contorno. */
  appearance?: TagAppearance;
  children: ReactNode;
  defaultSelected?: boolean;
  disabled?: boolean;
  /** Mostra o botao de remover, nomeado como `removeLabel` seguido do texto da etiqueta. */
  onRemove?: () => void;
  /** Com `selected`, `defaultSelected` ou `onSelectedChange`, a etiqueta vira um botao de alternar, como o filtro que se liga e desliga. */
  onSelectedChange?: (selected: boolean) => void;
  /** Verbo do botao de remover, antes do texto da etiqueta no nome dele. */
  removeLabel?: string;
  selected?: boolean;
  size?: TagSize;
}

export function Tag({
  appearance = 'outline',
  children,
  className,
  defaultSelected,
  disabled = false,
  onRemove,
  onSelectedChange,
  ref: refDoConsumidor,
  removeLabel = 'Remover',
  selected,
  size = 'md',
  ...props
}: TagProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const mergedRef = useMergedRefs(ref, refDoConsumidor);
  const textId = useId();
  const removeId = useId();
  const [internalSelected, setInternalSelected] = useState(defaultSelected ?? false);
  const toggleable = selected !== undefined || defaultSelected !== undefined || onSelectedChange !== undefined;
  const currentSelected = selected ?? internalSelected;
  const classes = [
    styles.tag,
    styles[size],
    appearance === 'filled' && styles.filled,
    toggleable && currentSelected && styles.selected,
    disabled && styles.disabled,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  /* Com texto simples, o nome do botao de remover e escrito direto; com conteudo rico, ele vem do texto desenhado. */
  const plainText = typeof children === 'string' || typeof children === 'number';

  useFocusNeighborOnRemove(ref);

  function toggle() {
    if (selected === undefined) {
      setInternalSelected(!currentSelected);
    }
    onSelectedChange?.(!currentSelected);
  }

  return (
    <span
      {...props}
      className={classes}
      data-disabled={disabled || undefined}
      data-selected={(toggleable && currentSelected) || undefined}
      ref={mergedRef}
    >
      {toggleable ? (
        <button
          aria-pressed={currentSelected}
          className={styles.toggle}
          disabled={disabled}
          id={textId}
          onClick={toggle}
          onKeyDown={blockRepeatedPress}
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
          {...(plainText
            ? { 'aria-label': `${removeLabel} ${children}` }
            : { 'aria-label': removeLabel, 'aria-labelledby': `${removeId} ${textId}` })}
          className={styles.remove}
          data-removes=""
          disabled={disabled}
          id={removeId}
          onClick={(event) => !isRepeatedClick(event) && onRemove()}
          onKeyDown={blockRepeatedPress}
          type="button"
        >
          <IconClose />
        </button>
      )}
    </span>
  );
}
