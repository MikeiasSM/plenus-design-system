import { useState } from 'react';
import { CalendarDate, CalendarDateTime, Time } from '@internationalized/date';
import { DatePicker } from '../DatePicker';
import { TimePicker } from '../TimePicker';
import styles from './DateTimePicker.module.css';

export type DateTimePickerSize = 'sm' | 'md';

export interface DateTimePickerProps {
  defaultValue?: CalendarDateTime;
  disabled?: boolean;
  error?: string;
  hint?: string;
  id?: string;
  isDateUnavailable?: (date: CalendarDate) => boolean;
  label?: string;
  locale?: string;
  max?: CalendarDate;
  min?: CalendarDate;
  onValueChange?: (value?: CalendarDateTime) => void;
  required?: boolean;
  size?: DateTimePickerSize;
  timeLabel?: string;
  value?: CalendarDateTime;
}

function paraData(valor?: CalendarDateTime) {
  return valor && new CalendarDate(valor.year, valor.month, valor.day);
}

function paraHora(valor?: CalendarDateTime) {
  return valor && new Time(valor.hour, valor.minute);
}

export function DateTimePicker({
  defaultValue,
  disabled = false,
  error,
  hint,
  id,
  isDateUnavailable,
  label,
  locale = 'pt-BR',
  max,
  min,
  onValueChange,
  required = false,
  size = 'md',
  timeLabel = 'Hora',
  value,
}: DateTimePickerProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const atual = value ?? internalValue;

  function definir(proximo?: CalendarDateTime) {
    if (value === undefined) {
      setInternalValue(proximo);
    }

    onValueChange?.(proximo);
  }

  function combinar(data?: CalendarDate, hora?: Time) {
    if (!data) {
      definir(undefined);
      return;
    }

    const usada = hora ?? new Time(0, 0);

    definir(new CalendarDateTime(data.year, data.month, data.day, usada.hour, usada.minute));
  }

  return (
    <div className={styles.group}>
      <div className={styles.date}>
        <DatePicker
          disabled={disabled}
          error={error}
          hint={hint}
          id={id}
          isDateUnavailable={isDateUnavailable}
          label={label}
          locale={locale}
          max={max}
          min={min}
          onValueChange={(data) => combinar(data, paraHora(atual))}
          required={required}
          size={size}
          value={paraData(atual)}
        />
      </div>
      <div className={styles.time}>
        <TimePicker
          disabled={disabled}
          label={timeLabel}
          onValueChange={(hora) => combinar(paraData(atual), hora)}
          size={size}
          value={paraHora(atual)}
        />
      </div>
    </div>
  );
}
