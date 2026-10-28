import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { selectionStatus, select, selectRange, toggleAll, type SelectionState } from '../../../hooks/useSelection/selection';
import { Spinner } from '../../feedback/Spinner';
import { Checkbox } from '../../forms/Checkbox';
import { IconArrowDown, IconArrowUp } from '../../icons';
import { Pagination } from '../../navigation/Pagination';
import {
  clampPage,
  columnAlign,
  moveFocus,
  pageCountOf,
  pageRows,
  reconcileFocus,
  restoreSnapshot,
  searchRows,
  snapshotOf,
  sortRows,
  toggleSort,
  type DataGridColumnModel,
  type DataGridFocus,
  type DataGridFocusMove,
  type DataGridSnapshot,
  type DataGridSortItem,
  type DataGridState,
} from './gridState';
import { DataGridContext } from './dataGridContext';
import { DataGridSearch, DataGridToolbar } from './DataGridToolbar';
import { DataGridRow, type DataGridCellContext } from './DataGridRow';
import { buildRowLayout, rowAt, totalHeight, visibleWindow } from './rowLayout';
import styles from './DataGrid.module.css';

const ROW_HEIGHT = 40;
const OVERSCAN = 6;
const DEFAULT_HEIGHT = 480;
const DEFAULT_MIN_WIDTH = 120;
const NO_MEASURES = new Map<string, number>();
/** Espaço da caixa de seleção, somado à coluna que a recebe para não tirar largura do conteúdo dela. */
const CONTROL_WIDTH = 24;

/** Controles dentro da célula usam `tabIndex={-1}`: a grade tem uma parada de Tab só, e Enter entra na célula. */
export interface DataGridColumn<Row> extends DataGridColumnModel<Row> {
  /** Peso na divisão da sobra de largura. Sem `width` nem `flex`, a coluna é flexível com peso 1. */
  flex?: number;
  maxWidth?: number;
  minWidth?: number;
  renderCell?: (context: DataGridCellContext<Row>) => ReactNode;
  renderHeader?: (column: DataGridColumn<Row>) => ReactNode;
  /** Largura fixa, em pixels. */
  width?: number;
}

export type DataGridSelectionMode = 'none' | 'single' | 'multiple';

/** O que o modo servidor pede a cada mudança: a resposta são as linhas da página e o total. */
export type DataGridQuery = DataGridState;

export interface DataGridProps<Row> extends Omit<ComponentPropsWithRef<'div'>, 'children' | 'onChange'> {
  /** Partes da grade, como `DataGrid.Toolbar`, desenhadas acima dela. */
  children?: ReactNode;
  /** Lista estável, memorizada pelo produto: uma lista nova a cada desenho refaz a busca e a ordenação. */
  columns: readonly DataGridColumn<Row>[];
  /** No servidor, `rows` é a página atual e `totalRows` o total; a busca, a ordem e a página vão por `onQueryChange`. */
  dataMode?: 'client' | 'server';
  defaultPage?: number;
  defaultPageSize?: number;
  defaultSearch?: string;
  defaultSelectedIds?: readonly string[];
  defaultSort?: readonly DataGridSortItem[];
  /** Texto da grade vazia. Com busca, o padrão diz que nada a atende. */
  emptyMessage?: ReactNode;
  /** Falha ao carregar, mostrada no lugar das linhas. */
  error?: ReactNode;
  getRowId: (row: Row) => string;
  /** Altura da área rolável, em pixels. */
  height?: number;
  /** Retrato salvo por `onStateChange`, aplicado de uma vez na montagem. Vence os valores `default*`. */
  initialState?: unknown;
  label: string;
  loading?: boolean;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onQueryChange?: (query: DataGridQuery) => void;
  onSearchChange?: (search: string) => void;
  onSelectedIdsChange?: (ids: readonly string[]) => void;
  onSortChange?: (sort: readonly DataGridSortItem[]) => void;
  /** Retrato versionado da busca, da ordem e da página, para o produto guardar onde quiser. */
  onStateChange?: (snapshot: DataGridSnapshot) => void;
  page?: number;
  pageSize?: number;
  pageSizeOptions?: readonly number[];
  /** Divide as linhas em páginas, com a paginação no rodapé. Sem ela, todas rolam na mesma área. */
  pagination?: boolean;
  rows: readonly Row[];
  search?: string;
  selectedIds?: readonly string[];
  selectionMode?: DataGridSelectionMode;
  sort?: readonly DataGridSortItem[];
  totalRows?: number;
}

