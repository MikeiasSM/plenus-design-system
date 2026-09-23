import type { HTMLAttributes } from 'react';
import styles from './Progress.module.css';

export type ProgressSize = 'sm' | 'md';

export interface ProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  label: string;
  max?: number;
  showValue?: boolean;
  size?: ProgressSize;
  value?: number;
}

export function Progress({ className, label, max = 100, showValue = false, size = 'md', value, ...props }: ProgressProps) {
  const indeterminate = value === undefined;
  const limitado = indeterminate ? 0 : Math.min(Math.max(value, 0), max);
  const percentual = max > 0 ? (limitado / max) * 100 : 0;
  const classes = [styles.progress, styles[size], className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <div
        {...props}
        className={styles.track}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={indeterminate ? undefined : limitado}
      >
        <div
          className={indeterminate ? styles.indeterminate : styles.fill}
          style={indeterminate ? undefined : { width: `${percentual}%` }}
        />
      </div>
      {showValue && !indeterminate && (
        <span className={styles.value}>{Math.round(percentual)}%</span>
      )}
    </div>
  );
}
