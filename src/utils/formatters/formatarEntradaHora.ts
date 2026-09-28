import { CalendarDateTime, Time } from '@internationalized/date';
import { lerEntradaData } from './formatarEntradaData';
import { mascararPartes } from './mascararPartes';

/** A hora fecha com os dois digitos do minuto; `18:4` fixaria o valor no terceiro digito. */
const HORA_INTEIRA = /^\d{1,2}:\d{2}$/;

/** Aplica a mascara hora:minuto conforme o usuario digita. */
export function formatarEntradaHora(valor: string) {
  return mascararPartes(valor, [2, 2], [':']);
}

export function lerEntradaHora(valor: string) {
  if (!HORA_INTEIRA.test(valor)) {
    return undefined;
  }

  const [hora, minuto] = valor.split(':').map(Number);

  return hora > 23 || minuto > 59 ? undefined : new Time(hora, minuto);
}

/** Aplica a mascara dia/mes/ano hora:minuto conforme o usuario digita. */
export function formatarEntradaDataHora(valor: string) {
  return mascararPartes(valor, [2, 2, 4, 2, 2], ['/', '/', ' ', ':']);
}

export function lerEntradaDataHora(valor: string) {
  const [data, hora = ''] = valor.trim().split(/\s+/);
  const dia = lerEntradaData(data);

  if (!dia) {
    return undefined;
  }

  // Sem hora nenhuma, meia-noite e o valor: a data sozinha e um instante legitimo.
  if (hora === '') {
    return new CalendarDateTime(dia.year, dia.month, dia.day, 0, 0);
  }

  // Hora pela metade ou impossivel nao tem valor; `25:99` viraria uma meia-noite que ninguem digitou.
  const horario = lerEntradaHora(hora);

  return horario && new CalendarDateTime(dia.year, dia.month, dia.day, horario.hour, horario.minute);
}
