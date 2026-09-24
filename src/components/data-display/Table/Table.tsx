import {
  createContext,
  useContext,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useSelection, type SelectionItem } from '../../../hooks/useSelection';
import { Tooltip } from '../../overlays/Tooltip';
import styles from './Table.module.css';

export type TableSize = 'sm' | 'md';
export type TableAlign = 'start' | 'center' | 'end';
export type TableBreakpoint = 'sm' | 'md' | 'lg';
export type SortDirection = 'ascending' | 'descending';
export type TableSelectionMode = 'none' | 'single' | 'multiple';
export type TableSelectionControl = 'checkbox' | 'radio' | 'toggle';

export interface TableRowItem {
  disabled?: boolean;
  id: string;
}

export interface TableSort {
  column: string;
  direction: SortDirection;
}

export interface TableProps {
  children: ReactNode;
  defaultSort?: TableSort;
  divider?: boolean;
  label?: string;
  loading?: boolean;
  loadingMessage?: string;
  highlightSelectedRow?: boolean;
  onSelectionChange?: (ids: readonly string[]) => void;
  onSortChange?: (sort: TableSort) => void;
  rows?: readonly TableRowItem[];
  selectedIds?: readonly string[];
  selectionControl?: TableSelectionControl;
  selectionMode?: TableSelectionMode;
  size?: TableSize;
  sort?: TableSort;
  stickyHeader?: boolean;
  striped?: boolean;
}

interface TableContextValue {
  baseId: string;
  countColumns: () => number;
  loading: boolean;
  registerColumn: (id: string) => number;
  requestSort: (column: string) => void;
  selection: TableSelection;
  size: TableSize;
  sort?: TableSort;
}

interface TableSelection {
  control: TableSelectionControl;
  highlight: boolean;
  isSelected: (id: string) => boolean;
  mode: TableSelectionMode;
  status: 'none' | 'partial' | 'all';
  toggle: (id: string, extend: boolean) => void;
  toggleAll: () => void;
}

const TableContext = createContext<TableContextValue | undefined>(undefined);

function useTableContext(part: string) {
  const context = useContext(TableContext);

  if (!context) {
    throw new Error(part + ' deve ser usado dentro de Table.');
  }

  return context;
}

export function Table({
  children,
  defaultSort,
  divider = true,
  highlightSelectedRow = true,
  label,
  loading = false,
  loadingMessage = 'Carregando',
  onSelectionChange,
  onSortChange,
  rows = [],
  selectedIds,
  selectionControl,
  selectionMode = 'none',
  size = 'md',
  sort,
  stickyHeader = false,
  striped = false,
}: TableProps) {
  const baseId = useId();
  const [internalSort, setInternalSort] = useState(defaultSort);
  const columns = useMemo(() => new Map<string, number>(), []);
  const currentSort = sort ?? internalSort;

  function requestSort(column: string) {
    const next: TableSort = {
      column,
      direction:
        currentSort?.column === column && currentSort.direction === 'ascending' ? 'descending' : 'ascending',
    };

    if (sort === undefined) {
      setInternalSort(next);
    }

    onSortChange?.(next);
  }

  const collection = useMemo<SelectionItem[]>(
    () => rows.map((row) => ({ key: row.id, disabled: row.disabled })),
    [rows],
  );

  const selection = useSelection({
    items: collection,
    mode: selectionMode,
    selectedKeys: selectedIds,
    onSelectionChange: (keys) => onSelectionChange?.([...keys]),
  });

  const context: TableContextValue = {
    baseId,
    countColumns: () => Math.max(columns.size, 1),
    loading,
    registerColumn: (id) => {
      if (!columns.has(id)) {
        columns.set(id, columns.size);
      }

      return columns.get(id) as number;
    },
    requestSort,
    selection: {
      control: selectionControl ?? (selectionMode === 'single' ? 'radio' : 'checkbox'),
      highlight: highlightSelectedRow,
      isSelected: (id) => selection.selectedKeys.has(id),
      mode: selectionMode,
      status: selection.status,
      toggle: (id, extend) => {
        if (extend && selectionMode === 'multiple') {
          selection.selectRange(id);
          return;
        }

        selection.select(id);
      },
      toggleAll: selection.toggleAll,
    },
    size,
    sort: currentSort,
  };

  const classes = [
    styles.table,
    styles[size],
    divider && styles.divider,
    striped && styles.striped,
    stickyHeader && styles.sticky,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.scroll}>
      <table aria-busy={loading || undefined} aria-label={label} className={classes}>
        <TableContext.Provider value={context}>{children}</TableContext.Provider>
      </table>
      {loading && (
        <p className={styles.status} role="status">
          {loadingMessage}
        </p>
      )}
    </div>
  );
}

export interface TableHeaderProps {
  children: ReactNode;
}

