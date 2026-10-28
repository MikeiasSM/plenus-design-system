import { useState, type ButtonHTMLAttributes, type MouseEvent, type ReactNode, type Ref } from 'react';
import { Tooltip } from '../../overlays/Tooltip';
import styles from './ButtonTile.module.css';

export type ButtonTileSize = 'sm' | 'md';

export interface ButtonTileProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'aria-pressed' | 'children'> {
  defaultSelected?: boolean;
  /** Mostrada como dica no foco e no ponteiro, e ligada ao botão por `aria-describedby`. */
  description?: string;
  icon: ReactNode;
  /** Texto visível e nome do botão. */
  label: string;
  onSelectedChange?: (selected: boolean) => void;
  ref?: Ref<HTMLButtonElement>;
  /** Com `selected`, `defaultSelected` ou `onSelectedChange`, o ladrilho alterna e anuncia `aria-pressed`. Sem eles, é um botão comum. */
  selected?: boolean;
  size?: ButtonTileSize;
}

export function ButtonTile({
  className,
  defaultSelected,
  description,
  icon,
  label,
  onClick,
  onSelectedChange,
  selected,
  size = 'md',
  type = 'button',
  ...props
}: ButtonTileProps) {
  const [internalSelected, setInternalSelected] = useState(defaultSelected ?? false);
  const toggleable = selected !== undefined || defaultSelected !== undefined || onSelectedChange !== undefined;
  const currentSelected = selected ?? internalSelected;

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    onClick?.(event);

    if (!toggleable) {
      return;
    }
    if (selected === undefined) {
      setInternalSelected(!currentSelected);
    }
    onSelectedChange?.(!currentSelected);
  }

  const tile = (
    <button
      {...props}
      aria-pressed={toggleable ? currentSelected : undefined}
      className={[styles.tile, styles[size], className].filter(Boolean).join(' ')}
      onClick={handleClick}
      type={type}
    >
      <span aria-hidden="true" className={styles.icon}>
        {icon}
      </span>
      <span className={styles.label}>{label}</span>
    </button>
  );

  return description ? <Tooltip content={description}>{tile}</Tooltip> : tile;
}
