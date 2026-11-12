import { useState, type ChangeEvent } from 'react';
import { formatDecimalDraft, formatDecimalInput } from '../utils/formatters';
import { useFormReset } from './useFormReset';

interface DecimalInputOptions {
  decimalScale: number;
  defaultValue: number | null;
  onValueChange?: (value: number | null) => void;
  value?: number | null;
}

/** Texto sem numero válido, como `-` ou `,`, vale como vazio. */
function numberOf(text: string, decimalScale: number) {
  const normalized = formatDecimalInput(text, decimalScale);
  const number = Number(normalized.replace(',', '.'));

  return normalized === '' || Number.isNaN(number) ? null : number + 0;
}

function textOf(value: number | null, decimalScale: number) {
  return value === null ? '' : formatDecimalInput(value, decimalScale);
}

/**
 * Estado dos campos decimais: o valor numerico, controlado ou não, e o texto que
 * a pessoa esta digitando, que pode ainda guardar um ponto sem papel decidido.
 */
export function useDecimalInput({ decimalScale, defaultValue, onValueChange, value }: DecimalInputOptions) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const [editingText, setEditingText] = useState<string | null>(null);
  const ref = useFormReset<HTMLInputElement>(() => {
    setUncontrolledValue(defaultValue);
    setEditingText(null);
  });
  const currentValue = value === undefined ? uncontrolledValue : value;
  // O texto digitado só vale enquanto diz o mesmo que o valor; uma mudança
  // externa, ou recusada pelo consumidor, volta a exibir o valor.
  const text =
    editingText !== null && numberOf(editingText, decimalScale) === currentValue
      ? editingText
      : textOf(currentValue, decimalScale);
  const formValue = textOf(currentValue, decimalScale).replace(',', '.');

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const nextValue = numberOf(event.target.value, decimalScale);

    setEditingText(formatDecimalDraft(event.target.value, decimalScale));
    setUncontrolledValue(nextValue);
    onValueChange?.(nextValue);
  }

  return { ref, value: currentValue, text, formValue, handleChange, endEditing: () => setEditingText(null) };
}
