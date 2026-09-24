import { useMemo } from 'react';
import { Time } from '@internationalized/date';
import { ListingOptions } from '../../data-display/List/ListingOptions';
import { useListing, type ListingItem } from '../../data-display/List/useListing';
import styles from './TimePicker.module.css';

export interface TimeSlotsProps {
  baseId: string;
  height?: number;
  label?: string;
  max?: Time;
  min?: Time;
  onChange: (value: Time) => void;
  step?: number;
  value?: Time;
}

const doisDigitos = (valor: number) => String(valor).padStart(2, '0');

export function paraTextoDeHora(hora?: Time) {
  return hora ? doisDigitos(hora.hour) + ':' + doisDigitos(hora.minute) : '';
}

export function gerarHorarios(step: number, min = new Time(0, 0), max = new Time(23, 59)) {
  const inicio = min.hour * 60 + min.minute;
  const fim = max.hour * 60 + max.minute;
  const horarios: Time[] = [];

  for (let minutos = inicio; minutos <= fim; minutos += step) {
    horarios.push(new Time(Math.floor(minutos / 60), minutos % 60));
  }

  return horarios;
}

export function TimeSlots({
  baseId,
  height = 264,
  label = 'Horário',
  max,
  min,
  onChange,
  step = 30,
  value,
}: TimeSlotsProps) {
  const horarios = useMemo<ListingItem[]>(
    () => gerarHorarios(step, min, max).map((hora) => ({ value: paraTextoDeHora(hora), label: paraTextoDeHora(hora) })),
    [max, min, step],
  );

  const escolhido = paraTextoDeHora(value);
  const listagem = useListing({
    items: horarios,
    selectionMode: 'single',
    value: value ? [{ value: escolhido, label: escolhido }] : [],
    onSelectionChange: ([item]) => {
      const lido = item && item.value.split(':').map(Number);

      if (lido) {
        onChange(new Time(lido[0], lido[1]));
      }
    },
  });

  return (
    <ListingOptions
      baseId={baseId}
      className={styles.slots}
      height={height}
      label={label}
      listing={listagem}
    />
  );
}
