import { CalendarDateTime, Time } from '@internationalized/date';
import { parseDateInput } from './formatDateInput';
import { maskParts } from './maskParts';

/** A hora fecha com os dois digitos do minuto; `18:4` fixaria o valor no terceiro digito. */
const FULL_TIME = /^\d{1,2}:\d{2}$/;

/** Aplica a mascara hora:minuto conforme o usuario digita. */
export function formatTimeInput(value: string) {
  return maskParts(value, [2, 2], [':']);
}

export function parseTimeInput(value: string) {
  if (!FULL_TIME.test(value)) {
    return undefined;
  }

  const [hour, minute] = value.split(':').map(Number);

  return hour > 23 || minute > 59 ? undefined : new Time(hour, minute);
}

/** Aplica a mascara dia/mes/ano hora:minuto conforme o usuario digita. */
export function formatDateTimeInput(value: string) {
  return maskParts(value, [2, 2, 4, 2, 2], ['/', '/', ' ', ':']);
}

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
