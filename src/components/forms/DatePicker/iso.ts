import { parseDate, parseDateTime, parseTime, type CalendarDateTime, type Time } from '@internationalized/date';

/** A API publica fala em texto ISO; o que nao e data valida conta como ausente, em vez de derrubar o componente. */
function ler<T>(texto: string | null | undefined, interpretar: (texto: string) => T) {
  if (!texto) {
    return undefined;
  }

  try {
    return interpretar(texto);
  } catch {
    return undefined;
  }
}

export const readIsoDate = (texto?: string | null) => ler(texto, parseDate);
export const readIsoTime = (texto?: string | null) => ler(texto, parseTime);
export const readIsoDateTime = (texto?: string | null) => ler(texto, parseDateTime);

/** Hora e data com hora saem sem segundos, que os seletores nao escolhem: `09:30` e `2026-03-09T09:30`. */
export const toIsoTime = (hora: Time) => hora.toString().slice(0, 5);
export const toIsoDateTime = (instante: CalendarDateTime) => instante.toString().slice(0, 16);
