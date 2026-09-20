import type { HTMLAttributes } from 'react';
import styles from './Badge.module.css';

export type BadgeTone = 'ok' | 'warn' | 'info' | 'danger' | 'primary' | 'neutral';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  dot?: boolean;
  outline?: boolean;
  tone?: BadgeTone;
}

export function Badge({ children, className, dot = false, outline = false, tone = 'neutral', ...props }: BadgeProps) {
  const classes = [styles.badge, styles[tone], outline && styles.outline, className]
    .filter(Boolean)
    .join(' ');

  return (
    <span {...props} className={classes}>
      {dot && <span className={styles.dot} aria-hidden="true" />}
      {children}
    </span>
  );
}
