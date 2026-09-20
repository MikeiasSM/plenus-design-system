import { useEffect, useState, type ChangeEvent, type ChangeEventHandler, type KeyboardEvent } from 'react';
import { Input, type InputProps } from '../Input';
import { formatDecimalInput } from '../../../utils/formatters';

export interface NumberInputProps extends Omit<InputProps, 'defaultValue' | 'onChange' | 'type' | 'value'> {
  decimalScale?: number;
  defaultValue?: string | number;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  onValueChange?: (value: string) => void;
  value?: string | number;
}

export function NumberInput({
  decimalScale = 0,
  defaultValue = '',
  onChange,
  onKeyDown,
  onValueChange,
  value,
  ...props
}: NumberInputProps) {
  const isControlled = value !== undefined;
  const [currentValue, setCurrentValue] = useState(() => formatDecimalInput(String(defaultValue), decimalScale));

  useEffect(() => {
    if (isControlled) {
      setCurrentValue(formatDecimalInput(String(value), decimalScale));
    }
  }, [decimalScale, isControlled, value]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const nextValue = formatDecimalInput(event.target.value, decimalScale);

    setCurrentValue(nextValue);
    onValueChange?.(nextValue);
    onChange?.(event);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (decimalScale === 0 && (event.key === ',' || event.key === '.')) {
      event.preventDefault();
    }
    onKeyDown?.(event);
  }

  return (
    <Input
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
