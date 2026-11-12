import { forwardRef, type ButtonHTMLAttributes, type KeyboardEvent, type MouseEvent } from 'react';
import { blockRepeatedPress } from '../../../utils/press/press';
import { Spinner } from '../../feedback/Spinner';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'ghost' | 'danger' | 'dangerSoft' | 'dangerGhost';
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
      onClick,
      onKeyDown,
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

    function handleClick(event: MouseEvent<HTMLButtonElement>) {
      if (loading) {
        event.preventDefault();
        return;
      }
      onClick?.(event);
    }

    function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
      onKeyDown?.(event);
      blockRepeatedPress(event);
    }

    return (
      <button
        {...props}
        ref={ref}
        className={classes}
        disabled={disabled}
        aria-disabled={loading || undefined}
        aria-busy={loading || undefined}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        type={type}
      >
        {loading && <Spinner size={size === 'lg' ? 'md' : 'sm'} />}
        {children}
      </button>
    );
  },
);
