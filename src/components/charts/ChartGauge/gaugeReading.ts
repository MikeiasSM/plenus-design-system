import { formatarNumero, formatarPercentual } from '../../../utils/formatters';
import type { ChartTooltipRow } from '../ChartTooltip';
import type { SeriesIntent } from '../palette';
import type { ChartGaugeDelta, ChartGaugeTarget } from './ChartGauge';
import { isNumber, type GaugeDomain, type GaugeSegment } from './gaugeScale';

/** Como o medidor lê o valor: no formato do consumidor ou contra a meta. */
export interface GaugeReading {
  /** Leitura contra a meta: a outra leitura no centro, a linha Atingido no balão e as duas no `aria-valuetext`. */
  againstTarget: boolean;
  /** Meta positiva, base do atingimento. */
  base: number | null;
  formatExact: (value: number) => string;
  formatValue: (value: number) => string;
  /** Centro, escala e intervalos em percentual da meta. */
  showsPercent: boolean;
}

export type CenterLine =
  | { kind: 'text'; text: string }
  | { glyph: string; kind: 'warn'; short: string; text: string }
  | { glyph: string; intent: SeriesIntent; kind: 'delta'; label?: string; text: string };

export interface GaugeCenter {
  lines: readonly CenterLine[];
  value?: string;
}

export type GaugeStatus = 'loading' | 'empty' | 'value';

export interface GaugeTooltip {
  rows: ChartTooltipRow[];
  subtitle?: string;
  title?: string;
}

/** Quem pede `percentOfTarget`, na exibição ou nas faixas, liga a leitura contra a meta; sem meta, vale o valor. */
export function gaugeReading(options: {
  base: number | null;
  formatTooltipValue?: (value: number) => string;
  formatValue: (value: number) => string;
  segmentUnit: string;
  valueDisplay: string;
}): GaugeReading {
  const { base, formatTooltipValue, formatValue, segmentUnit, valueDisplay } = options;

  return {
    againstTarget: base !== null && (valueDisplay === 'percentOfTarget' || segmentUnit === 'percentOfTarget'),
    base,
    formatExact: formatTooltipValue ?? formatValue,
    formatValue,
    showsPercent: base !== null && valueDisplay === 'percentOfTarget',
  };
}

export function formatAttainment(reading: GaugeReading, value: number) {
  return formatarPercentual(value / (reading.base ?? 1));
}

/** O número como a exibição escolhida o mostra. */
export function formatShown(reading: GaugeReading, value: number) {
  return reading.showsPercent ? formatAttainment(reading, value) : reading.formatValue(value);
}

/** A leitura que a exibição não escolheu, como "92% de R$ 2 mi" ou "R$ 1,84 mi de R$ 2 mi". */
export function otherReading(reading: GaugeReading, value: number, format: (value: number) => string) {
  const base = reading.base ?? 0;

  return reading.showsPercent
    ? `${format(value)} de ${format(base)}`
    : `${formatAttainment(reading, value)} de ${format(base)}`;
}

export function rangeText(reading: GaugeReading, segment: GaugeSegment) {
  return `${formatShown(reading, segment.from)} a ${formatShown(reading, segment.to)}`;
}

export function segmentName(segment: GaugeSegment) {
  return segment.label || 'Faixa';
}

/** O sinal é do componente; o `format` recebe o módulo da variação. */
export function deltaText(delta: ChartGaugeDelta) {
  const sign = delta.value > 0 ? '+' : delta.value < 0 ? '−' : '±';

  return sign + (delta.format ?? formatarNumero)(Math.abs(delta.value));
}

export function hasDelta(delta: ChartGaugeDelta | undefined): delta is ChartGaugeDelta {
  return delta !== undefined && isNumber(delta.value);
}

function deltaLine(delta: ChartGaugeDelta): CenterLine {
  const automatic = delta.value > 0 ? 'positive' : delta.value < 0 ? 'negative' : 'neutral';

  return {
    glyph: delta.value > 0 ? '▲' : delta.value < 0 ? '▼' : '●',
    intent: delta.intent ?? automatic,
    kind: 'delta',
    label: delta.label,
    text: deltaText(delta),
  };
}

