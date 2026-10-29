import { formatNumber } from '../../../utils/formatters';

/** Agregadores da linha de sumarização. A coluna escolhe um pelo id, ou traz o seu. */

export type DataGridAggregatorId = 'sum' | 'avg' | 'count' | 'min' | 'max';

export interface DataGridAggregator {
  /** Formato do resultado; sem ele, vale o do tipo da coluna. */
  format?: (value: unknown) => string;
  /** Vai ao servidor na consulta, para ele calcular o mesmo agregado. */
  id: string;
  label: string;
  /** Recebe os valores preenchidos da coluna, já sem os vazios. */
  aggregate: (values: readonly unknown[]) => unknown;
}

function numbers(values: readonly unknown[]) {
  return values.map(Number).filter(Number.isFinite);
}

/** O número vem antes da data: `Date.parse` leria "10" como um mês de 2001. */
function measureOf(value: unknown) {
  if (value instanceof Date) {
    return value.getTime();
  }

  const number = typeof value === 'number' ? value : Number(String(value).trim() || NaN);
  return Number.isNaN(number) ? Date.parse(String(value)) : number;
}

/** Mínimo e máximo comparam número ou data, e devolvem o valor original, que o tipo da coluna formata. */
function extreme(values: readonly unknown[], pick: (a: number, b: number) => boolean) {
  let best: { measure: number; value: unknown } | undefined;

  values.forEach((value) => {
    const measure = measureOf(value);
    if (Number.isFinite(measure) && (!best || pick(measure, best.measure))) {
      best = { measure, value };
    }
  });

  return best?.value;
}

export const dataGridAggregators: Record<DataGridAggregatorId, DataGridAggregator> = {
  sum: { id: 'sum', label: 'Soma', aggregate: (values) => numbers(values).reduce((sum, value) => sum + value, 0) },
  avg: {
    id: 'avg',
    label: 'Média',
    aggregate: (values) => {
      const valid = numbers(values);
      return valid.length === 0 ? undefined : valid.reduce((sum, value) => sum + value, 0) / valid.length;
    },
  },
  count: {
    id: 'count',
    label: 'Contagem',
    aggregate: (values) => values.length,
    format: (value) => formatNumber(Number(value)),
  },
  min: { id: 'min', label: 'Mínimo', aggregate: (values) => extreme(values, (a, b) => a < b) },
  max: { id: 'max', label: 'Máximo', aggregate: (values) => extreme(values, (a, b) => a > b) },
};

export function aggregatorOf(summary: DataGridAggregatorId | DataGridAggregator | undefined) {
  return typeof summary === 'string' ? dataGridAggregators[summary] : summary;
}
