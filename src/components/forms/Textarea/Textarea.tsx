import { useState, type ChangeEvent, type TextareaHTMLAttributes } from 'react';
import { Field } from '../Field';
import styles from './Textarea.module.css';

export type TextareaSize = 'sm' | 'md';

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  error?: string;
  hint?: string;
  label?: string;
  size?: TextareaSize;
  showCharacterCount?: boolean;
}

export function Textarea({
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  className,
  error,
  hint,
  id: providedId,
  label,
  maxLength,
  required = false,
  rows = 4,
  size = 'md',
  showCharacterCount = false,
  defaultValue,
  onChange,
  value,
  ...props
}: TextareaProps) {
  const [uncontrolledCount, setUncontrolledCount] = useState(() => Array.from(String(defaultValue ?? '')).length);
  const characterCount = value === undefined ? uncontrolledCount : Array.from(String(value)).length;
  const classes = [styles.textarea, styles[size], error && styles.error, className]
    .filter(Boolean)
    .join(' ');

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
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
        <textarea
          {...props}
          defaultValue={defaultValue}
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid || ariaInvalid}
          className={classes}
          maxLength={maxLength}
          onChange={handleChange}
          required={required}
          rows={rows}
          value={value}
        />
      )}
    </Field>
  );
}
