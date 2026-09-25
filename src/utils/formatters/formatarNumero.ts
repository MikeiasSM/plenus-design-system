export interface OpcoesDeNumero {
  /** Sem declarar, quem decide e a localidade — e, na moeda, a propria moeda. */
  casasDecimais?: number;
  compacto?: boolean;
  localidade?: string;
}

export interface OpcoesDeMoeda extends OpcoesDeNumero {
  moeda?: string;
}

export interface OpcoesDePercentual {
  casasDecimais?: number;
  localidade?: string;
}

function casas(casasDecimais?: number) {
  return casasDecimais === undefined
    ? {}
    : { maximumFractionDigits: casasDecimais, minimumFractionDigits: casasDecimais };
}

/**
 * A forma compacta sai da localidade, e nao de um sufixo proprio: em pt-BR um
 * milhao e `1 mi`, nao `1M`. Inventar o sufixo quebraria em qualquer outra.
 */
function notacao(compacto?: boolean) {
  return compacto ? ({ compactDisplay: 'short', notation: 'compact' } as const) : {};
}

export function formatarNumero(
  valor: number,
  { casasDecimais, compacto, localidade = 'pt-BR' }: OpcoesDeNumero = {},
) {
  if (!Number.isFinite(valor)) {
    return '';
  }

  return new Intl.NumberFormat(localidade, { ...notacao(compacto), ...casas(casasDecimais) }).format(valor);
}

/**
 * Valor monetario. O separador entre simbolo e numero e um espaco nao
 * separavel, escolha do `Intl`: ele impede que a quebra de linha afaste o
 * simbolo do valor. As mascaras de entrada usam espaco comum, e a convergencia
 * das duas ainda esta em aberto.
 */
export function formatarMoeda(
  valor: number,
  { casasDecimais, compacto, localidade = 'pt-BR', moeda = 'BRL' }: OpcoesDeMoeda = {},
) {
  if (!Number.isFinite(valor)) {
    return '';
  }

  return new Intl.NumberFormat(localidade, {
    currency: moeda,
    style: 'currency',
    ...notacao(compacto),
    ...casas(casasDecimais),
  }).format(valor);
}

/**
 * Percentual a partir da **fracao**: `0.42` vira `42%`. Receber o numero ja
 * multiplicado obrigaria cada consumidor a dividir antes de exibir, e e a
 * fracao que sai de uma divisao de duas medidas.
 */
export function formatarPercentual(
  valor: number,
  { casasDecimais = 0, localidade = 'pt-BR' }: OpcoesDePercentual = {},
) {
  if (!Number.isFinite(valor)) {
    return '';
  }

  return new Intl.NumberFormat(localidade, { style: 'percent', ...casas(casasDecimais) }).format(valor);
}
