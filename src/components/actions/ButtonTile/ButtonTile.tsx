import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import { Tooltip } from '../../overlays/Tooltip';
import styles from './ButtonTile.module.css';

export type ButtonTileSize = 'sm' | 'md';

export interface ButtonTileProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'aria-pressed' | 'children'> {
  /** Mostrada como dica no foco e no ponteiro, e ligada ao botão por `aria-describedby`. */
  description?: string;
  icon: ReactNode;
  /** Texto visível e nome do botão. */
  label: string;
  ref?: Ref<HTMLButtonElement>;
  /** Para o ladrilho que alterna: vira `aria-pressed`. Sem ele, o ladrilho é um botão comum. */
  selected?: boolean;
  size?: ButtonTileSize;
}

export function ButtonTile({ className, description, icon, label, selected, size = 'md', type = 'button', ...props }: ButtonTileProps) {
  const tile = (
    <button
      {...props}
      aria-pressed={selected}
      className={[styles.tile, styles[size], className].filter(Boolean).join(' ')}
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
