import type { ComponentPropsWithRef } from 'react';
import styles from './Badge.module.css';

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

/** `brand` pinta na cor da marca e ignora o `tone`: destaque, nao estado. */
export type BadgeVariant = 'status' | 'brand';

export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends ComponentPropsWithRef<'span'> {
  dot?: boolean;
  outline?: boolean;
  /** `sm` usa o papel `type.micro` (10px): etiqueta ao lado de um titulo, sem competir com ele. */
  size?: BadgeSize;
  tone?: BadgeTone;
  variant?: BadgeVariant;
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
  const color = variant === 'brand' ? styles.brand : styles[tone];
  const classes = [styles.badge, styles[size], color, outline && styles.outline, className].filter(Boolean).join(' ');

  return (
    <span {...props} className={classes}>
      {dot && <span className={styles.dot} aria-hidden="true" />}
      {children}
    </span>
  );
}
