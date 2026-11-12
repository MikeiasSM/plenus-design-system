import styles from './Chart.module.css';

export interface ChartTableRow {
  cells: readonly string[];
  header: string;
  key: string;
}

export interface ChartTableProps {
  columns: readonly string[];
  /** Rótulo da coluna de cabecalhos de linha. Sem ele, o canto fica vazio, como numa matriz. */
  corner?: string;
  rows: readonly ChartTableRow[];
  title: string;
}

/** Leitura medida a medida de um gráfico: um cabeçalho por linha e um valor escrito em cada coluna. */
export function ChartTable({ columns, corner, rows, title }: ChartTableProps) {
  return (
    <div aria-label={`Tabela: ${title}`} className={styles.tableScroll} role="region" tabIndex={0}>
      <table className={styles.table}>
        <caption className={styles.visuallyHidden}>{title}</caption>
        <thead>
          <tr>
            {corner ? <th scope="col">{corner}</th> : <td />}
            {columns.map((column) => (
              <th className={styles.numeric} key={column} scope="col">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <th scope="row">{row.header}</th>
              {row.cells.map((cell, index) => (
                <td className={styles.numeric} key={columns[index] ?? index}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
