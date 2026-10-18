import { useCallback, useId, type ChangeEvent, type ComponentPropsWithRef, type ReactNode } from 'react';
import { useMergedRefs } from '../../../hooks/useMergedRefs';
import { useCheckboxGroup } from '../CheckboxGroup/CheckboxGroup';
import styles from './Checkbox.module.css';

export interface CheckboxProps extends Omit<ComponentPropsWithRef<'input'>, 'type' | 'size'> {
  error?: string;
  hint?: string;
  indeterminate?: boolean;
  /** Sem rotulo visivel, o nome vem de `aria-label` ou `aria-labelledby`. */
  label?: ReactNode;
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
  const group = useCheckboxGroup();
  const groupValue = group && typeof props.value === 'string' ? props.value : undefined;
  const inGroup = group !== null && groupValue !== undefined;
  const invalid = Boolean(error) || (inGroup && group.invalid);
  const generatedId = useId();
  const id = providedId ?? `checkbox-${generatedId}`;
  const messageId = `${id}-message`;
  const describedBy = [ariaDescribedBy, error || hint ? messageId : undefined]
    .filter(Boolean)
    .join(' ') || undefined;
  const classes = [styles.input, invalid && styles.error, className].filter(Boolean).join(' ');

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
          {...(inGroup && {
            checked: group.values.includes(groupValue),
            disabled: props.disabled ?? group.disabled,
            name: group.name,
            // Obrigatório é marcar ao menos uma: o `required` nativo só vale enquanto o grupo está vazio.
            required: group.required && group.values.length === 0,
            onChange: (event: ChangeEvent<HTMLInputElement>) => {
              group.toggle(groupValue, event.target.checked);
              props.onChange?.(event);
            },
          })}
          aria-describedby={describedBy}
          aria-invalid={invalid ? true : ariaInvalid}
          type="checkbox"
        />
        {label && <span className={styles.text}>{label}</span>}
      </label>
      {(error || hint) && (
        <span className={error ? styles.errorMessage : styles.hint} id={messageId} role={error ? 'alert' : undefined}>
          {error || hint}
        </span>
      )}
    </div>
  );
}
