import type { HTMLAttributes } from 'react';
import styles from './Spinner.module.css';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: SpinnerSize;
  label?: string;
}

export function Spinner({ className, label, size = 'md', ...props }: SpinnerProps) {
  const classes = [styles.spinner, styles[size], className].filter(Boolean).join(' ');

  if (!label) {
    return <span {...props} className={classes} aria-hidden="true" />;
  }

  return <span {...props} className={classes} role="status" aria-label={label} />;
}
