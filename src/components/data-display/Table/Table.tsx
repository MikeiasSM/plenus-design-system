import {
  createContext,
  type ComponentPropsWithRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useMergedRefs } from '../../../hooks/useMergedRefs';
import { useSelection, type SelectionItem } from '../../../hooks/useSelection';
import { Tooltip } from '../../overlays/Tooltip';
import styles from './Table.module.css';
import { IconArrowUp } from '../../icons';

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

export interface TableProps extends ComponentPropsWithRef<'div'> {
  children: ReactNode;
  /** Escolha inicial no modo nao controlado. */
  defaultSelectedIds?: readonly string[];
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
  /** Cabecalho colado no topo da rolagem da pagina; com a tabela mais larga ou mais alta que o espaco, no dela. */
  stickyHeader?: boolean;
  striped?: boolean;
}

interface TableContextValue {
  baseId: string;
  countColumns: () => number;
  loading: boolean;
  registerColumn: (id: string) => () => void;
  requestSort: (column: string) => void;
  selection: TableSelection;
  size: TableSize;
  sort?: TableSort;
}

interface TableSelection {
  control: TableSelectionControl;
  empty: boolean;
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
  className,
  defaultSelectedIds,
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
  ref,
  ...props
}: TableProps) {
  const baseId = useId();
  const [internalSort, setInternalSort] = useState(defaultSort);
  const [columns, setColumns] = useState<ReadonlySet<string>>(() => new Set());
  const currentSort = sort ?? internalSort;
  const control = selectionControl ?? (selectionMode === 'single' ? 'radio' : 'checkbox');

  // Rolar dentro da tabela e colar o cabecalho na rolagem da pagina se excluem em CSS: o envoltorio so
  // continua conteiner de rolagem quando a tabela transborda dele.
  const [precisaRolar, setPrecisaRolar] = useState(true);
  const observarTransbordo = useCallback((envoltorio: HTMLDivElement | null) => {
    if (!envoltorio || typeof ResizeObserver === 'undefined') {
      return;
    }

    const observador = new ResizeObserver(() =>
      setPrecisaRolar(
        envoltorio.scrollWidth > envoltorio.clientWidth || envoltorio.scrollHeight > envoltorio.clientHeight,
      ),
    );

    observador.observe(envoltorio);

    if (envoltorio.firstElementChild) {
      observador.observe(envoltorio.firstElementChild);
    }

    return () => observador.disconnect();
  }, []);
  const envoltorioRef = useMergedRefs(stickyHeader ? observarTransbordo : undefined, ref);

  // A coluna se registra enquanto esta na tela e sai quando sai: registrada para sempre, o vazio ocupava colunas
  // que nao existiam mais.
  const registerColumn = useCallback((id: string) => {
    setColumns((atuais) => new Set(atuais).add(id));

    return () =>
      setColumns((atuais) => {
        const restantes = new Set(atuais);
        restantes.delete(id);
        return restantes;
      });
  }, []);

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
    // Caixa e chave desmarcam ao clicar de novo; o radio, nao.
    allowEmpty: control !== 'radio',
    defaultSelectedKeys: defaultSelectedIds,
    items: collection,
    mode: selectionMode,
    selectedKeys: selectedIds,
    onSelectionChange: (keys) => onSelectionChange?.([...keys]),
  });

  const context: TableContextValue = {
    baseId,
    countColumns: () => Math.max(columns.size, 1),
    loading,
    registerColumn,
    requestSort,
    selection: {
      control,
      empty: rows.length === 0,
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
    <div
      {...props}
      className={[styles.scroll, stickyHeader && !precisaRolar && styles.noScroll, className].filter(Boolean).join(' ')}
      ref={envoltorioRef}
    >
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

  useEffect(() => (selection.mode === 'none' ? undefined : registerColumn('__selecao__')), [registerColumn, selection.mode]);

  return (
    <thead className={styles.head}>
      <tr>
        {selection.mode === 'multiple' && (
          <th className={[styles.column, styles.lead].join(' ')} scope="col">
            {/* Sem `rows` nao ha o que marcar, e o clique so apagava a escolha que ja havia. */}
            <input
              aria-label="Selecionar todas as linhas"
              checked={selection.status === 'all'}
              className={styles.control}
              disabled={selection.empty}
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

  useEffect(() => registerColumn(id), [id, registerColumn]);

  const sorted = sort?.column === id ? sort.direction : undefined;

  // A ajuda e focavel e fica fora do botao de ordenacao: controle dentro de controle nao e HTML valido.
  const ajuda = help && (
    <Tooltip content={help}>
      <span aria-label={help} className={styles.help} role="img" tabIndex={0}>
        ?
      </span>
    </Tooltip>
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
        <div className={styles.sortHeader}>
          <button className={styles.sortButton} onClick={() => requestSort(id)} type="button">
            {children}
            <IconArrowUp
              className={[styles.sortIcon, sorted === 'descending' && styles.sortDescending].filter(Boolean).join(' ')}
              size={12}
            />
          </button>
          {ajuda}
        </div>
      ) : (
        <>
          {children}
          {ajuda}
        </>
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
      <tbody>
        <tr>
          <td className={styles.empty} colSpan={countColumns()}>
            {empty}
          </td>
        </tr>
      </tbody>
    );
  }

  return <tbody>{items.map(children)}</tbody>;
}

export interface TableRowProps {
  children: ReactNode;
  disabled?: boolean;
  id: string;
  label?: string;
}

function TableRow({ children, disabled = false, id, label }: TableRowProps) {
  const { baseId, selection } = useTableContext('Table.Row');
  const selected = selection.mode !== 'none' && selection.isSelected(id);

  return (
    // Sem `aria-selected` na linha: ele so vale em grade, e numa tabela quem anuncia a marcacao e o controle.
    <tr className={[styles.row, selected && selection.highlight && styles.selected].filter(Boolean).join(' ')}>
      {selection.mode !== 'none' && (
        <td className={[styles.cell, styles.lead].join(' ')}>
          <input
            aria-label={label ?? 'Selecionar linha'}
            checked={selected}
            className={[styles.control, selection.control === 'toggle' && styles.toggle].filter(Boolean).join(' ')}
            disabled={disabled}
            name={selection.control === 'radio' ? `${baseId}-selecao` : undefined}
            onChange={() => undefined}
            onClick={(event) => selection.toggle(id, event.shiftKey)}
            role={selection.control === 'toggle' ? 'switch' : undefined}
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
