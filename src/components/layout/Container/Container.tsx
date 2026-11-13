import type { ComponentPropsWithRef, CSSProperties } from 'react';
import styles from './Container.module.css';

export interface ContainerProps extends ComponentPropsWithRef<'div'> {
  /** Largura da coluna de conteúdo: `760px`, `1120px` ou um número, em px. Sem ela, usa a largura toda. */
  maxWidth?: CSSProperties['maxWidth'];
}

/** Palavras-chave de `max-width`, que não somam com uma medida e valem como estão. */
const PALAVRAS_CHAVE = /^(none|min-content|max-content|fit-content|inherit|initial|unset|revert|revert-layer)$/;

/** A caixa tem `border-box` e o respiro dentro dela: a largura máxima é a do conteúdo mais os dois respiros. */
function larguraMaxima(maxWidth: ContainerProps['maxWidth']) {
  if (maxWidth === undefined || maxWidth === '') {
    return undefined;
  }

  const medida = typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth.trim();

  return PALAVRAS_CHAVE.test(medida) ? medida : `calc(${medida} + 2 * var(--pl-space-5))`;
}

/**
 * A coluna de conteúdo, centrada, na largura do pai. O `maxWidth` mede o conteúdo, sem o respiro lateral, como no
 * `PageHeader`: os dois, com o mesmo valor, alinham na mesma borda. O respiro vertical é de quem usa.
 */
export function Container({ className, maxWidth, style, ...props }: ContainerProps) {
  return (
    <div
      {...props}
      className={[styles.root, className].filter(Boolean).join(' ')}
      style={{ ...style, maxWidth: larguraMaxima(maxWidth) }}
    />
  );
}
