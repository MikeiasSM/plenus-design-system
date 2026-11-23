import { useId, type ChangeEvent, type ComponentPropsWithRef, type ReactNode } from 'react';
import { useRadioGroupContexto } from './RadioGroup';
import styles from './RadioGroup.module.css';

export interface RadioProps
  extends Omit<ComponentPropsWithRef<'input'>, 'type' | 'size' | 'name' | 'checked' | 'defaultChecked' | 'value'> {
  /**
   * Texto secundário abaixo do rótulo, que descreve a opção pelo `aria-describedby`. Fica dentro da área clicável:
   * só texto, nada interativo.
   */
  description?: ReactNode;
  label: string;
  value: string;
}

export function Radio({
  'aria-describedby': ariaDescribedBy,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  className,
  description,
  disabled,
  id: providedId,
  label,
  onChange,
  ref,
  value,
  ...props
}: RadioProps) {
  const grupo = useRadioGroupContexto();
  const generatedId = useId();
  const id = providedId ?? `radio-${generatedId}`;
  const textId = `${id}-label`;
  const descriptionId = `${id}-description`;
  const controlado = grupo.value !== undefined;
  const classes = [styles.input, grupo.invalid && styles.error, className].filter(Boolean).join(' ');
  const describedBy = [ariaDescribedBy, description ? descriptionId : undefined].filter(Boolean).join(' ') || undefined;
  // A descrição fica dentro do `<label>`, que também a leria no nome: com ela, o nome vem só do texto do rótulo.
  const labelledBy = ariaLabelledby ?? (description && !ariaLabel ? textId : undefined);

  return (
    <label className={[styles.control, grupo.variant === 'card' && styles.card].filter(Boolean).join(' ')} htmlFor={id}>
      <input
        {...props}
        aria-describedby={describedBy}
        aria-label={ariaLabel}
        aria-labelledby={labelledBy}
        className={classes}
        id={id}
        checked={controlado ? grupo.value === value : undefined}
        defaultChecked={controlado ? undefined : grupo.defaultValue === value}
        disabled={disabled ?? grupo.disabled}
        name={grupo.name}
        required={grupo.required}
        onChange={(evento: ChangeEvent<HTMLInputElement>) => {
          grupo.onValueChange?.(value);
          onChange?.(evento);
        }}
        ref={ref}
        type="radio"
        value={value}
      />
      {description ? (
        <span className={styles.content}>
          <span className={styles.text} id={textId}>{label}</span>
          <span className={styles.description} id={descriptionId}>{description}</span>
        </span>
      ) : (
        <span className={styles.text}>{label}</span>
      )}
    </label>
  );
}
