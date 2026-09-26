import { CalendarDate } from '@internationalized/date';

/** Data ja separada por barra, traco ou ponto, com ou sem zero a esquerda. */
const DATA_DELIMITADA = /^\s*(\d{1,4})[/\-.](\d{1,2})[/\-.](\d{1,4})\s*$/;

/**
 * Digitos de uma data colada. Sem isto, `1/3/2026` perdia os separadores e
 * virava `13/20/26`: a mascara nao sabe onde cada parte comeca quando falta o
 * zero a esquerda. ISO, com o ano na frente, e reordenado.
 */
function digitosDeDataColada(valor: string) {
  const partes = valor.match(DATA_DELIMITADA);

  if (!partes) {
    return undefined;
  }

  const [, primeira, meio, ultima] = partes;
  const [dia, mes, ano] = primeira.length === 4 ? [ultima, meio, primeira] : [primeira, meio, ultima];

  if (ano.length !== 4) {
    return undefined;
  }

  return dia.padStart(2, '0') + mes.padStart(2, '0') + ano;
}

/** Aplica a mascara dia/mes/ano conforme o usuario digita. */
export function formatarEntradaData(valor: string) {
  const digitos = (digitosDeDataColada(valor) ?? valor.replace(/\D/g, '')).slice(0, 8);

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
