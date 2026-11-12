import { bisectRight, extent, quantileSorted } from 'd3-array';
import { resolveSeriesColors, textColorOn, type SeriesAppearance } from '../palette';

export interface ChartColorCategory extends SeriesAppearance {
  id: string;
  label: string;
}

/** `color` troca o azul da rampa por outra cor, de que saem os sete tons: mais escuro é maior, nos dois temas. */
export type ChartColorScale =
  | { color?: string; domain?: readonly [number, number]; log?: boolean; type: 'sequential' }
  | { center?: number; domain?: readonly [number, number]; type: 'diverging' }
  | { color?: string; count?: number; method: 'quantile' | 'equalInterval'; type: 'classes' }
  | { color?: string; labels?: readonly string[]; thresholds: readonly number[]; type: 'classes' }
  | { categories: readonly ChartColorCategory[]; type: 'categorical' }
  | { type: 'none' };

export interface ColorDatum {
  category: string | null;
  value: number | null;
}

/** Uma faixa ou categoria da legenda, que liga e desliga as regioes dela pela chave. */
export interface ColorScaleEntry {
  color: string;
  key: string;
  label: string;
}

export interface ColorGradient {
  log: boolean;
  /** Posicao do valor na barra, de 0 a 1. */
  position: (value: number) => number;
  stops: readonly string[];
  ticks: readonly { position: number; value: number }[];
}

export interface ColorScale {
  entries: readonly ColorScaleEntry[];
  /** Cor da regiao; `undefined` quando ela fica sem dado. */
  fillOf: (datum: ColorDatum) => string | undefined;
  gradient?: ColorGradient;
  /** Chave da faixa ou da categoria da regiao, quando a legenda as controla. */
  keyOf: (datum: ColorDatum) => string | undefined;
  /** Nome da faixa ou da categoria, para o balao e a tabela. */
  labelOf: (datum: ColorDatum) => string | undefined;
  /** A cor mede um valor; na categorica e na nenhuma, ela so nomeia ou nao diz nada. */
  numeric: boolean;
  /** Cor do texto escrito sobre o preenchimento; `undefined` onde nenhuma cor fixa garante o contraste. */
  textColorOf: (datum: ColorDatum) => string | undefined;
}

export const SEQUENTIAL_TOKENS = [1, 2, 3, 4, 5, 6, 7].map((step) => `var(--pl-chart-sequential-${step})`);
export const DIVERGING_TOKENS = ['negative-3', 'negative-2', 'negative-1', 'center', 'positive-1', 'positive-2', 'positive-3'].map(
  (step) => `var(--pl-chart-diverging-${step})`,
);

/** Os sete tons a partir de uma cor: clareada até ela, depois escurecida. A mistura acompanha a cor, token ou não. */
export function rampFrom(color: string) {
  const lighter = [15, 32, 55, 78].map((share) => `color-mix(in oklab, ${color} ${share}%, white)`);
  const darker = [22, 42].map((share) => `color-mix(in oklab, ${color}, black ${share}%)`);

  return [...lighter, color, ...darker];
}

const NEUTRAL_FILL = 'var(--pl-color-surface-muted)';
const ON_DARK = 'var(--pl-chart-on-dark)';
const ON_LIGHT = 'var(--pl-chart-on-light)';
// Medido nos dois temas: do quinto passo em diante o branco passa de 4,5:1, e antes dele, o preto.
const FIRST_DARK_STEP = 4;

const textOnStep = (step: number) => (step >= FIRST_DARK_STEP ? ON_DARK : ON_LIGHT);
const SINGLE_VALUE_STEP = 4;
const DEFAULT_CLASS_COUNT = 5;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Cor na posicao da rampa de tokens; entre dois passos, a mistura deles, que segue o tema sozinha. */
export function rampColor(stops: readonly string[], position: number) {
  const scaled = clamp01(position) * (stops.length - 1);
  const index = Math.min(Math.floor(scaled), stops.length - 2);
  const share = Math.round((scaled - index) * 1000) / 10;

  if (share <= 0) {
    return stops[index];
  }

  if (share >= 100) {
    return stops[index + 1];
  }

  return `color-mix(in oklab, ${stops[index + 1]} ${share}%, ${stops[index]})`;
}

