import { useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { InputText, type InputTextProps } from '../InputText';
import { formatarEntradaDecimal } from '../../../utils/formatters';

export interface InputNumberProps extends Omit<InputTextProps, 'defaultValue' | 'onChange' | 'showCharacterCount' | 'type' | 'value'> {
  decimalScale?: number;
  defaultValue?: string | number;
  onValueChange?: (value: string) => void;
  value?: string | number;
}

export function InputNumber({
  decimalScale = 0,
  defaultValue = '',
  onKeyDown,
  onValueChange,
  value,
  ...props
}: InputNumberProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(() => formatarEntradaDecimal(defaultValue, decimalScale));
  const currentValue = value === undefined ? uncontrolledValue : formatarEntradaDecimal(value, decimalScale);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const nextValue = formatarEntradaDecimal(event.target.value, decimalScale);

    setUncontrolledValue(nextValue);
    onValueChange?.(nextValue);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (decimalScale === 0 && (event.key === ',' || event.key === '.')) {
      event.preventDefault();
    }
    onKeyDown?.(event);
  }

  return (
    <InputText
      {...props}
      inputMode={decimalScale > 0 ? 'decimal' : 'numeric'}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      pattern={decimalScale > 0 ? undefined : '[0-9]*'}
      type="text"
      value={currentValue}
    />
  );
}
