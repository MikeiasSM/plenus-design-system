import type { ChartHeatmapCell } from './ChartHeatmap';
import styles from './ChartHeatmap.module.css';

interface ChartHeatmapTableProps {
  columns: readonly string[];
  formatValue: (value: number) => string;
  grade: readonly (readonly (ChartHeatmapCell | undefined)[])[];
  noDataLabel: string;
  rows: readonly string[];
  title: string;
}

/** Leitura medida a medida da matriz: as mesmas linhas e colunas, com o valor escrito em cada cruzamento. */
export function ChartHeatmapTable({ columns, formatValue, grade, noDataLabel, rows, title }: ChartHeatmapTableProps) {
  return (
    <div aria-label={`Tabela: ${title}`} className={styles.tableScroll} role="region" tabIndex={0}>
      <table className={styles.table}>
        <caption className={styles.visuallyHidden}>{title}</caption>
        <thead>
          <tr>
            <td />
            {columns.map((column) => (
              <th className={styles.numeric} key={column} scope="col">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grade.map((linha, row) => (
            <tr key={rows[row]}>
              <th scope="row">{rows[row]}</th>
              {linha.map((cell, column) => (
                <td className={styles.numeric} key={columns[column]}>
                  {cell === undefined ? '' : cell.value === null ? noDataLabel : formatValue(cell.value)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
