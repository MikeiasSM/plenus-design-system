import { useMemo } from 'react';
import { Time } from '@internationalized/date';
import { ListingOptions } from '../../data-display/List/ListingOptions';
import { useListing, type ListingItem } from '../../data-display/List/useListing';
import styles from './TimePicker.module.css';

export interface HourAndMinuteProps {
  baseId: string;
  height?: number;
  max?: Time;
  min?: Time;
  minuteStep?: number;
  onChange: (value: Time) => void;
  value?: Time;
}

export const doisDigitos = (valor: number) => String(valor).padStart(2, '0');

export function HourAndMinute({
  baseId,
  height = 200,
  max,
  min,
  minuteStep = 5,
  onChange,
  value,
}: HourAndMinuteProps) {
  const horas = useMemo<ListingItem[]>(
    () =>
      Array.from({ length: 24 }, (_, hora) => ({
        value: String(hora),
        label: doisDigitos(hora),
        disabled: (min !== undefined && hora < min.hour) || (max !== undefined && hora > max.hour),
      })),
    [max, min],
  );

  const minutos = useMemo<ListingItem[]>(
    () =>
      Array.from({ length: Math.ceil(60 / minuteStep) }, (_, indice) => {
        const minuto = indice * minuteStep;

        return {
          value: String(minuto),
          label: doisDigitos(minuto),
          disabled:
            (min !== undefined && value?.hour === min.hour && minuto < min.minute) ||
            (max !== undefined && value?.hour === max.hour && minuto > max.minute),
        };
      }),
    [max, min, minuteStep, value],
  );

  const listaDeHoras = useListing({
    items: horas,
    selectionMode: 'single',
    value: value ? [{ value: String(value.hour), label: doisDigitos(value.hour) }] : [],
    onSelectionChange: ([item]) => item && onChange(new Time(Number(item.value), value?.minute ?? 0)),
  });

  const listaDeMinutos = useListing({
    items: minutos,
    selectionMode: 'single',
    value: value ? [{ value: String(value.minute), label: doisDigitos(value.minute) }] : [],
    onSelectionChange: ([item]) => item && onChange(new Time(value?.hour ?? 0, Number(item.value))),
  });

  return (
    <div className={styles.columns}>
      <ListingOptions
        baseId={baseId + '-horas'}
        className={styles.column}
        height={height}
        label="Hora"
        listing={listaDeHoras}
      />
      <ListingOptions
        baseId={baseId + '-minutos'}
        className={styles.column}
        height={height}
        label="Minuto"
        listing={listaDeMinutos}
      />
    </div>
  );
}
