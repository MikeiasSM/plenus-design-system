import {
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { selectionStatus, select, selectRange, toggleAll, type SelectionState } from '../../../hooks/useSelection/selection';
import { Spinner } from '../../feedback/Spinner';
import { Checkbox } from '../../forms/Checkbox';
import { Pagination } from '../../navigation/Pagination';
import type { MenuSection } from '../../overlays/Menu';
import {
  moveColumn,
  moveColumnTo,
  normalizeColumnState,
  pinColumn,
  placeColumns,
  resizeColumn,
  setColumnHidden,
  type DataGridColumnSizing,
  type DataGridColumnState,
  type DataGridPin,
  type DataGridPlacedColumn,
} from './columnLayout';
import {
  bodyItems,
  cellText,
  clampPage,
  columnAlign,
  detailKeyOf,
  detailPathOf,
  moveFocus,
  pageCountOf,
  pageRows,
  reconcileFocus,
  restoreSnapshot,
  searchRows,
  snapshotColumnsOf,
  snapshotOf,
  sortBy,
  sortRows,
  toggleExpanded,
  toggleSort,
  type DataGridBodyItem,
  type DataGridColumnModel,
  type DataGridExpandMode,
  type DataGridFocus,
  type DataGridFocusMove,
  type DataGridSnapshot,
  type DataGridSortItem,
  type DataGridState,
} from './gridState';
import { DataGridContext, DataGridLevelContext, DataGridScrollContext } from './dataGridContext';
import { DataGridSearch, DataGridToolbar } from './DataGridToolbar';
import { DataGridRow, type DataGridCellContext } from './DataGridRow';
import { DataGridDetailRow, DETAIL_ESTIMATE, type DataGridDetailContext } from './DataGridDetail';
import { DataGridDetailLayout } from './DataGridDetailLayout';
import { DataGridHeaderCell, MIN_COLUMN_WIDTH } from './DataGridHeaderCell';
import { buildRowLayout, rowAt, totalHeight, visibleWindow } from './rowLayout';
import { DataGridScrollRoot } from './scrollRoot';
import styles from './DataGrid.module.css';

const ROW_HEIGHT = 40;
const OVERSCAN = 6;
const DEFAULT_HEIGHT = 480;
/** Teto do ajuste ao conteúdo: um texto longo não toma a tela inteira. */
const MAX_FIT_WIDTH = 480;
/** Espaço de cada controle da linha, a seta e a caixa de seleção, somado à coluna que os recebe. */
const CONTROL_WIDTH = 24;
const CELL_SELECTOR = '[data-column], [data-detail]';
const GRID_SELECTOR = '[role="grid"], [role="treegrid"]';
const INTERACTIVE_SELECTOR = 'a, button, input, label, select, textarea';

/** Controles dentro da célula usam `tabIndex={-1}`: a grade tem uma parada de Tab só, e Enter entra na célula. */
export interface DataGridColumn<Row> extends DataGridColumnModel<Row>, DataGridColumnSizing {
  renderCell?: (context: DataGridCellContext<Row>) => ReactNode;
  renderHeader?: (column: DataGridColumn<Row>) => ReactNode;
}

export type DataGridSelectionMode = 'none' | 'single' | 'multiple';

export type DataGridRowClickAction = 'none' | 'expand' | 'select' | 'activate';

/** O que o modo servidor pede a cada mudança: a resposta são as linhas da página e o total. */
export type DataGridQuery = DataGridState;

export interface DataGridProps<Row> extends Omit<ComponentPropsWithRef<'div'>, 'children' | 'onChange'> {
  /** Partes da grade, como `DataGrid.Toolbar`, desenhadas acima dela. */
  children?: ReactNode;
  /** Ordem, ocultas, fixas e larguras, como a pessoa deixou pelo menu da coluna e pelo arrasto. */
  columnState?: DataGridColumnState;
  /** Lista estável, memorizada pelo produto: uma lista nova a cada desenho refaz a busca e a ordenação. */
  columns: readonly DataGridColumn<Row>[];
  /** No servidor, `rows` é a página atual e `totalRows` o total; a busca, a ordem e a página vão por `onQueryChange`. */
  dataMode?: 'client' | 'server';
  /** Parcial: o que faltar sai da definição das colunas. */
  defaultColumnState?: Partial<DataGridColumnState>;
  defaultExpandedIds?: readonly string[];
  defaultPage?: number;
  defaultPageSize?: number;
  defaultSearch?: string;
  defaultSelectedIds?: readonly string[];
  defaultSort?: readonly DataGridSortItem[];
  /** Texto da grade vazia. Com busca, o padrão diz que nada a atende. */
  emptyMessage?: ReactNode;
  /** Falha ao carregar, mostrada no lugar das linhas. */
  error?: ReactNode;
  expandedIds?: readonly string[];
  /** Na `single`, abrir um detalhe fecha o que estava aberto. */
  expandMode?: DataGridExpandMode;
  getRowId: (row: Row) => string;
  /** Altura da área rolável, em pixels. Na grade aninhada não vale: ela rola com a de fora. */
  height?: number;
  /** Retrato salvo por `onStateChange`, aplicado de uma vez na montagem. Vence os valores `default*`. */
  initialState?: unknown;
  label: string;
  loading?: boolean;
  onColumnStateChange?: (state: DataGridColumnState) => void;
  onExpandedIdsChange?: (ids: readonly string[]) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onQueryChange?: (query: DataGridQuery) => void;
  /** Com `rowClickAction="activate"`, abre o registro da linha. */
  onRowActivate?: (row: Row) => void;
  onSearchChange?: (search: string) => void;
  onSelectedIdsChange?: (ids: readonly string[]) => void;
  onSortChange?: (sort: readonly DataGridSortItem[]) => void;
  /** Retrato versionado da busca, da ordem, da página e das colunas, para o produto guardar onde quiser. */
  onStateChange?: (snapshot: DataGridSnapshot) => void;
  page?: number;
  pageSize?: number;
  pageSizeOptions?: readonly number[];
  /** Divide as linhas em páginas, com a paginação no rodapé. Sem ela, todas rolam na mesma área. */
  pagination?: boolean;
  /**
   * Conteúdo livre do detalhe, inclusive outra `DataGrid`, que fica aninhada, sem rolagem própria. Memorizada pelo
   * produto, como `columns`: uma função nova a cada desenho redesenha os detalhes abertos.
   */
  renderDetail?: (context: DataGridDetailContext<Row>) => ReactNode;
  /** Ação do clique na linha e do Enter sobre ela. F2 continua entrando nos controles da célula. */
  rowClickAction?: DataGridRowClickAction;
  /** Sem ela, toda linha tem detalhe. Memorizada pelo produto, como `columns`. */
  rowHasDetail?: (row: Row) => boolean;
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

function placedStyle({ offset, pin, width }: DataGridPlacedColumn<unknown>): CSSProperties {
  return { width, left: pin === 'start' ? offset : undefined, right: pin === 'end' ? offset : undefined };
}

function placedClass({ edge, pin }: DataGridPlacedColumn<unknown>) {
  const edgeClass = edge && (pin === 'start' ? styles.edgeStart : styles.edgeEnd);
  return [pin && styles.pinned, edgeClass].filter(Boolean).join(' ');
}

const PIN_NAMES: Record<DataGridPin, string> = { start: 'à esquerda', end: 'à direita' };
const NO_MENU: MenuSection[] = [];

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

/** No detalhe, a grade aninhada recebe o foco na célula em que estava; sem ela, o primeiro controle alcançável. */
function detailEntryOf(cell: HTMLElement) {
  const grid = cell.querySelector<HTMLElement>(GRID_SELECTOR);
  const gridCell = grid
    ? [...grid.querySelectorAll<HTMLElement>('[tabindex="0"]')].find((element) => element.closest(GRID_SELECTOR) === grid)
    : undefined;

  return gridCell ?? focusablesIn(cell).find((element) => element.tabIndex >= 0);
}

/** A célula desta grade que contém o alvo, saltando as das grades aninhadas no detalhe. */
function ownCellOf(target: HTMLElement, grid: HTMLElement) {
  let cell = target.closest<HTMLElement>(CELL_SELECTOR);

  while (cell && cell.closest(GRID_SELECTOR) !== grid) {
    cell = cell.parentElement?.closest<HTMLElement>(CELL_SELECTOR) ?? null;
  }

  return cell;
}

function sameKeys(a: readonly string[], b: readonly string[]) {
  return a === b || (a.length === b.length && a.every((key, index) => key === b[index]));
}

const SIDEWAYS_MOVES = new Set<DataGridFocusMove>(['left', 'right', 'rowStart', 'rowEnd']);

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
  columnState: columnStateProp,
  columns,
  dataMode = 'client',
  defaultColumnState,
  defaultExpandedIds = [],
  defaultPage = 1,
  defaultPageSize,
  defaultSearch = '',
  defaultSelectedIds = [],
  defaultSort = [],
  emptyMessage,
  error,
  expandedIds: expandedIdsProp,
  expandMode = 'multiple',
  getRowId,
  height = DEFAULT_HEIGHT,
  initialState,
  label,
  loading = false,
  onColumnStateChange,
  onExpandedIdsChange,
  onPageChange,
  onPageSizeChange,
  onQueryChange,
  onRowActivate,
  onSearchChange,
  onSelectedIdsChange,
  onSortChange,
  onStateChange,
  page: pageProp,
  pageSize: pageSizeProp,
  pageSizeOptions = [25, 50, 100],
  pagination = false,
  renderDetail,
  rowClickAction = 'none',
  rowHasDetail,
  rows,
  search: searchProp,
  selectedIds: selectedIdsProp,
  selectionMode = 'none',
  sort: sortProp,
  totalRows: totalRowsProp,
  ...props
}: DataGridProps<Row>) {
  /* Dentro do detalhe de outra grade, esta rola com a de fora e guarda o próprio estado nela, pelo caminho. */
  const outerScroll = useContext(DataGridScrollContext);
  const outerLevel = useContext(DataGridLevelContext);
  const nested = outerScroll !== null && outerLevel !== null;
  const [ownVersion, setOwnVersion] = useState(0);
  const [ownRoot] = useState(() => new DataGridScrollRoot(() => setOwnVersion((version) => version + 1)));
  const ownScroll = useMemo(() => ({ root: ownRoot, version: ownVersion }), [ownRoot, ownVersion]);
  const { root, version } = nested ? outerScroll : ownScroll;
  const level = nested ? outerLevel.level : 1;
  const gridPath = nested ? detailPathOf(outerLevel.path, label) : '';
  const [memory] = useState(() => root.memories.get(gridPath));

  const [restored] = useState(() => {
    const fallback = { sort: defaultSort, search: defaultSearch, page: defaultPage, pageSize: defaultPageSize ?? pageSizeOptions[0] };
    const snapshot = memory ?? restoreSnapshot(initialState, columns, fallback);

    return pageSizeOptions.includes(snapshot.pageSize) ? snapshot : { ...snapshot, pageSize: fallback.pageSize };
  });
  const [sort, setSort] = useSlice(sortProp, restored.sort, onSortChange);
  const [search, setSearch] = useSlice(searchProp, restored.search, onSearchChange);
  const [page, setPage] = useSlice(pageProp, restored.page, onPageChange);
  const [pageSize, setPageSize] = useSlice(pageSizeProp, restored.pageSize, onPageSizeChange);
  const [selectedIds, setSelectedIds] = useSlice(selectedIdsProp, memory?.selectedIds ?? defaultSelectedIds, onSelectedIdsChange);
  const [expandedIds, setExpandedIds] = useSlice(expandedIdsProp, memory?.expandedIds ?? defaultExpandedIds, onExpandedIdsChange);
  const [savedColumnState] = useState(
    () => memory?.columns ?? normalizeColumnState(snapshotColumnsOf(initialState) ?? defaultColumnState, columns),
  );
  const [rawColumnState, setColumnState] = useSlice(columnStateProp, savedColumnState, onColumnStateChange);
  /* Concilia a cada troca das colunas: a coluna nova entra, a removida sai, inclusive no estado controlado. */
  const columnState = useMemo(() => normalizeColumnState(rawColumnState, columns), [rawColumnState, columns]);
  const [announcement, setAnnouncement] = useState('');
  const anchorKey = useRef<string>(undefined);
  const baseId = useId();

  const server = dataMode === 'server';
  const hiddenKey = columnState.hidden.join('\n');
  const searchColumns = useMemo(
    () => columns.filter((column) => !hiddenKey.split('\n').includes(column.id)),
    [columns, hiddenKey],
  );
  const searched = useMemo(
    () => (server ? rows : searchRows(rows, searchColumns, search)),
    [server, rows, searchColumns, search],
  );
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
  const withDetail = renderDetail !== undefined;
  const controlsWidth = (selectionMode === 'none' ? 0 : CONTROL_WIDTH) + (withDetail ? CONTROL_WIDTH : 0);
  const [viewWidth, setViewWidth] = useState(0);
  const placed = useMemo(
    () => placeColumns(columns, columnState, viewWidth, controlsWidth),
    [columns, columnState, viewWidth, controlsWidth],
  );
  const columnIds = useMemo(() => placed.map((item) => item.column.id), [placed]);
  const rowOffset = pagination ? (currentPage - 1) * pageSize : 0;

  const state: DataGridState = { sort, search, page: currentPage, pageSize };
  const stateKey = JSON.stringify(state);
  const snapshotKey = stateKey + JSON.stringify(columnState);
  /* No servidor a primeira consulta sai na montagem: o retrato restaurado pode diferir do que o produto guardou. */
  const lastStateKey = useRef<string | null>(server ? null : stateKey);
  const lastSnapshotKey = useRef(snapshotKey);

  useEffect(() => {
    if (nested) {
      root.memories.set(gridPath, { ...state, columns: columnState, expandedIds, selectedIds });
    }
    if (snapshotKey !== lastSnapshotKey.current) {
      lastSnapshotKey.current = snapshotKey;
      onStateChange?.(snapshotOf(state, columnState));
    }
    if (stateKey !== lastStateKey.current) {
      lastStateKey.current = stateKey;
      if (server) {
        onQueryChange?.(state);
      }
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
      const found = searchRows(rows, searchColumns, next).length;
      setAnnouncement(term ? `${found} ${found === 1 ? 'linha encontrada' : 'linhas encontradas'} para "${term}"` : 'Busca limpa');
    }
  }

  function applySort(next: readonly DataGridSortItem[]) {
    setSort(next);
    backToFirstPage();
    setAnnouncement(sortAnnouncement(next, columns));
  }

  function headerOf(columnId: string) {
    return columns.find((column) => column.id === columnId)?.header ?? columnId;
  }

  function changeColumns(next: DataGridColumnState, announcement: string) {
    setColumnState(next);
    setAnnouncement(announcement);
  }

  function moveColumnBy(columnId: string, step: -1 | 1) {
    const next = moveColumn(columnState, columnId, step);

    if (next === columnState) {
      setAnnouncement(`${headerOf(columnId)} não passa da divisa das colunas fixas`);
      return;
    }

    const position = placeColumns(columns, next, 0, 0).findIndex((item) => item.column.id === columnId) + 1;
    changeColumns(next, `${headerOf(columnId)} na posição ${position} de ${columnIds.length}`);
  }

  function pinColumnTo(columnId: string, pin: DataGridPin | null) {
    changeColumns(
      pinColumn(columnState, columnId, pin),
      `${headerOf(columnId)} ${pin ? `fixada ${PIN_NAMES[pin]}` : 'desafixada'}`,
    );
  }

  function hideColumn(columnId: string) {
    changeColumns(setColumnHidden(columnState, columnId, true), `${headerOf(columnId)} oculta`);
  }

  /* Mede o conteúdo natural das células desenhadas da coluna, inclusive o título: o texto ocupa a célula inteira. */
  function fitColumn(columnId: string) {
    const selector = `:scope > [role="row"] > [data-column="${CSS.escape(columnId)}"]`;
    const cells = [
      ...(headRef.current?.querySelectorAll<HTMLElement>(selector) ?? []),
      ...(bodyRef.current?.querySelectorAll<HTMLElement>(selector) ?? []),
    ];
    const content = Math.max(
      ...cells.map((cell) => {
        const text = cell.querySelector<HTMLElement>(`.${styles.text}, .${styles.headerLabel}`);
        if (!text) {
          return cell.offsetWidth;
        }
        const range = document.createRange();
        range.selectNodeContents(text);
        return Math.ceil(cell.offsetWidth - text.clientWidth + range.getBoundingClientRect().width);
      }),
    );
    const extra = columnId === columnIds[0] ? controlsWidth : 0;

    changeColumns(
      resizeColumn(columnState, columnId, Math.min(Math.max(content - extra, MIN_COLUMN_WIDTH), MAX_FIT_WIDTH)),
      `${headerOf(columnId)} ajustada ao conteúdo`,
    );
  }

  function hasDetail(row: Row) {
    return withDetail && (rowHasDetail?.(row) ?? true);
  }

  const expandedSet = useMemo(() => new Set(expandedIds), [expandedIds]);
  const items = useMemo(
    () =>
      bodyItems(
        rowKeys,
        (rowKey, index) => withDetail && expandedSet.has(rowKey) && (rowHasDetail?.(visibleRows[index]) ?? true),
      ),
    [rowKeys, visibleRows, expandedSet, withDetail, rowHasDetail],
  );
  const itemKeys = useMemo(() => items.map((item) => item.key), [items]);

  function rowLabelOf(row: Row, rowKey: string) {
    const first = placed[0]?.column;
    return (first && cellText(first, row)) || rowKey;
  }

  function toggleRowDetail(rowKey: string) {
    const row = visibleRows[rowKeys.indexOf(rowKey)];

    if (!row || !hasDetail(row)) {
      return;
    }

    const opening = !expandedSet.has(rowKey);
    setExpandedIds(toggleExpanded(expandedIds, rowKey, expandMode));
    setAnnouncement(`${rowLabelOf(row, rowKey)} ${opening ? 'expandido' : 'recolhido'}`);
  }

  const [focus, setFocus] = useState<DataGridFocus>({ rowKey: null, columnId: columnIds[0] });
  const lastFocusedIndex = useRef(0);
  const lastFocusedColumn = useRef(0);
  const activeFocus = reconcileFocus(focus, itemKeys, columnIds, lastFocusedIndex.current, lastFocusedColumn.current);
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

  function runRowAction(rowKey: string, range: boolean) {
    if (rowClickAction === 'expand') {
      toggleRowDetail(rowKey);
    } else if (rowClickAction === 'select' && selectionMode !== 'none') {
      toggleRow(rowKey, range);
    } else if (rowClickAction === 'activate') {
      const row = visibleRows[rowKeys.indexOf(rowKey)];
      if (row) {
        onRowActivate?.(row);
      }
    }
  }

  function clickRow(rowKey: string, event: MouseEvent) {
    if (!(event.target as Element).closest(INTERACTIVE_SELECTOR)) {
      runRowAction(rowKey, event.shiftKey);
    }
  }

  /* Fechado o menu por opção ou Esc, o foco volta ao título, ou ao vizinho se a coluna saiu. */
  function returnToHeader(columnId: string) {
    const active = document.activeElement;

    if (active === document.body || headRef.current?.contains(active)) {
      focusLater(reconcileFocus({ rowKey: null, columnId }, itemKeys, columnIds, 0, lastFocusedColumn.current));
    }
  }

  /* As linhas memorizadas e a busca recebem funções estáveis, que chamam sempre a versão do último desenho. */
  const latest = useRef({ clickRow, commitSearch, returnToHeader, toggleRow, toggleRowDetail });
  useLayoutEffect(() => {
    latest.current = { clickRow, commitSearch, returnToHeader, toggleRow, toggleRowDetail };
  });
  const searchFromPart = useCallback((next: string) => latest.current.commitSearch(next), []);
  const toggleFromRow = useCallback((rowKey: string, range: boolean) => latest.current.toggleRow(rowKey, range), []);
  const toggleDetailFromRow = useCallback((rowKey: string) => latest.current.toggleRowDetail(rowKey), []);
  const clickFromRow = useCallback((rowKey: string, event: MouseEvent) => latest.current.clickRow(rowKey, event), []);
  const focusFromRow = useCallback((rowKey: string, columnId: string) => setFocus({ rowKey, columnId }), []);
  const focusFromDetail = useCallback(
    (rowKey: string) => setFocus((current) => ({ rowKey: detailKeyOf(rowKey), columnId: current.columnId })),
    [],
  );

  const scrollerRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const layout = useMemo(
    () =>
      buildRowLayout(
        items.map((item) =>
          item.detail ? (root.heights.get(detailPathOf(gridPath, item.rowKey)) ?? DETAIL_ESTIMATE) : ROW_HEIGHT,
        ),
      ),
    /* `version` muda a cada altura medida, em qualquer nível. */
    [items, root, gridPath, version],
  );
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  const [rowWindow, setRowWindow] = useState(() => visibleWindow(layout, 0, height, OVERSCAN));

  useLayoutEffect(() => {
    if (!nested) {
      root.scroller = scrollerRef.current;
      root.head = headRef.current;
    }
  });

  /* A janela sai da tela da grade de fora, a única que rola: a aninhada desenha só o trecho que aparece nela. */
  const syncWindow = useCallback(() => {
    const scroller = root.scroller;
    const body = bodyRef.current;

    if (!scroller || !body) {
      return;
    }

    const headHeight = root.headHeight();
    const viewTop = scroller.scrollTop + headHeight - root.contentTop(body);
    const viewHeight = scroller.clientHeight > 0 ? scroller.clientHeight - headHeight : height;
    const next = visibleWindow(layoutRef.current, viewTop, viewHeight, OVERSCAN);

    setRowWindow((current) => (current.start === next.start && current.end === next.end ? current : next));
  }, [root, height]);

  /* Linhas que mudam de lugar sem mudar de altura soltam a âncora; uma lista nova com as mesmas chaves, não. */
  const drawnKeys = useRef(itemKeys);
  useLayoutEffect(() => {
    if (!sameKeys(drawnKeys.current, itemKeys)) {
      root.releaseAnchor();
    }
    drawnKeys.current = itemKeys;
  }, [root, itemKeys]);

  useLayoutEffect(() => root.subscribe(syncWindow), [root, syncWindow]);
  useLayoutEffect(() => root.notify(), [layout, root]);
  useLayoutEffect(() => {
    if (!nested) {
      root.restoreAnchor();
      root.notify();
    }
  }, [nested, root, version]);

  /* A sobra da largura da tela vai às colunas flexíveis; o detalhe tem a largura da tela, e não a das colunas. */
  useLayoutEffect(() => {
    const scroller = scrollerRef.current;

    if (!scroller || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver(() => setViewWidth(scroller.clientWidth));
    setViewWidth(scroller.clientWidth);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, []);

  const [edges, setEdges] = useState({ start: false, end: false });
  /* A divisa das colunas fixas só aparece quando há conteúdo rolado por baixo dela. */
  const readEdges = useCallback(() => {
    const scroller = scrollerRef.current;

    if (!scroller) {
      return;
    }

    const start = scroller.scrollLeft > 0;
    const end = scroller.scrollLeft < scroller.scrollWidth - scroller.clientWidth - 1;
    setEdges((current) => (current.start === start && current.end === end ? current : { start, end }));
  }, []);
  useLayoutEffect(readEdges, [readEdges, placed]);

  const rowColumns = useMemo(
    () => placed.map((item) => ({ ...item.column, className: placedClass(item), style: placedStyle(item) })),
    [placed],
  );
  const pinnedWidths = useMemo(
    () => ({
      start: placed.reduce((sum, item) => sum + (item.pin === 'start' ? item.width : 0), 0),
      end: placed.reduce((sum, item) => sum + (item.pin === 'end' ? item.width : 0), 0),
    }),
    [placed],
  );
  const focusedIndex = useMemo(
    () => (activeFocus.rowKey === null ? -1 : itemKeys.indexOf(activeFocus.rowKey)),
    [itemKeys, activeFocus.rowKey],
  );

  useEffect(() => {
    if (focusedIndex >= 0) {
      lastFocusedIndex.current = focusedIndex;
    }
    if (columnIds.includes(activeFocus.columnId)) {
      lastFocusedColumn.current = columnIds.indexOf(activeFocus.columnId);
    }
    if (activeFocus !== focus && gridHasFocus.current && !scrollerRef.current?.contains(document.activeElement)) {
      pendingFocus.current = true;
      setFocus(activeFocus);
    }
  });
  const drawnIndexes = useMemo(() => {
    const end = Math.min(rowWindow.end, items.length);
    const start = Math.min(rowWindow.start, end);
    const indexes = Array.from({ length: end - start }, (_, i) => start + i);

    if (focusedIndex >= 0 && (focusedIndex < start || focusedIndex >= end)) {
      indexes.push(focusedIndex);
      indexes.sort((a, b) => a - b);
    }

    return indexes;
  }, [rowWindow.start, rowWindow.end, items.length, focusedIndex]);

  function revealRow(index: number) {
    const head = headRef.current;
    const body = bodyRef.current;

    if (index >= 0 && body) {
      const bodyTop = root.contentTop(body);
      root.reveal(bodyTop + layout.offsets[index], bodyTop + layout.offsets[index + 1]);
    } else if (!nested && root.scroller) {
      root.scroller.scrollTop = 0;
    } else if (head) {
      const headTop = root.contentTop(head);
      root.reveal(headTop, headTop + head.offsetHeight);
    }
  }

  function focusedCellElement() {
    const { rowKey, columnId } = activeFocus;
    const column = CSS.escape(columnId);

    if (rowKey === null) {
      return headRef.current?.querySelector<HTMLElement>(`:scope > [role="row"] > [data-column="${column}"]`);
    }

    const item = items[focusedIndex];
    return item?.detail
      ? bodyRef.current?.querySelector<HTMLElement>(`:scope > [role="row"] > [data-detail="${CSS.escape(item.rowKey)}"]`)
      : bodyRef.current?.querySelector<HTMLElement>(
          `:scope > [role="row"] > [data-row="${CSS.escape(rowKey)}"][data-column="${column}"]`,
        );
  }

  useEffect(() => {
    if (!pendingFocus.current) {
      return;
    }
    pendingFocus.current = false;

    const scroller = scrollerRef.current;
    const cell = focusedCellElement();

    if (!scroller || !cell) {
      return;
    }

    cell.focus({ preventScroll: true });
    if (cell.dataset.detail !== undefined || cell.classList.contains(styles.pinned)) {
      return;
    }

    /* A célula que rola precisa aparecer entre as fixas dos dois lados, e não por baixo delas. */
    const left = cell.offsetLeft - pinnedWidths.start;
    const right = cell.offsetLeft + cell.offsetWidth + pinnedWidths.end;
    if (left < scroller.scrollLeft) {
      scroller.scrollLeft = left;
    } else if (right > scroller.scrollLeft + scroller.clientWidth) {
      scroller.scrollLeft = right - scroller.clientWidth;
    }
  });

  function focusLater(next: DataGridFocus) {
    pendingFocus.current = true;
    setFocus(next);
  }

  function goTo(next: DataGridFocus) {
    focusLater(next);
    revealRow(next.rowKey === null ? -1 : itemKeys.indexOf(next.rowKey));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    const cell = event.defaultPrevented ? null : ownCellOf(target, event.currentTarget);

    if (!cell) {
      return;
    }

    if (target !== cell) {
      handleKeyInsideCell(event, cell);
      return;
    }

    const detailRowKey = cell.dataset.detail;
    const rowKey = detailRowKey !== undefined ? detailKeyOf(detailRowKey) : cell.dataset.row || null;
    const columnId = cell.dataset.column ?? activeFocus.columnId;
    const move = focusMoveOf(event);

    if (event.key === ' ') {
      event.preventDefault();
    }

    if (rowKey === null && event.ctrlKey && event.shiftKey && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      event.preventDefault();
      moveColumnBy(columnId, event.key === 'ArrowLeft' ? -1 : 1);
      focusLater({ rowKey: null, columnId });
      return;
    }

    if (move) {
      event.preventDefault();
      if (detailRowKey !== undefined && SIDEWAYS_MOVES.has(move)) {
        return;
      }

      const visible = Math.max((root.scroller?.clientHeight ?? 0) - root.headHeight(), ROW_HEIGHT);
      const index = rowKey === null ? 0 : itemKeys.indexOf(rowKey);
      const target = rowAt(layout, layout.offsets[index] + (move === 'pageUp' ? -visible : visible));
      const pageStep = Math.max(Math.abs(target - index), 1);
      goTo(moveFocus({ rowKey, columnId }, move, { rowKeys: itemKeys, columnIds, pageStep }));
      return;
    }

    if (detailRowKey !== undefined) {
      handleDetailKey(event, cell);
    } else if (rowKey === null) {
      handleHeaderKey(event, columnId);
    } else {
      handleRowKey(event, cell, rowKey);
    }
  }

  function handleHeaderKey(event: KeyboardEvent, columnId: string) {
    const column = columns.find((candidate) => candidate.id === columnId);

    if (event.key === ' ' && columnId === columnIds[0] && selectionMode === 'multiple') {
      toggleEveryRow();
    } else if (event.key === 'Enter' && event.ctrlKey) {
      event.preventDefault();
      setMenuColumnId(columnId);
    } else if (event.key === 'Enter' && column && column.sortable !== false) {
      event.preventDefault();
      applySort(toggleSort(sort, columnId, event.shiftKey));
    }
  }

  function handleRowKey(event: KeyboardEvent, cell: HTMLElement, rowKey: string) {
    if (event.key === ' ' && selectionMode !== 'none') {
      toggleRow(rowKey, event.shiftKey);
    } else if (event.key === 'Enter' && event.ctrlKey) {
      event.preventDefault();
      toggleRowDetail(rowKey);
    } else if (event.key === 'Enter' && rowClickAction !== 'none') {
      event.preventDefault();
      runRowAction(rowKey, event.shiftKey);
    } else if (event.key === 'Enter' || event.key === 'F2') {
      const first = focusablesIn(cell)[0];

      if (first) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  function handleDetailKey(event: KeyboardEvent, cell: HTMLElement) {
    if (event.key !== 'Enter' && event.key !== 'F2') {
      return;
    }

    const entry = detailEntryOf(cell);
    if (entry) {
      event.preventDefault();
      entry.focus();
    }
  }

  /* No detalhe, Tab segue a ordem do conteúdo, que é do produto; Esc volta à célula do detalhe. */
  function handleKeyInsideCell(event: KeyboardEvent, cell: HTMLElement) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      cell.focus();
    } else if (event.key === 'Tab' && cell.dataset.detail === undefined) {
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

  const [menuColumnId, setMenuColumnId] = useState<string | null>(null);
  const draggedColumn = useRef<string | null>(null);

  function columnMenu(column: DataGridColumn<Row>, pin: DataGridPin | undefined): MenuSection[] {
    const direction = sort.find((item) => item.columnId === column.id)?.direction;
    const sorting: MenuSection = {
      key: 'sort',
      items: [
        { key: 'asc', label: 'Ordenar crescente', checked: direction === 'asc', onSelect: () => applySort(sortBy(sort, column.id, 'asc')) },
        { key: 'desc', label: 'Ordenar decrescente', checked: direction === 'desc', onSelect: () => applySort(sortBy(sort, column.id, 'desc')) },
        direction
          ? { key: 'clear', label: 'Remover da ordenação', onSelect: () => applySort(sortBy(sort, column.id, null)) }
          : { key: 'stack', label: 'Somar à ordenação', shortcut: 'Shift+Enter', onSelect: () => applySort(toggleSort(sort, column.id, true)) },
      ],
    };
    const pinning: MenuSection = {
      key: 'pin',
      items: [
        ...(['start', 'end'] as const)
          .filter((side) => side !== pin)
          .map((side) => ({ key: side, label: `Fixar ${PIN_NAMES[side]}`, onSelect: () => pinColumnTo(column.id, side) })),
        ...(pin ? [{ key: 'unpin', label: 'Desafixar', onSelect: () => pinColumnTo(column.id, null) }] : []),
      ],
    };
    const arranging: MenuSection = {
      key: 'arrange',
      items: [
        { key: 'fit', label: 'Ajustar largura ao conteúdo', onSelect: () => fitColumn(column.id) },
        {
          key: 'left',
          label: 'Mover para a esquerda',
          shortcut: 'Ctrl+Shift+←',
          shortcutKeys: 'Control+Shift+ArrowLeft',
          disabled: moveColumn(columnState, column.id, -1) === columnState,
          onSelect: () => moveColumnBy(column.id, -1),
        },
        {
          key: 'right',
          label: 'Mover para a direita',
          shortcut: 'Ctrl+Shift+→',
          shortcutKeys: 'Control+Shift+ArrowRight',
          disabled: moveColumn(columnState, column.id, 1) === columnState,
          onSelect: () => moveColumnBy(column.id, 1),
        },
        { key: 'hide', label: 'Ocultar coluna', disabled: columnIds.length === 1, onSelect: () => hideColumn(column.id) },
      ],
    };

    return column.sortable === false ? [pinning, arranging] : [sorting, pinning, arranging];
  }

  function renderHeaderCell(column: (typeof rowColumns)[number], index: number) {
    const item = placed[index];
    const sortIndex = sort.findIndex((sortItem) => sortItem.columnId === column.id);
    const sortable = column.sortable !== false;
    const host = index === 0;

    return (
      <DataGridHeaderCell
        canDrop={() =>
          draggedColumn.current !== null && moveColumnTo(columnState, draggedColumn.current, column.id) !== columnState
        }
        className={[
          styles.cell,
          styles.headerCell,
          styles[columnAlign(column)],
          sortable && styles.sortable,
          host && (withDetail || selectionMode !== 'none') && styles.withControls,
          column.className,
        ]
          .filter(Boolean)
          .join(' ')}
        colIndex={index + 1}
        columnId={column.id}
        controls={
          host && (
            <>
              {withDetail && <span className={styles.control} />}
              {multiple && (
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
              {selectionMode === 'single' && <span className={styles.control} />}
            </>
          )
        }
        focused={activeFocus.rowKey === null && activeFocus.columnId === column.id}
        header={column.header}
        key={column.id}
        label={column.renderHeader ? column.renderHeader(column) : column.header}
        labelId={`${baseId}-header-${index}`}
        menuItems={menuColumnId === column.id ? columnMenu(column, item.pin) : NO_MENU}
        menuOpen={menuColumnId === column.id}
        sortCount={sort.length}
        sortIndex={sortIndex}
        sortItem={sort[sortIndex]}
        style={column.style}
        width={item.width - (host ? controlsWidth : 0)}
        onDragStart={() => {
          draggedColumn.current = column.id;
        }}
        onDragEnd={() => {
          draggedColumn.current = null;
        }}
        onDrop={() => {
          const source = draggedColumn.current;
          if (source) {
            const next = moveColumnTo(columnState, source, column.id);
            if (next !== columnState) {
              changeColumns(next, `${headerOf(source)} movida`);
            }
          }
        }}
        onFit={() => fitColumn(column.id)}
        onFocus={() => setFocus({ rowKey: null, columnId: column.id })}
        onMenuOpenChange={(open) => {
          setMenuColumnId(open ? column.id : null);
          /* Clicar fora deixa o foco onde caiu: o fechamento chega com ele já fora do menu. */
          if (!open && document.activeElement?.closest('[role="menu"]')) {
            requestAnimationFrame(() => latest.current.returnToHeader(column.id));
          }
        }}
        onResize={(width) => setColumnState(resizeColumn(columnState, column.id, width))}
        onSort={sortable ? (event) => applySort(toggleSort(sort, column.id, event.shiftKey)) : undefined}
      />
    );
  }

  function renderRow(item: DataGridBodyItem, index: number) {
    const row = visibleRows[item.rowIndex];

    return (
      <DataGridRow
        ariaRowIndex={rowOffset + item.rowIndex + 2}
        columns={rowColumns}
        expanded={hasDetail(row) ? expandedSet.has(item.rowKey) : undefined}
        focusedColumnId={activeFocus.rowKey === item.key ? activeFocus.columnId : undefined}
        height={ROW_HEIGHT}
        key={item.key}
        level={withDetail ? level : undefined}
        row={row}
        rowKey={item.rowKey}
        selectable={selectionMode !== 'none'}
        selected={selectionMode === 'none' ? undefined : selectedSet.has(item.rowKey)}
        top={layout.offsets[index]}
        withExpander={withDetail}
        onCellFocus={focusFromRow}
        onRowClick={rowClickAction === 'none' ? undefined : clickFromRow}
        onToggle={toggleFromRow}
        onToggleExpanded={toggleDetailFromRow}
      />
    );
  }

  function renderDetailRow(item: DataGridBodyItem, index: number, render: NonNullable<typeof renderDetail>) {
    const row = visibleRows[item.rowIndex];

    return (
      <DataGridDetailRow
        colCount={columnIds.length}
        focused={activeFocus.rowKey === item.key}
        key={item.key}
        label={`Detalhe de ${rowLabelOf(row, item.rowKey)}`}
        level={level}
        path={detailPathOf(gridPath, item.rowKey)}
        render={render}
        root={root}
        row={row}
        rowKey={item.rowKey}
        top={layout.offsets[index]}
        onFocusDetail={focusFromDetail}
      />
    );
  }

  function renderMessage(content: ReactNode, alert = false) {
    return (
      <div aria-rowindex={2} className={styles.messageRow} role="row">
        <div aria-colindex={1} aria-colspan={columnIds.length} className={styles.message} role="gridcell">
          {alert ? <div role="alert">{content}</div> : content}
        </div>
      </div>
    );
  }

  const showsMessage = Boolean(error) || (rowKeys.length === 0 && !loading);
  const emptyContent =
    emptyMessage ?? (search.trim() ? `Nenhum registro atende à busca "${search.trim()}".` : 'Nenhum registro.');

  return (
    <DataGridScrollContext.Provider value={nested ? outerScroll : ownScroll}>
      <DataGridContext.Provider value={contextValue}>
        <div {...props} className={[styles.dataGrid, nested && styles.nested, className].filter(Boolean).join(' ')}>
          {children}
          <div className={styles.viewport}>
            <div
              className={styles.scroller}
              data-scrolled-end={edges.end || undefined}
              data-scrolled-start={edges.start || undefined}
              ref={scrollerRef}
              style={{
                height: nested ? undefined : height,
                ...(withDetail && viewWidth > 0 && { '--data-grid-view-width': `${viewWidth}px` }),
              }}
              onScroll={() => {
                readEdges();
                if (!nested) {
                  root.scrolled();
                }
              }}
            >
              <div
                aria-busy={loading || undefined}
                aria-colcount={columnIds.length}
                aria-label={label}
                aria-multiselectable={multiple || undefined}
                aria-rowcount={showsMessage ? 2 : totalRows + 1}
                className={styles.grid}
                role={withDetail ? 'treegrid' : 'grid'}
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
                <div
                  className={styles.body}
                  ref={bodyRef}
                  role="rowgroup"
                  style={{ height: error || !rowKeys.length ? undefined : totalHeight(layout) }}
                >
                  {error
                    ? renderMessage(error, true)
                    : rowKeys.length === 0
                      ? loading
                        ? null
                        : renderMessage(emptyContent)
                      : drawnIndexes.map((index) => {
                          const item = items[index];
                          return item.detail && renderDetail
                            ? renderDetailRow(item, index, renderDetail)
                            : renderRow(item, index);
                        })}
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
    </DataGridScrollContext.Provider>
  );
}

DataGrid.Toolbar = DataGridToolbar;
DataGrid.Search = DataGridSearch;
DataGrid.DetailLayout = DataGridDetailLayout;
