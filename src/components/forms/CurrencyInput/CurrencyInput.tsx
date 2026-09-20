import { useEffect, useState, type FocusEvent } from 'react';
import { Input, type InputProps } from '../Input';
import { formatCurrencyInput } from '../../../utils/formatters';

export interface CurrencyInputProps extends Omit<InputProps, 'defaultValue' | 'onChange' | 'type' | 'value'> {
  currency?: string;
  defaultValue?: string | number;
  decimalScale?: number;
  onValueChange?: (value: string) => void;
  value?: string | number;
}

export function CurrencyInput({
  currency = 'BRL',
  defaultValue = '',
  decimalScale = 2,
  onBlur,
  onFocus,
  onValueChange,
  value,
  ...props
}: CurrencyInputProps) {
  const isControlled = value !== undefined;
  const initialValue = String(defaultValue);
  const [rawValue, setRawValue] = useState(initialValue);
  const [displayValue, setDisplayValue] = useState(initialValue);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (isControlled && !focused) {
      const nextValue = String(value);
      setRawValue(nextValue);
      setDisplayValue(nextValue ? formatCurrencyInput(nextValue, currency, decimalScale) : '');
    }
  }, [currency, decimalScale, focused, isControlled, value]);

  function handleFocus(event: FocusEvent<HTMLInputElement>) {
    setFocused(true);
    setDisplayValue(rawValue);
    onFocus?.(event);
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    setFocused(false);
    setDisplayValue(rawValue ? formatCurrencyInput(rawValue, currency, decimalScale) : '');
    onBlur?.(event);
  }

  return (
    <Input
      {...props}
      inputMode="decimal"
      onBlur={handleBlur}
      onChange={(event) => {
        const nextValue = event.target.value.replace(/[^\d,]/g, '');
        setRawValue(nextValue);
        setDisplayValue(nextValue);
        onValueChange?.(nextValue);
      }}
      onFocus={handleFocus}
      type="text"
      value={displayValue}
    />
  );
}
