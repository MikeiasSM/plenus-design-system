import { useState, type ChangeEvent, type ClipboardEvent, type FocusEvent, type InputHTMLAttributes } from 'react';
import { useCharacterCount } from '../../../hooks/useCharacterCount';
import { Field } from '../Field';
import styles from './InputPassword.module.css';

export interface InputPasswordProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
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

export function InputPassword({
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  allowCopy = false,
  className,
  defaultValue,
  disabled = false,
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
}: InputPasswordProps) {
  const [visible, setVisible] = useState(false);
  const [blurred, setBlurred] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string>();
  const { ref: inputRef, count, updateCount } = useCharacterCount<HTMLInputElement>(value, defaultValue);
  const displayedError = error ?? validationMessage;
  const inputClasses = [styles.input, styles[size], displayedError && styles.error, className]
    .filter(Boolean)
    .join(' ');

  function runValidation(nextValue: string) {
    const message = validate?.(nextValue);

    setValidationMessage(message);
    onValidationChange?.(message);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    updateCount(event.target.value);
    if (validate && (blurred || !validateOnBlur)) {
      runValidation(event.target.value);
    }
    onChange?.(event);
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    setBlurred(true);
    if (validate && validateOnBlur) {
      runValidation(event.target.value);
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
    <Field
      aria-describedby={ariaDescribedBy}
      characterCount={count}
      error={displayedError}
      hint={hint}
      id={providedId}
      label={label}
      maxLength={maxLength}
      required={required}
      showCharacterCount={showCharacterCount}
    >
      {({ id, describedBy, invalid }) => (
        <div className={styles.control}>
          <input
            {...props}
            autoComplete={props.autoComplete ?? 'current-password'}
            className={inputClasses}
            defaultValue={defaultValue}
            disabled={disabled}
            id={id}
            ref={inputRef}
            aria-describedby={describedBy}
            aria-invalid={invalid || ariaInvalid}
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
              disabled={disabled}
              onClick={() => setVisible((current) => !current)}
            >
              {visible ? 'Ocultar' : 'Mostrar'}
            </button>
          )}
        </div>
      )}
    </Field>
  );
}
