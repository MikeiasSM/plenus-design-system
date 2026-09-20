import type { LabelHTMLAttributes } from 'react';
import styles from './Label.module.css';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({ children, className, required = false, ...props }: LabelProps) {
  const classes = [styles.label, className].filter(Boolean).join(' ');

  return (
    <label {...props} className={classes}>
      {children}
      {required && <span className={styles.required} aria-hidden="true">*</span>}
    </label>
  );
}
