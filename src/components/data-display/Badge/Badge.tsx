import type { ComponentPropsWithRef } from 'react';
import styles from './Badge.module.css';

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

/** `brand` pinta na cor da marca e ignora o `tone`: destaque, nao estado. */
export type BadgeVariant = 'status' | 'brand';

/** Tons da 0.3, aceitos ate a versao menor seguinte: `ok` e `success`, `warn` e `warning`, `primary` e `variant="brand"`. */
type DeprecatedBadgeTone = 'ok' | 'warn' | 'primary';

export interface BadgeProps extends ComponentPropsWithRef<'span'> {
  dot?: boolean;
  outline?: boolean;
  /** `ok`, `warn` e `primary` sao obsoletos: use `success`, `warning` e `variant="brand"`. */
  tone?: BadgeTone | DeprecatedBadgeTone;
  variant?: BadgeVariant;
}

const CURRENT_TONE: Record<DeprecatedBadgeTone, BadgeTone> = { ok: 'success', primary: 'neutral', warn: 'warning' };

export function Badge({
  children,
  className,
  dot = false,
  outline = false,
  tone = 'neutral',
  variant = tone === 'primary' ? 'brand' : 'status',
  ...props
}: BadgeProps) {
  const currentTone = CURRENT_TONE[tone as DeprecatedBadgeTone] ?? tone;
  const color = variant === 'brand' ? styles.brand : styles[currentTone];
  const classes = [styles.badge, color, outline && styles.outline, className].filter(Boolean).join(' ');

  return (
    <span {...props} className={classes}>
      {dot && <span className={styles.dot} aria-hidden="true" />}
      {children}
    </span>
  );
}
