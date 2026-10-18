/**
 * `true` compacta na forma da localidade: em pt-BR, `500 mil` e `1,5 mi`. `'sigla'` usa as siglas
 * `k`, `M`, `B` e `T` — `500 k`, `1,5 M` —, com a virgula e o milhar da localidade.
 */
export type Compacto = boolean | 'sigla';

export interface OpcoesDeNumero {
  /** Sem declarar, quem decide e a localidade — e, na moeda, a propria moeda. */
  casasDecimais?: number;
  compacto?: Compacto;
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
 * A forma compacta padrao sai da localidade, e nao de um sufixo proprio: em pt-BR um
 * milhao e `1 mi`, nao `1M`. A sigla e outra escolha, pedida por nome.
 */
function notacao(compacto?: Compacto) {
  return compacto === true ? ({ compactDisplay: 'short', notation: 'compact' } as const) : {};
}

/** Da maior para a menor; abaixo de mil, o valor sai sem sigla. */
const SIGLAS = [
  [1e12, 'T'],
  [1e9, 'B'],
  [1e6, 'M'],
  [1e3, 'k'],
] as const;

type FormatarReduzido = (reduzido: number, digitos: Intl.NumberFormatOptions) => string;

/**
 * Valor reduzido a sigla. Sem casas declaradas, uma casa abaixo de 10 e nenhuma acima, como a forma
 * compacta da localidade; o que arredonda para mil da sigla sobe para a seguinte: `999.950` e `1 M`.
 */
function comSigla(valor: number, casasDecimais: number | undefined, formatarReduzido: FormatarReduzido) {
  let indice = SIGLAS.findIndex(([base]) => Math.abs(valor) >= base);

  for (;;) {
    const [base, sigla] = indice >= 0 ? SIGLAS[indice] : [1, ''];
    const reduzido = valor / base;
    const digitos = casasDecimais ?? (Math.abs(reduzido) < 10 ? 1 : 0);
    const arredondado = Math.round(Math.abs(reduzido) * 10 ** digitos) / 10 ** digitos;
    const maior = indice === -1 ? SIGLAS.length - 1 : indice - 1;

    if (arredondado < 1000 || maior < 0) {
      const texto = formatarReduzido(reduzido, { maximumFractionDigits: digitos, minimumFractionDigits: casasDecimais ?? 0 });
      return sigla ? `${texto} ${sigla}` : texto;
    }

    indice = maior;
  }
}

/** Sinal so no negativo de fato: `-0`, e o que arredonda para zero, saiam como `-0`. */
const SINAL = { signDisplay: 'negative' } as const;

export function formatarNumero(
  valor: number,
  { casasDecimais, compacto, localidade = 'pt-BR' }: OpcoesDeNumero = {},
) {
  if (!Number.isFinite(valor)) {
    return '';
  }

  if (compacto === 'sigla') {
    return comSigla(valor, casasDecimais, (reduzido, digitos) =>
      new Intl.NumberFormat(localidade, { ...SINAL, ...digitos }).format(reduzido),
    );
  }

  return new Intl.NumberFormat(localidade, { ...SINAL, ...notacao(compacto), ...casas(casasDecimais) }).format(valor);
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

  if (compacto === 'sigla') {
    return comSigla(valor, casasDecimais, (reduzido, digitos) =>
      new Intl.NumberFormat(localidade, { ...SINAL, currency: moeda, style: 'currency', ...digitos }).format(reduzido),
    );
  }

  return new Intl.NumberFormat(localidade, {
    ...SINAL,
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

  return new Intl.NumberFormat(localidade, { ...SINAL, style: 'percent', ...casas(casasDecimais) }).format(valor);
}
