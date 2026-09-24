import { useMemo, useState, type KeyboardEvent } from 'react';
import { getLocalTimeZone, startOfMonth, today, type CalendarDate } from '@internationalized/date';
import { buildMonth, clamp, isUnavailable, moveFocus, sameDay, type CalendarDay, type CalendarLimits } from './calendar';

export interface UseCalendarOptions extends CalendarLimits {
  locale?: string;
  onSelect?: (date: CalendarDate) => void;
  value?: CalendarDate;
}

export interface UseCalendarResult {
  focusedDate: CalendarDate;
  goToMonth: (offset: number) => void;
  handleKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  isSelected: (date: CalendarDate) => boolean;
  isToday: (date: CalendarDate) => boolean;
  select: (date: CalendarDate) => void;
  visibleMonth: CalendarDate;
  weeks: CalendarDay[][];
}

export function useCalendar({
  isDateUnavailable,
  locale = 'pt-BR',
  max,
  min,
  onSelect,
  value,
}: UseCalendarOptions = {}): UseCalendarResult {
  const limits: CalendarLimits = { isDateUnavailable, max, min };
  const hoje = useMemo(() => today(getLocalTimeZone()), []);
  const [focusedDate, setFocusedDate] = useState(() => clamp(value ?? hoje, limits));
  const anchor = value ?? focusedDate;
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(anchor));

  const weeks = useMemo(() => buildMonth(visibleMonth, locale, limits), [locale, visibleMonth, max, min, isDateUnavailable]);

  function focus(date: CalendarDate) {
    setFocusedDate(date);

    if (date.compare(startOfMonth(visibleMonth)) < 0 || date.compare(startOfMonth(visibleMonth).add({ months: 1 })) >= 0) {
      setVisibleMonth(startOfMonth(date));
    }
  }

  function select(date: CalendarDate) {
    if (isUnavailable(date, limits)) {
      return;
    }

    focus(date);
    onSelect?.(date);
  }

  return {
    focusedDate,
    goToMonth: (offset) => setVisibleMonth(startOfMonth(visibleMonth.add({ months: offset }))),
    handleKeyDown: (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        select(focusedDate);
        return;
      }

      const next = moveFocus(focusedDate, event.key, event.shiftKey, limits);

      if (next) {
        event.preventDefault();
        focus(next);
      }
    },
    isSelected: (date) => sameDay(date, value),
    isToday: (date) => sameDay(date, hoje),
    select,
    visibleMonth,
    weeks,
  };
}
