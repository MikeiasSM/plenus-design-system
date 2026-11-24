import { useState, type ComponentPropsWithRef } from 'react';
import type { CalendarDate } from '@internationalized/date';
import type { CalendarLimits } from '../../../hooks/useCalendar';
import { Calendar as CalendarGrid } from '../DatePicker/Calendar';
import { readIsoDate } from '../DatePicker/iso';
import type { DateRange } from '../DatePickerRange';
import styles from './Calendar.module.css';

/** As propriedades nativas vao ao grupo que envolve o calendario; o `className` soma ao do sistema. */
interface CalendarBaseProps
  extends Omit<ComponentPropsWithRef<'div'>, 'children' | 'defaultValue' | 'onChange' | 'role'> {
  /** Nome do calendario, como "Data da entrega". Sem ele, passe `aria-labelledby`. */
  'aria-label'?: string;
  /** Leva o foco ao dia escolhido, ou a hoje, ao montar. */
  autoFocus?: boolean;
  /** Recusa datas avulsas, recebidas em ISO: o dia fica riscado e se anuncia como indisponivel. */
  isDateUnavailable?: (date: string) => boolean;
  locale?: string;
  /** Ultima data que se escolhe, em ISO. Depois dela, os dias so se apagam. */
  maxValue?: string;
  /** Primeira data que se escolhe, em ISO. Antes dela, os dias so se apagam. */
  minValue?: string;
}

export interface CalendarSingleProps extends CalendarBaseProps {
  defaultValue?: string | null;
  /** Chamado a cada dia escolhido, em ISO. */
  onChange?: (value: string) => void;
  selectionMode?: 'single';
  /** Data em ISO, `2026-03-09`. `null` e controlado e vazio. */
  value?: string | null;
}

export interface CalendarRangeProps extends CalendarBaseProps {
  defaultValue?: DateRange | null;
  /** Chamado quando o segundo clique fecha o intervalo, com as duas pontas em ISO. */
  onChange?: (value: DateRange) => void;
  /** O primeiro clique marca o inicio e o segundo, o fim; se vier antes, as pontas se invertem. */
  selectionMode: 'range';
  /** Intervalo em ISO, com as duas pontas incluidas. `null` e controlado e vazio. */
  value?: DateRange | null;
}

export type CalendarProps = CalendarSingleProps | CalendarRangeProps;

interface Selection {
  end?: CalendarDate;
  start?: CalendarDate;
}

function readSelection(value: string | DateRange | null | undefined): Selection {
  if (!value) {
    return {};
  }

  return typeof value === 'string'
    ? { start: readIsoDate(value) }
    : { start: readIsoDate(value.start), end: readIsoDate(value.end) };
}

/**
 * O calendario solto na pagina, para mostrar a disponibilidade e escolher uma data ou um intervalo a vista. E o
 * mesmo miolo do painel do `DatePicker`, sem borda nem fundo, um mes por vez.
 */
export function Calendar(props: CalendarProps) {
  const {
    autoFocus,
    className,
    defaultValue,
    isDateUnavailable,
    locale = 'pt-BR',
    maxValue,
    minValue,
    onChange,
    selectionMode = 'single',
    value,
    ...rest
  } = props;
  const range = selectionMode === 'range';
  const [internalValue, setInternalValue] = useState(() => readSelection(defaultValue));
  // No intervalo, o inicio escolhido espera o fim sem virar valor: so o intervalo inteiro chega a `onChange`.
  const [pendingStart, setPendingStart] = useState<CalendarDate>();
  const chosen = value === undefined ? internalValue : readSelection(value);
  const shown = range && pendingStart ? { start: pendingStart } : chosen;
  const limits: CalendarLimits = {
    isDateUnavailable: isDateUnavailable && ((date) => isDateUnavailable(date.toString())),
    max: readIsoDate(maxValue),
    min: readIsoDate(minValue),
  };

  function select(day: CalendarDate) {
    if (!range) {
      setInternalValue({ start: day });
      (onChange as CalendarSingleProps['onChange'])?.(day.toString());
      return;
    }

    if (!pendingStart) {
      setPendingStart(day);
      return;
    }

    const [start, end] = day.compare(pendingStart) < 0 ? [day, pendingStart] : [pendingStart, day];

    setPendingStart(undefined);
    setInternalValue({ start, end });
    (onChange as CalendarRangeProps['onChange'])?.({ start: start.toString(), end: end.toString() });
  }

  return (
    <div {...rest} className={[styles.calendar, className].filter(Boolean).join(' ')} role="group">
      <CalendarGrid
        autoFocus={autoFocus}
        isDateUnavailable={limits.isDateUnavailable}
        locale={locale}
        max={limits.max}
        min={limits.min}
        onSelect={select}
        rangeEnd={range ? shown.end : undefined}
        value={shown.start}
      />
    </div>
  );
}