function TableHeader({ children }: TableHeaderProps) {
  const { registerColumn, selection } = useTableContext('Table.Header');

  if (selection.mode !== 'none') {
    registerColumn('__selecao__');
  }

  return (
    <thead className={styles.head}>
      <tr>
        {selection.mode === 'multiple' && (
          <th className={[styles.column, styles.lead].join(' ')} scope="col">
            <input
              aria-label="Selecionar todas as linhas"
              checked={selection.status === 'all'}
              className={styles.control}
              onChange={selection.toggleAll}
              ref={(node) => {
                if (node) {
                  node.indeterminate = selection.status === 'partial';
                }
              }}
              type="checkbox"
            />
          </th>
        )}
        {selection.mode === 'single' && <th className={[styles.column, styles.lead].join(' ')} scope="col" />}
        {children}
      </tr>
    </thead>
  );
}

export interface TableColumnProps {
  align?: TableAlign;
  children: ReactNode;
  help?: string;
  hideBelow?: TableBreakpoint;
  id: string;
  numeric?: boolean;
  sortable?: boolean;
  width?: string;
}

function TableColumn({ align, children, help, hideBelow, id, numeric = false, sortable = false, width }: TableColumnProps) {
  const { registerColumn, requestSort, sort } = useTableContext('Table.Column');

  registerColumn(id);

  const sorted = sort?.column === id ? sort.direction : undefined;

  const content = (
    <>
      {children}
      {help && (
        <Tooltip content={help}>
          <span aria-label={help} className={styles.help} role="img" tabIndex={0}>
            ?
          </span>
        </Tooltip>
      )}
      {sortable && (
        <svg
          aria-hidden="true"
          className={[styles.sortIcon, sorted === 'descending' && styles.sortDescending].filter(Boolean).join(' ')}
          fill="none"
          height="12"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="12"
        >
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      )}
    </>
  );

  return (
    <th
      aria-sort={sortable ? sorted ?? 'none' : undefined}
      className={[styles.column, styles[align ?? (numeric ? 'end' : 'start')], sortable && styles.sortable]
        .filter(Boolean)
        .join(' ')}
      data-hide-below={hideBelow}
      scope="col"
      style={{ width }}
    >
      {sortable ? (
        <button className={styles.sortButton} onClick={() => requestSort(id)} type="button">
          {content}
        </button>
      ) : (
        content
      )}
    </th>
  );
}

export interface TableBodyProps<T> {
  children: (item: T) => ReactNode;
  empty?: ReactNode;
  items: readonly T[];
}

function TableBody<T>({ children, empty, items }: TableBodyProps<T>) {
  const { countColumns, loading } = useTableContext('Table.Body');

  if (items.length === 0 && !loading && empty !== undefined) {
    return (
      <tbody className={styles.body}>
        <tr>
          <td className={styles.empty} colSpan={countColumns()}>
            {empty}
          </td>
        </tr>
      </tbody>
    );
  }

  return <tbody className={styles.body}>{items.map(children)}</tbody>;
}

export interface TableRowProps {
  children: ReactNode;
  disabled?: boolean;
  id: string;
  label?: string;
}

function TableRow({ children, disabled = false, id, label }: TableRowProps) {
  const { selection } = useTableContext('Table.Row');
  const selected = selection.mode !== 'none' && selection.isSelected(id);

  return (
    <tr
      aria-selected={selection.mode === 'none' ? undefined : selected}
      className={[styles.row, selected && selection.highlight && styles.selected].filter(Boolean).join(' ')}
    >
      {selection.mode !== 'none' && (
        <td className={[styles.cell, styles.lead].join(' ')}>
          <input
            aria-label={label ?? 'Selecionar linha'}
            checked={selected}
            className={[styles.control, selection.control === 'toggle' && styles.toggle].filter(Boolean).join(' ')}
            disabled={disabled}
            name={selection.control === 'radio' ? 'table-selection' : undefined}
            onChange={() => undefined}
            onClick={(event) => selection.toggle(id, event.shiftKey)}
            type={selection.control === 'radio' ? 'radio' : 'checkbox'}
          />
        </td>
      )}
      {children}
    </tr>
  );
}

export interface TableCellProps {
  align?: TableAlign;
  children?: ReactNode;
  hideBelow?: TableBreakpoint;
  numeric?: boolean;
}

function TableCell({ align, children, hideBelow, numeric = false }: TableCellProps) {
  return (
    <td
      className={[styles.cell, styles[align ?? (numeric ? 'end' : 'start')], numeric && styles.numeric]
        .filter(Boolean)
        .join(' ')}
      data-hide-below={hideBelow}
    >
      {children}
    </td>
  );
}

Table.Header = TableHeader;
Table.Column = TableColumn;
Table.Body = TableBody;
Table.Row = TableRow;
Table.Cell = TableCell;
