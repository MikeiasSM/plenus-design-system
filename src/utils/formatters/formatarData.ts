export interface OpcoesDeData {
  localidade?: string;
  formato?: 'curto' | 'longo' | 'numerico';
}

export interface OpcoesDeHora {
  localidade?: string;
  segundos?: boolean;
}

const ESTILOS: Record<NonNullable<OpcoesDeData['formato']>, Intl.DateTimeFormatOptions> = {
  numerico: { day: '2-digit', month: '2-digit', year: 'numeric' },
  curto: { day: '2-digit', month: 'short', year: 'numeric' },
  longo: { day: '2-digit', month: 'long', year: 'numeric' },
};

/** Data sem hora, que precisa ser lida no fuso local. */
const DATA_SIMPLES = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Data sem hora entra pelo fuso local: lida como UTC, ela recua um dia em
 * qualquer fuso negativo. Qualquer outra cadeia — a comecar pelo que sai de
 * `toISOString()` — vai inteira para o `Date`, que sabe ler o deslocamento.
 */
function paraData(valor: Date | string) {
  if (valor instanceof Date) {
    return valor;
  }

  if (DATA_SIMPLES.test(valor)) {
    const [ano, mes, dia] = valor.split('-').map(Number);

    return new Date(ano, mes - 1, dia);
  }

  return new Date(valor);
}

export function formatarData(valor: Date | string, { localidade = 'pt-BR', formato = 'numerico' }: OpcoesDeData = {}) {
  const data = paraData(valor);

  if (Number.isNaN(data.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat(localidade, ESTILOS[formato]).format(data);
}

export function formatarHora(valor: Date | string, { localidade = 'pt-BR', segundos = false }: OpcoesDeHora = {}) {
  const data = typeof valor === 'string' && /^\d{2}:\d{2}/.test(valor) ? new Date(`1970-01-01T${valor}`) : paraData(valor);

  if (Number.isNaN(data.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat(localidade, {
    hour: '2-digit',
    minute: '2-digit',
    second: segundos ? '2-digit' : undefined,
    hourCycle: 'h23',
  }).format(data);
}
