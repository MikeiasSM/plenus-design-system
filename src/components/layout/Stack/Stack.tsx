import type { ComponentPropsWithRef, ElementType } from 'react';
import styles from './Stack.module.css';

/** Espaçamento entre os filhos: o passo `N` de `--pl-space-N`, de 1 a 7. */
export type StackGap = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type StackDirection = 'vertical' | 'horizontal';
export type StackAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type StackJustify = 'start' | 'center' | 'end' | 'between';

export interface StackProps extends ComponentPropsWithRef<'div'> {
  /** Alinhamento no eixo transversal. Sem ele, os filhos se esticam, como no flex. */
  align?: StackAlign;
  /** Elemento ou componente da raiz, como `section` ou `ul`, quando a semântica pede. */
  as?: ElementType;
  /** `vertical`, o padrão, empilha os filhos; `horizontal` os põe em linha. */
  direction?: StackDirection;
  /** Passo de `--pl-space-N` entre os filhos. Padrão: 4. */
  gap?: StackGap;
  /** Distribuição no eixo principal. */
  justify?: StackJustify;
  /** Quebra os filhos em novas linhas quando faltar espaço. */
  wrap?: boolean;
}

/** Pilha flex: espaça os filhos num eixo, sem mexer na semântica do conteúdo. */
export function Stack({
  align,
  as: Element = 'div',
  className,
  direction = 'vertical',
  gap = 4,
  justify,
  wrap,
  ...props
}: StackProps) {
  return (
    <Element
      {...props}
      className={[styles.root, className].filter(Boolean).join(' ')}
      data-align={align}
      data-direction={direction}
      data-gap={gap}
      data-justify={justify}
      data-wrap={wrap ? '' : undefined}
    />
  );
}
