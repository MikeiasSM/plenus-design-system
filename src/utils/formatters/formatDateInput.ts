import { CalendarDate } from '@internationalized/date';
import { closePart, maskParts } from './maskParts';

/** Data colada em ISO, com o ano na frente, que a mascara reordena. */
const ISO_DATE = /^\s*(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})\s*$/;

const DATE_LIMITS = [2, 2, 4];
const DATE_SEPARATORS = ['/', '/'];

/** Aplica a mascara dia/mes/ano conforme o usuario digita. */
export function formatDateInput(value: string) {
  const iso = value.match(ISO_DATE);
  const text = iso ? [iso[3].padStart(2, '0'), iso[2].padStart(2, '0'), iso[1]].join('/') : value;

  return maskParts(text, DATE_LIMITS, DATE_SEPARATORS);
}

export const closeDateInput = (text: string, key: string) => closePart(text, key, DATE_LIMITS, DATE_SEPARATORS);

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

/** Mes colado em ISO, `2026-06` ou `2026-06-01`, que a mascara reordena. */
const ISO_MONTH = /^\s*(\d{4})[/\-.](\d{1,2})(?:[/\-.]\d{1,2})?\s*$/;
/** Ano colado dentro de uma data ISO, `2026-06-01`. */
const ISO_YEAR = /^\s*(\d{4})[/\-.]\d{1,2}(?:[/\-.]\d{1,2})?\s*$/;

const MONTH_LIMITS = [2, 4];
const MONTH_SEPARATORS = ['/'];
const YEAR_LIMITS = [4];

/** Aplica a mascara mes/ano conforme o usuario digita. */
export function formatMonthInput(value: string) {
  const iso = value.match(ISO_MONTH);
  const text = iso ? [iso[2].padStart(2, '0'), iso[1]].join('/') : value;

  return maskParts(text, MONTH_LIMITS, MONTH_SEPARATORS);
}

export const closeMonthInput = (text: string, key: string) => closePart(text, key, MONTH_LIMITS, MONTH_SEPARATORS);

/** Le mes e ano inteiros, com o ano de 4 digitos, e devolve o primeiro dia do mes. */
export function parseMonthInput(value: string) {
  const parts = value.trim().split(/[/\-.\s]+/).filter(Boolean);

  if (parts.length !== 2 || parts[1].length !== 4) {
    return undefined;
  }

  const [month, year] = parts.map(Number);

  if (![month, year].every(Number.isInteger) || year < 1000 || month < 1 || month > 12) {
    return undefined;
  }

  return new CalendarDate(year, month, 1);
}

/** Aplica a mascara de ano, so os quatro digitos. */
export function formatYearInput(value: string) {
  const iso = value.match(ISO_YEAR);

  return maskParts(iso ? iso[1] : value, YEAR_LIMITS, []);
}

/** O ano e o unico grupo: nenhum separador o fecha. */
export const closeYearInput = (text: string, key: string) => closePart(text, key, YEAR_LIMITS, []);

/** Le o ano de 4 digitos e devolve o 1o de janeiro. */
export function parseYearInput(value: string) {
  const text = value.trim();

  if (!/^\d{4}$/.test(text) || Number(text) < 1000) {
    return undefined;
  }

  return new CalendarDate(Number(text), 1, 1);
}
