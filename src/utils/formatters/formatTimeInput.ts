import { CalendarDateTime, Time } from '@internationalized/date';
import { parseDateInput } from './formatDateInput';
import { closePart, maskParts } from './maskParts';

/** A hora fecha com os dois digitos do minuto; `18:4` fixaria o valor no terceiro digito. */
const FULL_TIME = /^\d{1,2}:\d{2}$/;

const TIME_LIMITS = [2, 2];
const TIME_SEPARATORS = [':'];
const DATE_TIME_LIMITS = [2, 2, 4, 2, 2];
const DATE_TIME_SEPARATORS = ['/', '/', ' ', ':'];

/** Aplica a mascara hora:minuto conforme o usuario digita. */
export function formatTimeInput(value: string) {
  return maskParts(value, TIME_LIMITS, TIME_SEPARATORS);
}

export const closeTimeInput = (text: string, key: string) => closePart(text, key, TIME_LIMITS, TIME_SEPARATORS);

export function parseTimeInput(value: string) {
  if (!FULL_TIME.test(value)) {
    return undefined;
  }

  const [hour, minute] = value.split(':').map(Number);

  return hour > 23 || minute > 59 ? undefined : new Time(hour, minute);
}

/** Aplica a mascara dia/mes/ano hora:minuto conforme o usuario digita. */
export function formatDateTimeInput(value: string) {
  return maskParts(value, DATE_TIME_LIMITS, DATE_TIME_SEPARATORS);
}

export const closeDateTimeInput = (text: string, key: string) =>
  closePart(text, key, DATE_TIME_LIMITS, DATE_TIME_SEPARATORS);

export function parseDateTimeInput(value: string) {
  const [dateText, timeText = ''] = value.trim().split(/\s+/);
  const date = parseDateInput(dateText);

  if (!date) {
    return undefined;
  }

  // Sem hora nenhuma, meia-noite e o valor: a data sozinha e um instante legitimo.
  if (timeText === '') {
    return new CalendarDateTime(date.year, date.month, date.day, 0, 0);
  }

  // Hora pela metade ou impossivel nao tem valor; `25:99` viraria uma meia-noite que ninguem digitou.
  const time = parseTimeInput(timeText);

  return time && new CalendarDateTime(date.year, date.month, date.day, time.hour, time.minute);
}
