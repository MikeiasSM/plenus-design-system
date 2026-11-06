import type { ReactNode } from 'react';
import { IconTrendDown, IconTrendUp } from '../../icons';
import { formatNumber } from '../../../utils/formatters';
import { comparisonTone, type CardMetricComparison } from './comparisonTone';
import { isTextCell, resolveTrendLine, trendCells, type CardMetricTrendPart, type TrendMaskLine } from './trendMask';
import styles from './CardMetricTrend.module.css';

export type CardMetricTrendLayout = 'stack' | 'table';

interface PartOptions {
  formatPercent: (ratio: number) => string;
  iconSize: number;
  tonedParts: readonly CardMetricTrendPart[];
}

const TONE_CLASS = { danger: styles.danger, neutral: '', success: styles.success } as const;

export const knownChange = (comparison: CardMetricComparison) => Number.isFinite(comparison.change);

export function signedValue(value: number, format: (value: number) => string = formatNumber) {
  return (value > 0 ? '+' : '') + format(value);
}

/** O que cada parte mostra numa comparacao; `null` quando ela nao existe ali, como a diferenca nao informada. */
function partContent(part: CardMetricTrendPart, comparison: CardMetricComparison, { formatPercent, iconSize }: PartOptions): ReactNode {
  const change = comparison.change as number;

  switch (part) {
    case 'change':
      return knownChange(comparison) ? (change > 0 ? '+' : '') + formatPercent(change) : '—';
    case 'magnitude':
      return knownChange(comparison) ? formatPercent(Math.abs(change)) : '—';
    case 'icon': {
      const { direction } = comparisonTone(comparison);
      const Trend = direction === 'up' ? IconTrendUp : direction === 'down' ? IconTrendDown : null;
      return Trend && <Trend aria-hidden="true" size={iconSize} />;
    }
    case 'label':
      return comparison.label;
    case 'value':
      return comparison.value === undefined ? null : signedValue(comparison.value, comparison.formatValue);
    case 'description':
      return comparison.description || null;
  }
}

const segmentsOf = (line: TrendMaskLine, comparison: CardMetricComparison, options: PartOptions) =>
  resolveTrendLine(line, (part) => partContent(part, comparison, options) !== null);

/** Uma linha da mascara desenhada para uma comparacao. */
export function TrendLine({ comparison, line, options }: { comparison: CardMetricComparison; line: TrendMaskLine; options: PartOptions }) {
  const { tone } = comparisonTone(comparison);

  return segmentsOf(line, comparison, options).map((segment, index) =>
    segment.kind === 'text' ? (
      <span className={styles.separator} key={index}>
        {segment.text}
      </span>
    ) : (
      <span
        className={[styles[segment.part], options.tonedParts.includes(segment.part) && TONE_CLASS[tone]].filter(Boolean).join(' ')}
        key={index}
      >
        {partContent(segment.part, comparison, options)}
      </span>
    ),
  );
}

interface TrendComparisonsProps {
  comparisons: readonly CardMetricComparison[];
  layout: CardMetricTrendLayout;
  lines: readonly TrendMaskLine[];
  options: PartOptions;
}

/** O corpo do balao. Em bloco, cada linha flui; em tabela, a primeira linha vira colunas alinhadas entre as comparacoes. */
export function TrendComparisons({ comparisons, layout, lines, options }: TrendComparisonsProps) {
  const lineOf = (comparison: CardMetricComparison, line: TrendMaskLine) => (
    <TrendLine comparison={comparison} line={line} options={options} />
  );

  if (layout === 'stack') {
    return (
      <div className={styles.stack}>
        {comparisons.map((comparison, index) => (
          <div className={styles.comparison} key={index}>
            {lines
              .filter((line) => segmentsOf(line, comparison, options).length > 0)
              .map((line, order) => (
                <span className={order === 0 ? styles.lead : styles.line} key={order}>
                  {lineOf(comparison, line)}
                </span>
              ))}
          </div>
        ))}
      </div>
    );
  }

  const [first = [], ...rest] = lines;
  const cells = trendCells(first);

  return (
    <div className={styles.table} style={{ gridTemplateColumns: cells.map((cell) => (isTextCell(cell) ? 'minmax(0, 1fr)' : 'auto')).join(' ') }}>
      {comparisons.map((comparison, index) => [
        index > 0 && <span aria-hidden="true" className={styles.rowDivider} key={`divisor-${index}`} />,
        ...cells.map((cell, column) => (
          <span className={isTextCell(cell) ? styles.textCell : styles.numberCell} key={`${index}-${column}`}>
            {lineOf(comparison, cell)}
          </span>
        )),
        ...rest
          .filter((line) => segmentsOf(line, comparison, options).length > 0)
          .map((line, order) => (
            <span className={styles.tableLine} key={`${index}-linha-${order}`}>
              {lineOf(comparison, line)}
            </span>
          )),
      ])}
    </div>
  );
}
