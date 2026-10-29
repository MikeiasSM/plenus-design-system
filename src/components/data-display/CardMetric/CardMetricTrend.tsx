import type { ComponentPropsWithRef } from 'react';
import { ChartTooltip } from '../../charts/ChartTooltip';
import { IconArrowDown, IconArrowUp } from '../../icons';
import { formatNumber, formatPercent as formatRatio } from '../../../utils/formatters';
import { Badge } from '../Badge';
import { comparisonTone, type CardMetricComparison } from './comparisonTone';
import { useAnchoredTooltip } from './useAnchoredTooltip';
import { useCardMetric } from './CardMetricContext';
import styles from './CardMetricTrend.module.css';

export interface CardMetricTrendProps extends Omit<ComponentPropsWithRef<'button'>, 'children'> {
  /** O selo mostra a primeira; o balao, todas. */
  comparisons: readonly CardMetricComparison[];
  formatPercent?: (ratio: number) => string;
}

const WORD = { down: 'Queda', flat: 'Estável', up: 'Alta' } as const;
const MEANING = { danger: ', desfavorável', neutral: '', success: ', favorável' } as const;

const knownChange = (comparison: CardMetricComparison) => Number.isFinite(comparison.change);

const percentWithDecimal = (ratio: number) => formatRatio(ratio, { decimals: 1 });

export function CardMetricTrend({
  className,
  comparisons,
  formatPercent = percentWithDecimal,
  onBlur,
  onClick,
  onFocus,
  onKeyDown,
  ...props
}: CardMetricTrendProps) {
  const { error, loading } = useCardMetric('CardMetric.Trend');
  const tooltip = useAnchoredTooltip();
  const [first] = comparisons;

  if (loading || error || !first) {
    return null;
  }

  const { direction, tone } = comparisonTone(first);
  const magnitude = (comparison: CardMetricComparison) =>
    knownChange(comparison) ? formatPercent(Math.abs(comparison.change as number)) : '—';
  const signed = (ratio: number) => (ratio > 0 ? '+' : '') + formatPercent(ratio);
  const difference = (comparison: CardMetricComparison) =>
    comparison.value === undefined ? '' : ` (${signedValue(comparison.value, comparison.formatValue)})`;
  const phrase = (comparison: CardMetricComparison) => {
    const { direction: way, tone: sense } = comparisonTone(comparison);
    const change = knownChange(comparison) ? `${WORD[way]} de ${magnitude(comparison)}` : 'Sem variação calculada';
    return `${change}${difference(comparison)}${MEANING[sense]}, ${comparison.label}`;
  };
  const rows = comparisons.map((comparison) => ({
    label:
      comparison.value === undefined
        ? comparison.label
        : `${comparison.label} · ${signedValue(comparison.value, comparison.formatValue)}`,
    values: [knownChange(comparison) ? (comparison.change as number) : Number.NaN],
  }));
  const Arrow = direction === 'up' ? IconArrowUp : direction === 'down' ? IconArrowDown : null;

  return (
    <ChartTooltip anchor={tooltip.anchor} columns={[{ format: signed }]} computed="none" rows={rows} title="Comparações">
      <button
        {...props}
        {...tooltip.triggerProps({ onBlur, onClick, onFocus, onKeyDown })}
        aria-label={`Tendência: ${comparisons.map(phrase).join('; ')}`}
        className={[styles.trend, className].filter(Boolean).join(' ')}
        type="button"
      >
        <Badge tone={tone}>
          {Arrow && <Arrow aria-hidden="true" size={12} />}
          {magnitude(first)}
        </Badge>
      </button>
    </ChartTooltip>
  );
}

function signedValue(value: number, format: (value: number) => string = formatNumber) {
  return (value > 0 ? '+' : '') + format(value);
}
