import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import fieldStyles from '../Field/Field.module.css';
import styles from './Switch.module.css';

export interface SwitchProps extends Omit<ComponentPropsWithRef<'input'>, 'type' | 'size'> {
  /**
   * Texto secundario abaixo do rotulo, que descreve a chave pelo `aria-describedby`. Com `label`, fica dentro da area
   * clicavel: so texto, nada interativo.
   */
  description?: ReactNode;
  error?: string;
  hint?: string;
  /** Sem ele, o nome vem de quem rotula o controle por fora, como o `FieldRow`, ou do `aria-label`. */
  label?: string;
  /**
   * Conteudo ao lado do rotulo, fora do `<label>` e do nome, como um botao de ajuda. So aparece com `label`; o que for
   * interativo entra na tabulacao depois da chave.
   */
  labelAddon?: ReactNode;
  /** O estado a cada mudanca, ao lado do `onChange` nativo. */
  onCheckedChange?: (checked: boolean) => void;
}

export function Switch({
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  className,
  description,
  error,
  hint,
  id: providedId,
  label,
  labelAddon,
  onCheckedChange,
  ref,
  ...props
}: SwitchProps) {
  const generatedId = useId();
  const id = providedId ?? `switch-${generatedId}`;
  const messageId = `${id}-message`;
  const textId = `${id}-label`;
  const descriptionId = `${id}-description`;
  // A descricao fica dentro do `<label>`, que tambem a leria no nome: com ela, o nome vem so do texto do rotulo.
  const descricaoNoRotulo = Boolean(label) && Boolean(description);
  const describedBy = [ariaDescribedBy, description ? descriptionId : undefined, error || hint ? messageId : undefined]
    .filter(Boolean)
    .join(' ') || undefined;
  const labelledBy = ariaLabelledby ?? (descricaoNoRotulo && !ariaLabel ? textId : undefined);
  const classes = [styles.input, error && styles.error, className].filter(Boolean).join(' ');

  const rotulo = (
    <label className={[styles.control, descricaoNoRotulo && styles.withDescription].filter(Boolean).join(' ')} htmlFor={id}>
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
        aria-label={ariaLabel}
        aria-labelledby={labelledBy}
        role="switch"
        type="checkbox"
      />
      {descricaoNoRotulo ? (
        <span className={styles.content}>
          <span className={styles.text} id={textId}>{label}</span>
          <span className={styles.description} id={descriptionId}>{description}</span>
        </span>
      ) : (
        label && <span className={styles.text}>{label}</span>
      )}
    </label>
  );

  return (
    <div className={styles.field}>
      {label && labelAddon != null ? (
        <div className={styles.labelRow}>
          {rotulo}
          <span className={styles.labelAddon}>{labelAddon}</span>
        </div>
      ) : (
        rotulo
      )}
      {description && !label && (
        <span className={styles.description} id={descriptionId}>{description}</span>
      )}
      {(error || hint) && (
        <span className={error ? fieldStyles.errorMessage : fieldStyles.hint} id={messageId} role={error ? 'alert' : undefined}>
          {error || hint}
        </span>
      )}
    </div>
  );
}
