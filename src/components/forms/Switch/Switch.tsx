import { useId, type InputHTMLAttributes } from 'react';
import styles from './Switch.module.css';

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  error?: string;
  hint?: string;
  label: string;
}

export function Switch({
  'aria-describedby': ariaDescribedBy,
  className,
  error,
  hint,
  id: providedId,
  label,
  ...props
}: SwitchProps) {
  const generatedId = useId();
  const id = providedId ?? `switch-${generatedId}`;
  const messageId = `${id}-message`;
  const describedBy = [ariaDescribedBy, error || hint ? messageId : undefined]
    .filter(Boolean)
    .join(' ') || undefined;
  const classes = [styles.input, error && styles.error, className].filter(Boolean).join(' ');

  return (
    <div className={styles.field}>
      <label className={styles.control} htmlFor={id}>
        <input
          {...props}
          className={classes}
          id={id}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          role="switch"
          type="checkbox"
        />
        <span className={styles.text}>{label}</span>
      </label>
      {(error || hint) && (
        <span className={error ? styles.errorMessage : styles.hint} id={messageId}>
          {error || hint}
        </span>
      )}
    </div>
  );
}
