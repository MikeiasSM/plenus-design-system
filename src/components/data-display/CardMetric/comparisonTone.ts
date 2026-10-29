export type CardMetricPolarity = 'higherIsBetter' | 'lowerIsBetter' | 'neutral';
export type CardMetricDirection = 'up' | 'down' | 'flat';
export type CardMetricTone = 'success' | 'danger' | 'neutral';

export interface CardMetricComparison {
  label: string;
  /** Fracao, a unidade do `formatPercent`: 0.124 e 12,4%. */
  change?: number;
  /** Diferenca absoluta, mostrada no balao. */
  value?: number;
  formatValue?: (value: number) => string;
  polarity?: CardMetricPolarity;
  /** Forca a cor. */
  tone?: CardMetricTone;
  /** Forca a seta. */
  direction?: CardMetricDirection;
}

/** A seta segue o sinal; a cor segue o sinal e a polaridade. `tone` e `direction` vencem o calculo. */
export function comparisonTone({ change = 0, direction, polarity = 'higherIsBetter', tone }: CardMetricComparison) {
  const arrow: CardMetricDirection = direction ?? (change > 0 ? 'up' : change < 0 ? 'down' : 'flat');

  if (tone) {
    return { direction: arrow, tone };
  }

  if (polarity === 'neutral' || arrow === 'flat') {
    return { direction: arrow, tone: 'neutral' as const };
  }

  const better = (arrow === 'up') === (polarity === 'higherIsBetter');

  return { direction: arrow, tone: better ? ('success' as const) : ('danger' as const) };
}
