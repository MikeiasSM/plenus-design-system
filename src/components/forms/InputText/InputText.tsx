import { useState, type ChangeEvent, type InputHTMLAttributes } from 'react';
import { Field } from '../Field';
import styles from './InputText.module.css';

export type InputTextSize = 'sm' | 'md';

export interface InputTextProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  error?: string;
  hint?: string;
  label?: string;
  size?: InputTextSize;
  showCharacterCount?: boolean;
}

export function InputText({
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  className,
  error,
  hint,
  id: providedId,
  label,
  maxLength,
  required = false,
  size = 'md',
  showCharacterCount = false,
  defaultValue,
  onChange,
  value,
  ...props
}: InputTextProps) {
  const [uncontrolledCount, setUncontrolledCount] = useState(() => Array.from(String(defaultValue ?? '')).length);
  const characterCount = value === undefined ? uncontrolledCount : Array.from(String(value)).length;
  const classes = [styles.input, styles[size], error && styles.error, className]
    .filter(Boolean)
    .join(' ');

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    if (value === undefined) {
      setUncontrolledCount(Array.from(event.target.value).length);
    }
    onChange?.(event);
  }

  return (
    <Field
      aria-describedby={ariaDescribedBy}
      characterCount={characterCount}
      error={error}
      hint={hint}
      id={providedId}
      label={label}
      maxLength={maxLength}
      required={required}
      showCharacterCount={showCharacterCount}
    >
      {({ id, describedBy, invalid }) => (
        <input
          {...props}
          defaultValue={defaultValue}
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid || ariaInvalid}
          className={classes}
          maxLength={maxLength}
          onChange={handleChange}
          required={required}
          value={value}
        />
      )}
    </Field>
  );
}
