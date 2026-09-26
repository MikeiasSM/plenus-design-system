import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import { Label } from '../Label';
import styles from './Field.module.css';

export interface FieldWiring {
  id: string;
  describedBy: string | undefined;
  invalid: boolean;
}

export interface FieldProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  'aria-describedby'?: string;
  characterCount?: number;
  children: (wiring: FieldWiring) => ReactNode;
  error?: string;
  hint?: string;
  id?: string;
  label?: string;
  maxLength?: number;
  required?: boolean;
  showCharacterCount?: boolean;
}

export function Field({
  'aria-describedby': ariaDescribedBy,
  className,
  characterCount = 0,
  children,
  error,
  hint,
  id: providedId,
  label,
  maxLength,
  required = false,
  showCharacterCount = false,
  ...props
}: FieldProps) {
  const generatedId = useId();
  const id = providedId ?? `field-${generatedId}`;
  const messageId = `${id}-message`;
  const characterCountId = `${id}-character-count`;
  const describedBy = [
    ariaDescribedBy,
    error || hint ? messageId : undefined,
    showCharacterCount ? characterCountId : undefined,
  ]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <div {...props} className={[styles.field, className].filter(Boolean).join(' ')}>
      {label && <Label htmlFor={id} required={required}>{label}</Label>}
      {children({ id, describedBy, invalid: Boolean(error) })}
      {(error || hint) && (
        <span className={error ? styles.errorMessage : styles.hint} id={messageId}>
          {error || hint}
        </span>
      )}
      {showCharacterCount && (
        <span className={styles.characterCount} id={characterCountId}>
          {maxLength ? `${characterCount}/${maxLength}` : characterCount}
        </span>
      )}
    </div>
  );
}
