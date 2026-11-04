import { endOfMonth, getLocalTimeZone, startOfMonth, today, type CalendarDate } from '@internationalized/date';
import type { DateRange, DateRangeShortcut } from './DatePickerRange';

const startingAt = (days: number) => () => between(today(getLocalTimeZone()).subtract({ days }), today(getLocalTimeZone()));

function between(start: CalendarDate, end: CalendarDate): DateRange {
  return { start: start.toString(), end: end.toString() };
}

/** Atalhos de uso corrente, para o produto passar a `shortcuts` quando servirem. Nenhum atalho é imposto. */
export const defaultDateRangeShortcuts: readonly DateRangeShortcut[] = [
  { label: 'Hoje', range: startingAt(0) },
  {
    label: 'Ontem',
    range: () => {
      const yesterday = today(getLocalTimeZone()).subtract({ days: 1 });
      return between(yesterday, yesterday);
    },
  },
  { label: 'Últimos 7 dias', range: startingAt(6) },
  { label: 'Últimos 30 dias', range: startingAt(29) },
  {
    label: 'Este mês',
    range: () => between(startOfMonth(today(getLocalTimeZone())), endOfMonth(today(getLocalTimeZone()))),
  },
  {
    label: 'Mês passado',
    range: () => {
      const lastMonth = startOfMonth(today(getLocalTimeZone())).subtract({ months: 1 });
      return between(lastMonth, endOfMonth(lastMonth));
    },
  },
];
