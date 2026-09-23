import { useId, type InputHTMLAttributes } from 'react';
import { useRadioGroupContexto } from './RadioGroup';
import styles from './RadioGroup.module.css';

export interface RadioProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size' | 'name' | 'checked' | 'defaultChecked' | 'value'> {
  label: string;
  value: string;
}

export function Radio({ className, disabled, id: providedId, label, value, ...props }: RadioProps) {
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
        onChange={() => grupo.onValueChange?.(value)}
        type="radio"
        value={value}
      />
      <span className={styles.text}>{label}</span>
    </label>
  );
}
