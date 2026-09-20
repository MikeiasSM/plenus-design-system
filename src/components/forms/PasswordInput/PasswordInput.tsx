import { useEffect, useId, useState, type ClipboardEvent, type ChangeEvent, type FocusEvent, type InputHTMLAttributes } from 'react';
import { Label } from '../Label';
import styles from './PasswordInput.module.css';

export interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  error?: string;
  hint?: string;
  label?: string;
  allowCopy?: boolean;
  onValidationChange?: (message?: string) => void;
  showCharacterCount?: boolean;
  showToggle?: boolean;
  validate?: (value: string) => string | undefined;
  validateOnBlur?: boolean;
  size?: 'sm' | 'md';
}

export function PasswordInput({
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  allowCopy = false,
  className,
  defaultValue,
  error,
  hint,
  id: providedId,
  label,
  maxLength,
  onChange,
  onCopy,
  onCut,
  onBlur,
  onValidationChange,
  required = false,
  showCharacterCount = false,
  showToggle = true,
  size = 'md',
  validate,
  validateOnBlur = true,
  value,
  ...props
}: PasswordInputProps) {
  const generatedId = useId();
  const id = providedId ?? `password-${generatedId}`;
  const messageId = `${id}-message`;
  const countId = `${id}-character-count`;
  const initialValue = value ?? defaultValue ?? '';
  const [visible, setVisible] = useState(false);
  const [characterCount, setCharacterCount] = useState(() => Array.from(String(initialValue)).length);
  const [validationMessage, setValidationMessage] = useState<string>();
  const [hasInteracted, setHasInteracted] = useState(false);
  const displayedError = error ?? (hasInteracted ? validationMessage : undefined);
  const describedBy = [
    ariaDescribedBy,
    displayedError || hint ? messageId : undefined,
    showCharacterCount ? countId : undefined,
  ].filter(Boolean).join(' ') || undefined;
  const inputClasses = [styles.input, styles[size], displayedError && styles.error, className]
    .filter(Boolean)
    .join(' ');

  useEffect(() => {
    if (value !== undefined) {
      setCharacterCount(Array.from(String(value)).length);
    }
  }, [value]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setCharacterCount(Array.from(event.target.value).length);
    if (hasInteracted && validate) {
      const nextMessage = validate(event.target.value);
      setValidationMessage(nextMessage);
      onValidationChange?.(nextMessage);
    }
    onChange?.(event);
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    setHasInteracted(true);
    if (validate && validateOnBlur) {
      const nextMessage = validate(event.target.value);
      setValidationMessage(nextMessage);
      onValidationChange?.(nextMessage);
    }
    onBlur?.(event);
  }

  function handleCopy(event: ClipboardEvent<HTMLInputElement>) {
    onCopy?.(event);
    if (!allowCopy) {
      event.preventDefault();
    }
  }

  function handleCut(event: ClipboardEvent<HTMLInputElement>) {
    onCut?.(event);
    if (!allowCopy) {
      event.preventDefault();
    }
  }

  return (
    <div className={styles.field}>
      {label && <Label htmlFor={id} required={required}>{label}</Label>}
      <div className={styles.control}>
        <input
          {...props}
          autoComplete={props.autoComplete ?? 'current-password'}
          className={inputClasses}
          defaultValue={defaultValue}
          id={id}
          aria-describedby={describedBy}
          aria-invalid={displayedError ? true : ariaInvalid}
          maxLength={maxLength}
          onChange={handleChange}
          onCopy={handleCopy}
          onCut={handleCut}
          onBlur={handleBlur}
          required={required}
          type={visible ? 'text' : 'password'}
          value={value}
        />
        {showToggle && (
          <button
            className={styles.toggle}
            type="button"
            aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={visible}
            onClick={() => setVisible((current) => !current)}
          >
            {visible ? 'Ocultar' : 'Mostrar'}
          </button>
        )}
      </div>
      {(displayedError || hint) && (
        <span className={displayedError ? styles.errorMessage : styles.hint} id={messageId}>
          {displayedError || hint}
        </span>
      )}
      {showCharacterCount && (
        <span className={styles.characterCount} id={countId} aria-live="polite">
          {maxLength ? `${characterCount}/${maxLength}` : characterCount}
        </span>
      )}
    </div>
  );
}