function useSlice<T>(value: T | undefined, initial: T, onChange?: (value: T) => void) {
  const [internal, setInternal] = useState(initial);
  const controlled = value !== undefined;
  const current = controlled ? value : internal;

  function set(next: T) {
    if (!controlled) {
      setInternal(next);
    }
    onChange?.(next);
  }

  return [current, set] as const;
}

function columnStyle<Row>(column: DataGridColumn<Row>, controlsWidth: number): CSSProperties {
  if (column.width !== undefined) {
    const width = column.width + controlsWidth;
    return { flex: `0 0 ${width}px`, width };
  }

  const minWidth = (column.minWidth ?? DEFAULT_MIN_WIDTH) + controlsWidth;

  return {
    flex: `${column.flex ?? 1} 1 ${minWidth}px`,
    minWidth,
    maxWidth: column.maxWidth === undefined ? undefined : column.maxWidth + controlsWidth,
  };
}

const FOCUS_MOVES: Record<string, DataGridFocusMove> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  Home: 'rowStart',
  End: 'rowEnd',
  PageUp: 'pageUp',
  PageDown: 'pageDown',
};

function focusMoveOf(event: KeyboardEvent): DataGridFocusMove | undefined {
  if (event.ctrlKey && event.key === 'Home') {
    return 'gridStart';
  }
  if (event.ctrlKey && event.key === 'End') {
    return 'gridEnd';
  }

  return FOCUS_MOVES[event.key];
}

function focusablesIn(cell: HTMLElement) {
  return [...cell.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [tabindex]')].filter(
    (element) => !element.hasAttribute('disabled'),
  );
}

function sortAnnouncement<Row>(sort: readonly DataGridSortItem[], columns: readonly DataGridColumn<Row>[]) {
  if (sort.length === 0) {
    return 'Sem ordenação';
  }

  const parts = sort.map((item) => {
    const header = columns.find((column) => column.id === item.columnId)?.header ?? item.columnId;
    return `${header}, ${item.direction === 'asc' ? 'crescente' : 'decrescente'}`;
  });

  return `Ordenado por ${parts.join('; depois por ')}`;
}

