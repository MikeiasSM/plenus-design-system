import { useState, type ChangeEvent } from 'react';
import { Time } from '@internationalized/date';
import { Field } from '../Field';
import styles from './TimePicker.module.css';

export type TimePickerSize = 'sm' | 'md';

export interface TimePickerProps {
  defaultValue?: Time;
  disabled?: boolean;
  error?: string;
  hint?: string;
  id?: string;
  label?: string;
  max?: Time;
  min?: Time;
  onValueChange?: (value?: Time) => void;
  required?: boolean;
  size?: TimePickerSize;
  step?: number;
  value?: Time;
}

function paraTexto(hora?: Time) {
  if (!hora) {
    return '';
  }

  return [hora.hour, hora.minute].map((parte) => String(parte).padStart(2, '0')).join(':');
}

export function lerHora(texto: string) {
  const [hora, minuto] = texto.split(':').map(Number);

  if (!Number.isInteger(hora) || !Number.isInteger(minuto) || hora > 23 || minuto > 59) {
    return undefined;
  }

  return new Time(hora, minuto);
}

export function TimePicker({
  defaultValue,
  disabled = false,
  error,
  hint,
  id: providedId,
  label,
  max,
  min,
  onValueChange,
  required = false,
  size = 'md',
  step = 60,
  value,
}: TimePickerProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const escolhido = value ?? internalValue;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const lido = event.target.value === '' ? undefined : lerHora(event.target.value);

    if (value === undefined) {
      setInternalValue(lido);
    }

    onValueChange?.(lido);
  }

  return (
    <Field error={error} hint={hint} id={providedId} label={label} required={required}>
      {({ id, describedBy, invalid }) => (
        <input
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          aria-required={required || undefined}
          className={[styles.input, styles[size], error && styles.error].filter(Boolean).join(' ')}
          disabled={disabled}
          id={id}
          max={paraTexto(max) || undefined}
          min={paraTexto(min) || undefined}
          onChange={handleChange}
          step={step}
          type="time"
          value={paraTexto(escolhido)}
        />
      )}
    </Field>
  );
}
