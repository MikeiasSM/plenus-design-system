import { CalendarDate } from '@internationalized/date';
import { maskParts } from './maskParts';

/** Data colada em ISO, com o ano na frente, que a mascara reordena. */
const ISO_DATE = /^\s*(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})\s*$/;

/** Aplica a mascara dia/mes/ano conforme o usuario digita. */
export function formatDateInput(value: string) {
  const iso = value.match(ISO_DATE);
  const text = iso ? [iso[3].padStart(2, '0'), iso[2].padStart(2, '0'), iso[1]].join('/') : value;

  return maskParts(text, [2, 2, 4], ['/', '/']);
}

/** Le dia, mes e ano separados por barra, traco, ponto ou espaco. */
export function parseDateInput(value: string) {
  const parts = value.trim().split(/[/\-.\s]+/).filter(Boolean);

  if (parts.length !== 3) {
    return undefined;
  }

  const [day, month, year] = parts.map(Number);

  if (![day, month, year].every(Number.isInteger) || year < 1000 || month < 1 || month > 12 || day < 1) {
    return undefined;
  }

  const date = new CalendarDate(year, month, day);

  return date.day === day && date.month === month ? date : undefined;
}
