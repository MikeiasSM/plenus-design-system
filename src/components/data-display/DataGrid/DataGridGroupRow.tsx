import { memo, type ReactNode } from 'react';
import { formatNumber } from '../../../utils/formatters';
import { IconChevronRight } from '../../icons';
import { columnAlign, summaryText } from './gridState';
import type { DataGridGroup } from './groupModel';
import { INDENT, type DataGridRowColumn } from './DataGridRow';
import { aggregatorOf } from './summaries';
import styles from './DataGrid.module.css';

interface DataGridGroupRowProps<Row> {
  ariaRowIndex: number;
  columns: readonly DataGridRowColumn<Row>[];
  depth: number;
  expanded: boolean;
  focusedColumnId: string | undefined;
  group: DataGridGroup<Row>;
  height: number;
  /** Nome da coluna do grupo, para o leitor de tela. */
  groupHeader: string;
  level: number;
  onCellFocus: (rowKey: string, columnId: string) => void;
  onToggle: (rowKey: string) => void;
  position: number;
  setSize: number;
  /** A grade tem seleção: o grupo só reserva o lugar da caixa. */
  selectable: boolean;
  top: number;
}

/** A linha do grupo: o valor e a quantidade na primeira coluna, e o agregado de cada coluna com `summary`. */
export const DataGridGroupRow = memo(function DataGridGroupRow<Row>({
  ariaRowIndex,
  columns,
  depth,
  expanded,
  focusedColumnId,
  group,
  groupHeader,
  height,
  level,
  onCellFocus,
  onToggle,
  position,
  selectable,
  setSize,
  top,
}: DataGridGroupRowProps<Row>) {
  const name = group.text || '(Vazio)';
  const count = `${formatNumber(group.rows.length)} ${group.rows.length === 1 ? 'linha' : 'linhas'}`;

  return (
    <div
      aria-expanded={expanded}
      aria-level={level}
      aria-posinset={position}
      aria-rowindex={ariaRowIndex}
      aria-setsize={setSize}
      className={[styles.row, styles.groupRow, styles.clickable].join(' ')}
      data-anchor=""
      role="row"
      style={{ height, transform: `translateY(${top}px)` }}
      onClick={(event) => {
        if (!(event.target as Element).closest('button')) {
          onToggle(group.key);
        }
      }}
    >
      {columns.map((column) => {
        const focused = focusedColumnId === column.id;
        const aggregator = aggregatorOf(column.summary);
        const text = aggregator ? summaryText(column, group.aggregates[column.id]) : '';
        let content: ReactNode = null;

        if (column.colIndex === 1) {
          content = (
            <>
              {depth > 0 && <span className={styles.indent} style={{ width: depth * INDENT }} />}
              <span className={styles.control}>
                <button
                  aria-expanded={expanded}
                  aria-label={`${expanded ? 'Recolher' : 'Expandir'} ${groupHeader} ${name}`}
                  className={styles.expander}
                  tabIndex={-1}
                  type="button"
                  onClick={() => onToggle(group.key)}
                >
                  <IconChevronRight size={14} />
                </button>
              </span>
              {selectable && <span className={styles.control} />}
              <span className={styles.text}>
                <span className={styles.visuallyHidden}>{groupHeader}: </span>
                {name} <span className={styles.groupCount}>({count})</span>
              </span>
            </>
          );
        } else if (aggregator) {
          content = (
            <span className={styles.text}>
              <span className={styles.visuallyHidden}>
                {aggregator.label} de {column.header}:{' '}
              </span>
              {text}
            </span>
          );
        }

        return (
          <div
            aria-colindex={column.colIndex}
            className={[
              styles.cell,
              styles[columnAlign(column)],
              aggregator && (column.type === 'number' || column.type === 'currency') && styles.numeric,
              column.className,
            ]
              .filter(Boolean)
              .join(' ')}
            data-column={column.id}
            data-row={group.key}
            key={column.id}
            role="gridcell"
            style={column.style}
            tabIndex={focused ? 0 : -1}
            onFocus={() => {
              if (!focused) {
                onCellFocus(group.key, column.id);
              }
            }}
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}) as <Row>(props: DataGridGroupRowProps<Row>) => ReactNode;
