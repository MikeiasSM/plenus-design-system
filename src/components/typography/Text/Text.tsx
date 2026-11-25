import type { ComponentPropsWithRef, ElementType } from 'react';
import styles from './Text.module.css';

export type TextVariant = 'body' | 'label' | 'caption' | 'micro' | 'title' | 'code';
export type TextTone = 'default' | 'secondary' | 'tertiary' | 'danger';

/** As variantes que, postas em `role`, seriam papel ARIA inválido ou fora do lugar. `code` é papel válido e fica. */
const MISPLACED_VARIANTS: readonly string[] = ['body', 'label', 'caption', 'micro', 'title'] satisfies TextVariant[];

export interface TextProps extends ComponentPropsWithRef<'span'> {
  /** Elemento ou componente que renderiza o texto. `span`, o padrão, não quebra a linha; `p` e `div` sim. */
  as?: ElementType;
  /** Mantém o texto em uma linha e corta o excesso com reticências. Precisa de largura limitada pelo pai. */
  truncate?: boolean;
  /** Algarismos tabulares: os números ficam alinhados em colunas e não mudam de largura ao trocar. */
  numeric?: boolean;
  /** `default`, a cor do texto corrente; `secondary` e `tertiary`, para o apoio; `danger`, para o erro. */
  tone?: TextTone;
  /** O papel tipográfico, com tamanho, entrelinha e peso dos tokens. O padrão é `body`. Não é o `role` do HTML. */
  variant?: TextVariant;
}

export function Text({
  as: Elemento = 'span',
  className,
  numeric = false,
  tone = 'default',
  truncate = false,
  role,
  variant,
  ...props
}: TextProps) {
  // `role` com o nome de uma variante, sem `variant`, é a variante trocada de lugar: vale como variante e não vai ao HTML.
  const roleIsVariant = variant === undefined && role !== undefined && MISPLACED_VARIANTS.includes(role);

  return (
    <Elemento
      {...props}
      role={roleIsVariant ? undefined : role}
      className={[styles.root, className].filter(Boolean).join(' ')}
      data-numeric={numeric || undefined}
      data-tone={tone}
      data-truncate={truncate || undefined}
      data-variant={variant ?? (roleIsVariant ? role : 'body')}
    />
  );
}
