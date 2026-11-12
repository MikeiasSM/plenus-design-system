import type { ComponentPropsWithRef } from 'react';
import { ChartTooltip } from '../../charts/ChartTooltip';
import { measureLabel, useChartMetrics, type LabelFont } from '../../charts/core';
import { Skeleton } from '../../feedback/Skeleton';
import { formatNumber } from '../../../utils/formatters';
import { useAnchoredTooltip } from './useAnchoredTooltip';
import { useCardMetric } from './CardMetricContext';
import styles from './CardMetricValue.module.css';

export interface CardMetricValueProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  value: number | null;
  /** Rotulo acima do valor, como "Total em aberto". */
  label?: string;
  emptyValue?: string;
  /** O que aparece, que pode sair compacto. */
  formatValue?: (value: number) => string;
  /** Valor exato no balao e na impressao, como nos graficos. Com ela, o valor ganha balao. */
  formatTooltipValue?: (value: number) => string;
}

/** A medida da tela nao leva o peso 600 do valor, e o texto real sai um pouco mais largo. */
const FOLGA_DO_PESO = 0.92;

/** O maior degrau da escala oficial em que o valor cabe inteiro, como o centro do ChartDonut. */
function stepFor(text: string, font: LabelFont, width: number) {
  const steps = font.centerSteps;
  const familyOf = (display: boolean) => (display ? font.headingFamily : font.family);
  const fits = steps.find(
    (step) => measureLabel(text, { ...font, family: familyOf(step.display), size: step.size }) <= width * FOLGA_DO_PESO,
  );
  // Sem largura ainda, o maior: o valor nao nasce pequeno para crescer depois.
  const step = width <= 0 ? steps[0] : (fits ?? steps[steps.length - 1]);

  return { ...step, family: familyOf(step.display) };
}

export function CardMetricValue({
  className,
  emptyValue = '—',
  formatTooltipValue,
  formatValue = formatNumber,
  label,
  value,
  ...props
}: CardMetricValueProps) {
  const { error, loading } = useCardMetric('CardMetric.Value');
  const metrics = useChartMetrics();
  const tooltip = useAnchoredTooltip();
  const rootClass = [styles.valuePart, className].filter(Boolean).join(' ');
  const caption = label && <span className={styles.label}>{label}</span>;

  if (error) {
    return null;
  }

  if (loading) {
    return (
      <div {...props} className={rootClass}>
        {caption}
        <Skeleton height={36} width="60%" />
      </div>
    );
  }

  if (value === null) {
    return (
      <div {...props} className={rootClass}>
        {caption}
        <div className={styles.value}>
          <span aria-hidden="true">{emptyValue}</span>
          <span className={styles.visuallyHidden}>Sem valor</span>
        </div>
      </div>
    );
  }

  const shown = formatValue(value);
  const step = stepFor(shown, metrics.font, metrics.width);
  const size = { fontFamily: step.family, fontSize: step.size, lineHeight: `${step.lineHeight}px` };

  if (!formatTooltipValue) {
    return (
      <div {...props} className={rootClass}>
        {caption}
        <div className={styles.value} ref={metrics.ref} style={size}>
          {shown}
        </div>
      </div>
    );
  }

  const exact = formatTooltipValue(value);

  return (
    <div {...props} className={rootClass}>
      {caption}
      <div className={styles.value} ref={metrics.ref} style={size}>
        <ChartTooltip
          anchor={tooltip.anchor}
          computed="none"
          rows={[{ label: 'Valor exato', values: [value], format: formatTooltipValue }]}
        >
          <button
            {...tooltip.triggerProps()}
            aria-label={`${label ? `${label}: ` : ''}${shown}, valor exato ${exact}`}
            className={styles.valueButton}
            type="button"
          >
            {shown}
          </button>
        </ChartTooltip>
        <span aria-hidden="true" className={styles.printOnly}>
          {exact}
        </span>
      </div>
    </div>
  );
}
