import { useEffect, useMemo, type ComponentPropsWithRef } from 'react';
import { ChartTooltip } from '../../charts/ChartTooltip';
import { formatPercent as formatRatio } from '../../../utils/formatters';
import { isDevelopment } from '../../../utils/isDevelopment';
import { Badge } from '../Badge';
import { comparisonTone, type CardMetricComparison } from './comparisonTone';
import { knownChange, signedValue, TrendComparisons, TrendLine, type CardMetricTrendLayout } from './CardMetricTrendParts';
import { parseTrendMask, unknownTrendParts, type CardMetricTrendPart } from './trendMask';
import { useAnchoredTooltip } from './useAnchoredTooltip';
import { useCardMetric } from './CardMetricContext';
import styles from './CardMetricTrend.module.css';

export interface CardMetricTrendProps extends Omit<ComponentPropsWithRef<'button'>, 'children'> {
  /** Mascara do selo, que mostra a primeira comparação. `{icon}{magnitude}` por padrão. */
  badgeMask?: string;
  /** O selo mostra a primeira; o balão, todas. */
  comparisons: readonly CardMetricComparison[];
  formatPercent?: (ratio: number) => string;
  /** Arranjo do balão: `stack` faz cada linha da mascara fluir; `table` alinha a primeira linha em colunas. */
  layout?: CardMetricTrendLayout;
  /** Partes de cada comparação no balão, uma linha da comparação por linha do texto. O padrão depende do `layout`. */
  mask?: string;
  /** Partes pintadas no tom da comparação. Variação, ícone e rótulo por padrão. */
  tonedParts?: readonly CardMetricTrendPart[];
  /** Largura maxima do balão, em pixels. 360 por padrão. */
  tooltipMaxWidth?: number;
}

const DEFAULT_MASK: Record<CardMetricTrendLayout, string> = {
  stack: '{change}{icon} {label}\n{value} · {description}',
  table: '{label} {value} {icon}{change}\n{description}',
};
const DEFAULT_TONED_PARTS: readonly CardMetricTrendPart[] = ['change', 'icon', 'label'];

const WORD = { down: 'Queda', flat: 'Estável', up: 'Alta' } as const;
const MEANING = { danger: ', desfavorável', neutral: '', success: ', favorável' } as const;

const percentWithDecimal = (ratio: number) => formatRatio(ratio, { decimals: 1 });

export function CardMetricTrend({
  badgeMask = '{icon}{magnitude}',
  className,
  comparisons,
  formatPercent = percentWithDecimal,
  layout = 'stack',
  mask = DEFAULT_MASK[layout],
  onBlur,
  onClick,
  onFocus,
  onKeyDown,
  tonedParts = DEFAULT_TONED_PARTS,
  tooltipMaxWidth,
  ...props
}: CardMetricTrendProps) {
  const { error, loading } = useCardMetric('CardMetric.Trend');
  const tooltip = useAnchoredTooltip();
  const lines = useMemo(() => parseTrendMask(mask), [mask]);
  const badgeLines = useMemo(() => parseTrendMask(badgeMask), [badgeMask]);

  useEffect(() => {
    const unknown = unknownTrendParts([...lines, ...badgeLines]);

    if (unknown.length > 0 && isDevelopment()) {
      console.warn(`CardMetric.Trend: a máscara cita partes que não existem (${unknown.map((part) => `{${part}}`).join(', ')}) e elas ficam de fora.`);
    }
  }, [badgeLines, lines]);

  const [first] = comparisons;

  if (loading || error || !first) {
    return null;
  }

  // A mascara e só visual: o nome acessível e a frase completa, na mesma ordem, com todas as partes.
  const phrase = (comparison: CardMetricComparison) => {
    const { direction, tone } = comparisonTone(comparison);
    const change = knownChange(comparison)
      ? `${WORD[direction]} de ${formatPercent(Math.abs(comparison.change as number))}`
      : 'Sem variação calculada';
    const difference = comparison.value === undefined ? '' : ` (${signedValue(comparison.value, comparison.formatValue)})`;
    const description = comparison.description ? `. ${comparison.description}` : '';

    return `${change}${difference}${MEANING[tone]}, ${comparison.label}${description}`;
  };
  const options = { formatPercent, iconSize: 12, tonedParts };

  return (
    <ChartTooltip
      anchor={tooltip.anchor}
      content={<TrendComparisons comparisons={comparisons} layout={layout} lines={lines} options={options} />}
      maxWidth={tooltipMaxWidth}
      title="Comparações"
    >
      <button
        {...props}
        {...tooltip.triggerProps({ onBlur, onClick, onFocus, onKeyDown })}
        aria-label={`Tendência: ${comparisons.map(phrase).join('; ')}`}
        className={[styles.trend, className].filter(Boolean).join(' ')}
        type="button"
      >
        <Badge tone={comparisonTone(first).tone}>
          {badgeLines.map((line, index) => (
            <TrendLine comparison={first} key={index} line={line} options={{ ...options, tonedParts: [] }} />
          ))}
        </Badge>
      </button>
    </ChartTooltip>
  );
}
