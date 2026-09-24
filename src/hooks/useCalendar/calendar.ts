import {
  endOfMonth,
  getWeeksInMonth,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  type CalendarDate,
} from '@internationalized/date';

export interface CalendarLimits {
  isDateUnavailable?: (date: CalendarDate) => boolean;
  max?: CalendarDate;
  min?: CalendarDate;
}

export interface CalendarDay {
  date: CalendarDate;
  outside: boolean;
  unavailable: boolean;
}

export function isUnavailable(date: CalendarDate, { isDateUnavailable, max, min }: CalendarLimits) {
  if (min && date.compare(min) < 0) {
    return true;
  }

  if (max && date.compare(max) > 0) {
    return true;
  }

  return isDateUnavailable?.(date) ?? false;
}

export function buildMonth(anchor: CalendarDate, locale: string, limits: CalendarLimits = {}): CalendarDay[][] {
  const first = startOfMonth(anchor);
  const start = startOfWeek(first, locale);
  const weeks: CalendarDay[][] = [];

  for (let week = 0; week < getWeeksInMonth(anchor, locale); week += 1) {
    const days: CalendarDay[] = [];

    for (let day = 0; day < 7; day += 1) {
      const date = start.add({ days: week * 7 + day });

      days.push({
        date,
        outside: !isSameMonth(date, anchor),
        unavailable: isUnavailable(date, limits),
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

export function sameDay(a: CalendarDate | undefined, b: CalendarDate | undefined) {
  return Boolean(a && b && isSameDay(a, b));
}
