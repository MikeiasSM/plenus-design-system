import { useState, type ComponentPropsWithRef } from 'react';
import { ChartTooltip } from '../../charts/ChartTooltip';
import { groupSmallSlices, type ChartSlice } from '../../charts/core';
import { paletteOf, type ChartPalette } from '../../charts/palette';
import { Skeleton } from '../../feedback/Skeleton';
import { formatNumber, formatPercent as formatRatio } from '../../../utils/formatters';
import { useAnchoredTooltip } from './useAnchoredTooltip';
import { useCardMetric } from './CardMetricContext';
import styles from './CardMetricBar.module.css';

export interface CardMetricSegment {
  id?: string;
  label: string;
  value: number;
  /** Vence a paleta. */
  color?: string;
}

export interface CardMetricBarProps extends Omit<ComponentPropsWithRef<'div'>, 'children' | 'title'> {
  segments: readonly CardMetricSegment[];
  /** Nomeia a imagem e o balao, como nos graficos. */
  title: string;
  /** Linha de total do balao. Padrao: a soma com sinal. */
  total?: number;
  orientation?: 'horizontal' | 'vertical';
  /** Lista em rotacao ou `{ base }`, que gera os tons. */
  palette?: ChartPalette;
  /** `byValue` da a primeira cor ao maior segmento, como pede a paleta de tons. */
  paletteOrder?: 'byIndex' | 'byValue';
  /** Fracao abaixo da qual os segmentos positivos se reunem no balao; 0 desliga. */
  smallSegmentThreshold?: number;
  otherLabel?: string;
  showPercent?: boolean;
  formatValue?: (value: number) => string;
  formatPercent?: (ratio: number) => string;
  emptyMessage?: string;
}

const percentWithDecimals = (ratio: number) => formatRatio(ratio, { decimals: 2 });

function colorsOf(segments: readonly CardMetricSegment[], palette: ChartPalette, order: 'byIndex' | 'byValue') {
  const colors = paletteOf(palette, segments.length);

  if (order === 'byIndex') {
    return segments.map((segment, index) => segment.color ?? colors[index]);
  }

  const rank = segments
    .map((_, index) => index)
    .sort((a, b) => Math.abs(segments[b].value) - Math.abs(segments[a].value));

  return segments.map((segment, index) => segment.color ?? colors[rank.indexOf(index)]);
}

/**
 * Barra de composicao de um total. E uma imagem nomeada com uma parada de Tab, que abre o balao com a lista
 * inteira: os segmentos nao sao acionaveis, e por isso nao ha setas entre eles (COMPONENTS §7).
 */
export function CardMetricBar({
  className,
  emptyMessage = 'Sem dados',
  formatPercent = percentWithDecimals,
  formatValue = formatNumber,
  orientation = 'horizontal',
  otherLabel = 'Outros',
  palette = [],
  paletteOrder = 'byIndex',
  segments,
  showPercent = true,
  smallSegmentThreshold = 0.02,
  title,
  total,
  ...props
}: CardMetricBarProps) {
  const { error, loading } = useCardMetric('CardMetric.Bar');
  const tooltip = useAnchoredTooltip();
  const [hovered, setHovered] = useState<number | null>(null);
  const rootClass = [styles.bar, orientation === 'vertical' && styles.vertical, className].filter(Boolean).join(' ');
  const magnitude = segments.reduce((sum, segment) => sum + Math.abs(segment.value), 0);

  if (error) {
    return null;
  }

  if (loading) {
    return (
      <div {...props} className={rootClass} data-orientation={orientation}>
        <Skeleton className={styles.track} height="100%" width="100%" />
      </div>
    );
  }

  if (magnitude === 0) {
    return (
      <div {...props} className={rootClass} data-orientation={orientation}>
        <div aria-label={`${title}: sem dados`} className={`${styles.track} ${styles.empty}`} role="img" />
        {orientation === 'horizontal' && <p className={styles.emptyMessage}>{emptyMessage}</p>}
      </div>
    );
  }

  const colors = colorsOf(segments, palette, paletteOrder);
  const share = (value: number) => Math.abs(value) / magnitude;
  const signedTotal = total ?? segments.reduce((sum, segment) => sum + segment.value, 0);
  const describe = (segment: CardMetricSegment) =>
    [segment.label, formatValue(segment.value), showPercent && formatPercent(share(segment.value))].filter(Boolean).join(', ');

  // Negativo nao ocupa fatia de um total: so os positivos se reunem, e os negativos seguem a parte, no fim.
  const slices: ChartSlice[] = segments.map((segment, index) => ({ color: colors[index], label: segment.label, value: segment.value }));
  const grouped = groupSmallSlices(
    slices.filter((slice) => slice.value > 0),
    { label: otherLabel, threshold: smallSegmentThreshold },
  );
  const rows = [...grouped, ...slices.filter((slice) => slice.value <= 0)].map((slice) => {
    const members = slice.grouped ?? [slice];
    return {
      color: slice.grouped ? 'var(--pl-color-text-tertiary)' : slice.color,
      emphasis: hovered !== null && members.includes(slices[hovered]),
      label: slice.grouped ? `${slice.label} (${slice.grouped.length})` : slice.label,
      values: [slice.value],
    };
  });

  return (
    <div {...props} className={rootClass} data-orientation={orientation}>
      <ChartTooltip
        anchor={tooltip.anchor}
        columns={[{ format: formatValue, total: () => signedTotal }]}
        computed={showPercent ? { compute: share, format: formatPercent } : 'none'}
        rows={rows}
        showTotal
        title={title}
      >
        <div
          {...tooltip.triggerProps()}
          aria-label={`${title}: ${segments.map(describe).join('; ')}. Total ${formatValue(signedTotal)}`}
          className={styles.track}
          onPointerLeave={() => setHovered(null)}
          role="img"
          tabIndex={0}
        >
          {segments.map((segment, index) => (
            <span
              className={[styles.segment, segment.value < 0 && styles.negative].filter(Boolean).join(' ')}
              data-active={hovered === index || undefined}
              key={segment.id ?? index}
              onPointerEnter={() => setHovered(index)}
              style={{ color: colors[index], flexGrow: Math.abs(segment.value) }}
            />
          ))}
        </div>
      </ChartTooltip>
    </div>
  );
}
