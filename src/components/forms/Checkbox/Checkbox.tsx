import { useCallback, useId, type ComponentPropsWithRef } from 'react';
import { useMergedRefs } from '../../../hooks/useMergedRefs';
import styles from './Checkbox.module.css';

export interface CheckboxProps extends Omit<ComponentPropsWithRef<'input'>, 'type' | 'size'> {
  error?: string;
  hint?: string;
  indeterminate?: boolean;
  label: string;
}

export function Checkbox({
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
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
  const mergedRef = useMergedRefs(aplicarIndeterminado, ref);

  return (
    <div className={styles.field}>
      <label className={styles.control} htmlFor={id}>
        <input
          {...props}
          ref={mergedRef}
          className={classes}
          id={id}
          aria-describedby={describedBy}
          aria-invalid={error ? true : ariaInvalid}
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
