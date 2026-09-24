import { CalendarDate } from '@internationalized/date';

/** Aplica a mascara dia/mes/ano conforme o usuario digita. */
export function formatarEntradaData(valor: string) {
  const digitos = valor.replace(/\D/g, '').slice(0, 8);

  if (digitos.length <= 2) {
    return digitos;
  }

  if (digitos.length <= 4) {
    return digitos.slice(0, 2) + '/' + digitos.slice(2);
  }

  return digitos.slice(0, 2) + '/' + digitos.slice(2, 4) + '/' + digitos.slice(4);
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
