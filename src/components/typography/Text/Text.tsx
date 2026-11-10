import type { ComponentPropsWithRef, ElementType } from 'react';
import styles from './Text.module.css';

export type TextVariant = 'body' | 'label' | 'caption' | 'micro' | 'title' | 'code';
export type TextTone = 'default' | 'secondary' | 'tertiary' | 'danger';

export interface TextProps extends ComponentPropsWithRef<'span'> {
  /** Elemento ou componente que renderiza o texto. `span`, o padrão, não quebra a linha; `p` e `div` sim. */
  as?: ElementType;
  /** Mantém o texto em uma linha e corta o excesso com reticências. Precisa de largura limitada pelo pai. */
  truncate?: boolean;
  /** Algarismos tabulares: os números ficam alinhados em colunas e não mudam de largura ao trocar. */
  numeric?: boolean;
  /** `default`, a cor do texto corrente; `secondary` e `tertiary`, para o apoio; `danger`, para o erro. */
  tone?: TextTone;
  /** O papel tipográfico, com tamanho, entrelinha e peso dos tokens. O padrão é `body`. */
  variant?: TextVariant;
}

export function Text({
  as: Elemento = 'span',
  className,
  numeric = false,
  tone = 'default',
  truncate = false,
  variant = 'body',
  ...props
}: TextProps) {
  return (
    <Elemento
      {...props}
      className={[styles.root, className].filter(Boolean).join(' ')}
      data-numeric={numeric || undefined}
      data-tone={tone}
      data-truncate={truncate || undefined}
      data-variant={variant}
    />
  );
}
