import { forwardRef, useRef, useState, type ButtonHTMLAttributes, type KeyboardEvent, type MouseEvent } from 'react';
import { blockRepeatedPress } from '../../../utils/press/press';
import { Spinner } from '../../feedback/Spinner';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'ghost' | 'danger' | 'dangerSoft' | 'dangerGhost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Se devolver uma `Promise`, o botão fica ocupado, como em `loading`, até ela terminar; cliques e Enter nesse tempo não rodam. */
  onClick?: (event: MouseEvent<HTMLButtonElement>) => unknown;
}

function ehPromessa(valor: unknown): valor is PromiseLike<unknown> {
  return typeof (valor as PromiseLike<unknown> | undefined)?.then === 'function';
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
    const emCurso = useRef(false);
    const [pending, setPending] = useState(false);
    const busy = loading || pending;
    const classes = [styles.button, styles[variant], styles[size], className]
      .filter(Boolean)
      .join(' ');

    function terminar() {
      emCurso.current = false;
      setPending(false);
    }

    function handleClick(event: MouseEvent<HTMLButtonElement>) {
      if (loading || emCurso.current) {
        event.preventDefault();
        return;
      }

      const resultado = onClick?.(event);

      if (ehPromessa(resultado)) {
        emCurso.current = true;
        setPending(true);
        resultado.then(terminar, (erro: unknown) => {
          terminar();
          console.error(erro);
        });
      }
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
        aria-disabled={busy || undefined}
        aria-busy={busy || undefined}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        type={type}
      >
        {busy && <Spinner size={size === 'lg' ? 'md' : 'sm'} />}
        {children}
      </button>
    );
  },
);
