import { CalendarDate } from '@internationalized/date';
import { mascararPartes } from './mascararPartes';

/** Data colada em ISO, com o ano na frente, que a mascara reordena. */
const DATA_ISO = /^\s*(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})\s*$/;

/** Aplica a mascara dia/mes/ano conforme o usuario digita. */
export function formatarEntradaData(valor: string) {
  const iso = valor.match(DATA_ISO);
  const texto = iso ? [iso[3].padStart(2, '0'), iso[2].padStart(2, '0'), iso[1]].join('/') : valor;

  return mascararPartes(texto, [2, 2, 4], ['/', '/']);
}

/** Le dia, mes e ano separados por barra, traco, ponto ou espaco. */
export function lerEntradaData(valor: string) {
  const partes = valor.trim().split(/[/\-.\s]+/).filter(Boolean);

  if (partes.length !== 3) {
    return undefined;
  }

  const [dia, mes, ano] = partes.map(Number);

  if (![dia, mes, ano].every(Number.isInteger) || ano < 1000 || mes < 1 || mes > 12 || dia < 1) {
    return undefined;
  }

  const data = new CalendarDate(ano, mes, dia);

  return data.day === dia && data.month === mes ? data : undefined;
}
