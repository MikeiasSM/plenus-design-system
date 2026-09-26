import { useId, type ChangeEvent, type ComponentPropsWithRef } from 'react';
import { useRadioGroupContexto } from './RadioGroup';
import styles from './RadioGroup.module.css';

export interface RadioProps
  extends Omit<ComponentPropsWithRef<'input'>, 'type' | 'size' | 'name' | 'checked' | 'defaultChecked' | 'value'> {
  label: string;
  value: string;
}

export function Radio({
  className,
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
  const controlado = grupo.value !== undefined;
  const classes = [styles.input, grupo.invalid && styles.error, className].filter(Boolean).join(' ');

  return (
    <label className={styles.control} htmlFor={id}>
      <input
        {...props}
        className={classes}
        id={id}
        checked={controlado ? grupo.value === value : undefined}
        defaultChecked={controlado ? undefined : grupo.defaultValue === value}
        disabled={disabled ?? grupo.disabled}
        name={grupo.name}
        onChange={(evento: ChangeEvent<HTMLInputElement>) => {
          grupo.onValueChange?.(value);
          onChange?.(evento);
        }}
        ref={ref}
        type="radio"
        value={value}
      />
      <span className={styles.text}>{label}</span>
    </label>
  );
}
