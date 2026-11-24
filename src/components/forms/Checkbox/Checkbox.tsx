import { useCallback, useId, type ChangeEvent, type ComponentPropsWithRef, type ReactNode } from 'react';
import { useMergedRefs } from '../../../hooks/useMergedRefs';
import { useCheckboxGroup } from '../CheckboxGroup/CheckboxGroup';
import fieldStyles from '../Field/Field.module.css';
import radioGroupStyles from '../RadioGroup/RadioGroup.module.css';
import styles from './Checkbox.module.css';

export interface CheckboxProps extends Omit<ComponentPropsWithRef<'input'>, 'type' | 'size'> {
  /**
   * Texto secundario abaixo do rotulo, que descreve a caixa pelo `aria-describedby`. Fica dentro da area clicavel:
   * so texto, nada interativo.
   */
  description?: ReactNode;
  error?: string;
  hint?: string;
  indeterminate?: boolean;
  /** Sem rotulo visivel, o nome vem de `aria-label` ou `aria-labelledby`. */
  label?: ReactNode;
  /** A marcacao a cada mudanca, ao lado do `onChange` nativo. */
  onCheckedChange?: (checked: boolean) => void;
}

export function Checkbox({
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  className,
  description,
  error,
  hint,
  id: providedId,
  indeterminate = false,
  label,
  onCheckedChange,
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
  const textId = `${id}-label`;
  const descriptionId = `${id}-description`;
  // A descricao fica dentro do `<label>`, que tambem a leria no nome: com ela, o nome vem so do texto do rotulo.
  const descricaoNoRotulo = Boolean(label) && Boolean(description);
  const describedBy = [ariaDescribedBy, description ? descriptionId : undefined, error || hint ? messageId : undefined]
    .filter(Boolean)
    .join(' ') || undefined;
  const labelledBy = ariaLabelledby ?? (descricaoNoRotulo && !ariaLabel ? textId : undefined);
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
      <label className={[styles.control, group?.variant === 'card' && radioGroupStyles.card].filter(Boolean).join(' ')} htmlFor={id}>
        <input
          {...props}
          onChange={(event) => {
            props.onChange?.(event);
            onCheckedChange?.(event.target.checked);
          }}
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
              onCheckedChange?.(event.target.checked);
            },
          })}
          aria-describedby={describedBy}
          aria-invalid={invalid ? true : ariaInvalid}
          aria-label={ariaLabel}
          aria-labelledby={labelledBy}
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
