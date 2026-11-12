import { CalendarDate, CalendarDateTime, Time } from '@internationalized/date';
import { parseDateInput } from './formatDateInput';
import { parseTimeInput } from './formatTimeInput';

const onlyDigits = (text: string) => text.replace(/\D/g, '');

export function keepInputChars(text: string, separators: string) {
  return [...text].filter((char) => (char >= '0' && char <= '9') || separators.includes(char)).join('');
}

const ISO_DATE = /^\s*\d{4}[/\-.]\d{1,2}[/\-.]\d{1,2}\s*$/;

export function keepDateChars(text: string) {
  return ISO_DATE.test(text) ? text : keepInputChars(text, '/');
}

function toDate(day: number, month: number, year: number) {
  if (month < 1 || month > 12 || day < 1 || year < 1000) {
    return undefined;
  }

  const date = new CalendarDate(year, month, day);

  return date.day === day && date.month === month ? date : undefined;
}

export function completeDateInput(text: string, reference: CalendarDate) {
  const whole = parseDateInput(text);

  if (whole) {
    return whole;
  }

  const digits = onlyDigits(text);
  const { month, year } = reference;

  switch (digits.length) {
    case 1:
    case 2:
      return toDate(Number(digits), month, year);
    case 3:
      return toDate(Number(digits.slice(0, 2)), Number(digits.slice(2)), year);
    case 4:
      return toDate(Number(digits.slice(0, 2)), Number(digits.slice(2)), year);
    case 6:
      return toDate(Number(digits.slice(0, 2)), Number(digits.slice(2, 4)), 2000 + Number(digits.slice(4)));
    case 8:
      return toDate(Number(digits.slice(0, 2)), Number(digits.slice(2, 4)), Number(digits.slice(4)));
    default:
      return undefined;
  }
}

export function completeTimeInput(text: string) {
  const whole = parseTimeInput(text);

  if (whole) {
    return whole;
  }

  const digits = onlyDigits(text);
  const hourLength = digits.length === 3 ? 1 : 2;

  if (digits.length < 1 || digits.length > 4) {
    return undefined;
  }

  const hour = Number(digits.slice(0, hourLength));
  const minute = Number(digits.slice(hourLength) || 0);

  return hour > 23 || minute > 59 ? undefined : new Time(hour, minute);
}

export function completeDateTimeInput(text: string, reference: CalendarDate) {
  const [dateText, timeText = ''] = text.trim().split(/\s+/);
  const date = completeDateInput(dateText, reference);

  if (!date) {
    return { invalid: 'date' as const };
  }

  const time = timeText === '' ? new Time(0, 0) : completeTimeInput(timeText);

  if (!time) {
    return { invalid: 'time' as const };
  }

  return { value: new CalendarDateTime(date.year, date.month, date.day, time.hour, time.minute) };
}
