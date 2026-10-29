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
import { Button } from '../../actions/Button';
import { selectionStatus, select, selectRange, toggleAll, type SelectionState } from '../../../hooks/useSelection/selection';
import { formatNumber } from '../../../utils/formatters';
import { isDevelopment } from '../../../utils/isDevelopment';
import { Spinner } from '../../feedback/Spinner';
import { Checkbox } from '../../forms/Checkbox';
import { IconChevronRight } from '../../icons';
import { Pagination } from '../../navigation/Pagination';
import type { MenuSection } from '../../overlays/Menu';
import {
  effectiveHidden,
  flattenColumns,
  headerSegments,
  moveColumn,
  moveColumnTo,
  normalizeColumnState,
  pinColumn,
  placeColumns,
  resizeColumn,
  setColumnHidden,
  toggleGroupCollapsed,
  type DataGridColumnGroupSizing,
  type DataGridColumnSizing,
  type DataGridColumnState,
  type DataGridGroupInfo,
  type DataGridHeaderSegment,
  type DataGridPin,
  type DataGridPlacedColumn,
} from './columnLayout';
import {
  activeFilterOf,
  columnFilterOf,
  EMPTY_FILTER,
  filteredColumnIds,
  filterKindOf,
  normalizeFilter,
  operatorsOf,
  setColumnFilter,
  type DataGridFilter,
} from './filterModel';
import { dataGridCsvExporter } from './exporters';
import type { DataGridExporter, DataGridExportModel, DataGridExportScope } from './exportModel';
import { aggregatorOf } from './summaries';
import { buildTree, flattenTree, parentKeysOf, pruneTree, sortTree, topRows, treeRows } from './treeModel';
import {
  bodyItems,
  cellText,
  cellValue,
  clampPage,
  columnAlign,
  detailKeyOf,
  detailPathOf,
  distinctTexts,
  filterRows,
  moveFocus,
  pageCountOf,
  pageRows,
  reconcileFocus,
  restoreSnapshot,
  searchRows,
  isDensity,
  ROW_HEIGHTS,
  snapshotLayoutOf,
  snapshotOf,
  sortBy,
  sortRows,
  summarize,
  summaryText,
  toggleExpanded,
  toggleSort,
  type DataGridBodyItem,
  type DataGridColumnModel,
  type DataGridDensity,
  type DataGridExpandMode,
  type DataGridFocus,
  type DataGridFocusMove,
  type DataGridSnapshot,
  type DataGridSortItem,
  type DataGridState,
} from './gridState';
import { DataGridContext, DataGridLevelContext, DataGridScrollContext } from './dataGridContext';
import { DataGridSearch, DataGridTableMenu, DataGridToolbar } from './DataGridToolbar';
import { DataGridRow, type DataGridCellContext } from './DataGridRow';
import { DataGridDetailRow, DETAIL_ESTIMATE, type DataGridDetailContext } from './DataGridDetail';
import { DataGridDetailLayout } from './DataGridDetailLayout';
import { DataGridFilterPanel, type DataGridFilterApplyMode } from './DataGridFilterPanel';
import { DataGridHeaderCell, MIN_COLUMN_WIDTH } from './DataGridHeaderCell';
import { buildRowLayout, rowAt, totalHeight, visibleWindow } from './rowLayout';
import { DataGridScrollRoot } from './scrollRoot';
import styles from './DataGrid.module.css';

const OVERSCAN = 6;
const DEFAULT_HEIGHT = 480;
/** Teto do ajuste ao conteúdo: um texto longo não toma a tela inteira. */
const MAX_FIT_WIDTH = 480;
/** Espaço de cada controle da linha, a seta e a caixa de seleção, somado à coluna que os recebe. */
const CONTROL_WIDTH = 24;
const CELL_SELECTOR = '[data-column], [data-detail]';
/** Chave de foco da linha de sumarização, que não colide com nenhuma linha. */
const SUMMARY_KEY = '\u0001summary';
const GRID_SELECTOR = '[role="grid"], [role="treegrid"]';
const INTERACTIVE_SELECTOR = 'a, button, input, label, select, textarea';

/** Controles dentro da célula usam `tabIndex={-1}`: a grade tem uma parada de Tab só, e Enter entra na célula. */
export interface DataGridColumn<Row> extends DataGridColumnModel<Row>, DataGridColumnSizing {
  renderCell?: (context: DataGridCellContext<Row>) => ReactNode;
  renderHeader?: (column: DataGridColumn<Row>) => ReactNode;
}

/** Grupo de títulos acima das colunas de `children`, em quantos níveis houver. */
export type DataGridColumnGroup<Row> = DataGridColumnGroupSizing<DataGridColumn<Row>>;

export type DataGridColumnDefinition<Row> = DataGridColumn<Row> | DataGridColumnGroup<Row>;

export type DataGridSelectionMode = 'none' | 'single' | 'multiple';

export type DataGridRowClickAction = 'none' | 'expand' | 'select' | 'activate';

/** O que o modo servidor pede a cada mudança: a resposta são as linhas da página, o total e os agregados pedidos. */
export interface DataGridQuery extends DataGridState {
  summaries: readonly { aggregator: string; columnId: string }[];
}

