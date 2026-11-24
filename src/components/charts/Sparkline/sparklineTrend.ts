import { numberFormat } from '../../../utils/formatters/intlCache';

/** Os textos do nome acessivel. `range` monta o trecho do primeiro ao ultimo valor, ja formatados. */
export interface SparklineLabels {
  down: string;
  empty: string;
  range: (first: string, last: string) => string;
  stable: string;
  up: string;
}

export type SparklineDirection = 'down' | 'stable' | 'up';

export interface SparklineTrend {
  direction: SparklineDirection;
  first: number;
  last: number;
  /** Variacao relativa ao primeiro valor. Fica de fora quando o primeiro e zero. */
  ratio?: number;
}

export const DEFAULT_SPARKLINE_LABELS: SparklineLabels = {
  down: 'cai',
  empty: 'sem dados',
  range: (first, last) => `de ${first} a ${last}`,
  stable: 'estável',
  up: 'sobe',
};

/** Compacto na forma da localidade, como "18,2 mil": a frase cabe num folego e o valor exato fica no cartao. */
export const DEFAULT_SPARKLINE_FORMAT: Intl.NumberFormatOptions = { maximumFractionDigits: 1, notation: 'compact' };

const PERCENT: Intl.NumberFormatOptions = { maximumFractionDigits: 0, style: 'percent' };

/**
 * Tendencia do primeiro ao ultimo valor valido. Uma variacao que arredonda para 0% conta como estavel, para a
 * frase nunca dizer "sobe 0%".
 */
export function sparklineTrend(data: readonly number[]): SparklineTrend | undefined {
  const validos = data.filter(Number.isFinite);

  if (validos.length === 0) {
    return undefined;
  }

  const first = validos[0];
  const last = validos[validos.length - 1];
  const change = last - first;
  const ratio = first === 0 ? undefined : change / Math.abs(first);
  const parado = ratio === undefined ? change === 0 : Math.round(Math.abs(ratio) * 100) === 0;

  return { direction: parado ? 'stable' : change > 0 ? 'up' : 'down', first, last, ratio };
}

export interface SparklineNameOptions {
  format?: Intl.NumberFormatOptions;
  label?: string;
  labels?: Partial<SparklineLabels>;
  locale?: string;
}

/**
 * Nome da imagem: o rotulo e a tendencia, como "Vendas nos ultimos 30 dias: sobe 12%, de 18,2 mil a 20,4 mil".
 * Com um valor so, nao ha tendencia, e o nome traz o valor.
 */
export function sparklineName(
  data: readonly number[],
  { format = DEFAULT_SPARKLINE_FORMAT, label, labels, locale = 'pt-BR' }: SparklineNameOptions = {},
) {
  const textos = { ...DEFAULT_SPARKLINE_LABELS, ...labels };
  const trend = sparklineTrend(data);
  const comRotulo = (frase: string) => (label ? `${label}: ${frase}` : frase);

  if (!trend) {
    return comRotulo(textos.empty);
  }

  const numero = numberFormat(locale, format);
  const primeiro = numero.format(trend.first);
  const ultimo = numero.format(trend.last);

  if (data.filter(Number.isFinite).length === 1) {
    return comRotulo(ultimo);
  }

  const faixa = textos.range(primeiro, ultimo);

  if (trend.direction === 'stable') {
    return comRotulo(`${textos.stable}, ${faixa}`);
  }

  const palavra = textos[trend.direction];
  const variacao = trend.ratio === undefined ? '' : ` ${numberFormat(locale, PERCENT).format(Math.abs(trend.ratio))}`;

  return comRotulo(`${palavra}${variacao}, ${faixa}`);
}
