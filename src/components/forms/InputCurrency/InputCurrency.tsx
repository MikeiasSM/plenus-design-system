import { useState, type FocusEvent, type Ref } from 'react';
import { useDecimalInput } from '../../../hooks/useDecimalInput';
import { mergeRefs } from '../../../utils/mergeRefs';
import { InputText, type InputTextProps } from '../InputText';
import { formatarEntradaMonetaria } from '../../../utils/formatters';

export interface InputCurrencyProps extends Omit<InputTextProps, 'defaultValue' | 'onChange' | 'showCharacterCount' | 'type' | 'value'> {
  currency?: string;
  defaultValue?: string | number;
  decimalScale?: number;
  onValueChange?: (value: string) => void;
  value?: string | number;
}

export function InputCurrency({
  currency = 'BRL',
  defaultValue = '',
  decimalScale = 2,
  onBlur,
  onFocus,
  onValueChange,
  value,
  ...props
}: InputCurrencyProps) {
  const decimalInput = useDecimalInput({ decimalScale, defaultValue, onValueChange, value });
  const [focused, setFocused] = useState(false);
  const displayValue =
    focused || !decimalInput.value ? decimalInput.text : formatarEntradaMonetaria(decimalInput.value, currency, decimalScale);

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
    <InputText
      {...props}
      ref={mergeRefs(decimalInput.ref, props.ref as Ref<HTMLInputElement>)}
      inputMode="decimal"
      onBlur={handleBlur}
      onChange={decimalInput.handleChange}
      onFocus={handleFocus}
      type="text"
      value={displayValue}
    />
  );
}
