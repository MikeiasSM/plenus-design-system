import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Alert.module.css';

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  tone?: AlertTone;
  title?: string;
  children?: ReactNode;
}

export function Alert({ children, className, title, tone = 'info', ...props }: AlertProps) {
  const classes = [styles.alert, styles[tone], className].filter(Boolean).join(' ');
  const urgente = tone === 'danger' || tone === 'warning';

  return (
    <div role={urgente ? 'alert' : 'status'} {...props} className={classes}>
      {title && <strong className={styles.title}>{title}</strong>}
      {children && <div className={styles.body}>{children}</div>}
    </div>
  );
}
