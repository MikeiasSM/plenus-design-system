import { useState, type ChangeEvent, type FocusEvent } from 'react';
import { InputText, type InputTextProps } from '../InputText';
import { formatarEntradaDecimal, formatarEntradaMonetaria } from '../../../utils/formatters';

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
  const [uncontrolledValue, setUncontrolledValue] = useState(() => formatarEntradaDecimal(defaultValue, decimalScale));
  const [focused, setFocused] = useState(false);
  const rawValue = value === undefined ? uncontrolledValue : formatarEntradaDecimal(value, decimalScale);
  const displayValue = focused || !rawValue ? rawValue : formatarEntradaMonetaria(rawValue, currency, decimalScale);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const nextValue = formatarEntradaDecimal(event.target.value, decimalScale);

    setUncontrolledValue(nextValue);
    onValueChange?.(nextValue);
  }

  function handleFocus(event: FocusEvent<HTMLInputElement>) {
    setFocused(true);
    onFocus?.(event);
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    setFocused(false);
    onBlur?.(event);
  }

  return (
    <InputText
      {...props}
      inputMode="decimal"
      onBlur={handleBlur}
      onChange={handleChange}
      onFocus={handleFocus}
      type="text"
      value={displayValue}
    />
  );
}
