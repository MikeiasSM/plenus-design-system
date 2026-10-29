import { numberFormat } from './intlCache';

/**
 * `true` compacta na forma da localidade: em pt-BR, `500 mil` e `1,5 mi`. `'symbol'` usa as siglas
 * `k`, `M`, `B` e `T` — `500 k`, `1,5 M` —, com a virgula e o milhar da localidade.
 */
export type CompactNotation = boolean | 'symbol';

export interface FormatNumberOptions {
  compact?: CompactNotation;
  /** Sem declarar, quem decide e a localidade — e, na moeda, a propria moeda. */
  decimals?: number;
  locale?: string;
}

export interface FormatCurrencyOptions extends FormatNumberOptions {
  currency?: string;
}

export interface FormatPercentOptions {
  decimals?: number;
  locale?: string;
}

function fractionDigits(decimals?: number) {
  return decimals === undefined ? {} : { maximumFractionDigits: decimals, minimumFractionDigits: decimals };
}

/**
 * A forma compacta padrao sai da localidade, e nao de um sufixo proprio: em pt-BR um
 * milhao e `1 mi`, nao `1M`. A sigla e outra escolha, pedida por nome.
 */
function notation(compact?: CompactNotation) {
  return compact === true ? ({ compactDisplay: 'short', notation: 'compact' } as const) : {};
}

/** Da maior para a menor; abaixo de mil, o valor sai sem sigla. */
const SYMBOLS = [
  [1e12, 'T'],
  [1e9, 'B'],
  [1e6, 'M'],
  [1e3, 'k'],
] as const;

type FormatReduced = (reduced: number, digits: Intl.NumberFormatOptions) => string;

/**
 * Valor reduzido a sigla. Sem casas declaradas, uma casa abaixo de 10 e nenhuma acima, como a forma
 * compacta da localidade; o que arredonda para mil da sigla sobe para a seguinte: `999.950` e `1 M`.
 */
function withSymbol(value: number, decimals: number | undefined, formatReduced: FormatReduced) {
  let index = SYMBOLS.findIndex(([base]) => Math.abs(value) >= base);

  for (;;) {
    const [base, symbol] = index >= 0 ? SYMBOLS[index] : [1, ''];
    const reduced = value / base;
    const digits = decimals ?? (Math.abs(reduced) < 10 ? 1 : 0);
    const rounded = Math.round(Math.abs(reduced) * 10 ** digits) / 10 ** digits;
    const larger = index === -1 ? SYMBOLS.length - 1 : index - 1;

    if (rounded < 1000 || larger < 0) {
      const text = formatReduced(reduced, { maximumFractionDigits: digits, minimumFractionDigits: decimals ?? 0 });
      return symbol ? `${text} ${symbol}` : text;
    }

    index = larger;
  }
}

/** Sinal so no negativo de fato: `-0`, e o que arredonda para zero, saiam como `-0`. */
const SIGN = { signDisplay: 'negative' } as const;

export function formatNumber(value: number, { compact, decimals, locale = 'pt-BR' }: FormatNumberOptions = {}) {
  if (!Number.isFinite(value)) {
    return '';
  }

  if (compact === 'symbol') {
    return withSymbol(value, decimals, (reduced, digits) =>
      numberFormat(locale, { ...SIGN, ...digits }).format(reduced),
    );
  }

  return numberFormat(locale, { ...SIGN, ...notation(compact), ...fractionDigits(decimals) }).format(value);
}

/**
 * Valor monetario. O separador entre simbolo e numero e um espaco nao
 * separavel, escolha do `Intl`: ele impede que a quebra de linha afaste o
 * simbolo do valor. As mascaras de entrada usam espaco comum, e a convergencia
 * das duas ainda esta em aberto.
 */
export function formatCurrency(
  value: number,
  { compact, currency = 'BRL', decimals, locale = 'pt-BR' }: FormatCurrencyOptions = {},
) {
  if (!Number.isFinite(value)) {
    return '';
  }

  if (compact === 'symbol') {
    return withSymbol(value, decimals, (reduced, digits) =>
      numberFormat(locale, { ...SIGN, currency, style: 'currency', ...digits }).format(reduced),
    );
  }

  return numberFormat(locale, {
    ...SIGN,
    currency,
    style: 'currency',
    ...notation(compact),
    ...fractionDigits(decimals),
  }).format(value);
}

/**
 * Percentual a partir da **fracao**: `0.42` vira `42%`. Receber o numero ja
 * multiplicado obrigaria cada consumidor a dividir antes de exibir, e e a
 * fracao que sai de uma divisao de duas medidas.
 */
export function formatPercent(value: number, { decimals = 0, locale = 'pt-BR' }: FormatPercentOptions = {}) {
  if (!Number.isFinite(value)) {
    return '';
  }

  return numberFormat(locale, { ...SIGN, style: 'percent', ...fractionDigits(decimals) }).format(value);
}