/** Passo da rampa de cada classe, espalhado do primeiro ao ultimo. */
function classSteps(count: number, singleStep = SINGLE_VALUE_STEP) {
  if (count === 1) {
    return [singleStep];
  }

  return Array.from({ length: count }, (_, index) => Math.round((index * 6) / (count - 1)));
}

function classLabels(thresholds: readonly number[], format: (value: number) => string) {
  return Array.from({ length: thresholds.length + 1 }, (_, index) => {
    if (index === 0) {
      return `Menos de ${format(thresholds[0])}`;
    }

    if (index === thresholds.length) {
      return `${format(thresholds[index - 1])} ou mais`;
    }

    return `${format(thresholds[index - 1])} a ${format(thresholds[index])}`;
  });
}

/** Limites das faixas calculadas. Com menos valores distintos que faixas, elas diminuem, em vez de sobrar vazias. */
export function classThresholds(
  method: 'quantile' | 'equalInterval',
  values: readonly number[],
  requested = DEFAULT_CLASS_COUNT,
) {
  const sorted = [...values].sort((a, b) => a - b);
  const distinct = new Set(sorted).size;
  const count = Math.min(Math.max(Math.round(requested), 2), SEQUENTIAL_TOKENS.length, distinct);
  const [low = 0, high = 0] = [sorted[0], sorted.at(-1)];
  const cuts = Array.from({ length: Math.max(count - 1, 0) }, (_, index) =>
    method === 'quantile' ? quantileSorted(sorted, (index + 1) / count)! : low + ((high - low) * (index + 1)) / count,
  );

  // O limite igual ao menor valor deixaria a primeira faixa vazia; repetido, deixaria a do meio.
  return [...new Set(cuts)].filter((cut) => cut > low);
}

function classScale(
  thresholds: readonly number[],
  labels: readonly string[],
  range: readonly [number, number],
  format: (value: number) => string,
  stops: readonly string[],
  singleStep?: number,
): ColorScale {
  const steps = classSteps(thresholds.length + 1, singleStep);
  const colors = steps.map((step) => stops[step]);
  const measured = stops === SEQUENTIAL_TOKENS;
  const [low, high] = range;
  const names =
    thresholds.length === 0
      ? [labels[0] ?? (low === high ? format(low) : `${format(low)} a ${format(high)}`)]
      : classLabels(thresholds, format).map((label, index) => labels[index] ?? label);
  const classOf = (value: number) => bisectRight(thresholds, value);

  return {
    entries: names.map((label, index) => ({ color: colors[index], key: String(index), label })),
    fillOf: ({ value }) => (value === null ? undefined : colors[classOf(value)]),
    keyOf: ({ value }) => (value === null ? undefined : String(classOf(value))),
    labelOf: ({ value }) => (value === null ? undefined : names[classOf(value)]),
    numeric: true,
    textColorOf: ({ value }) => (value === null || !measured ? undefined : textOnStep(steps[classOf(value)])),
  };
}

function continuousScale(stops: readonly string[], position: (value: number) => number, gradient: ColorGradient): ColorScale {
  return {
    entries: [],
    fillOf: ({ value }) => (value === null ? undefined : rampColor(stops, position(value))),
    gradient,
    keyOf: () => undefined,
    labelOf: () => undefined,
    numeric: true,
    textColorOf: () => undefined,
  };
}

function sequentialScale(
  config: Extract<ChartColorScale, { type: 'sequential' }>,
  values: readonly number[],
  stops: readonly string[],
): ColorScale {
  const [dataLow = 0, dataHigh = 0] = extent(values);
  const [low, high] = config.domain ?? [dataLow, dataHigh];
  // Na logaritmica, o que nao for positivo encosta no primeiro passo.
  const logLow = low > 0 ? low : values.reduce((least, value) => (value > 0 ? Math.min(least, value) : least), high);
  const position = config.log
    ? (value: number) =>
        value <= 0 || high <= logLow ? 0 : clamp01((Math.log(value) - Math.log(logLow)) / (Math.log(high) - Math.log(logLow)))
    : (value: number) => (high === low ? 1 : clamp01((value - low) / (high - low)));

  return continuousScale(stops, position, {
    log: config.log === true,
    position,
    stops,
    ticks: [
      { position: 0, value: config.log ? logLow : low },
      { position: 1, value: high },
    ],
  });
}

