import { useState, type ChangeEvent } from 'react';
import { formatarEdicaoDecimal, formatarEntradaDecimal } from '../utils/formatters';
import { useFormReset } from './useFormReset';

interface DecimalInputOptions {
  decimalScale: number;
  defaultValue: string | number;
  onValueChange?: (value: string) => void;
  value?: string | number;
}

/**
 * Estado dos campos decimais: o valor, controlado ou nao, e o texto que a
 * pessoa esta digitando, que pode ainda guardar um ponto sem papel decidido.
 */
export function useDecimalInput({ decimalScale, defaultValue, onValueChange, value }: DecimalInputOptions) {
  const [uncontrolledValue, setUncontrolledValue] = useState(() => formatarEntradaDecimal(defaultValue, decimalScale));
  const [editingText, setEditingText] = useState<string | null>(null);
  const ref = useFormReset<HTMLInputElement>(() => {
    setUncontrolledValue(formatarEntradaDecimal(defaultValue, decimalScale));
    setEditingText(null);
  });
  const currentValue = value === undefined ? uncontrolledValue : formatarEntradaDecimal(value, decimalScale);
  // O texto digitado so vale enquanto diz o mesmo que o valor; uma mudanca
  // externa, ou recusada pelo consumidor, volta a exibir o valor.
  const text =
    editingText !== null && formatarEntradaDecimal(editingText, decimalScale) === currentValue ? editingText : currentValue;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const nextValue = formatarEntradaDecimal(event.target.value, decimalScale);

    setEditingText(formatarEdicaoDecimal(event.target.value, decimalScale));
    setUncontrolledValue(nextValue);
    onValueChange?.(nextValue);
  }

  return { ref, value: currentValue, text, handleChange, endEditing: () => setEditingText(null) };
}