export interface DataGridProps<Row> extends Omit<ComponentPropsWithRef<'div'>, 'children' | 'onChange'> {
  /** Partes da grade, como `DataGrid.Toolbar`, desenhadas acima dela. */
  children?: ReactNode;
  /** Ordem, ocultas, fixas e larguras, como a pessoa deixou pelo menu da coluna e pelo arrasto. */
  columnState?: DataGridColumnState;
  /** Lista estável, memorizada pelo produto: uma lista nova a cada desenho refaz a busca e a ordenação. */
  columns: readonly DataGridColumnDefinition<Row>[];
  /** No servidor, `rows` é a página atual e `totalRows` o total; a busca, a ordem e a página vão por `onQueryChange`. */
  dataMode?: 'client' | 'server';
  /** Altura das linhas: 32, 40 ou 48 pixels. */
  density?: DataGridDensity;
  /** Parcial: o que faltar sai da definição das colunas. */
  defaultColumnState?: Partial<DataGridColumnState>;
  defaultDensity?: DataGridDensity;
  defaultExpandedIds?: readonly string[];
  defaultFilter?: DataGridFilter;
  defaultPage?: number;
  defaultPageSize?: number;
  defaultSearch?: string;
  defaultSelectedIds?: readonly string[];
  defaultSort?: readonly DataGridSortItem[];
  /** Texto da grade vazia. Com busca, o padrão diz que nada a atende. */
  emptyMessage?: ReactNode;
  /** Falha ao carregar, mostrada no lugar das linhas. */
  error?: ReactNode;
  /** Formatos do menu da tabela. O CSV vem no núcleo; XLSX e PDF entram por exportador do produto. */
  exporters?: readonly DataGridExporter[];
  expandedIds?: readonly string[];
  /** Na `single`, abrir um detalhe fecha o que estava aberto. */
  expandMode?: DataGridExpandMode;
  /** Condições por coluna, em grupos E/OU. O funil de cada título edita a da sua coluna. */
  filter?: DataGridFilter;
  /** `button` só filtra no "Aplicar" do painel, para filtros caros no servidor. */
  filterApplyMode?: DataGridFilterApplyMode;
  /** Árvore: os filhos de cada linha, na mesma grade; `undefined` enquanto não carregaram. Memorizada, como `columns`. */
  getChildren?: (row: Row) => readonly Row[] | undefined;
  getRowId: (row: Row) => string;
  /** Altura da área rolável, em pixels. Na grade aninhada não vale: ela rola com a de fora. */
  height?: number;
  /** Retrato salvo por `onStateChange`, aplicado de uma vez na montagem. Vence os valores `default*`. */
  initialState?: unknown;
  label: string;
  loading?: boolean;
  onColumnStateChange?: (state: DataGridColumnState) => void;
  onDensityChange?: (density: DataGridDensity) => void;
  onExpandedIdsChange?: (ids: readonly string[]) => void;
  onFilterChange?: (filter: DataGridFilter) => void;
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
  /** Filhos ainda por carregar: a seta aparece, e abrir avisa por `onExpandedIdsChange`, inclusive na expansão inicial. */
  rowHasChildren?: (row: Row) => boolean;
  /** Sem ela, toda linha tem detalhe. Memorizada pelo produto, como `columns`. */
  rowHasDetail?: (row: Row) => boolean;
  rows: readonly Row[];
  search?: string;
  selectedIds?: readonly string[];
  selectionMode?: DataGridSelectionMode;
  sort?: readonly DataGridSortItem[];
  /** No servidor, os agregados da linha de sumarização, pelo id da coluna, vindos na resposta da consulta. */
  summaryValues?: Readonly<Record<string, unknown>>;
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

const DEFAULT_EXPORTERS = [dataGridCsvExporter];
const SCOPE_NAMES: Record<Exclude<DataGridExportScope, 'selected'>, string> = { filtered: '', page: ' da página' };

const PIN_NAMES: Record<DataGridPin, string> = { start: 'à esquerda', end: 'à direita' };
const NO_MENU: MenuSection[] = [];
/** Teto do "expandir os da tela". */
const EXPAND_LIMIT = 10;
const DENSITIES: { key: DataGridDensity; label: string }[] = [
  { key: 'compact', label: 'Compacta' },
  { key: 'normal', label: 'Padrão' },
  { key: 'comfortable', label: 'Confortável' },
];

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
  columns: definitions,
  dataMode = 'client',
  defaultColumnState,
  defaultDensity = 'normal',
  density: densityProp,
  defaultExpandedIds = [],
  defaultFilter = EMPTY_FILTER,
  defaultPage = 1,
  defaultPageSize,
  defaultSearch = '',
  defaultSelectedIds = [],
  defaultSort = [],
  emptyMessage,
  error,
  exporters = DEFAULT_EXPORTERS,
  expandedIds: expandedIdsProp,
  expandMode = 'multiple',
  filter: filterProp,
  filterApplyMode = 'immediate',
  getChildren,
  getRowId,
  height = DEFAULT_HEIGHT,
  initialState,
  label,
  loading = false,
  onColumnStateChange,
  onDensityChange,
  onExpandedIdsChange,
  onFilterChange,
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
  rowHasChildren,
  rowHasDetail,
  rows,
  search: searchProp,
  selectedIds: selectedIdsProp,
  selectionMode = 'none',
  sort: sortProp,
  summaryValues,
  totalRows: totalRowsProp,
  ...props
}: DataGridProps<Row>) {
  const { columns, groupsOf } = useMemo(() => flattenColumns(definitions), [definitions]);
  const groupIds = useMemo(
    () => [...new Set([...groupsOf.values()].flatMap((path) => path.map((group) => group.id)))],
    [groupsOf],
  );

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
    const fallback = {
      sort: defaultSort,
      search: defaultSearch,
      filter: normalizeFilter(defaultFilter, columns),
      page: defaultPage,
      pageSize: defaultPageSize ?? pageSizeOptions[0],
    };
    const snapshot = memory ?? restoreSnapshot(initialState, columns, fallback);

    return pageSizeOptions.includes(snapshot.pageSize) ? snapshot : { ...snapshot, pageSize: fallback.pageSize };
  });
  const [sort, setSort] = useSlice(sortProp, restored.sort, onSortChange);
  const [search, setSearch] = useSlice(searchProp, restored.search, onSearchChange);
  const [filter, setFilter] = useSlice(filterProp, restored.filter, onFilterChange);
  const activeFilter = useMemo(() => activeFilterOf(filter, columns), [filter, columns]);
  const [page, setPage] = useSlice(pageProp, restored.page, onPageChange);
  const [pageSize, setPageSize] = useSlice(pageSizeProp, restored.pageSize, onPageSizeChange);
  const [selectedIds, setSelectedIds] = useSlice(selectedIdsProp, memory?.selectedIds ?? defaultSelectedIds, onSelectedIdsChange);
  const [expandedIds, setExpandedIds] = useSlice(expandedIdsProp, memory?.expandedIds ?? defaultExpandedIds, onExpandedIdsChange);
  const [savedLayout] = useState(() => snapshotLayoutOf(initialState));
  const [savedColumnState] = useState(
    () => memory?.columns ?? normalizeColumnState(savedLayout.columns ?? defaultColumnState, columns, groupIds),
  );
  const [density, setDensity] = useSlice(
    densityProp,
    memory?.density ?? (isDensity(savedLayout.density) ? savedLayout.density : defaultDensity),
    onDensityChange,
  );
  const rowHeight = ROW_HEIGHTS[density];
  const [fullScreen, setFullScreen] = useState(false);
  const [rawColumnState, setColumnState] = useSlice(columnStateProp, savedColumnState, onColumnStateChange);
  /* Concilia a cada troca das colunas: a coluna nova entra, a removida sai, inclusive no estado controlado. */
  const columnState = useMemo(
    () => normalizeColumnState(rawColumnState, columns, groupIds),
    [rawColumnState, columns, groupIds],
  );
  /* Na tela, saem também as colunas de um grupo recolhido; o estado guarda só as ocultas pela pessoa. */
  const shownState = useMemo(
    () => ({ ...columnState, hidden: effectiveHidden(columnState, columns, groupsOf) }),
    [columnState, columns, groupsOf],
  );
  const [announcement, setAnnouncementState] = useState({ text: '', repeat: false });
  /* O mesmo aviso duas vezes não mudaria a região viva, e o leitor de tela o calaria. */
  const setAnnouncement = (text: string) => setAnnouncementState((current) => ({ text, repeat: !current.repeat }));
  const anchorKey = useRef<string>(undefined);
  const baseId = useId();

  const server = dataMode === 'server';
  const hiddenKey = shownState.hidden.join('\n');
  const searchColumns = useMemo(
    () => columns.filter((column) => !hiddenKey.split('\n').includes(column.id)),
    [columns, hiddenKey],
  );
  const rowIdOf = useRef(getRowId);
  rowIdOf.current = getRowId;
  const tree = getChildren !== undefined;
  /* Na árvore, a busca e o filtro passam por todas as linhas carregadas; a poda mantém o caminho até quem atende. */
  const branches = useMemo(() => (getChildren ? buildTree(rows, getChildren) : null), [rows, getChildren]);
  const allRows = useMemo(() => (branches ? treeRows(branches) : rows), [branches, rows]);
  const searched = useMemo(
    () => (server ? allRows : searchRows(allRows, searchColumns, search)),
    [server, allRows, searchColumns, search],
  );
  const filtered = useMemo(
    () => (server ? searched : filterRows(searched, columns, filter)),
    [server, searched, columns, filter],
  );
  const sorted = useMemo(
    () => (server || tree ? filtered : sortRows(filtered, columns, sort)),
    [server, tree, filtered, columns, sort],
  );
  /* Sem busca nem filtro, nada a podar. */
  const treeKept = useMemo(
    () => (branches && !server && filtered.length !== allRows.length ? new Set(filtered) : null),
    [branches, server, filtered, allRows],
  );
  const treeBranches = useMemo(() => {
    if (!branches || server) {
      return branches;
    }

    const kept = treeKept ? pruneTree(branches, treeKept) : branches;
    return sortTree(kept, (siblings) => sortRows(siblings, columns, sort));
  }, [branches, server, treeKept, columns, sort]);
  const parentKeys = useMemo(
    () => (branches ? parentKeysOf(branches, (row) => rowIdOf.current(row)) : null),
    [branches],
  );
  const expandedSet = useMemo(() => new Set(expandedIds), [expandedIds]);
  const nodes = useMemo(
    () =>
      treeBranches &&
      flattenTree(
        treeBranches,
        (row) => rowIdOf.current(row),
        (key) => expandedSet.has(key),
        (row) => rowHasChildren?.(row) ?? false,
      ),
    [treeBranches, expandedSet, rowHasChildren],
  );
  /* A árvore pagina pelas raízes: os filhos acompanham a raiz de que descendem. */
  const totalRows = server ? (totalRowsProp ?? rows.length) : (treeBranches?.length ?? sorted.length);
  const currentPage = !pagination ? 1 : server ? page : clampPage(page, totalRows, pageSize);
  const pageNodes = useMemo(() => {
    if (!nodes || server || !pagination) {
      return nodes;
    }

    const start = (currentPage - 1) * pageSize;
    return nodes.filter((node) => node.rootIndex >= start && node.rootIndex < start + pageSize);
  }, [nodes, server, pagination, currentPage, pageSize]);
  const visibleRows = useMemo(
    () =>
      pageNodes ? pageNodes.map((node) => node.row) : server || !pagination ? sorted : pageRows(sorted, currentPage, pageSize),
    [pageNodes, server, pagination, sorted, currentPage, pageSize],
  );
  const rowKeys = useMemo(
    () => (pageNodes ? pageNodes.map((node) => node.key) : visibleRows.map((row) => rowIdOf.current(row))),
    [pageNodes, visibleRows],
  );
  const nodeOf = useMemo(() => new Map((pageNodes ?? []).map((node) => [node.key, node])), [pageNodes]);
  const withDetail = renderDetail !== undefined && !tree;
  const expandable = withDetail || tree;
  const controlsWidth = (selectionMode === 'none' ? 0 : CONTROL_WIDTH) + (expandable ? CONTROL_WIDTH : 0);
  const [viewWidth, setViewWidth] = useState(0);
  const placed = useMemo(
    () => placeColumns(columns, shownState, viewWidth, controlsWidth),
    [columns, shownState, viewWidth, controlsWidth],
  );
  const columnIds = useMemo(() => placed.map((item) => item.column.id), [placed]);
  const summaryRequests = useMemo(
    () =>
      placed.flatMap(({ column }) => {
        const aggregator = aggregatorOf(column.summary);
        return aggregator ? [{ columnId: column.id, aggregator: aggregator.id }] : [];
      }),
    [placed],
  );
  const withSummary = placed.some((item) => item.column.summary !== undefined);
  const showsSummary = withSummary && !error;
  const summary = useMemo(
    () =>
      !withSummary
        ? {}
        : server
          ? (summaryValues ?? {})
          : summarize(treeBranches ? topRows(treeBranches, treeKept) : filtered, columns),
    [withSummary, server, summaryValues, treeBranches, treeKept, filtered, columns],
  );
  /* Na árvore, a posição conta as linhas abertas das páginas de antes; no servidor, que não as conhece, só as desta. */
  const rowOffset = !pagination
    ? 0
    : nodes && pageNodes
      ? server
        ? 0
        : Math.max(nodes.indexOf(pageNodes[0]), 0)
      : (currentPage - 1) * pageSize;

  const state: DataGridState = { sort, search, filter, page: currentPage, pageSize };
  const stateKey = JSON.stringify(state);
  /* Mostrar ou ocultar uma coluna com total muda os agregados que o servidor precisa mandar. */
  const queryKey = stateKey + JSON.stringify(summaryRequests);
  const snapshotKey = stateKey + JSON.stringify(columnState) + density;
  /* No servidor a primeira consulta sai na montagem: o retrato restaurado pode diferir do que o produto guardou. */
  const lastQueryKey = useRef<string | null>(server ? (memory?.queryKey ?? null) : queryKey);
  const lastSnapshotKey = useRef(snapshotKey);

  useEffect(() => {
    if (tree && renderDetail && isDevelopment()) {
      console.warn(`DataGrid "${label}": getChildren e renderDetail não se combinam; com a árvore, o detalhe é ignorado.`);
    }
  }, [tree, renderDetail, label]);

  useEffect(() => {
    if (nested) {
      root.memories.set(gridPath, { ...state, columns: columnState, density, expandedIds, queryKey, selectedIds });
    }
    if (snapshotKey !== lastSnapshotKey.current) {
      lastSnapshotKey.current = snapshotKey;
      onStateChange?.(snapshotOf(state, columnState, density));
    }
    if (queryKey !== lastQueryKey.current) {
      lastQueryKey.current = queryKey;
      if (server) {
        onQueryChange?.({ ...state, summaries: summaryRequests });
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
      const found = filterRows(searchRows(allRows, searchColumns, next), columns, filter).length;
      setAnnouncement(term ? `${found} ${found === 1 ? 'linha encontrada' : 'linhas encontradas'} para "${term}"` : 'Busca limpa');
    }
  }

  function applyFilter(next: DataGridFilter) {
    setFilter(next);
    backToFirstPage();
    if (server) {
      setAnnouncement(next.conditions.length > 0 ? 'Filtro aplicado' : 'Filtros limpos');
      return;
    }

    const found = filterRows(searched, columns, next).length;
    setAnnouncement(
      next.conditions.length > 0 ? `${found} de ${searched.length} ${searched.length === 1 ? 'linha' : 'linhas'} após o filtro` : 'Filtros limpos',
    );
  }

  function clearFilters() {
    setFilter(EMPTY_FILTER);
    setSearch('');
    backToFirstPage();
    setAnnouncement(search.trim() ? 'Filtros e busca limpos' : 'Filtros limpos');
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

  function groupKeyOf(columnId: string) {
    return groupsOf.get(columnId)?.at(-1)?.id ?? '';
  }

  /* O passo conta só as colunas na tela, e a nova ordem volta ao estado sem as que o grupo recolhido escondeu. */
  function steppedOrder(columnId: string, step: -1 | 1) {
    const next = moveColumn(shownState, columnId, step, groupKeyOf);
    return next === shownState ? null : next.order;
  }

  function droppedOrder(columnId: string, targetId: string) {
    const next = moveColumnTo(shownState, columnId, targetId, groupKeyOf);
    return next === shownState ? null : next.order;
  }

  function moveColumnBy(columnId: string, step: -1 | 1) {
    const order = steppedOrder(columnId, step);

    if (!order) {
      setAnnouncement(`${headerOf(columnId)} não sai do próprio grupo nem passa da divisa das fixas`);
      return;
    }

    const next = { ...columnState, order };
    const position = placeColumns(columns, { ...shownState, order }, 0, 0).findIndex((item) => item.column.id === columnId) + 1;
    changeColumns(next, `${headerOf(columnId)} na posição ${position} de ${columnIds.length}`);
  }

  function toggleGroup(group: DataGridGroupInfo) {
    const collapsing = !columnState.collapsedGroups.includes(group.id);
    changeColumns(toggleGroupCollapsed(columnState, group.id), `${group.header} ${collapsing ? 'recolhido' : 'expandido'}`);
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

  const hasDetail = useCallback((row: Row) => withDetail && (rowHasDetail?.(row) ?? true), [withDetail, rowHasDetail]);

  function canExpand(row: Row, rowKey: string) {
    return tree ? (nodeOf.get(rowKey)?.expandable ?? false) : hasDetail(row);
  }
  const items = useMemo(
    () =>
      bodyItems(
        rowKeys,
        (rowKey, index) => expandedSet.has(rowKey) && hasDetail(visibleRows[index]),
      ),
    [rowKeys, visibleRows, expandedSet, hasDetail],
  );
  const itemKeys = useMemo(() => items.map((item) => item.key), [items]);
  /* A sumarização entra na navegação depois da última linha; com falha, a mensagem toma o lugar das linhas. */
  const navKeys = useMemo(
    () => (error ? [] : showsSummary ? [...itemKeys, SUMMARY_KEY] : itemKeys),
    [error, showsSummary, itemKeys],
  );

  function rowLabelOf(row: Row, rowKey: string) {
    const first = placed[0]?.column;
    return (first && cellText(first, row)) || rowKey;
  }

  function toggleRowExpanded(rowKey: string) {
    const row = visibleRows[rowKeys.indexOf(rowKey)];

    if (!row || !canExpand(row, rowKey)) {
      return;
    }

    const opening = !expandedSet.has(rowKey);
    setExpandedIds(toggleExpanded(expandedIds, rowKey, tree ? 'multiple' : expandMode));
    setAnnouncement(`${rowLabelOf(row, rowKey)} ${opening ? 'expandido' : 'recolhido'}`);
  }

  const [focus, setFocus] = useState<DataGridFocus>({ rowKey: null, columnId: columnIds[0] });
  const lastFocusedIndex = useRef(0);
  const lastFocusedColumn = useRef(0);
  const activeFocus = reconcileFocus(focus, navKeys, columnIds, lastFocusedIndex.current, lastFocusedColumn.current, (key) =>
    parentKeys?.get(key),
  );
  const pendingFocus = useRef(false);
  const gridHasFocus = useRef(false);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectableItems = useMemo(
    () => (nodes ? nodes.map((node) => ({ key: node.key })) : sorted.map((row) => ({ key: rowIdOf.current(row) }))),
    [nodes, sorted],
  );

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
      toggleRowExpanded(rowKey);
    } else if (rowClickAction === 'select' && selectionMode !== 'none') {
      toggleRow(rowKey, range);
    } else if (rowClickAction === 'activate') {
      const row = visibleRows[rowKeys.indexOf(rowKey)];
      if (row) {
        onRowActivate?.(row);
      }
    }
  }

  /* O clique num Popover ou Menu da célula atravessa o portal pela árvore do React: não é clique na linha. */
  function clickRow(rowKey: string, event: MouseEvent) {
    const target = event.target as Element;
    if ((event.currentTarget as Element).contains(target) && !target.closest(INTERACTIVE_SELECTOR)) {
      runRowAction(rowKey, event.shiftKey);
    }
  }

  /* Os da tela, a partir da primeira linha visível, com teto: abrir centenas de detalhes de uma vez pesa na tela. */
  function expandOnScreen() {
    const scroller = root.scroller;
    const body = bodyRef.current;
    const viewTop = scroller && body ? scroller.scrollTop + root.headHeight() - root.contentTop(body) : 0;
    const first = items[rowAt(layout, Math.max(viewTop, 0))]?.rowIndex ?? 0;
    const opening = visibleRows
      .slice(first)
      .filter((row, index) => canExpand(row, rowKeys[first + index]) && !expandedSet.has(rowKeys[first + index]))
      .slice(0, EXPAND_LIMIT)
      .map((row) => rowIdOf.current(row));

    if (opening.length === 0) {
      return;
    }

    setExpandedIds([...expandedIds, ...opening]);
    const opened = tree ? ['linha aberta', 'linhas abertas'] : ['detalhe aberto', 'detalhes abertos'];
    setAnnouncement(`${opening.length} ${opened[opening.length === 1 ? 0 : 1]}`);
  }

  /* As colunas na ordem da tela e as linhas do escopo na ordem atual; na árvore, com os ramos todos abertos. */
  /* Na árvore, a exportação leva os ramos todos abertos, e não só os da tela. */
  function everyTreeNode() {
    return (
      treeBranches &&
      flattenTree(
        treeBranches,
        (row) => rowIdOf.current(row),
        () => true,
        () => false,
      )
    );
  }

  function exportModelOf(scope: DataGridExportScope): DataGridExportModel {
    const exported = placed.map((item) => item.column);
    const everyNode = everyTreeNode();
    const flat = (list: readonly Row[]) => list.map((row) => ({ row, depth: 0, key: rowIdOf.current(row) }));
    const scoped = server || scope === 'page' ? (pageNodes ?? flat(visibleRows)) : (everyNode ?? flat(sorted));
    const chosen = scope === 'selected' ? scoped.filter((item) => selectedSet.has(item.key)) : scoped;

    return {
      title: label,
      scope,
      tree,
      columns: exported.map((column) => ({
        header: column.header,
        id: column.id,
        numeric: (column.type === 'number' || column.type === 'currency') && !column.format,
      })),
      rows: chosen.map(({ row, depth }) => ({
        depth,
        cells: exported.map((column) => ({ text: cellText(column, row), value: cellValue(column, row) })),
      })),
      summary:
        showsSummary && scope === 'filtered' && !server
          ? exported.map((column, index) => ({
              text: aggregatorOf(column.summary) ? summaryText(column, summary[column.id]) : index === 0 ? 'Total' : '',
              value: summary[column.id],
            }))
          : undefined,
    };
  }

  /* Só as selecionadas que o escopo alcança: a que o filtro escondeu, ou que está em outra página do servidor, não vai. */
  function exportItems() {
    const reachable = server ? rowKeys : (everyTreeNode()?.map((node) => node.key) ?? selectableItems.map((item) => item.key));
    const selectedCount = reachable.filter((key) => selectedSet.has(key)).length;
    const selectedName = selectedCount === 1 ? ' da selecionada' : ` das ${selectedCount} selecionadas`;
    const scopes: DataGridExportScope[] = [
      server ? 'page' : 'filtered',
      ...(selectedCount > 0 ? ['selected' as const] : []),
      ...(pagination && !server ? ['page' as const] : []),
    ];

    return exporters.flatMap((exporter) =>
      scopes.map((scope) => ({
        key: `${exporter.id}-${scope}`,
        label: `${exporter.label}${scope === 'selected' ? selectedName : SCOPE_NAMES[scope]}`,
        onSelect: async () => {
          try {
            await exporter.export(exportModelOf(scope));
            setAnnouncement(`${exporter.label} exportado`);
          } catch {
            setAnnouncement(`Não foi possível exportar ${exporter.label}`);
          }
        },
      })),
    );
  }

  function restoreDefaults() {
    setSort(defaultSort);
    setSearch(defaultSearch);
    setFilter(normalizeFilter(defaultFilter, columns));
    setPage(defaultPage);
    setPageSize(defaultPageSize ?? pageSizeOptions[0]);
    setColumnState(normalizeColumnState(defaultColumnState, columns, groupIds));
    setDensity(defaultDensity);
    setAnnouncement('Padrão restaurado');
  }

  function tableMenu(): MenuSection[] {
    const visible = new Set(columnIds);
    const sections: MenuSection[] = [
      {
        key: 'layout',
        items: [
          {
            key: 'columns',
            label: 'Colunas',
            items: columns.map((column) => {
              const shown = !columnState.hidden.includes(column.id);
              return {
                key: column.id,
                label: column.header,
                checked: shown,
                disabled: shown && visible.has(column.id) && visible.size === 1,
                onSelect: () =>
                  changeColumns(
                    setColumnHidden(columnState, column.id, shown),
                    `${column.header} ${shown ? 'oculta' : 'visível'}`,
                  ),
              };
            }),
          },
          {
            key: 'density',
            label: 'Densidade',
            items: DENSITIES.map(({ key, label: densityLabel }) => ({
              key,
              label: densityLabel,
              checked: density === key,
              onSelect: () => setDensity(key),
            })),
          },
        ],
      },
    ];

    if (expandable) {
      sections.push({
        key: 'detail',
        items: [
          ...(tree || expandMode === 'multiple'
            ? [{ key: 'expand', label: `Expandir ${EXPAND_LIMIT} linhas`, onSelect: expandOnScreen }]
            : []),
          {
            key: 'collapse',
            label: 'Recolher todas',
            disabled: expandedIds.length === 0,
            onSelect: () => {
              setExpandedIds([]);
              setAnnouncement(tree ? 'Linhas recolhidas' : 'Detalhes recolhidos');
            },
          },
        ],
      });
    }

    if (exporters.length > 0) {
      sections.push({ key: 'export', items: [{ key: 'export', label: 'Exportar', items: exportItems() }] });
    }

    sections.push({
      key: 'view',
      items: [
        {
          key: 'clearFilters',
          label: 'Limpar filtros',
          disabled: filter.conditions.length === 0,
          onSelect: () => applyFilter(EMPTY_FILTER),
        },
        ...(nested
          ? []
          : [{ key: 'full', label: fullScreen ? 'Sair da tela cheia' : 'Tela cheia', onSelect: () => setFullScreen(!fullScreen) }]),
        { key: 'restore', label: 'Restaurar o padrão', onSelect: restoreDefaults },
      ],
    });

    return sections;
  }

  /* Fechado o menu por opção ou Esc, o foco volta ao título, ou ao vizinho se a coluna saiu. */
  function returnToHeader(columnId: string) {
    const active = document.activeElement;

    if (active === document.body || headRef.current?.contains(active)) {
      focusLater(reconcileFocus({ rowKey: null, columnId }, navKeys, columnIds, 0, lastFocusedColumn.current));
    }
  }

  /* As linhas memorizadas e a busca recebem funções estáveis, que chamam sempre a versão do último desenho. */
  const latest = useRef({ applyColumnFilter, clickRow, commitSearch, returnToHeader, tableMenu, toggleRow, toggleRowExpanded });
  useLayoutEffect(() => {
    latest.current = { applyColumnFilter, clickRow, commitSearch, returnToHeader, tableMenu, toggleRow, toggleRowExpanded };
  });
  /* O painel aplica depois de uma espera: a função estável não reinicia a espera e lê o filtro do último desenho. */
  const applyColumnFilterFromPanel = useCallback(
    (columnId: string, next: DataGridFilter | null) => latest.current.applyColumnFilter(columnId, next),
    [],
  );
  const tableMenuFromPart = useCallback(() => latest.current.tableMenu(), []);
  const searchFromPart = useCallback((next: string) => latest.current.commitSearch(next), []);
  const toggleFromRow = useCallback((rowKey: string, range: boolean) => latest.current.toggleRow(rowKey, range), []);
  const toggleDetailFromRow = useCallback((rowKey: string) => latest.current.toggleRowExpanded(rowKey), []);
  const clickFromRow = useCallback((rowKey: string, event: MouseEvent) => latest.current.clickRow(rowKey, event), []);
  const focusFromRow = useCallback((rowKey: string, columnId: string) => setFocus({ rowKey, columnId }), []);
  const focusFromDetail = useCallback(
    (rowKey: string) => setFocus((current) => ({ rowKey: detailKeyOf(rowKey), columnId: current.columnId })),
    [],
  );

  const scrollerRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const footRef = useRef<HTMLDivElement>(null);
  const layout = useMemo(
    () =>
      buildRowLayout(
        items.map((item) =>
          item.detail ? (root.heights.get(detailPathOf(gridPath, item.rowKey)) ?? DETAIL_ESTIMATE) : rowHeight,
        ),
      ),
    /* `version` muda a cada altura medida, em qualquer nível. */
    [items, root, gridPath, version, rowHeight],
  );
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  const [rowWindow, setRowWindow] = useState(() => visibleWindow(layout, 0, height, OVERSCAN));

  useLayoutEffect(() => {
    if (!nested) {
      root.scroller = scrollerRef.current;
      root.head = headRef.current;
      root.foot = footRef.current;
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
    const viewHeight = scroller.clientHeight > 0 ? scroller.clientHeight - headHeight - root.footHeight() : height;
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

    /* A altura também muda a janela: na tela cheia, ou quando o produto muda o espaço da grade. */
    const observer = new ResizeObserver(() => {
      setViewWidth(scroller.clientWidth);
      root.notify();
    });
    setViewWidth(scroller.clientWidth);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, [root]);

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
    if (rowKey === SUMMARY_KEY) {
      return footRef.current?.querySelector<HTMLElement>(`:scope > [role="row"] > [data-column="${column}"]`);
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
    if (next.rowKey === SUMMARY_KEY) {
      revealSummary();
      return;
    }
    revealRow(next.rowKey === null ? -1 : itemKeys.indexOf(next.rowKey));
  }

  /* Fora da grade aninhada a sumarização fica presa ao rodapé, sempre à vista. */
  function revealSummary() {
    const foot = footRef.current;
    if (nested && foot) {
      const footTop = root.contentTop(foot);
      root.reveal(footTop, footTop + foot.offsetHeight);
    }
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

    if (rowKey === null && event.altKey && event.key === 'ArrowDown') {
      event.preventDefault();
      openFilter(columnId);
      return;
    }

    if (move) {
      event.preventDefault();
      if (detailRowKey !== undefined && SIDEWAYS_MOVES.has(move)) {
        return;
      }

      const visible = Math.max((root.scroller?.clientHeight ?? 0) - root.headHeight() - root.footHeight(), rowHeight);
      const index = rowKey === null ? 0 : navKeys.indexOf(rowKey);
      const target = rowAt(layout, layout.offsets[index] + (move === 'pageUp' ? -visible : visible));
      const pageStep = Math.max(Math.abs(target - index), 1);
      goTo(moveFocus({ rowKey, columnId }, move, { rowKeys: navKeys, columnIds, pageStep }));
      return;
    }

    if (rowKey === SUMMARY_KEY) {
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
      toggleRowExpanded(rowKey);
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
  const contextValue = useMemo(
    () => ({ label, search, setSearch: searchFromPart, tableMenu: tableMenuFromPart }),
    [label, search, searchFromPart, tableMenuFromPart],
  );

  const segments = useMemo(() => headerSegments(placed, groupsOf), [placed, groupsOf]);
  const groupRows = segments.reduce((rowsAbove, segment) => Math.max(rowsAbove, segment.level + segment.rowSpan), 0);
  const [menuColumnId, setMenuColumnId] = useState<string | null>(null);
  const [filterColumnId, setFilterColumnId] = useState<string | null>(null);
  const filteredIds = useMemo(() => filteredColumnIds(activeFilter), [activeFilter]);

  /* No servidor, o conjunto só tem como saber os valores por `filterOptions`: a página tem só os que já passaram. */
  function filterKindIn(column: DataGridColumn<Row>) {
    const kind = filterKindOf(column);
    return kind === 'set' && server && !column.filterOptions ? null : kind;
  }

  function openFilter(columnId: string) {
    const column = columns.find((candidate) => candidate.id === columnId);
    if (column && filterKindIn(column)) {
      setFilterColumnId(columnId);
    }
  }

  /* Os valores do conjunto saem das linhas que os outros filtros deixam, para a coluna não se esconder de si mesma. */
  function setOptionsOf(column: DataGridColumn<Row>) {
    if (column.filterOptions) {
      return column.filterOptions;
    }

    const others = filterRows(searched, columns, setColumnFilter(filter, column.id, null));
    return distinctTexts(others, column);
  }

  /* Aberto pelo funil ou pelo menu, o foco voltaria ao botão, onde as setas não andam. */
  function closeFilter(columnId: string) {
    setFilterColumnId(null);
    requestAnimationFrame(() => latest.current.returnToHeader(columnId));
  }

  function headerFilterOf(column: DataGridColumn<Row>) {
    const kind = filterKindIn(column);

    if (!kind) {
      return undefined;
    }

    return {
      active: filteredIds.has(column.id),
      open: filterColumnId === column.id,
      onOpenChange: (open: boolean) => (open ? setFilterColumnId(column.id) : closeFilter(column.id)),
      renderPanel: () => (
        <DataGridFilterPanel
          applyMode={filterApplyMode}
          columnId={column.id}
          header={column.header}
          kind={kind}
          operators={operatorsOf(column)}
          options={() => setOptionsOf(column)}
          value={columnFilterOf(filter, column.id)}
          onChange={applyColumnFilterFromPanel}
          onClose={() => closeFilter(column.id)}
        />
      ),
    };
  }

  function applyColumnFilter(columnId: string, next: DataGridFilter | null) {
    applyFilter(setColumnFilter(filter, columnId, next));
  }
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
          disabled: !steppedOrder(column.id, -1),
          onSelect: () => moveColumnBy(column.id, -1),
        },
        {
          key: 'right',
          label: 'Mover para a direita',
          shortcut: 'Ctrl+Shift+→',
          shortcutKeys: 'Control+Shift+ArrowRight',
          disabled: !steppedOrder(column.id, 1),
          onSelect: () => moveColumnBy(column.id, 1),
        },
        { key: 'hide', label: 'Ocultar coluna', disabled: columnIds.length === 1, onSelect: () => hideColumn(column.id) },
      ],
    };
    const filtering: MenuSection | null = filterKindIn(column)
      ? {
          key: 'filter',
          items: [
            { key: 'filter', label: 'Filtrar', shortcut: 'Alt+↓', onSelect: () => openFilter(column.id) },
            ...(filteredIds.has(column.id)
              ? [{ key: 'clearFilter', label: 'Limpar filtro', onSelect: () => applyColumnFilter(column.id, null) }]
              : []),
          ],
        }
      : null;
    const group = [...(groupsOf.get(column.id) ?? [])].reverse().find((candidate) => candidate.collapsible);
    const grouping: MenuSection | null = group
      ? {
          key: 'group',
          items: [
            {
              key: 'collapse',
              label: `${columnState.collapsedGroups.includes(group.id) ? 'Expandir' : 'Recolher'} o grupo ${group.header}`,
              onSelect: () => toggleGroup(group),
            },
          ],
        }
      : null;

    return [column.sortable === false ? null : sorting, filtering, pinning, arranging, grouping].filter(
      (section): section is MenuSection => section !== null,
    );
  }

  function renderHeaderCell(column: (typeof rowColumns)[number], index: number) {
    const item = placed[index];
    const sortIndex = sort.findIndex((sortItem) => sortItem.columnId === column.id);
    const sortable = column.sortable !== false;
    const host = index === 0;

    return (
      <DataGridHeaderCell
        canDrop={() =>
          draggedColumn.current !== null && droppedOrder(draggedColumn.current, column.id) !== null
        }
        className={[
          styles.cell,
          styles.headerCell,
          styles[columnAlign(column)],
          sortable && styles.sortable,
          host && (expandable || selectionMode !== 'none') && styles.withControls,
          column.className,
        ]
          .filter(Boolean)
          .join(' ')}
        colIndex={index + 1}
        columnId={column.id}
        controls={
          host && (
            <>
              {expandable && <span className={styles.control} />}
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
        filter={headerFilterOf(column)}
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
        style={{ ...column.style, gridColumn: index + 1, gridRow: groupRows + 1 }}
        width={item.width - (host ? controlsWidth : 0)}
        onDragStart={() => {
          draggedColumn.current = column.id;
        }}
        onDragEnd={() => {
          draggedColumn.current = null;
        }}
        onDrop={() => {
          const source = draggedColumn.current;
          const order = source ? droppedOrder(source, column.id) : null;
          if (source && order) {
            changeColumns({ ...columnState, order }, `${headerOf(source)} movida`);
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

  function renderSegment(segment: DataGridHeaderSegment) {
    const { group } = segment;
    const last = placed[segment.first + segment.span - 1];
    const edge = segment.pin === 'start' ? last.edge : segment.pin === 'end' && placed[segment.first].edge;
    const pinStyle = placedStyle({ ...last, offset: segment.offset, width: segment.width });
    const style = {
      ...pinStyle,
      gridColumn: `${segment.first + 1} / span ${segment.span}`,
      gridRow: `${segment.level + 1} / span ${segment.rowSpan}`,
    };
    const className = [
      styles.groupCell,
      segment.pin && styles.pinned,
      edge && (segment.pin === 'start' ? styles.edgeStart : styles.edgeEnd),
    ]
      .filter(Boolean)
      .join(' ');

    if (!group) {
      return <div className={className} key={`${segment.level}-${segment.first}`} role="presentation" style={style} />;
    }

    const collapsed = columnState.collapsedGroups.includes(group.id);
    const labelId = `${baseId}-group-${segment.level}-${segment.first}`;

    return (
      <div
        aria-colindex={segment.first + 1}
        aria-colspan={segment.span}
        aria-labelledby={labelId}
        className={className}
        key={`${segment.level}-${segment.first}`}
        role="columnheader"
        style={style}
      >
        <span className={styles.groupLabel} id={labelId}>
          {group.header}
        </span>
        {group.collapsible && (
          <button
            aria-expanded={!collapsed}
            aria-label={`${collapsed ? 'Expandir' : 'Recolher'} ${group.header}`}
            className={styles.expander}
            tabIndex={-1}
            type="button"
            onClick={() => toggleGroup(group)}
          >
            <IconChevronRight size={14} />
          </button>
        )}
      </div>
    );
  }

  function renderRow(item: DataGridBodyItem, index: number) {
    const row = visibleRows[item.rowIndex];
    const node = nodeOf.get(item.rowKey);

    return (
      <DataGridRow
        ariaRowIndex={rowOffset + item.rowIndex + groupRows + 2}
        columns={rowColumns}
        depth={node?.depth ?? 0}
        expanded={canExpand(row, item.rowKey) ? expandedSet.has(item.rowKey) : undefined}
        focusedColumnId={activeFocus.rowKey === item.key ? activeFocus.columnId : undefined}
        height={rowHeight}
        key={item.key}
        level={node ? level + node.depth : withDetail ? level : undefined}
        loading={node?.loading ?? false}
        position={node?.position}
        row={row}
        rowKey={item.rowKey}
        selectable={selectionMode !== 'none'}
        selected={selectionMode === 'none' ? undefined : selectedSet.has(item.rowKey)}
        top={layout.offsets[index]}
        setSize={node?.setSize}
        withExpander={expandable}
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

  function renderSummaryRow() {
    const scope = `de ${formatNumber(totalRows)} ${totalRows === 1 ? 'linha' : 'linhas'}`;

    return (
      <div aria-rowindex={summaryRowIndex} className={styles.summaryRow} role="row">
        {rowColumns.map((column, index) => {
          const aggregator = aggregatorOf(column.summary);
          const focused = activeFocus.rowKey === SUMMARY_KEY && activeFocus.columnId === column.id;
          const text = aggregator ? summaryText(column, summary[column.id]) : '';
          /* O valor sozinho cabe na coluna estreita; o nome do agregado vai à dica e ao leitor de tela. */
          const name = aggregator ? `${aggregator.label} de ${column.header}` : index === 0 ? `Total ${scope}` : undefined;

          return (
            <div
              aria-colindex={index + 1}
              className={[
                styles.cell,
                styles[columnAlign(column)],
                aggregator && (column.type === 'number' || column.type === 'currency') && styles.numeric,
                column.className,
              ]
                .filter(Boolean)
                .join(' ')}
              data-column={column.id}
              data-row={SUMMARY_KEY}
              key={column.id}
              role="gridcell"
              style={column.style}
              tabIndex={focused ? 0 : -1}
              title={name && text ? `${name}: ${text}` : name}
              onFocus={() => {
                if (!focused) {
                  setFocus({ rowKey: SUMMARY_KEY, columnId: column.id });
                }
              }}
            >
              {index === 0 && expandable && <span className={styles.control} />}
              {index === 0 && selectionMode !== 'none' && <span className={styles.control} />}
              {aggregator && <span className={styles.visuallyHidden}>{aggregator.label}: </span>}
              <span className={styles.text}>
                {text}
                {!aggregator && index === 0 && (
                  <>
                    Total<span className={styles.visuallyHidden}> {scope}</span>
                  </>
                )}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  function renderMessage(content: ReactNode, alert = false) {
    return (
      <div aria-rowindex={groupRows + 2} className={styles.messageRow} role="row">
        <div aria-colindex={1} aria-colspan={columnIds.length} className={styles.message} role="gridcell">
          {alert ? <div role="alert">{content}</div> : content}
        </div>
      </div>
    );
  }

  const showsMessage = Boolean(error) || (rowKeys.length === 0 && !loading);
  const filtering = activeFilter.conditions.length > 0;
  const searching = search.trim() !== '';
  const emptyText = filtering
    ? 'Nenhum registro atende aos filtros.'
    : search.trim()
      ? `Nenhum registro atende à busca "${search.trim()}".`
      : 'Nenhum registro.';
  /* O vazio por filtro oferece o caminho de volta. */
  const emptyContent = emptyMessage ?? (
    <>
      {emptyText}
      {(filtering || searching) && (
        <div className={styles.messageAction}>
          <Button size="sm" type="button" variant="secondary" onClick={clearFilters}>
            {filtering && searching ? 'Limpar filtros e busca' : filtering ? 'Limpar filtros' : 'Limpar busca'}
          </Button>
        </div>
      )}
    </>
  );
  const bodyRowCount = showsMessage ? 1 : nodes ? nodes.length : totalRows;
  const summaryRowIndex = groupRows + bodyRowCount + 2;

  return (
    <DataGridScrollContext.Provider value={nested ? outerScroll : ownScroll}>
      <DataGridContext.Provider value={contextValue}>
        <div
          {...props}
          className={[styles.dataGrid, nested && styles.nested, fullScreen && styles.fullScreen, className]
            .filter(Boolean)
            .join(' ')}
          onKeyDown={(event) => {
            props.onKeyDown?.(event);
            const inField = (event.target as HTMLElement).closest('input, select, textarea, [contenteditable="true"]');
            if (fullScreen && event.key === 'Escape' && !event.defaultPrevented && !inField) {
              setFullScreen(false);
            }
          }}
        >
          {children}
          <div className={styles.viewport}>
            <div
              className={styles.scroller}
              data-scrolled-end={edges.end || undefined}
              data-scrolled-start={edges.start || undefined}
              ref={scrollerRef}
              style={{
                height: nested || fullScreen ? undefined : height,
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
                aria-rowcount={tree && server ? -1 : groupRows + bodyRowCount + 1 + (showsSummary ? 1 : 0)}
                className={styles.grid}
                role={expandable ? 'treegrid' : 'grid'}
                onBlur={(event) => {
                  gridHasFocus.current = event.currentTarget.contains(event.relatedTarget as Node | null);
                }}
                onFocus={(event) => {
                  gridHasFocus.current = event.currentTarget.contains(event.target);
                }}
                onKeyDown={handleKeyDown}
              >
                <div
                  className={[styles.head, groupRows > 0 && styles.grouped].filter(Boolean).join(' ')}
                  ref={headRef}
                  role="rowgroup"
                  style={{ gridTemplateColumns: placed.map((item) => `${item.width}px`).join(' ') }}
                >
                  {Array.from({ length: groupRows }, (_, level) => (
                    <div aria-rowindex={level + 1} className={styles.headerRow} key={level} role="row">
                      {segments.filter((segment) => segment.level === level).map(renderSegment)}
                    </div>
                  ))}
                  <div aria-rowindex={groupRows + 1} className={styles.headerRow} role="row">
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
                {showsSummary && (
                  <div className={styles.foot} ref={footRef} role="rowgroup">
                    {renderSummaryRow()}
                  </div>
                )}
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
            {announcement.text}
            {announcement.repeat && '\u00a0'}
          </div>
        </div>
      </DataGridContext.Provider>
    </DataGridScrollContext.Provider>
  );
}

DataGrid.Toolbar = DataGridToolbar;
DataGrid.Search = DataGridSearch;
DataGrid.DetailLayout = DataGridDetailLayout;
DataGrid.TableMenu = DataGridTableMenu;
