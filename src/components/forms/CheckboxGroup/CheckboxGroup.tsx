import { createContext, useContext, useId, useState, type ComponentPropsWithRef, type ReactNode } from 'react';
import { useFormReset } from '../../../hooks/useFormReset';
import { useMergedRefs } from '../../../hooks/useMergedRefs';
import fieldStyles from '../Field/Field.module.css';
import radioGroupStyles from '../RadioGroup/RadioGroup.module.css';
import styles from './CheckboxGroup.module.css';

interface CheckboxGroupContextValue {
  disabled: boolean;
  invalid: boolean;
  name: string;
  required: boolean;
  toggle: (value: string, checked: boolean) => void;
  values: readonly string[];
}

const CheckboxGroupContext = createContext<CheckboxGroupContextValue | null>(null);

/** O `Checkbox` com `value` dentro de um grupo lê daqui o estado; fora dele, segue solto. */
export function useCheckboxGroup() {
  return useContext(CheckboxGroupContext);
}

export type CheckboxGroupOrientation = 'vertical' | 'horizontal';

export interface CheckboxGroupProps extends Omit<ComponentPropsWithRef<'fieldset'>, 'defaultValue' | 'onChange'> {
  children: ReactNode;
  defaultValue?: readonly string[];
  disabled?: boolean;
  error?: string;
  hint?: string;
  label: string;
  name?: string;
  onValueChange?: (values: string[]) => void;
  orientation?: CheckboxGroupOrientation;
  /** Exige ao menos uma caixa marcada no envio. */
  required?: boolean;
  value?: readonly string[];
}

export function CheckboxGroup({
  'aria-describedby': ariaDescribedBy,
  children,
  className,
  defaultValue = [],
  disabled = false,
  error,
  hint,
  label,
  name: providedName,
  onValueChange,
  orientation = 'vertical',
  ref,
  required = false,
  value,
  ...props
}: CheckboxGroupProps) {
  const generatedId = useId();
  const name = providedName ?? `checkbox-group-${generatedId}`;
  const messageId = `checkbox-group-${generatedId}-message`;
  const describedBy = [ariaDescribedBy, error || hint ? messageId : undefined].filter(Boolean).join(' ') || undefined;
  const [uncontrolledValues, setUncontrolledValues] = useState(defaultValue);
  const values = value ?? uncontrolledValues;
  const resetRef = useFormReset<HTMLFieldSetElement>(() => setUncontrolledValues(defaultValue));
  const mergedRef = useMergedRefs(resetRef, ref);

  function toggle(item: string, checked: boolean) {
    const next = checked ? [...values, item] : values.filter((current) => current !== item);

    if (value === undefined) {
      setUncontrolledValues(next);
    }

    onValueChange?.(next);
  }

  return (
    <CheckboxGroupContext.Provider value={{ disabled, invalid: Boolean(error), name, required, toggle, values }}>
      <fieldset
        {...props}
        ref={mergedRef}
        className={[radioGroupStyles.group, className].filter(Boolean).join(' ')}
        aria-describedby={describedBy}
      >
        <legend className={radioGroupStyles.legend}>
          {label}
          {required && <span className={radioGroupStyles.required} aria-hidden="true">*</span>}
        </legend>
        <div className={[styles.options, styles[orientation]].join(' ')}>{children}</div>
        {(error || hint) && (
          <span className={error ? fieldStyles.errorMessage : fieldStyles.hint} id={messageId} role={error ? 'alert' : undefined}>
            {error || hint}
          </span>
        )}
      </fieldset>
    </CheckboxGroupContext.Provider>
  );
}
