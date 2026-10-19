import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import { Label } from '../Label';
import styles from './Field.module.css';

export type FieldSize = 'sm' | 'md' | 'lg';

export interface FieldWiring {
  /** O visual dos campos do sistema para o controle — borda, foco, erro e tamanho. A classe do controle vence a dele. */
  className: string;
  describedBy: string | undefined;
  id: string;
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
  size?: FieldSize;
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
  size = 'md',
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
  const controlClassName = [styles.control, size === 'sm' && styles.sm, size === 'lg' && styles.lg, error && styles.invalid].filter(Boolean).join(' ');

  return (
    <div {...props} className={[styles.field, className].filter(Boolean).join(' ')}>
      {label && <Label htmlFor={id} required={required}>{label}</Label>}
      {children({ className: controlClassName, describedBy, id, invalid: Boolean(error) })}
      {(error || hint) && (
        <span className={error ? styles.errorMessage : styles.hint} id={messageId} role={error ? 'alert' : undefined}>
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
