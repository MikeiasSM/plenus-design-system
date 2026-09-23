import { createContext, useContext, useId, type ReactNode } from 'react';
import styles from './RadioGroup.module.css';

interface RadioGroupContexto {
  defaultValue?: string;
  disabled: boolean;
  invalid: boolean;
  name: string;
  onValueChange?: (value: string) => void;
  value?: string;
}

const RadioGroupContexto = createContext<RadioGroupContexto | null>(null);

export function useRadioGroupContexto() {
  const contexto = useContext(RadioGroupContexto);

  if (!contexto) {
    throw new Error('Radio precisa ser renderizado dentro de RadioGroup.');
  }

  return contexto;
}

export interface RadioGroupProps {
  children: ReactNode;
  defaultValue?: string;
  disabled?: boolean;
  error?: string;
  hint?: string;
  label: string;
  name?: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
  value?: string;
}

export function RadioGroup({
  children,
  defaultValue,
  disabled = false,
  error,
  hint,
  label,
  name: providedName,
  onValueChange,
  required = false,
  value,
}: RadioGroupProps) {
  const generatedId = useId();
  const name = providedName ?? `radio-group-${generatedId}`;
  const messageId = `${name}-message`;
  const describedBy = error || hint ? messageId : undefined;

  return (
    <RadioGroupContexto.Provider
      value={{ defaultValue, disabled, invalid: Boolean(error), name, onValueChange, value }}
    >
      <fieldset
        className={styles.group}
        role="radiogroup"
        aria-describedby={describedBy}
        aria-required={required || undefined}
      >
        <legend className={styles.legend}>
          {label}
          {required && <span className={styles.required} aria-hidden="true">*</span>}
        </legend>
        <div className={styles.options}>{children}</div>
        {(error || hint) && (
          <span className={error ? styles.errorMessage : styles.hint} id={messageId}>
            {error || hint}
          </span>
        )}
      </fieldset>
    </RadioGroupContexto.Provider>
  );
}
