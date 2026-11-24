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
  /**
   * Ao lado do controle, na mesma linha, como o botao que completa o campo. O rotulo fica acima dos dois, e a mensagem
   * e o contador, abaixo. Fica fora da descricao do campo: o que ele tiver de interativo se nomeia sozinho.
   */
  aside?: ReactNode;
  characterCount?: number;
  children: (wiring: FieldWiring) => ReactNode;
  error?: string;
  hint?: string;
  id?: string;
  label?: string;
  /**
   * Ao lado do rotulo, fora do `<label>`, numa linha de cabecalho: um selo, uma dica ou um link. Nao entra no nome do
   * campo, e pode ser interativo.
   */
  labelAddon?: ReactNode;
  maxLength?: number;
  required?: boolean;
  showCharacterCount?: boolean;
  size?: FieldSize;
}

export function Field({
  'aria-describedby': ariaDescribedBy,
  aside,
  className,
  characterCount = 0,
  children,
  error,
  hint,
  id: providedId,
  label,
  labelAddon,
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
  const control = children({ className: controlClassName, describedBy, id, invalid: Boolean(error) });
  const labelElement = label && (
    <Label htmlFor={id} required={required}>
      {label}
    </Label>
  );

  return (
    <div {...props} className={[styles.field, className].filter(Boolean).join(' ')}>
      {labelAddon ? (
        // O complemento fica fora do `<label>`: dentro dele, entraria no nome do campo e prenderia o que for interativo.
        <div className={styles.header}>
          {labelElement}
          {labelAddon}
        </div>
      ) : (
        labelElement
      )}
      {aside ? (
        <div className={styles.withAside}>
          <div className={styles.main}>{control}</div>
          <div className={styles.aside}>{aside}</div>
        </div>
      ) : (
        control
      )}
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
