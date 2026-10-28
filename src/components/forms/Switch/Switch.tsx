import { useId, type ComponentPropsWithRef } from 'react';
import fieldStyles from '../Field/Field.module.css';
import styles from './Switch.module.css';

export interface SwitchProps extends Omit<ComponentPropsWithRef<'input'>, 'type' | 'size'> {
  error?: string;
  hint?: string;
  label: string;
  /** O estado a cada mudanca, ao lado do `onChange` nativo. */
  onCheckedChange?: (checked: boolean) => void;
}

export function Switch({
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  className,
  error,
  hint,
  id: providedId,
  label,
  onCheckedChange,
  ref,
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
          onChange={(event) => {
            props.onChange?.(event);
            onCheckedChange?.(event.target.checked);
          }}
          ref={ref}
          className={classes}
          id={id}
          aria-describedby={describedBy}
          aria-invalid={error ? true : ariaInvalid}
          role="switch"
          type="checkbox"
        />
        <span className={styles.text}>{label}</span>
      </label>
      {(error || hint) && (
        <span className={error ? fieldStyles.errorMessage : fieldStyles.hint} id={messageId} role={error ? 'alert' : undefined}>
          {error || hint}
        </span>
      )}
    </div>
  );
}
