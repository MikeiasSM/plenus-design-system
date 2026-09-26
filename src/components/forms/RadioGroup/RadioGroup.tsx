import { createContext, useContext, useId, type ComponentPropsWithRef, type ReactNode } from 'react';
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

export interface RadioGroupProps extends Omit<ComponentPropsWithRef<'fieldset'>, 'onChange'> {
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
  className,
  defaultValue,
  disabled = false,
  error,
  hint,
  label,
  name: providedName,
  onValueChange,
  required = false,
  value,
  ...props
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
        {...props}
        className={[styles.group, className].filter(Boolean).join(' ')}
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
