import {
  CalendarDate,
  endOfMonth,
  getWeeksInMonth,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from '@internationalized/date';

export interface CalendarLimits {
  isDateUnavailable?: (date: CalendarDate) => boolean;
  max?: CalendarDate;
  min?: CalendarDate;
}

/** Unidade de escolha: o dia, o mes ou o ano. O valor e sempre o primeiro dia do periodo. */
export type CalendarGranularity = 'day' | 'month' | 'year';

export interface CalendarDay {
  date: CalendarDate;
  /** Recusado pelo predicado `isDateUnavailable`, e nao pela faixa: e o que se risca e se anuncia como indisponivel. */
  excluded: boolean;
  outside: boolean;
  unavailable: boolean;
}

/** Mes ou ano da grade de periodos, pelo primeiro dia dele. */
export interface CalendarPeriod {
  date: CalendarDate;
  excluded: boolean;
  unavailable: boolean;
}

/** Primeiro dia do periodo que contem a data: o proprio dia, o dia 1 do mes ou o 1o de janeiro. */
export function startOfPeriod(date: CalendarDate, granularity: CalendarGranularity = 'day') {
  if (granularity === 'month') {
    return startOfMonth(date);
  }

  return granularity === 'year' ? date.set({ month: 1, day: 1 }) : date;
}

/** Ultimo dia do periodo que contem a data. */
export function endOfPeriod(date: CalendarDate, granularity: CalendarGranularity = 'day') {
  if (granularity === 'month') {
    return endOfMonth(date);
  }

  return granularity === 'year' ? date.set({ month: 12, day: 31 }) : date;
}

/**
 * Fora da faixa so fica o periodo que nao toca nela: o mes de `min` vale mesmo com `min` no meio dele.
 * O predicado recebe o primeiro dia do periodo, que e o valor.
 */
export function isUnavailable(
  date: CalendarDate,
  limits: CalendarLimits,
  granularity: CalendarGranularity = 'day',
) {
  return isOutOfRange(date, limits, granularity) || (limits.isDateUnavailable?.(startOfPeriod(date, granularity)) ?? false);
}

export function isOutOfRange(date: CalendarDate, { max, min }: CalendarLimits, granularity: CalendarGranularity = 'day') {
  if (min && endOfPeriod(date, granularity).compare(min) < 0) {
    return true;
  }

  return Boolean(max && startOfPeriod(date, granularity).compare(max) > 0);
}

export function buildMonth(anchor: CalendarDate, locale: string, limits: CalendarLimits = {}): CalendarDay[][] {
  const first = startOfMonth(anchor);
  const start = startOfWeek(first, locale);
  const weeks: CalendarDay[][] = [];

  for (let week = 0; week < getWeeksInMonth(anchor, locale); week += 1) {
    const days: CalendarDay[] = [];

    for (let day = 0; day < 7; day += 1) {
      const date = start.add({ days: week * 7 + day });

      const excluded = limits.isDateUnavailable?.(date) ?? false;

      days.push({
        date,
        excluded,
        outside: !isSameMonth(date, anchor),
        unavailable: excluded || isOutOfRange(date, limits),
      });
    }

    weeks.push(days);
  }

  return weeks;
}

export function clamp(date: CalendarDate, { max, min }: CalendarLimits) {
  if (min && date.compare(min) < 0) {
    return min;
  }

  if (max && date.compare(max) > 0) {
    return max;
  }

  return date;
}

export function moveFocus(date: CalendarDate, key: string, shift: boolean, limits: CalendarLimits) {
  switch (key) {
    case 'ArrowLeft':
      return clamp(date.subtract({ days: 1 }), limits);
    case 'ArrowRight':
      return clamp(date.add({ days: 1 }), limits);
    case 'ArrowUp':
      return clamp(date.subtract({ weeks: 1 }), limits);
    case 'ArrowDown':
      return clamp(date.add({ weeks: 1 }), limits);
    case 'Home':
      return clamp(startOfMonth(date), limits);
    case 'End':
      return clamp(endOfMonth(date), limits);
    case 'PageUp':
      return clamp(shift ? date.subtract({ years: 1 }) : date.subtract({ months: 1 }), limits);
    case 'PageDown':
      return clamp(shift ? date.add({ years: 1 }) : date.add({ months: 1 }), limits);
    default:
      return undefined;
  }
}

/** Os anos andam em paginas de doze, e a primeira pagina de um ano comeca na sua decada: 2026 abre em 2020 a 2031. */
export const yearPageStart = (year: number) => Math.floor(year / 10) * 10;

/** Primeiro dia da pagina de periodos que contem a data: o 1o de janeiro do ano, ou do primeiro ano da pagina. */
export function startOfPage(date: CalendarDate, granularity: Exclude<CalendarGranularity, 'day'>, current?: CalendarDate) {
  if (granularity === 'month') {
    return date.set({ month: 1, day: 1 });
  }

  // Ja numa pagina, o ano que sai dela vira a pagina inteira, sem realinhar a decada.
  if (current) {
    const pages = Math.floor((date.year - current.year) / 12);

    return current.add({ years: pages * 12 });
  }

  return new CalendarDate(yearPageStart(date.year), 1, 1);
}

/** Os doze periodos da pagina, em quatro linhas de tres. */
export function buildPeriods(
  page: CalendarDate,
  granularity: Exclude<CalendarGranularity, 'day'>,
  limits: CalendarLimits = {},
): CalendarPeriod[][] {
  const rows: CalendarPeriod[][] = [];

  for (let row = 0; row < 4; row += 1) {
    const periods: CalendarPeriod[] = [];

    for (let column = 0; column < 3; column += 1) {
      const offset = row * 3 + column;
      const date = granularity === 'month' ? page.add({ months: offset }) : page.add({ years: offset });
      const excluded = limits.isDateUnavailable?.(date) ?? false;

      periods.push({ date, excluded, unavailable: excluded || isOutOfRange(date, limits, granularity) });
    }

    rows.push(periods);
  }

  return rows;
}

/** Traz o periodo de volta para a faixa: o mais perto e o que contem `min` ou `max`. */
export function clampPeriod(date: CalendarDate, granularity: CalendarGranularity, { max, min }: CalendarLimits) {
  if (min && endOfPeriod(date, granularity).compare(min) < 0) {
    return startOfPeriod(min, granularity);
  }

  if (max && startOfPeriod(date, granularity).compare(max) > 0) {
    return startOfPeriod(max, granularity);
  }

  return date;
}

/**
 * Teclado da grade de periodos: as setas para os lados andam um, para cima e para baixo, tres (uma linha), e
 * Home e End vao ao comeco e ao fim da linha. Passar da borda segue para o ano ou a pagina vizinha.
 */
export function movePeriodFocus(
  date: CalendarDate,
  key: string,
  granularity: Exclude<CalendarGranularity, 'day'>,
  page: CalendarDate,
  limits: CalendarLimits,
) {
  const index = granularity === 'month' ? date.month - 1 : date.year - page.year;
  const steps: Record<string, number> = {
    ArrowDown: 3,
    ArrowLeft: -1,
    ArrowRight: 1,
    ArrowUp: -3,
    End: 2 - (index % 3),
    Home: -(index % 3),
  };

  if (!(key in steps)) {
    return undefined;
  }

  const moved = granularity === 'month' ? date.add({ months: steps[key] }) : date.add({ years: steps[key] });

  return clampPeriod(moved, granularity, limits);
}

export function sameDay(a: CalendarDate | undefined, b: CalendarDate | undefined) {
  return Boolean(a && b && isSameDay(a, b));
}

/** Anda periodos inteiros: dias, meses ou anos. */
export function shiftPeriod(date: CalendarDate, granularity: CalendarGranularity, amount: number) {
  if (granularity === 'month') {
    return date.add({ months: amount });
  }

  return granularity === 'year' ? date.add({ years: amount }) : date.add({ days: amount });
}
