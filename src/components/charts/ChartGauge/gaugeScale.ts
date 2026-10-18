import { resolveSeriesColors } from '../palette';
import type { ChartGaugeSegment, ChartGaugeTarget } from './ChartGauge';

/** Folga da escala padrão acima da meta: mostra a superação sem achatar as faixas. */
const TARGET_HEADROOM = 1.2;
const DEFAULT_MAX = 100;
const DEFAULT_TICK_COUNT = 5;
const EPSILON = 1e-9;

export interface GaugeDomain {
  max: number;
  min: number;
}

export interface GaugeSegment {
  color: string;
  from: number;
  label?: string;
  to: number;
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function clampToDomain(value: number, { max, min }: GaugeDomain) {
  return Math.min(Math.max(value, min), max);
}

/** Meta que serve de base ao atingimento: só uma meta positiva divide. */
export function targetBase(target: ChartGaugeTarget | undefined) {
  return target && isNumber(target.value) && target.value > 0 ? target.value : null;
}

/** Sem `max` e com meta, a escala vai a 120% dela. Intervalo vazio ganha uma unidade, como nos eixos. */
export function gaugeDomain(min: number | undefined, max: number | undefined, target: ChartGaugeTarget | undefined) {
  const start = isNumber(min) ? min : 0;
  const base = targetBase(target);
  const end = isNumber(max) ? max : base !== null ? base * TARGET_HEADROOM : DEFAULT_MAX;

  return { max: end > start ? end : start + 1, min: start };
}

/**
 * Faixas em ordem crescente, cada uma do fim da anterior até o seu `to`, multiplicado por `unit` quando declarado em
 * fração da meta. Faixa com limite inválido, ou que não avança sobre a anterior, é ignorada.
 */
export function gaugeSegments(
  segments: readonly ChartGaugeSegment[],
  domain: GaugeDomain,
  { accent, unit }: { accent?: string; unit: number },
) {
  const colors = resolveSeriesColors(segments, { accent });
  const resolved: GaugeSegment[] = [];
  let from = domain.min;

  segments.forEach((segment, index) => {
    const to = Math.min(segment.to === undefined ? domain.max : segment.to * unit, domain.max);

    if (!(to > from)) {
      return;
    }

    resolved.push({ color: colors[index], from, label: segment.label, to });
    from = to;
  });

  return resolved;
}

export function segmentAt(segments: readonly GaugeSegment[], value: number) {
  return segments.find(
    (segment, index) =>
      value >= segment.from && (value < segment.to || (index === segments.length - 1 && value <= segment.to)),
  );
}

/** De onde o arco preenchido parte: o zero quando a escala o cruza; senão, o mínimo. */
export function gaugeOrigin(origin: number | undefined, domain: GaugeDomain) {
  if (isNumber(origin)) {
    return clampToDomain(origin, domain);
  }

  return domain.min < 0 && domain.max > 0 ? 0 : domain.min;
}

/**
 * Marcas principais. Em percentual da meta, a cada 50% dela (25% numa escala curta), com as pontas sempre incluídas;
 * senão, `tickCount` divisões iguais.
 */
export function majorTicks(domain: GaugeDomain, tickCount: number, percentBase: number | null) {
  if (percentBase === null) {
    const count = Math.max(1, Math.round(tickCount) || DEFAULT_TICK_COUNT);

    return Array.from({ length: count + 1 }, (_, index) => domain.min + (index * (domain.max - domain.min)) / count);
  }

  const low = domain.min / percentBase;
  const high = domain.max / percentBase;
  const step = high - low >= 1 ? 0.5 : 0.25;
  // O `|| 0` troca o -0 do arredondamento pelo zero.
  const first = Math.ceil(low / step - EPSILON) * step || 0;
  const ratios: number[] = [];

  for (let ratio = first; ratio <= high + EPSILON; ratio = first + ratios.length * step) {
    ratios.push(ratio);
  }

  if (ratios.length === 0 || Math.abs(ratios[0] - low) > EPSILON) {
    ratios.unshift(low);
  }

  if (Math.abs(ratios[ratios.length - 1] - high) > EPSILON) {
    ratios.push(high);
  }

  return ratios.map((ratio) => ratio * percentBase);
}

/** Ordem em que os rótulos da escala disputam espaço: as pontas, a meta e o resto. */
export function tickLabelPriority(ticks: readonly number[], target: number | null) {
  const last = ticks.length - 1;
  const atTarget =
    target === null ? -1 : ticks.findIndex((tick) => Math.abs(tick - target) < EPSILON * Math.max(1, Math.abs(target)));
  const first = atTarget > 0 && atTarget < last ? [0, last, atTarget] : [0, last];
  const rest = ticks.map((_, index) => index).filter((index) => index > 0 && index < last && index !== atTarget);

  return [...first, ...rest];
}
