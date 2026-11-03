import { type FocusEvent, type KeyboardEvent, type Ref } from 'react';
import { useDecimalInput } from '../../../hooks/useDecimalInput';
import { useMergedRefs } from '../../../hooks/useMergedRefs';
import { InputText, type InputTextProps } from '../InputText';

export interface InputNumberProps extends Omit<InputTextProps, 'defaultValue' | 'onChange' | 'onValueChange' | 'showCharacterCount' | 'type' | 'value'> {
  decimalScale?: number;
  defaultValue?: number | null;
  onValueChange?: (value: number | null) => void;
  value?: number | null;
}

export function InputNumber({
  decimalScale = 0,
  defaultValue = null,
  onBlur,
  onKeyDown,
  name,
  onValueChange,
  value,
  ...props
}: InputNumberProps) {
  const decimalInput = useDecimalInput({ decimalScale, defaultValue, onValueChange, value });
  const mergedRef = useMergedRefs(decimalInput.ref, props.ref as Ref<HTMLInputElement>);

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    decimalInput.endEditing();
    onBlur?.(event);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (decimalScale === 0 && (event.key === ',' || event.key === '.')) {
      event.preventDefault();
    }
    onKeyDown?.(event);
  }

  return (
    <>
      <InputText
        {...props}
        ref={mergedRef}
        inputMode={decimalScale > 0 ? 'decimal' : 'numeric'}
        onBlur={handleBlur}
        onChange={decimalInput.handleChange}
        onKeyDown={handleKeyDown}
        pattern={decimalScale > 0 ? undefined : '-?[0-9]*'}
        type="text"
        value={decimalInput.text}
      />
      {name && <input disabled={props.disabled} form={props.form} name={name} type="hidden" value={decimalInput.formValue} />}
    </>
  );
}
