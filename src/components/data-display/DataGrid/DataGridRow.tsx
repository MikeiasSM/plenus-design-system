import { memo, type CSSProperties, type ReactNode } from 'react';
import { Checkbox } from '../../forms/Checkbox';
import { cellText, cellValue, columnAlign, type DataGridColumnModel } from './gridState';
import styles from './DataGrid.module.css';

export interface DataGridCellContext<Row> {
  row: Row;
  text: string;
  value: unknown;
}

export interface DataGridRowColumn<Row> extends DataGridColumnModel<Row> {
  renderCell?: (context: DataGridCellContext<Row>) => ReactNode;
  style: CSSProperties;
}

interface DataGridRowProps<Row> {
  ariaRowIndex: number;
  columns: readonly DataGridRowColumn<Row>[];
  /** Coluna com foco nesta linha; nas outras linhas, nenhuma. */
  focusedColumnId: string | undefined;
  height: number;
  onCellFocus: (rowKey: string, columnId: string) => void;
  onToggle: (rowKey: string, range: boolean) => void;
  row: Row;
  rowKey: string;
  selectable: boolean;
  selected: boolean | undefined;
  top: number;
}

/** Memorizada: ao rolar, só as linhas que entram na janela são desenhadas. */
export const DataGridRow = memo(function DataGridRow<Row>({
  ariaRowIndex,
  columns,
  focusedColumnId,
  height,
  onCellFocus,
  onToggle,
  row,
  rowKey,
  selectable,
  selected,
  top,
}: DataGridRowProps<Row>) {
  return (
    <div
      aria-rowindex={ariaRowIndex}
      aria-selected={selected}
      className={[styles.row, selected && styles.selected].filter(Boolean).join(' ')}
      role="row"
      style={{ height, transform: `translateY(${top}px)` }}
    >
      {columns.map((column, columnIndex) => {
        const text = cellText(column, row);
        const focused = focusedColumnId === column.id;

        return (
          <div
            aria-colindex={columnIndex + 1}
            className={[
              styles.cell,
              styles[columnAlign(column)],
              (column.type === 'number' || column.type === 'currency') && styles.numeric,
            ]
              .filter(Boolean)
              .join(' ')}
            data-column={column.id}
            data-row={rowKey}
            key={column.id}
            role="gridcell"
            style={column.style}
            tabIndex={focused ? 0 : -1}
            onFocus={() => {
              if (!focused) {
                onCellFocus(rowKey, column.id);
              }
            }}
          >
            {columnIndex === 0 && selectable && (
              <Checkbox
                aria-label={`Selecionar ${text || rowKey}`}
                checked={Boolean(selected)}
                className={styles.control}
                tabIndex={-1}
                onChange={() => undefined}
                onClick={(event) => onToggle(rowKey, event.shiftKey)}
              />
            )}
            <span className={styles.text}>
              {column.renderCell ? column.renderCell({ row, text, value: cellValue(column, row) }) : text}
            </span>
          </div>
        );
      })}
    </div>
  );
}) as <Row>(props: DataGridRowProps<Row>) => ReactNode;
