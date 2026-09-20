import { useEffect, useId, useState, type ChangeEvent, type InputHTMLAttributes } from 'react';
import { Label } from '../Label';
import styles from './Input.module.css';

export type InputSize = 'sm' | 'md';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  error?: string;
  hint?: string;
  label?: string;
  size?: InputSize;
  showCharacterCount?: boolean;
}

export function Input({
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
}: InputProps) {
  const generatedId = useId();
  const id = providedId ?? `input-${generatedId}`;
  const messageId = `${id}-message`;
  const characterCountId = `${id}-character-count`;
  const initialValue = value ?? defaultValue ?? '';
  const [characterCount, setCharacterCount] = useState(() => Array.from(String(initialValue)).length);
  const describedBy = [
    ariaDescribedBy,
    error || hint ? messageId : undefined,
    showCharacterCount ? characterCountId : undefined,
  ]
    .filter(Boolean)
    .join(' ') || undefined;
  const classes = [styles.input, styles[size], error && styles.error, className]
    .filter(Boolean)
    .join(' ');

  useEffect(() => {
    if (value !== undefined) {
      setCharacterCount(Array.from(String(value)).length);
    }
  }, [value]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setCharacterCount(Array.from(event.target.value).length);
    onChange?.(event);
  }

  return (
    <div className={styles.field}>
      {label && <Label htmlFor={id} required={required}>{label}</Label>}
      <input
        {...props}
        defaultValue={defaultValue}
        id={id}
        aria-describedby={describedBy}
        aria-invalid={error ? true : ariaInvalid}
        className={classes}
        maxLength={maxLength}
        onChange={handleChange}
        required={required}
        value={value}
      />
      {(error || hint) && (
        <span className={error ? styles.errorMessage : styles.hint} id={messageId}>
          {error || hint}
        </span>
      )}
      {showCharacterCount && (
        <span className={styles.characterCount} id={characterCountId} aria-live="polite">
          {maxLength ? `${characterCount}/${maxLength}` : characterCount}
        </span>
      )}
    </div>
  );
}
