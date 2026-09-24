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

function paraData(valor: Date | string) {
  if (valor instanceof Date) {
    return valor;
  }

  const partes = valor.split('-').map(Number);

  return partes.length === 3 ? new Date(partes[0], partes[1] - 1, partes[2]) : new Date(valor);
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
    hour12: false,
  }).format(data);
}