function divergingScale(
  config: Extract<ChartColorScale, { type: 'diverging' }>,
  values: readonly number[],
): ColorScale {
  const center = config.center ?? 0;
  const [low = center, high = center] = config.domain ?? extent(values);
  // O dominio e simetrico em torno do centro: a mesma distancia pinta a mesma intensidade dos dois lados.
  const reach = Math.max(Math.abs(low - center), Math.abs(high - center)) || 1;
  const position = (value: number) => clamp01((value - center) / reach / 2 + 0.5);

  return continuousScale(DIVERGING_TOKENS, position, {
    log: false,
    position,
    stops: DIVERGING_TOKENS,
    ticks: [
      { position: 0, value: center - reach },
      { position: 0.5, value: center },
      { position: 1, value: center + reach },
    ],
  });
}

function categoricalScale(categories: readonly ChartColorCategory[], accent?: string): ColorScale {
  const colors = resolveSeriesColors(categories, { accent });
  const byId = new Map(categories.map((category, index) => [category.id, { color: colors[index], label: category.label }]));

  return {
    entries: categories.map((category, index) => ({ color: colors[index], key: category.id, label: category.label })),
    fillOf: ({ category }) => (category === null ? undefined : byId.get(category)?.color),
    keyOf: ({ category }) => (category !== null && byId.has(category) ? category : undefined),
    labelOf: ({ category }) => (category === null ? undefined : byId.get(category)?.label),
    numeric: false,
    textColorOf: ({ category }) => {
      const color = category === null ? undefined : byId.get(category)?.color;
      return color === undefined ? undefined : textColorOn(color);
    },
  };
}

/**
 * Escala de cor das regioes, sobre os valores validos das regioes em jogo. As cores sao tokens, ou a mistura de dois
 * deles: a troca de tema repinta o mapa sem calculo algum.
 */
export function buildColorScale(
  config: ChartColorScale,
  values: readonly number[],
  format: (value: number) => string,
  accent?: string,
): ColorScale {
  if (config.type === 'none') {
    return {
      entries: [],
      fillOf: () => NEUTRAL_FILL,
      keyOf: () => undefined,
      labelOf: () => undefined,
      numeric: false,
      textColorOf: () => undefined,
    };
  }

  if (config.type === 'categorical') {
    return categoricalScale(config.categories, accent);
  }

  const stops = config.type !== 'diverging' && config.color ? rampFrom(config.color) : SEQUENTIAL_TOKENS;

  if (values.length === 0) {
    return {
      entries: [],
      fillOf: () => undefined,
      keyOf: () => undefined,
      labelOf: () => undefined,
      numeric: true,
      textColorOf: () => undefined,
    };
  }

  const [low = 0, high = 0] = extent(values);
  const fixedClasses = config.type === 'classes' && 'thresholds' in config;

  // Um valor so nao forma escala: uma cor e uma entrada na legenda. So zeros e ausencia de intensidade: o passo mais claro.
  if (low === high && config.type !== 'diverging' && !fixedClasses) {
    return classScale([], [], [low, high], format, stops, low === 0 ? 0 : undefined);
  }

  if (config.type === 'sequential') {
    return sequentialScale(config, values, stops);
  }

  if (config.type === 'diverging') {
    return divergingScale(config, values);
  }

  if ('thresholds' in config) {
    const thresholds = [...new Set(config.thresholds.filter(Number.isFinite))].sort((a, b) => a - b);
    return classScale(thresholds, config.labels ?? [], [low, high], format, stops);
  }

  return classScale(classThresholds(config.method, values, config.count), [], [low, high], format, stops);
}
