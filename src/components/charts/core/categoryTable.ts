import type { ChartTableProps } from './ChartTable';

export interface CategoryTableSeries {
  label: string;
  values: readonly (number | null)[];
}

/** Uma linha por categoria e uma coluna por série, com o valor no formato da série. Valor inválido fica em branco. */
export function categoryTable(
  categories: readonly string[],
  series: readonly CategoryTableSeries[],
  format: (value: number, seriesIndex: number) => string,
): Pick<ChartTableProps, 'columns' | 'rows'> {
  return {
    columns: series.map((item) => item.label),
    rows: categories.map((category, column) => ({
      cells: series.map((item, row) => {
        const value = item.values[column];

        return typeof value === 'number' && Number.isFinite(value) ? format(value, row) : '';
      }),
      header: category,
      key: `${column}:${category}`,
    })),
  };
}
