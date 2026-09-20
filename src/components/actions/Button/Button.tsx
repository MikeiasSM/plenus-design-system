import { forwardRef, type ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      disabled = false,
      loading = false,
      size = 'md',
      type = 'button',
      variant = 'primary',
      ...props
    },
    ref,
  ) => {
    const classes = [styles.button, styles[variant], styles[size], className]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        {...props}
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        type={type}
      >
        {loading && <span className={styles.spinner} aria-hidden="true" />}
        {children}
      </button>
    );
  },
);
