import type { ComponentPropsWithRef } from 'react';
import styles from './Badge.module.css';

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

/**
 * `brand` pinta na cor da marca e ignora o `tone`: destaque, nao estado. `count` e o selo de contagem, um circulo
 * na cor da marca com algarismos tabulares; ignora `tone`, `size`, `dot` e `outline`.
 */
export type BadgeVariant = 'status' | 'brand' | 'count';

export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends ComponentPropsWithRef<'span'> {
  dot?: boolean;
  outline?: boolean;
  /** `sm` usa o papel `type.micro` (10px): etiqueta ao lado de um titulo, sem competir com ele. */
  size?: BadgeSize;
  tone?: BadgeTone;
  variant?: BadgeVariant;
}

/** Acima de 99, o selo mostra "99+": a contagem exata nao cabe no circulo nem muda a decisao de quem o le. */
export function formatBadgeCount(count: number) {
  return count > 99 ? '99+' : String(count);
}

export function Badge({
  children,
  className,
  dot = false,
  outline = false,
  size = 'md',
  tone = 'neutral',
  variant = 'status',
  ...props
}: BadgeProps) {
  if (variant === 'count') {
    return (
      <span {...props} className={[styles.badge, styles.count, className].filter(Boolean).join(' ')}>
        {typeof children === 'number' ? formatBadgeCount(children) : children}
      </span>
    );
  }

  const color = variant === 'brand' ? styles.brand : styles[tone];
  const classes = [styles.badge, styles[size], color, outline && styles.outline, className].filter(Boolean).join(' ');

  return (
    <span {...props} className={classes}>
      {dot && <span className={styles.dot} aria-hidden="true" />}
      {children}
    </span>
  );
}
