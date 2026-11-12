import type { ComponentPropsWithRef, ReactNode } from 'react';
import styles from './CardMetricBody.module.css';

export interface CardMetricBodyProps extends ComponentPropsWithRef<'div'> {
  /** A ordem dos filhos e a ordem na tela. */
  children: ReactNode;
  /** Em `horizontal`, as partes dividem a largura, como o gráfico ao lado do valor. */
  orientation?: 'vertical' | 'horizontal';
}

/** Âncora as partes no rodapé do cartão, para os valores de uma linha de cartoes ficarem na mesma altura. */
export function CardMetricBody({ className, orientation = 'vertical', ...props }: CardMetricBodyProps) {
  return (
    <div
      {...props}
      className={[styles.body, orientation === 'horizontal' && styles.horizontal, className].filter(Boolean).join(' ')}
    />
  );
}