export function DataGrid<Row>({
  children,
  className,
  columns,
  dataMode = 'client',
  defaultPage = 1,
  defaultPageSize,
  defaultSearch = '',
  defaultSelectedIds = [],
  defaultSort = [],
  emptyMessage,
  error,
  getRowId,
  height = DEFAULT_HEIGHT,
  initialState,
  label,
  loading = false,
  onPageChange,
  onPageSizeChange,
  onQueryChange,
  onSearchChange,
  onSelectedIdsChange,
  onSortChange,
  onStateChange,
  page: pageProp,
  pageSize: pageSizeProp,
  pageSizeOptions = [25, 50, 100],
  pagination = false,
  rows,
  search: searchProp,
  selectedIds: selectedIdsProp,
  selectionMode = 'none',
  sort: sortProp,
  totalRows: totalRowsProp,
  ...props
}: DataGridProps<Row>) {
  const [restored] = useState(() => {
    const fallback = { sort: defaultSort, search: defaultSearch, page: defaultPage, pageSize: defaultPageSize ?? pageSizeOptions[0] };
    const snapshot = restoreSnapshot(initialState, columns, fallback);

    return pageSizeOptions.includes(snapshot.pageSize) ? snapshot : { ...snapshot, pageSize: fallback.pageSize };
  });
  const [sort, setSort] = useSlice(sortProp, restored.sort, onSortChange);
  const [search, setSearch] = useSlice(searchProp, restored.search, onSearchChange);
  const [page, setPage] = useSlice(pageProp, restored.page, onPageChange);
  const [pageSize, setPageSize] = useSlice(pageSizeProp, restored.pageSize, onPageSizeChange);
  const [selectedIds, setSelectedIds] = useSlice(selectedIdsProp, defaultSelectedIds, onSelectedIdsChange);
  const [announcement, setAnnouncement] = useState('');
  const anchorKey = useRef<string>(undefined);
  const baseId = useId();

  const server = dataMode === 'server';
  const searched = useMemo(() => (server ? rows : searchRows(rows, columns, search)), [server, rows, columns, search]);
  const sorted = useMemo(() => (server ? searched : sortRows(searched, columns, sort)), [server, searched, columns, sort]);
  const totalRows = server ? (totalRowsProp ?? rows.length) : sorted.length;
  const currentPage = !pagination ? 1 : server ? page : clampPage(page, totalRows, pageSize);
  const visibleRows = useMemo(
    () => (server || !pagination ? sorted : pageRows(sorted, currentPage, pageSize)),
    [server, pagination, sorted, currentPage, pageSize],
  );
  const rowIdOf = useRef(getRowId);
  rowIdOf.current = getRowId;
  const rowKeys = useMemo(() => visibleRows.map((row) => rowIdOf.current(row)), [visibleRows]);
  const columnIds = useMemo(() => columns.map((column) => column.id), [columns]);
  const rowOffset = pagination ? (currentPage - 1) * pageSize : 0;

  const state: DataGridState = { sort, search, page: currentPage, pageSize };
  const stateKey = JSON.stringify(state);
  /* No servidor a primeira consulta sai na montagem: o retrato restaurado pode diferir do que o produto guardou. */
  const lastStateKey = useRef<string | null>(server ? null : stateKey);

  useEffect(() => {
    if (stateKey === lastStateKey.current) {
      return;
    }

    const mounting = lastStateKey.current === null;
    lastStateKey.current = stateKey;
    if (!mounting) {
      onStateChange?.(snapshotOf(state));
    }
    if (server) {
      onQueryChange?.(state);
    }
  });

  function backToFirstPage() {
    if (page !== 1) {
      setPage(1);
    }
  }

  function commitSearch(next: string) {
    const term = next.trim();

    setSearch(next);
    backToFirstPage();
    if (!server) {
      const found = searchRows(rows, columns, next).length;
      setAnnouncement(term ? `${found} ${found === 1 ? 'linha encontrada' : 'linhas encontradas'} para "${term}"` : 'Busca limpa');
    }
  }

  function requestSort(columnId: string, stack: boolean) {
    const next = toggleSort(sort, columnId, stack);
    setSort(next);
    backToFirstPage();
    setAnnouncement(sortAnnouncement(next, columns));
  }

  const [focus, setFocus] = useState<DataGridFocus>({ rowKey: null, columnId: columnIds[0] });
  const lastFocusedIndex = useRef(0);
  const activeFocus = reconcileFocus(focus, rowKeys, columnIds, lastFocusedIndex.current);
  const pendingFocus = useRef(false);
  const gridHasFocus = useRef(false);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectableItems = useMemo(() => sorted.map((row) => ({ key: rowIdOf.current(row) })), [sorted]);

  function applySelection(next: SelectionState) {
    anchorKey.current = next.anchorKey;
    setSelectedIds([...next.selectedKeys]);
  }

  function toggleRow(rowKey: string, range: boolean) {
    const current: SelectionState = { selectedKeys: selectedSet, anchorKey: anchorKey.current };

    if (range && selectionMode === 'multiple' && anchorKey.current !== undefined) {
      applySelection(selectRange(current, rowKey, selectableItems));
    } else {
      applySelection(select(current, rowKey, selectionMode, { allowEmpty: true }));
    }
  }

  function toggleEveryRow() {
    applySelection(toggleAll({ selectedKeys: selectedSet }, selectableItems));
  }

  /* As linhas memorizadas e a busca recebem funções estáveis, que chamam sempre a versão do último desenho. */
  const latest = useRef({ commitSearch, toggleRow });
  useLayoutEffect(() => {
    latest.current = { commitSearch, toggleRow };
  });
  const searchFromPart = useCallback((next: string) => latest.current.commitSearch(next), []);
  const toggleFromRow = useCallback((rowKey: string, range: boolean) => latest.current.toggleRow(rowKey, range), []);
  const focusFromRow = useCallback((rowKey: string, columnId: string) => setFocus({ rowKey, columnId }), []);


  const scrollerRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const layout = useMemo(() => buildRowLayout(rowKeys, NO_MEASURES, ROW_HEIGHT), [rowKeys]);

  /* Com menos linhas o navegador recua a rolagem sem avisar a janela, que ficaria desenhando linhas fora da tela. */
  useLayoutEffect(() => {
    setScrollTop(scrollerRef.current?.scrollTop ?? 0);
  }, [layout]);
  const controlsWidth = selectionMode === 'none' ? 0 : CONTROL_WIDTH;
  const rowColumns = useMemo(
    () => columns.map((column, index) => ({ ...column, style: columnStyle(column, index === 0 ? controlsWidth : 0) })),
    [columns, controlsWidth],
  );
  const rowWindow = visibleWindow(layout, scrollTop, height, OVERSCAN);
  const focusedIndex = useMemo(
    () => (activeFocus.rowKey === null ? -1 : rowKeys.indexOf(activeFocus.rowKey)),
    [rowKeys, activeFocus.rowKey],
  );

  useEffect(() => {
    if (focusedIndex >= 0) {
      lastFocusedIndex.current = focusedIndex;
    }
    if (activeFocus !== focus && gridHasFocus.current && !scrollerRef.current?.contains(document.activeElement)) {
      pendingFocus.current = true;
      setFocus(activeFocus);
    }
  });
  const drawnIndexes = useMemo(() => {
    const indexes = Array.from({ length: rowWindow.end - rowWindow.start }, (_, i) => rowWindow.start + i);

    if (focusedIndex >= 0 && (focusedIndex < rowWindow.start || focusedIndex >= rowWindow.end)) {
      indexes.push(focusedIndex);
      indexes.sort((a, b) => a - b);
    }

    return indexes;
  }, [rowWindow.start, rowWindow.end, focusedIndex]);

  function revealRow(index: number) {
    const scroller = scrollerRef.current;

    if (!scroller) {
      return;
    }

    if (index < 0) {
      scroller.scrollTop = 0;
      return;
    }

    const visible = scroller.clientHeight - (headRef.current?.offsetHeight ?? 0);
    const top = layout.offsets[index];
    const bottom = layout.offsets[index + 1];

    if (top < scroller.scrollTop) {
      scroller.scrollTop = top;
    } else if (visible > 0 && bottom > scroller.scrollTop + visible) {
      scroller.scrollTop = bottom - visible;
    }
  }

  useEffect(() => {
    if (!pendingFocus.current) {
      return;
    }
    pendingFocus.current = false;

    const scroller = scrollerRef.current;
    const cell = scroller?.querySelector<HTMLElement>(
      `[data-row="${CSS.escape(activeFocus.rowKey ?? '')}"][data-column="${CSS.escape(activeFocus.columnId)}"]`,
    );

    if (!scroller || !cell) {
      return;
    }

    cell.focus({ preventScroll: true });
    if (cell.offsetLeft < scroller.scrollLeft) {
      scroller.scrollLeft = cell.offsetLeft;
    } else if (cell.offsetLeft + cell.offsetWidth > scroller.scrollLeft + scroller.clientWidth) {
      scroller.scrollLeft = cell.offsetLeft + cell.offsetWidth - scroller.clientWidth;
    }
  });

  function goTo(next: DataGridFocus) {
    pendingFocus.current = true;
    setFocus(next);
    revealRow(next.rowKey === null ? -1 : rowKeys.indexOf(next.rowKey));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    const cell = target.closest<HTMLElement>('[data-column]');

    if (event.defaultPrevented || !cell || cell.closest('[role="grid"]') !== event.currentTarget) {
      return;
    }

    if (target !== cell) {
      handleKeyInsideCell(event, cell);
      return;
    }

    const rowKey = cell.dataset.row || null;
    const columnId = cell.dataset.column ?? columnIds[0];
    const move = focusMoveOf(event);

    if (event.key === ' ') {
      event.preventDefault();
    }

    if (move) {
      event.preventDefault();
      const visible = (scrollerRef.current?.clientHeight ?? 0) - (headRef.current?.offsetHeight ?? 0);
      const pageStep = Math.max(Math.floor(visible / ROW_HEIGHT), 1);
      goTo(moveFocus({ rowKey, columnId }, move, { rowKeys, columnIds, pageStep }));
      return;
    }

    if (rowKey === null) {
      handleHeaderKey(event, columnId);
    } else {
      handleRowKey(event, cell, rowKey);
    }
  }

  function handleHeaderKey(event: KeyboardEvent, columnId: string) {
    const column = columns.find((candidate) => candidate.id === columnId);

    if (event.key === ' ' && columnId === columnIds[0] && selectionMode === 'multiple') {
      toggleEveryRow();
    } else if (event.key === 'Enter' && column && column.sortable !== false) {
      event.preventDefault();
      requestSort(columnId, event.shiftKey);
    }
  }

  function handleRowKey(event: KeyboardEvent, cell: HTMLElement, rowKey: string) {
    if (event.key === ' ' && selectionMode !== 'none') {
      toggleRow(rowKey, event.shiftKey);
    } else if (event.key === 'Enter' || event.key === 'F2') {
      const first = focusablesIn(cell)[0];

      if (first) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  function handleKeyInsideCell(event: KeyboardEvent, cell: HTMLElement) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      cell.focus();
    } else if (event.key === 'Tab') {
      const controls = focusablesIn(cell);
      const index = controls.indexOf(event.target as HTMLElement);

      event.preventDefault();
      if (controls.length > 1) {
        controls[(index + (event.shiftKey ? -1 : 1) + controls.length) % controls.length].focus();
      } else {
        cell.focus();
      }
    }
  }

  const status = useMemo(() => selectionStatus({ selectedKeys: selectedSet }, selectableItems), [selectedSet, selectableItems]);
  const hostColumnId = columnIds[0];
  const multiple = selectionMode === 'multiple';
  const contextValue = useMemo(() => ({ label, search, setSearch: searchFromPart }), [label, search, searchFromPart]);

  function renderHeaderCell(column: (typeof rowColumns)[number], index: number) {
    const focused = activeFocus.rowKey === null && activeFocus.columnId === column.id;
    const labelId = `${baseId}-header-${index}`;
    const sortIndex = sort.findIndex((item) => item.columnId === column.id);
    const sortItem = sort[sortIndex];
    const sortable = column.sortable !== false;
    const align = columnAlign(column);

    return (
      <div
        aria-colindex={index + 1}
        aria-labelledby={labelId}
        aria-sort={sortIndex === 0 ? (sortItem.direction === 'asc' ? 'ascending' : 'descending') : undefined}
        className={[styles.cell, styles.headerCell, styles[align], sortable && styles.sortable].filter(Boolean).join(' ')}
        data-column={column.id}
        data-row=""
        key={column.id}
        role="columnheader"
        style={column.style}
        tabIndex={focused ? 0 : -1}
        onClick={sortable ? (event) => requestSort(column.id, event.shiftKey) : undefined}
        onFocus={() => {
          if (!focused) {
            setFocus({ rowKey: null, columnId: column.id });
          }
        }}
      >
        {column.id === hostColumnId && multiple && (
          <Checkbox
            aria-label="Selecionar todas as linhas"
            checked={status === 'all'}
            className={styles.control}
            indeterminate={status === 'partial'}
            tabIndex={-1}
            onChange={toggleEveryRow}
            onClick={(event) => event.stopPropagation()}
          />
        )}
        <span className={styles.headerLabel} id={labelId}>
          {column.renderHeader ? column.renderHeader(column) : column.header}
        </span>
        {sortItem && (
          <span aria-hidden="true" className={styles.sortMark}>
            {sortItem.direction === 'asc' ? <IconArrowUp size={12} /> : <IconArrowDown size={12} />}
            {sort.length > 1 && <sup>{sortIndex + 1}</sup>}
          </span>
        )}
      </div>
    );
  }

  function renderRow(index: number) {
    const rowKey = rowKeys[index];

    return (
      <DataGridRow
        ariaRowIndex={rowOffset + index + 2}
        columns={rowColumns}
        focusedColumnId={activeFocus.rowKey === rowKey ? activeFocus.columnId : undefined}
        height={ROW_HEIGHT}
        key={rowKey}
        row={visibleRows[index]}
        rowKey={rowKey}
        selectable={selectionMode !== 'none'}
        selected={selectionMode === 'none' ? undefined : selectedSet.has(rowKey)}
        top={layout.offsets[index]}
        onCellFocus={focusFromRow}
        onToggle={toggleFromRow}
      />
    );
  }

  function renderMessage(content: ReactNode, alert = false) {
    return (
      <div aria-rowindex={2} className={styles.messageRow} role="row">
        <div aria-colindex={1} aria-colspan={columns.length} className={styles.message} role="gridcell">
          {alert ? <div role="alert">{content}</div> : content}
        </div>
      </div>
    );
  }

  const showsMessage = Boolean(error) || (rowKeys.length === 0 && !loading);
  const emptyContent =
    emptyMessage ?? (search.trim() ? `Nenhum registro atende à busca "${search.trim()}".` : 'Nenhum registro.');

  return (
    <DataGridContext.Provider value={contextValue}>
      <div {...props} className={[styles.dataGrid, className].filter(Boolean).join(' ')}>
        {children}
        <div className={styles.viewport}>
        <div
          className={styles.scroller}
          ref={scrollerRef}
          style={{ height }}
          onScroll={(event) => {
            const top = event.currentTarget.scrollTop;
            if (rowAt(layout, top) !== rowAt(layout, scrollTop)) {
              setScrollTop(top);
            }
          }}
        >
          <div
            aria-busy={loading || undefined}
            aria-colcount={columns.length}
            aria-label={label}
            aria-multiselectable={multiple || undefined}
            aria-rowcount={showsMessage ? 2 : totalRows + 1}
            className={styles.grid}
            role="grid"
            onBlur={(event) => {
              gridHasFocus.current = event.currentTarget.contains(event.relatedTarget as Node | null);
            }}
            onFocus={() => {
              gridHasFocus.current = true;
            }}
            onKeyDown={handleKeyDown}
          >
            <div className={styles.head} ref={headRef} role="rowgroup">
              <div aria-rowindex={1} className={styles.headerRow} role="row">
                {rowColumns.map(renderHeaderCell)}
              </div>
            </div>
            <div className={styles.body} role="rowgroup" style={{ height: error || !rowKeys.length ? undefined : totalHeight(layout) }}>
              {error
                ? renderMessage(error, true)
                : rowKeys.length === 0
                  ? loading
                    ? null
                    : renderMessage(emptyContent)
                  : drawnIndexes.map(renderRow)}
            </div>
          </div>
        </div>
        {loading && (
          <div className={styles.loading}>
            <Spinner label="Carregando" />
          </div>
        )}
        </div>
        {pagination && (
          <div className={styles.footer}>
            <Pagination
              disabled={loading}
              label={`Paginação de ${label}`}
              page={currentPage}
              pageCount={pageCountOf(totalRows, pageSize)}
              pageSize={pageSize}
              pageSizeOptions={pageSizeOptions}
              showFirstLast
              totalItems={totalRows}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        )}
        <div aria-live="polite" className={styles.visuallyHidden} role="status">
          {announcement}
        </div>
      </div>
    </DataGridContext.Provider>
  );
}

DataGrid.Toolbar = DataGridToolbar;
DataGrid.Search = DataGridSearch;
