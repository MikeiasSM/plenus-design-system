import { useCallback, useId, type ComponentPropsWithRef } from 'react';
import { mergeRefs } from '../../../utils/mergeRefs';
import styles from './Checkbox.module.css';

export interface CheckboxProps extends Omit<ComponentPropsWithRef<'input'>, 'type' | 'size'> {
  error?: string;
  hint?: string;
  indeterminate?: boolean;
  label: string;
}

export function Checkbox({
  'aria-describedby': ariaDescribedBy,
  className,
  error,
  hint,
  id: providedId,
  indeterminate = false,
  label,
  ref,
  ...props
}: CheckboxProps) {
  const generatedId = useId();
  const id = providedId ?? `checkbox-${generatedId}`;
  const messageId = `${id}-message`;
  const describedBy = [ariaDescribedBy, error || hint ? messageId : undefined]
    .filter(Boolean)
    .join(' ') || undefined;
  const classes = [styles.input, error && styles.error, className].filter(Boolean).join(' ');

  const aplicarIndeterminado = useCallback(
    (node: HTMLInputElement | null) => {
      if (node) {
        node.indeterminate = indeterminate;
      }
    },
    [indeterminate],
  );

  return (
    <div className={styles.field}>
      <label className={styles.control} htmlFor={id}>
        <input
          {...props}
          ref={mergeRefs(aplicarIndeterminado, ref)}
          className={classes}
          id={id}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
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
