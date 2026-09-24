import { useMemo, useState } from 'react';
import { Time } from '@internationalized/date';
import { ListingOptions } from '../../data-display/List/ListingOptions';
import { useListing, type ListingItem } from '../../data-display/List/useListing';
import styles from './TimePicker.module.css';

export interface TimeSlotsProps {
  baseId: string;
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

/** Aplica a mascara hora:minuto conforme o usuario digita. */
export function formatarEntradaHora(valor: string) {
  const digitos = valor.replace(/\D/g, '').slice(0, 4);

  return digitos.length <= 2 ? digitos : digitos.slice(0, 2) + ':' + digitos.slice(2);
}

export function lerEntradaHora(valor: string) {
  const [hora, minuto] = valor.split(':').map(Number);

  if (!Number.isInteger(hora) || !Number.isInteger(minuto) || hora > 23 || minuto > 59) {
    return undefined;
  }

  return new Time(hora, minuto);
}

/** Horarios do dia inteiro, do primeiro ao ultimo que couber no passo. */
export function gerarHorarios(step: number, min = new Time(0, 0), max = new Time(23, 59)) {
  const inicio = min.hour * 60 + min.minute;
  const fim = max.hour * 60 + max.minute;
  const horarios: Time[] = [];

  for (let minutos = inicio; minutos <= fim; minutos += step) {
    horarios.push(new Time(Math.floor(minutos / 60), minutos % 60));
  }

  return horarios;
}

export function TimeSlots({ baseId, label = 'Horário', max, min, onChange, step = 30, value }: TimeSlotsProps) {
  const [texto, setTexto] = useState(() => paraTextoDeHora(value));
  const [digitando, setDigitando] = useState(false);

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
      const lido = item && lerEntradaHora(item.value);

      if (lido) {
        setDigitando(false);
        onChange(lido);
      }
    },
  });

  function handleChange(entrada: string) {
    const mascarado = formatarEntradaHora(entrada);

    setDigitando(true);
    setTexto(mascarado);

    const lido = lerEntradaHora(mascarado);

    if (lido) {
      onChange(lido);
    }
  }

  return (
    <div className={styles.slots}>
      <input
        aria-label={label + ' em horas e minutos'}
        autoComplete="off"
        className={styles.slotInput}
        inputMode="numeric"
        onBlur={() => setDigitando(false)}
        onChange={(event) => handleChange(event.target.value)}
        placeholder="hh:mm"
        type="text"
        value={digitando ? texto : escolhido}
      />
      <ListingOptions baseId={baseId} className={styles.slotList} label={label} listing={listagem} />
    </div>
  );
}
