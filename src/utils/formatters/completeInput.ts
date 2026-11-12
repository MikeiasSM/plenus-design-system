import { CalendarDate, CalendarDateTime, Time } from '@internationalized/date';
import { formatDateInput } from './formatDateInput';
import { parseTimeInput } from './formatTimeInput';

export function keepInputChars(text: string, separators: string) {
  return [...text].filter((char) => (char >= '0' && char <= '9') || separators.includes(char)).join('');
}

const ISO_DATE = /^\s*\d{4}[/\-.]\d{1,2}[/\-.]\d{1,2}\s*$/;

export function keepDateChars(text: string) {
  return ISO_DATE.test(text) ? formatDateInput(text) : keepInputChars(text, '/');
}

function toDate(day: number, month: number, year: number) {
  if (month < 1 || month > 12 || day < 1 || year < 1000) {
    return undefined;
  }

  const date = new CalendarDate(year, month, day);

  return date.day === day && date.month === month ? date : undefined;
}

export function completeDateInput(text: string, reference: CalendarDate) {
  const [day = '', month = '', year = ''] = formatDateInput(text).split('/');

  if (day === '' || (year !== '' && year.length !== 2 && year.length !== 4)) {
    return undefined;
  }

  return toDate(
    Number(day),
    month === '' ? reference.month : Number(month),
    year === '' ? reference.year : Number(year) + (year.length === 2 ? 2000 : 0),
  );
}

function toTime(hour: number, minute: number) {
  return hour > 23 || minute > 59 ? undefined : new Time(hour, minute);
}

export function completeTimeInput(text: string, closed = false) {
  const whole = parseTimeInput(text);

  if (whole) {
    return whole;
  }

  const [hourText, minuteText] = text.split(':');

  if (minuteText !== undefined && hourText !== '' && (closed || hourText.length < 2)) {
    return toTime(Number(hourText), Number(minuteText.padEnd(2, '0')));
  }

  const digits = text.replace(/\D/g, '');
  const hourLength = digits.length === 3 ? 1 : 2;

  if (digits.length < 1 || digits.length > 4) {
    return undefined;
  }

  return toTime(Number(digits.slice(0, hourLength)), Number(digits.slice(hourLength) || 0));
}

export function completeDateTimeInput(text: string, reference: CalendarDate, closed = false) {
  const [dateText, timeText = ''] = text.trim().split(/\s+/);
  const date = completeDateInput(dateText, reference);

  if (!date) {
    return { invalid: 'date' as const };
  }

  const time = timeText === '' ? new Time(0, 0) : completeTimeInput(timeText, closed);

  if (!time) {
    return { invalid: 'time' as const };
  }

  return { value: new CalendarDateTime(date.year, date.month, date.day, time.hour, time.minute) };
}