export function gaugeCenter(options: {
  centerLabel?: string;
  compact: boolean;
  delta?: ChartGaugeDelta;
  domain: GaugeDomain;
  emptyMessage: string;
  reading: GaugeReading;
  showCenter: boolean;
  status: GaugeStatus;
  value: number;
}): GaugeCenter {
  const { centerLabel, compact, delta, domain, emptyMessage, reading, showCenter, status, value } = options;

  if (status === 'loading') {
    return { lines: [{ kind: 'text', text: 'Carregando…' }] };
  }

  if (status === 'empty') {
    return { lines: [{ kind: 'text', text: emptyMessage }], value: '—' };
  }

  if (!showCenter) {
    return { lines: [] };
  }

  const lines: CenterLine[] = [];
  const over = value > domain.max;

  if (over || value < domain.min) {
    const short = over ? 'acima' : 'abaixo';
    lines.push({ glyph: over ? '▲' : '▼', kind: 'warn', short, text: compact ? short : `${short} do ${over ? 'máximo' : 'mínimo'}` });
  }

  const label = centerLabel || (reading.againstTarget ? otherReading(reading, value, reading.formatValue) : '');

  // No compacto, o aviso de fora da escala vence o rótulo.
  if (label && !(compact && lines.length > 0)) {
    lines.push({ kind: 'text', text: label });
  }

  if (!compact && hasDelta(delta)) {
    lines.push(deltaLine(delta));
  }

  return { lines, value: formatShown(reading, value) };
}

/** A frase do `aria-valuetext`: o valor, o que excede a escala, a faixa, a meta e a variação. */
export function gaugeValueText(options: {
  delta?: ChartGaugeDelta;
  domain: GaugeDomain;
  reading: GaugeReading;
  segment?: GaugeSegment;
  target?: ChartGaugeTarget;
  value: number;
}) {
  const { delta, domain, reading, segment, target, value } = options;
  const { againstTarget, formatExact, formatValue, showsPercent } = reading;
  const parts = !againstTarget
    ? [formatValue(value)]
    : showsPercent
      ? [`${formatAttainment(reading, value)} da meta`, otherReading(reading, value, formatExact)]
      : [formatExact(value), `${formatAttainment(reading, value)} da meta de ${formatExact(reading.base ?? 0)}`];
  const limit = (bound: number) =>
    showsPercent ? formatShown(reading, bound) : againstTarget ? formatExact(bound) : formatValue(bound);

  if (value > domain.max) {
    parts.push(`acima do máximo de ${limit(domain.max)}`);
  }

  if (value < domain.min) {
    parts.push(`abaixo do mínimo de ${limit(domain.min)}`);
  }

  if (segment?.label) {
    parts.push(`faixa ${segment.label}`);
  }

  if (target && isNumber(target.value) && !againstTarget) {
    const name = target.label && target.label !== 'Meta' ? target.label : 'meta';
    parts.push(`${name} ${formatValue(target.value)}`);
  }

  if (hasDelta(delta)) {
    parts.push(`variação ${deltaText(delta)}${delta.label ? ` ${delta.label}` : ''}`);
  }

  return parts.join(', ');
}

function targetRow(target: ChartGaugeTarget | undefined): ChartTooltipRow[] {
  return target && isNumber(target.value) ? [{ label: target.label || 'Meta', values: [target.value] }] : [];
}

/** Balão do centro ou do arco sem faixas: a faixa do valor, o valor, a meta, o atingido e a variação. */
export function valueTooltip(options: {
  color: string;
  delta?: ChartGaugeDelta;
  domain: GaugeDomain;
  reading: GaugeReading;
  segment?: GaugeSegment;
  target?: ChartGaugeTarget;
  title: string;
  value: number;
}): GaugeTooltip {
  const { color, delta, domain, reading, segment, target, title, value } = options;
  const percent = reading.showsPercent;
  const rows: ChartTooltipRow[] = [
    { color, emphasis: !percent, label: 'Valor', values: [value] },
    ...targetRow(target),
  ];

  if (reading.againstTarget) {
    rows.push({
      color: percent ? color : undefined,
      emphasis: percent,
      format: formatarPercentual,
      label: 'Atingido',
      values: [value / (reading.base ?? 1)],
    });
  }

  if (hasDelta(delta)) {
    rows.push({ format: () => deltaText(delta), label: 'Variação', values: [delta.value] });
  }

  const subtitle =
    value > domain.max
      ? `Acima do máximo de ${formatShown(reading, domain.max)}`
      : value < domain.min
        ? `Abaixo do mínimo de ${formatShown(reading, domain.min)}`
        : segment
          ? `${segment.label ? `Faixa ${segment.label} · ` : 'Faixa '}${rangeText(reading, segment)}`
          : `Escala ${formatShown(reading, domain.min)} a ${formatShown(reading, domain.max)}`;

  return { rows, subtitle, title };
}

/** Balão de uma faixa: o intervalo dela, o valor atual e se ele está ali. */
export function segmentTooltip(options: {
  current?: GaugeSegment;
  reading: GaugeReading;
  segment: GaugeSegment;
  target?: ChartGaugeTarget;
  value: number;
}): GaugeTooltip {
  const { current, reading, segment, target, value } = options;
  const inside = current === segment;

  return {
    rows: [
      { color: inside ? segment.color : undefined, emphasis: inside, label: 'Valor atual', values: [value] },
      ...targetRow(target),
    ],
    subtitle: `${rangeText(reading, segment)}${inside ? ' · o valor está aqui' : ''}`,
    title: segmentName(segment),
  };
}
