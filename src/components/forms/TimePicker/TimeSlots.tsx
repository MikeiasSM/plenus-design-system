import { useEffect, useMemo, useRef, useState } from 'react';
import { Time } from '@internationalized/date';
import { ListingOptions } from '../../data-display/List/ListingOptions';
import { useListing, type ListingItem } from '../../data-display/List/useListing';
import { formatarEntradaHora, lerEntradaHora } from '../../../utils/formatters';
import styles from './TimePicker.module.css';

export interface TimeSlotsProps {
  autoFocus?: boolean;
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

/** A hora digitada respeita os limites que a lista ja respeita. */
export function isTimeAllowed(time: Time, min?: Time, max?: Time) {
  return (!min || time.compare(min) >= 0) && (!max || time.compare(max) <= 0);
}

/** Horarios do dia inteiro, do primeiro ao ultimo que couber no passo. */
export function gerarHorarios(step: number, min = new Time(0, 0), max = new Time(23, 59)) {
  if (step <= 0) {
    return [];
  }

  const inicio = min.hour * 60 + min.minute;
  const fim = max.hour * 60 + max.minute;
  const horarios: Time[] = [];

  for (let minutos = inicio; minutos <= fim; minutos += step) {
    horarios.push(new Time(Math.floor(minutos / 60), minutos % 60));
  }

  return horarios;
}

export function TimeSlots({ autoFocus = false, baseId, label = 'Horário', max, min, onChange, step = 30, value }: TimeSlotsProps) {
  const [texto, setTexto] = useState(() => paraTextoDeHora(value));
  const [digitando, setDigitando] = useState(false);
  const listboxRef = useRef<HTMLElement | null>(null);

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

  // Na abertura, o teclado parte do horario escolhido, como no Select; sem isso, partia da meia-noite.
  useEffect(() => {
    listagem.focus(horarios.some((horario) => horario.value === escolhido) ? escolhido : undefined);

    if (autoFocus) {
      listboxRef.current?.focus();
    }
  }, []);

  function handleChange(entrada: string) {
    const mascarado = formatarEntradaHora(entrada);

    setDigitando(true);
    setTexto(mascarado);

    const lido = lerEntradaHora(mascarado);

    if (lido && isTimeAllowed(lido, min, max)) {
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
      <ListingOptions
        baseId={baseId}
        className={styles.slotList}
        elementRef={listboxRef}
        holdsFocus
        label={label}
        listing={listagem}
        onKeyDown={listagem.handleKeyDown}
      />
    </div>
  );
}
