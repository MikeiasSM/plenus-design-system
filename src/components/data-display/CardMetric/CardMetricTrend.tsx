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
  const magnitude = (comparison: CardMetricComparison) => formatPercent(Math.abs(comparison.change ?? 0));
  const signed = (ratio: number) => (ratio > 0 ? '+' : '') + formatPercent(ratio);
  const phrase = (comparison: CardMetricComparison) =>
    `${WORD[comparisonTone(comparison).direction]} de ${magnitude(comparison)}, ${comparison.label}`;
  const rows = comparisons.map((comparison) => ({
    label:
      comparison.value === undefined
        ? comparison.label
        : `${comparison.label} · ${signedValue(comparison.value, comparison.formatValue)}`,
    values: [comparison.change ?? 0],
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
