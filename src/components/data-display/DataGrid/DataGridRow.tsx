import { memo, type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import { Checkbox } from '../../forms/Checkbox';
import { IconChevronRight } from '../../icons';
import { cellText, cellValue, columnAlign, type DataGridColumnModel } from './gridState';
import styles from './DataGrid.module.css';

export interface DataGridCellContext<Row> {
  row: Row;
  text: string;
  value: unknown;
}

export interface DataGridRowColumn<Row> extends DataGridColumnModel<Row> {
  /** Coluna fixa e divisa das fixas. */
  className: string;
  renderCell?: (context: DataGridCellContext<Row>) => ReactNode;
  style: CSSProperties;
}

interface DataGridRowProps<Row> {
  ariaRowIndex: number;
  columns: readonly DataGridRowColumn<Row>[];
  /** `undefined` na linha sem detalhe. */
  expanded: boolean | undefined;
  /** Coluna com foco nesta linha; nas outras linhas, nenhuma. */
  focusedColumnId: string | undefined;
  height: number;
  /** Só na grade em árvore. */
  level: number | undefined;
  onCellFocus: (rowKey: string, columnId: string) => void;
  /** Clique fora dos controles da linha; ausente quando a linha não responde ao clique. */
  onRowClick: ((rowKey: string, event: MouseEvent) => void) | undefined;
  onToggle: (rowKey: string, range: boolean) => void;
  onToggleExpanded: (rowKey: string) => void;
  row: Row;
  rowKey: string;
  selectable: boolean;
  selected: boolean | undefined;
  top: number;
  /** A grade com detalhe reserva o espaço da seta em todas as linhas, para os textos alinharem. */
  withExpander: boolean;
}

/** Memorizada: ao rolar, só as linhas que entram na janela são desenhadas. */
export const DataGridRow = memo(function DataGridRow<Row>({
  ariaRowIndex,
  columns,
  expanded,
  focusedColumnId,
  height,
  level,
  onCellFocus,
  onRowClick,
  onToggle,
  onToggleExpanded,
  row,
  rowKey,
  selectable,
  selected,
  top,
  withExpander,
}: DataGridRowProps<Row>) {
  return (
    <div
      aria-expanded={expanded}
      aria-level={level}
      aria-rowindex={ariaRowIndex}
      aria-selected={selected}
      className={[styles.row, selected && styles.selected, expanded && styles.expanded, onRowClick && styles.clickable]
        .filter(Boolean)
        .join(' ')}
      data-anchor=""
      role="row"
      style={{ height, transform: `translateY(${top}px)` }}
      onClick={onRowClick && ((event) => onRowClick(rowKey, event))}
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
              column.className,
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
            {columnIndex === 0 && withExpander && (
              <span className={styles.control}>
                {expanded !== undefined && (
                  <button
                    aria-expanded={expanded}
                    aria-label={`${expanded ? 'Recolher' : 'Expandir'} ${text || rowKey}`}
                    className={styles.expander}
                    tabIndex={-1}
                    type="button"
                    onClick={() => onToggleExpanded(rowKey)}
                  >
                    <IconChevronRight size={14} />
                  </button>
                )}
              </span>
            )}
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
            <span
              className={styles.text}
              onPointerEnter={(event) => {
                const element = event.currentTarget;
                element.title = element.scrollWidth > element.clientWidth ? text : '';
              }}
            >
              {column.renderCell ? column.renderCell({ row, text, value: cellValue(column, row) }) : text}
            </span>
          </div>
        );
      })}
    </div>
  );
}) as <Row>(props: DataGridRowProps<Row>) => ReactNode;
