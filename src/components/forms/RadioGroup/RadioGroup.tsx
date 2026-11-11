import { createContext, useContext, useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import fieldStyles from '../Field/Field.module.css';
import styles from './RadioGroup.module.css';

interface RadioGroupContexto {
  defaultValue?: string;
  disabled: boolean;
  invalid: boolean;
  name: string;
  onValueChange?: (value: string) => void;
  required: boolean;
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

export type RadioGroupOrientation = 'vertical' | 'horizontal';

export interface RadioGroupProps extends Omit<ComponentPropsWithRef<'fieldset'>, 'onChange'> {
  children: ReactNode;
  defaultValue?: string;
  disabled?: boolean;
  error?: string;
  hint?: string;
  label: string;
  name?: string;
  onValueChange?: (value: string) => void;
  /** `vertical`, o padrão: uma opção por linha. `horizontal`: lado a lado, com quebra de linha quando não couber. */
  orientation?: RadioGroupOrientation;
  required?: boolean;
  value?: string;
}

export function RadioGroup({
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  children,
  className,
  defaultValue,
  disabled = false,
  error,
  hint,
  label,
  name: providedName,
  onValueChange,
  orientation = 'vertical',
  required = false,
  value,
  ...props
}: RadioGroupProps) {
  const generatedId = useId();
  const name = providedName ?? `radio-group-${generatedId}`;
  // Do `useId`, e nao do nome: dois grupos com o mesmo nome dividiam o id da mensagem.
  const messageId = `radio-group-${generatedId}-message`;
  const describedBy = [ariaDescribedBy, error || hint ? messageId : undefined].filter(Boolean).join(' ') || undefined;

  return (
    <RadioGroupContexto.Provider
      value={{ defaultValue, disabled, invalid: Boolean(error), name, onValueChange, required, value }}
    >
      <fieldset
        {...props}
        className={[styles.group, className].filter(Boolean).join(' ')}
        role="radiogroup"
        aria-describedby={describedBy}
        aria-invalid={error ? true : ariaInvalid}
        aria-required={required || undefined}
      >
        <legend className={styles.legend}>
          {label}
          {required && <span className={styles.required} aria-hidden="true">*</span>}
        </legend>
        <div className={[styles.options, styles[orientation]].join(' ')}>{children}</div>
        {(error || hint) && (
          <span className={error ? fieldStyles.errorMessage : fieldStyles.hint} id={messageId} role={error ? 'alert' : undefined}>
            {error || hint}
          </span>
        )}
      </fieldset>
    </RadioGroupContexto.Provider>
  );
}
