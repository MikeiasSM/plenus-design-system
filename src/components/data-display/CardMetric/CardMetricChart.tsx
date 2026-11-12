import type { ComponentPropsWithRef } from 'react';
import { ChartArea } from '../../charts/ChartArea';
import { useChartMetrics, type ChartMarkClick } from '../../charts/core';
import { ChartLine } from '../../charts/ChartLine';
import { Skeleton } from '../../feedback/Skeleton';
import { useCardMetric } from './CardMetricContext';
import styles from './CardMetricChart.module.css';

export interface CardMetricChartProps extends Omit<ComponentPropsWithRef<'div'>, 'children' | 'title'> {
  type?: 'area' | 'line';
  /** Nome do gráfico para o leitor de tela e título do balão. */
  title: string;
  categories: readonly string[];
  values: readonly (number | null)[];
  formatValue?: (value: number) => string;
  accent?: string;
  /** Balão no ponteiro. O clique no gráfico continua abrindo o cartão. */
  showTooltip?: boolean;
  /** Torna os pontos botões, com uma parada de Tab e setas; o clique no gráfico deixa de abrir o cartão. */
  onPointClick?: (point: ChartMarkClick) => void;
  /** Piso da altura, em pixels. Acima dele, o gráfico ocupa o que sobra no cartão. */
  minHeight?: number;
}

/**
 * Área ou linha sem eixos, grade, legenda nem pontos, no espaço que sobra do cartão. O desenho e o ChartArea ou o
 * ChartLine da lib; esta parte só mede o lugar e responde aos estados da moldura.
 */
export function CardMetricChart({
  accent,
  categories,
  className,
  formatValue,
  minHeight = 48,
  onPointClick,
  showTooltip = false,
  style,
  title,
  type = 'area',
  values,
  ...props
}: CardMetricChartProps) {
  const { error, loading, onActivate } = useCardMetric('CardMetric.Chart');
  const metrics = useChartMetrics();
  const interactive = showTooltip || onPointClick !== undefined;
  const Chart = type === 'line' ? ChartLine : ChartArea;

  if (error) {
    return null;
  }

  return (
    <div
      {...props}
      className={[styles.chart, interactive && styles.raised, className].filter(Boolean).join(' ')}
      onClick={showTooltip && !onPointClick ? onActivate : undefined}
      style={{ minHeight, ...style }}
    >
      <div className={styles.plot} ref={metrics.ref}>
        {loading ? (
          <Skeleton height="100%" shape="block" />
        ) : (
          metrics.height > 0 && (
            <Chart
              accent={accent}
              categories={categories}
              formatValue={formatValue}
              height={metrics.height}
              hideTitle
              includeZero={false}
              legend="none"
              onPointClick={onPointClick}
              series={[{ label: title, values }]}
              showDots="hidden"
              showGrid={false}
              showTableToggle={false}
              showTooltip={showTooltip}
              title={title}
              xAxis="hidden"
              yAxis="hidden"
            />
          )
        )}
      </div>
    </div>
  );
}
