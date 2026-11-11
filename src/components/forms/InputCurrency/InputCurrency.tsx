import { useState, type FocusEvent, type Ref } from 'react';
import { useDecimalInput } from '../../../hooks/useDecimalInput';
import { useMergedRefs } from '../../../hooks/useMergedRefs';
import { InputText, type InputTextProps } from '../InputText';
import { formatCurrencyInput } from '../../../utils/formatters';

export interface InputCurrencyProps extends Omit<InputTextProps, 'defaultValue' | 'onChange' | 'onValueChange' | 'showCharacterCount' | 'type' | 'unit' | 'value'> {
  currency?: string;
  defaultValue?: number | null;
  decimalScale?: number;
  onValueChange?: (value: number | null) => void;
  value?: number | null;
}

export function InputCurrency({
  currency = 'BRL',
  defaultValue = null,
  decimalScale = 2,
  onBlur,
  name,
  onFocus,
  onValueChange,
  value,
  ...props
}: InputCurrencyProps) {
  const decimalInput = useDecimalInput({ decimalScale, defaultValue, onValueChange, value });
  const mergedRef = useMergedRefs(decimalInput.ref, props.ref as Ref<HTMLInputElement>);
  const [focused, setFocused] = useState(false);
  const displayValue =
    focused || decimalInput.value === null ? decimalInput.text : formatCurrencyInput(decimalInput.value, currency, decimalScale);

  function handleFocus(event: FocusEvent<HTMLInputElement>) {
    setFocused(true);
    onFocus?.(event);
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    setFocused(false);
    decimalInput.endEditing();
    onBlur?.(event);
  }

  return (
    <>
      <InputText
        {...props}
        ref={mergedRef}
        inputMode="decimal"
        onBlur={handleBlur}
        onChange={decimalInput.handleChange}
        onFocus={handleFocus}
        type="text"
        value={displayValue}
      />
      {name && <input disabled={props.disabled} form={props.form} name={name} type="hidden" value={decimalInput.formValue} />}
    </>
  );
}
