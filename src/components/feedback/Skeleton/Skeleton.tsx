import type { HTMLAttributes } from 'react';
import styles from './Skeleton.module.css';

export type SkeletonShape = 'line' | 'circle' | 'block';

export interface SkeletonProps extends HTMLAttributes<HTMLSpanElement> {
  /** Numero em pixels ou qualquer medida CSS. Sem altura, cada forma tem a sua: linha de texto, avatar ou bloco. */
  height?: number | string;
  shape?: SkeletonShape;
  width?: number | string;
}

/**
 * Lugar de um conteudo que ainda carrega. E decorativo e fica fora da leitura:
 * quem envolve os esqueletos anuncia o carregamento, com `aria-busy` ou uma mensagem de status.
 */
export function Skeleton({ className, height, shape = 'line', style, width, ...props }: SkeletonProps) {
  return (
    <span
      {...props}
      aria-hidden="true"
      className={[styles.skeleton, styles[shape], className].filter(Boolean).join(' ')}
      style={{ height, width, ...style }}
    />
  );
}
