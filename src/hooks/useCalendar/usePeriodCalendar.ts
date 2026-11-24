import { useMemo, useState, type KeyboardEvent } from 'react';
import { getLocalTimeZone, today, type CalendarDate } from '@internationalized/date';
import {
  buildPeriods,
  clampPeriod,
  isUnavailable,
  movePeriodFocus,
  startOfPage,
  startOfPeriod,
  type CalendarGranularity,
  type CalendarLimits,
  type CalendarPeriod,
} from './calendar';
import { blockRepeatedPress } from '../../utils/press/press';

export type CalendarPeriodGranularity = Exclude<CalendarGranularity, 'day'>;

export interface UsePeriodCalendarOptions extends CalendarLimits {
  granularity: CalendarPeriodGranularity;
  onSelect?: (date: CalendarDate) => void;
  /** Primeiro dia do periodo escolhido. Outro dia do periodo vale como o primeiro. */
  value?: CalendarDate;
}

export interface UsePeriodCalendarResult {
  /** Leva o foco a um periodo e traz a pagina dele para a grade. */
  focus: (date: CalendarDate) => void;
  focusedDate: CalendarDate;
  /** Troca o ano, na grade de meses, ou a pagina de doze anos, na de anos. */
  goToPage: (offset: number) => void;
  handleKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  isCurrent: (date: CalendarDate) => boolean;
  isSelected: (date: CalendarDate) => boolean;
  /** Primeiro dia da pagina: o 1o de janeiro do ano mostrado, ou do primeiro ano da pagina. */
  page: CalendarDate;
  periods: CalendarPeriod[][];
  select: (date: CalendarDate) => void;
}

const samePeriod = (a: CalendarDate | undefined, b: CalendarDate | undefined, granularity: CalendarGranularity) =>
  Boolean(a && b && startOfPeriod(a, granularity).compare(startOfPeriod(b, granularity)) === 0);

/** O motor da grade de meses ou de anos, o par do `useCalendar` para escolher a competencia ou o exercicio. */
export function usePeriodCalendar({
  granularity,
  isDateUnavailable,
  max,
  min,
  onSelect,
  value,
}: UsePeriodCalendarOptions): UsePeriodCalendarResult {
  const limits: CalendarLimits = { isDateUnavailable, max, min };
  const atual = useMemo(() => startOfPeriod(today(getLocalTimeZone()), granularity), [granularity]);
  const escolhido = value && startOfPeriod(value, granularity);
  const [focusedDate, setFocusedDate] = useState(() => clampPeriod(escolhido ?? atual, granularity, limits));
  const [page, setPage] = useState(() => startOfPage(focusedDate, granularity));
  const [ultimoValor, setUltimoValor] = useState(escolhido);

  // Como na grade de dias, a pagina segue o valor que muda de fora, mas so quando ele sai da pagina mostrada.
  if (escolhido && (!ultimoValor || escolhido.compare(ultimoValor) !== 0)) {
    setUltimoValor(escolhido);
    setFocusedDate(clampPeriod(escolhido, granularity, limits));

    if (!naPagina(escolhido)) {
      setPage(startOfPage(escolhido, granularity));
    }
  }

  const periods = useMemo(() => buildPeriods(page, granularity, limits), [page, granularity, max, min, isDateUnavailable]);

  function naPagina(date: CalendarDate) {
    const fim = page.add({ years: granularity === 'month' ? 1 : 12 });

    return date.compare(page) >= 0 && date.compare(fim) < 0;
  }

  function focus(date: CalendarDate) {
    const periodo = startOfPeriod(date, granularity);

    setFocusedDate(periodo);

    if (!naPagina(periodo)) {
      setPage(startOfPage(periodo, granularity, page));
    }
  }

  function select(date: CalendarDate) {
    if (isUnavailable(date, limits, granularity)) {
      return;
    }

    focus(date);
    onSelect?.(startOfPeriod(date, granularity));
  }

  return {
    focus,
    focusedDate,
    goToPage: (offset) => {
      const anos = granularity === 'month' ? offset : offset * 12;

      setPage(page.add({ years: anos }));
      // O foco acompanha a pagina, na mesma posicao da grade.
      setFocusedDate(clampPeriod(focusedDate.add({ years: anos }), granularity, limits));
    },
    handleKeyDown: (event) => {
      if (blockRepeatedPress(event)) {
        return;
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        select(focusedDate);
        return;
      }

      const next = movePeriodFocus(focusedDate, event.key, granularity, page, limits);

      if (next) {
        event.preventDefault();
        focus(next);
      }
    },
    isCurrent: (date) => samePeriod(date, atual, granularity),
    isSelected: (date) => samePeriod(date, value, granularity),
    page,
    periods,
    select,
  };
}
