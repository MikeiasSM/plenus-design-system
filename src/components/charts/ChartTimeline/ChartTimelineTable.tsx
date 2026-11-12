import type { ChartTimelineSummary } from './ChartTimeline';
import styles from './ChartTimeline.module.css';

export interface TimelineTableEntry {
  color: string;
  duration: string;
  end: string;
  name: string;
  progress?: string;
  start: string;
}

export interface TimelineTableRow {
  description?: string;
  entries: readonly TimelineTableEntry[];
  key: string;
  label: string;
  summary?: ChartTimelineSummary;
}

interface ChartTimelineTableProps {
  emptyRowLabel: string;
  rows: readonly TimelineTableRow[];
  showProgress: boolean;
  title: string;
}

/** Leitura medida a medida do grafico: uma secao por linha, com o rotulo, a descricao e o resumo no cabecalho dela. */
export function ChartTimelineTable({ emptyRowLabel, rows, showProgress, title }: ChartTimelineTableProps) {
  const columns = showProgress ? 5 : 4;

  return (
    <div aria-label={`Tabela: ${title}`} className={styles.tableScroll} role="region" tabIndex={0}>
      <table className={styles.table}>
        <caption className={styles.visuallyHidden}>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Série</th>
            <th className={styles.numeric} scope="col">Início</th>
            <th className={styles.numeric} scope="col">Fim</th>
            <th className={styles.numeric} scope="col">Duração</th>
            {showProgress && <th className={styles.numeric} scope="col">Progresso</th>}
          </tr>
        </thead>
        {rows.map((row) => {
          const summary = row.summary && [row.summary.title, row.summary.subtitle].filter(Boolean).join(', ');
          const extra = [row.description, summary].filter(Boolean).join(' · ');

          return (
            <tbody key={row.key}>
              <tr>
                <th className={styles.tableRowHeader} colSpan={columns} scope="rowgroup">
                  {row.label}
                  {extra && <> <span className={styles.tableRowExtra}>{extra}</span></>}
                </th>
              </tr>
              {row.entries.map((entry, index) => (
                <tr key={index}>
                  <td>
                    <span aria-hidden="true" className={styles.tableSwatch} style={{ background: entry.color }} />
                    {entry.name}
                  </td>
                  <td className={styles.numeric}>{entry.start}</td>
                  <td className={styles.numeric}>{entry.end}</td>
                  <td className={styles.numeric}>{entry.duration}</td>
                  {showProgress && <td className={styles.numeric}>{entry.progress}</td>}
                </tr>
              ))}
              {row.entries.length === 0 && (
                <tr>
                  <td className={styles.tableEmpty} colSpan={columns}>
                    {emptyRowLabel}
                  </td>
                </tr>
              )}
            </tbody>
          );
        })}
      </table>
    </div>
  );
}
