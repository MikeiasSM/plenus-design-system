import { type ChangeEvent, type TextareaHTMLAttributes } from 'react';
import { useCharacterCount } from '../../../hooks/useCharacterCount';
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
  const { ref: textareaRef, count, updateCount } = useCharacterCount<HTMLTextAreaElement>(value, defaultValue);
  const classes = [styles.textarea, styles[size], error && styles.error, className]
    .filter(Boolean)
    .join(' ');

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    updateCount(event.target.value);
    onChange?.(event);
  }

  return (
    <Field
      aria-describedby={ariaDescribedBy}
      characterCount={count}
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
          ref={textareaRef}
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
