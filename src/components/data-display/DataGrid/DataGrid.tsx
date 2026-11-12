import {
  useCallback,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type ComponentPropsWithRef,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { Button } from '../../actions/Button';
import { selectionStatus, select, selectRange, toggleAll, type SelectionState } from '../../../hooks/useSelection/selection';
import { formatNumber } from '../../../utils/formatters';
import { isDevelopment } from '../../../utils/isDevelopment';
import { blockRepeatedPress } from '../../../utils/press/press';
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
  visibleColumnWindow,
  type DataGridColumnGroupSizing,
  type DataGridColumnWindow,
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
import { toTsv, tsvField, type DataGridExporter, type DataGridExportModel, type DataGridExportScope } from './exportModel';
import { commitEdit, initialDraft, isEditable, type DataGridEditing } from './editModel';
import { buildGroups, flattenGroups, indexGroups, leafRows, type DataGridGroup } from './groupModel';
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
  hasLegacySortDirection,
  moveFocus,
  normalizeSort,
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
  type DataGridSortItemInput,
  type DataGridState,
} from './gridState';
import { DataGridContext, DataGridLevelContext, DataGridScrollContext } from './dataGridContext';
import { DataGridSearch, DataGridTableMenu, DataGridToolbar } from './DataGridToolbar';
import { DataGridRow, type DataGridCellContext } from './DataGridRow';
import { DataGridDetailRow, DETAIL_ESTIMATE, type DataGridDetailContext } from './DataGridDetail';
import { DataGridDetailLayout } from './DataGridDetailLayout';
import { DataGridFilterBuilder } from './DataGridFilterBuilder';
import { DataGridFilterPanel, type DataGridFilterApplyMode } from './DataGridFilterPanel';
import { DataGridGroupRow } from './DataGridGroupRow';
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
/** Chave das linhas fixas no topo, que não colide com nenhuma linha nem com os grupos. */
const PINNED_PREFIX = '\u0002pinned';
/** Colunas desenhadas além das que aparecem, de cada lado, com a virtualização de colunas. */
const COLUMN_OVERSCAN = 2;
/** Largura da tela enquanto ainda não foi medida: a primeira passada desenha só o que cabe numa tela larga. */
const FALLBACK_VIEW_WIDTH = 1280;
const GRID_SELECTOR = '[role="grid"], [role="treegrid"]';
const INTERACTIVE_SELECTOR = 'a, button, input, label, select, textarea';

/** Controles dentro da célula usam `tabIndex={-1}`: a grade tem uma parada de Tab só, e Enter entra na célula. */
export interface DataGridColumn<Row> extends DataGridColumnModel<Row>, DataGridColumnSizing {
  renderCell?: (context: DataGridCellContext<Row>) => ReactNode;
  /** Editor do produto no lugar do campo de texto. O valor que ele entrega por `onChange` vai a `onCellEdit` como está. */
  renderEditor?: (context: DataGridEditorContext<Row>) => ReactNode;
  renderHeader?: (column: DataGridColumn<Row>) => ReactNode;
}

/** O que o editor do produto recebe: o valor de agora, a recusa e os meios de entregar, confirmar ou desistir. */
export interface DataGridEditorContext<Row> {
  cancel: () => void;
  columnId: string;
  commit: () => void;
  /** Mensagem de `validate` ou de número ilegível; a edição fica aberta enquanto ela existir. */
  error: string | null;
  /** Para `aria-describedby` do campo: aponta a mensagem de recusa. */
  errorId: string;
  onChange: (value: unknown) => void;
  row: Row;
  /** Começa no valor cru da célula. */
  value: unknown;
}

/** O valor confirmado de uma célula. A grade não guarda a linha: o produto troca em `rows`. */
export interface DataGridCellEdit<Row> {
  columnId: string;
  previousValue: unknown;
  row: Row;
  rowId: string;
  value: unknown;
}

/** O que o produto alcança por `apiRef`, fora do menu da tabela. */
export interface DataGridApi {
  /** Colunas na ordem da tela e linhas do escopo na ordem atual, com o texto exibido e o valor cru de cada célula. */
  getExportModel: (scope?: DataGridExportScope) => DataGridExportModel;
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
  /** Aponta para o que o produto alcança por fora da interface, como o modelo de exportação. */
  apiRef?: Ref<DataGridApi>;
  /** Partes da grade, como `DataGrid.Toolbar`, desenhadas acima dela. */
  children?: ReactNode;
  /** Ordem, ocultas, fixas e larguras, como a pessoa deixou pelo menu da coluna e pelo arrasto. */
  columnState?: DataGridColumnState;
  /** Lista estável, memorizada pelo produto: uma lista nova a cada desenho refaz a busca e a ordenação. */
  columns: readonly DataGridColumnDefinition<Row>[];
  /** Ctrl+C copia em TSV as linhas selecionadas ou, sem seleção, a célula com foco. */
  copyable?: boolean;
  /** Com `copyable`, a primeira linha copiada leva os títulos das colunas. */
  copyHeaders?: boolean;
  /** No servidor, `rows` é a página atual e `totalRows` o total; a busca, a ordem e a página vão por `onQueryChange`. */
  dataMode?: 'client' | 'server';
  /** Altura das linhas: 32, 40 ou 48 pixels. */
  density?: DataGridDensity;
  /** Parcial: o que faltar sai da definição das colunas. */
  defaultColumnState?: Partial<DataGridColumnState>;
  defaultDensity?: DataGridDensity;
  defaultExpandedIds?: readonly string[];
  defaultFilter?: DataGridFilter;
  defaultGroupBy?: readonly string[];
  defaultPage?: number;
  defaultPageSize?: number;
  defaultSearch?: string;
  defaultSelectedIds?: readonly string[];
  defaultSort?: readonly DataGridSortItemInput[];
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
  /**
   * Ids das colunas que agrupam as linhas, em níveis. O grupo mostra o valor e a quantidade, e o agregado `summary`
   * de cada coluna. Abre e fecha pelo `expandedIds`, com a chave de `dataGridGroupKey`. Só no cliente e fora da árvore.
   */
  groupBy?: readonly string[];
  /** Altura da área rolável, em pixels, ou `fill` para ocupar a altura imposta pelo contêiner (480 sem altura imposta). Na grade aninhada não vale: ela rola com a de fora. */
  height?: number | 'fill';
  /** Retrato salvo por `onStateChange`, aplicado de uma vez na montagem. Vence os valores `default*`. */
  initialState?: unknown;
  label: string;
  loading?: boolean;
  /** O valor novo de uma célula `editable`, depois de convertido e aceito por `validate`. */
  onCellEdit?: (edit: DataGridCellEdit<Row>) => void;
  onColumnStateChange?: (state: DataGridColumnState) => void;
  onDensityChange?: (density: DataGridDensity) => void;
  onExpandedIdsChange?: (ids: readonly string[]) => void;
  onFilterChange?: (filter: DataGridFilter) => void;
  onGroupByChange?: (columnIds: readonly string[]) => void;
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
  /** Linhas fixas sob o título, fora da ordem, do filtro, da paginação e da seleção: resumos ou o que o produto fixar. */
  pinnedRows?: readonly Row[];
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
  sort?: readonly DataGridSortItemInput[];
  /** No servidor, os agregados da linha de sumarização, pelo id da coluna, vindos na resposta da consulta. */
  summaryValues?: Readonly<Record<string, unknown>>;
  totalRows?: number;
  /** Desenha só as colunas que cruzam a tela, mais as fixas e a com foco: para muitas colunas. */
  virtualizeColumns?: boolean;
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

function isPinnedKey(key: string) {
  return key.startsWith(PINNED_PREFIX);
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
    return `${header}, ${item.direction === 'ascending' ? 'crescente' : 'decrescente'}`;
  });

  return `Ordenado por ${parts.join('; depois por ')}`;
}

export function DataGrid<Row>({
  apiRef,
  children,
  className,
  columnState: columnStateProp,
  columns: definitions,
  copyable = false,
  copyHeaders = false,
  dataMode = 'client',
  defaultColumnState,
  defaultDensity = 'normal',
  density: densityProp,
  defaultExpandedIds = [],
  defaultFilter = EMPTY_FILTER,
  defaultGroupBy = [],
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
  groupBy: groupByProp,
  height = DEFAULT_HEIGHT,
  initialState,
  label,
  loading = false,
  onCellEdit,
  onColumnStateChange,
  onDensityChange,
  onExpandedIdsChange,
  onFilterChange,
  onGroupByChange,
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
  pinnedRows,
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
  virtualizeColumns = false,
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
      sort: normalizeSort(defaultSort),
      search: defaultSearch,
      filter: normalizeFilter(defaultFilter, columns),
      page: defaultPage,
      pageSize: defaultPageSize ?? pageSizeOptions[0],
    };
    const snapshot = memory ?? restoreSnapshot(initialState, columns, fallback);

    return pageSizeOptions.includes(snapshot.pageSize) ? snapshot : { ...snapshot, pageSize: fallback.pageSize };
  });
  const controlledSort = useMemo(() => (sortProp ? normalizeSort(sortProp) : undefined), [sortProp]);
  const [sort, setSort] = useSlice<readonly DataGridSortItem[]>(controlledSort, restored.sort, onSortChange);
  const legacySortDirection = hasLegacySortDirection(sortProp) || hasLegacySortDirection(defaultSort);
  const [search, setSearch] = useSlice(searchProp, restored.search, onSearchChange);
  const [filter, setFilter] = useSlice(filterProp, restored.filter, onFilterChange);
  const activeFilter = useMemo(() => activeFilterOf(filter, columns), [filter, columns]);
  const [groupBy, setGroupBy] = useSlice(groupByProp, defaultGroupBy, onGroupByChange);
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
  /* A ref acompanha o estado: os eventos de teclado e de foco leem a edição de agora, e não a do último desenho. */
  const [editing, setEditingState] = useState<DataGridEditing | null>(null);
  const editingRef = useRef<DataGridEditing | null>(null);

  function setEditing(next: DataGridEditing | null) {
    editingRef.current = next;
    setEditingState(next);
  }

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
  /* Os grupos saem das linhas já filtradas e ordenadas; no servidor e na árvore, `groupBy` não vale. */
  const knownGroupBy = useMemo(() => groupBy.filter((id) => columns.some((column) => column.id === id)), [groupBy, columns]);
  const grouped = !server && !tree && knownGroupBy.length > 0;
  const groupTree = useMemo(
    () => (grouped ? buildGroups(sorted, columns, knownGroupBy) : null),
    [grouped, sorted, columns, knownGroupBy],
  );
  const groupIndex = useMemo(
    () => (groupTree ? indexGroups(groupTree, (row) => rowIdOf.current(row)) : null),
    [groupTree],
  );
  const hierarchical = tree || grouped;
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
    () => (branches ? parentKeysOf(branches, (row) => rowIdOf.current(row)) : (groupIndex?.parents ?? null)),
    [branches, groupIndex],
  );
  const expandedSet = useMemo(() => new Set(expandedIds), [expandedIds]);
  const nodes = useMemo(() => {
    if (treeBranches) {
      return flattenTree(
        treeBranches,
        (row) => rowIdOf.current(row),
        (key) => expandedSet.has(key),
        (row) => rowHasChildren?.(row) ?? false,
      );
    }

    return groupTree ? flattenGroups(groupTree, (row) => rowIdOf.current(row), (key) => expandedSet.has(key)) : null;
  }, [treeBranches, groupTree, expandedSet, rowHasChildren]);
  /* A árvore e os grupos paginam pelas raízes: o que está dentro acompanha a raiz de que descende. */
  const totalRows = server ? (totalRowsProp ?? rows.length) : ((treeBranches ?? groupTree)?.length ?? sorted.length);
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
  const withDetail = renderDetail !== undefined && !hierarchical;
  const expandable = withDetail || hierarchical;
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
    if (legacySortDirection && isDevelopment()) {
      console.warn(`DataGrid "${label}": 'asc' e 'desc' em sort e defaultSort são obsoletos; use 'ascending' e 'descending'.`);
    }
  }, [legacySortDirection, label]);

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
    return hierarchical ? (nodeOf.get(rowKey)?.expandable ?? false) : hasDetail(row);
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
  const pinnedKeys = useMemo(
    () => (error ? [] : (pinnedRows ?? []).map((_, index) => `${PINNED_PREFIX}${index}`)),
    [error, pinnedRows],
  );
  const pinnedCount = pinnedKeys.length;
  /* As fixas no topo entram na navegação antes das linhas, e a sumarização depois delas; com falha, a mensagem toma o lugar das linhas. */
  const navKeys = useMemo(
    () => (error ? [] : [...pinnedKeys, ...itemKeys, ...(showsSummary ? [SUMMARY_KEY] : [])]),
    [error, pinnedKeys, showsSummary, itemKeys],
  );

  function rowLabelOf(row: Row, rowKey: string) {
    const group = groupIndex?.byKey.get(rowKey);
    if (group) {
      return group.text || '(Vazio)';
    }

    const first = placed[0]?.column;
    return (first && cellText(first, row)) || rowKey;
  }

  function toggleRowExpanded(rowKey: string) {
    const row = visibleRows[rowKeys.indexOf(rowKey)];

    if (!row || !canExpand(row, rowKey)) {
      return;
    }

    const opening = !expandedSet.has(rowKey);
    setExpandedIds(toggleExpanded(expandedIds, rowKey, hierarchical ? 'multiple' : expandMode));
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
  /* Com grupos, a seleção percorre as linhas na ordem em que a tela as mostra, abertas ou não; o grupo não se seleciona. */
  const selectableItems = useMemo(() => {
    if (groupTree) {
      return leafRows(groupTree).map((row) => ({ key: rowIdOf.current(row) }));
    }

    return nodes ? nodes.map((node) => ({ key: node.key })) : sorted.map((row) => ({ key: rowIdOf.current(row) }));
  }, [nodes, groupTree, sorted]);

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
    /* O segundo clique de um duplo clique não repete a ação: o duplo clique é da edição. */
    if (event.detail > 1) {
      return;
    }
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
    const opening = rowKeys
      .slice(first)
      .filter((rowKey, index) => canExpand(visibleRows[first + index], rowKey) && !expandedSet.has(rowKey))
      .slice(0, EXPAND_LIMIT);

    if (opening.length === 0) {
      return;
    }

    setExpandedIds([...expandedIds, ...opening]);
    const opened = hierarchical ? ['linha aberta', 'linhas abertas'] : ['detalhe aberto', 'detalhes abertos'];
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
    const pageStart = (currentPage - 1) * pageSize;
    const scoped = groupTree
      ? flat(leafRows(scope === 'page' && pagination ? groupTree.slice(pageStart, pageStart + pageSize) : groupTree))
      : server || scope === 'page'
        ? (pageNodes ?? flat(visibleRows))
        : (everyNode ?? flat(sorted));
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
    setSort(normalizeSort(defaultSort));
    setSearch(defaultSearch);
    setFilter(normalizeFilter(defaultFilter, columns));
    setGroupBy(defaultGroupBy);
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
          ...(hierarchical || expandMode === 'multiple'
            ? [{ key: 'expand', label: `Expandir ${EXPAND_LIMIT} linhas`, onSelect: expandOnScreen }]
            : []),
          ...(groupIndex
            ? [
                {
                  key: 'expandGroups',
                  label: 'Expandir todos os grupos',
                  onSelect: () => {
                    setExpandedIds([...groupIndex.byKey.keys()]);
                    setAnnouncement('Grupos expandidos');
                  },
                },
              ]
            : []),
          {
            key: 'collapse',
            label: 'Recolher todas',
            disabled: expandedIds.length === 0,
            onSelect: () => {
              setExpandedIds([]);
              setAnnouncement(grouped ? 'Grupos recolhidos' : tree ? 'Linhas recolhidas' : 'Detalhes recolhidos');
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
  const latest = useRef({
    applyColumnFilter,
    applyFilter,
    beginEdit,
    cellFocused,
    clickRow,
    commitSearch,
    exportModelOf,
    optionsForColumn,
    returnToHeader,
    settleEditing,
    tableMenu,
    toggleRow,
    toggleRowExpanded,
  });
  useLayoutEffect(() => {
    latest.current = {
      applyColumnFilter,
      applyFilter,
      beginEdit,
      cellFocused,
      clickRow,
      commitSearch,
      exportModelOf,
      optionsForColumn,
      returnToHeader,
      settleEditing,
      tableMenu,
      toggleRow,
      toggleRowExpanded,
    };
  });
  useImperativeHandle(apiRef, () => ({ getExportModel: (scope = 'filtered') => latest.current.exportModelOf(scope) }), []);
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
  const focusFromRow = useCallback((rowKey: string, columnId: string) => latest.current.cellFocused(rowKey, columnId), []);
  const editFromRow = useCallback((rowKey: string, columnId: string) => latest.current.beginEdit(rowKey, columnId), []);
  const applyFilterFromPart = useCallback((next: DataGridFilter) => latest.current.applyFilter(next), []);
  const optionsFromPart = useCallback((columnId: string) => latest.current.optionsForColumn(columnId), []);
  const focusFromDetail = useCallback((rowKey: string) => {
    latest.current.settleEditing();
    setFocus((current) => ({ rowKey: detailKeyOf(rowKey), columnId: current.columnId }));
  }, []);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const footRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef<HTMLDivElement>(null);
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
  const pixelHeight = height === 'fill' ? DEFAULT_HEIGHT : height;
  const [rowWindow, setRowWindow] = useState(() => visibleWindow(layout, 0, pixelHeight, OVERSCAN));

  useLayoutEffect(() => {
    if (!nested) {
      root.scroller = scrollerRef.current;
      root.head = headRef.current;
      root.pinned = pinnedRef.current;
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
    const viewHeight = scroller.clientHeight > 0 ? scroller.clientHeight - headHeight - root.footHeight() : pixelHeight;
    const next = visibleWindow(layoutRef.current, viewTop, viewHeight, OVERSCAN);

    setRowWindow((current) => (current.start === next.start && current.end === next.end ? current : next));
  }, [root, pixelHeight]);

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
    const head = headRef.current;
    const observer = new ResizeObserver(() => {
      setViewWidth(scroller.clientWidth);
      setHeadHeight(head?.offsetHeight ?? 0);
      root.notify();
    });
    setViewWidth(scroller.clientWidth);
    setHeadHeight(head?.offsetHeight ?? 0);
    observer.observe(scroller);
    if (head) {
      observer.observe(head);
    }
    return () => observer.disconnect();
  }, [root]);

  /* Abaixo do título, as linhas fixas colam nesta altura. */
  const [headHeight, setHeadHeight] = useState(0);
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

  const [columnRange, setColumnRange] = useState<DataGridColumnWindow>({ start: 0, end: 0 });
  const syncColumnWindow = useCallback(() => {
    if (!virtualizeColumns) {
      return;
    }

    const scrollLeft = scrollerRef.current?.scrollLeft ?? 0;
    const next = visibleColumnWindow(placed, scrollLeft, viewWidth || FALLBACK_VIEW_WIDTH, COLUMN_OVERSCAN);
    setColumnRange((current) => (current.start === next.start && current.end === next.end ? current : next));
  }, [virtualizeColumns, placed, viewWidth]);
  useLayoutEffect(syncColumnWindow, [syncColumnWindow]);

  const rowColumns = useMemo(
    () =>
      placed.map((item, index) => ({
        ...item.column,
        className: placedClass(item),
        colIndex: index + 1,
        style: placedStyle(item),
      })),
    [placed],
  );
  const focusedColumnIndex = columnIds.indexOf(activeFocus.columnId);
  /* Com colunas virtuais, a que fica depois das não desenhadas ganha de margem a largura delas, e nada se desloca. */
  const drawnColumns = useMemo(() => {
    if (!virtualizeColumns) {
      return rowColumns;
    }

    let skipped = 0;
    return rowColumns.flatMap((column, index) => {
      const inView = index >= columnRange.start && index < columnRange.end;
      if (placed[index].pin === undefined && !inView && index !== focusedColumnIndex) {
        skipped += placed[index].width;
        return [];
      }

      const style = skipped > 0 ? { ...column.style, marginInlineStart: skipped } : column.style;
      skipped = 0;
      return [{ ...column, style }];
    });
  }, [virtualizeColumns, rowColumns, placed, columnRange, focusedColumnIndex]);
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
    if (isPinnedKey(rowKey)) {
      return pinnedRef.current?.querySelector<HTMLElement>(
        `:scope > [role="row"] > [data-row="${CSS.escape(rowKey)}"][data-column="${column}"]`,
      );
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
    if (next.rowKey !== null && isPinnedKey(next.rowKey)) {
      return;
    }
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

  function beginEdit(rowKey: string, columnId: string) {
    const column = columns.find((candidate) => candidate.id === columnId);
    const row = visibleRows[rowKeys.indexOf(rowKey)];

    if (!column || row === undefined || groupIndex?.byKey.has(rowKey) || !isEditable(column, row)) {
      return false;
    }
    if (editingRef.current?.rowKey === rowKey && editingRef.current.columnId === columnId) {
      return true;
    }

    setEditing({
      columnId,
      draft: column.renderEditor ? cellValue(column, row) : initialDraft(column, row),
      error: null,
      rowKey,
    });
    setAnnouncement(`Editando ${column.header} de ${rowLabelOf(row, rowKey)}. Enter confirma, Escape cancela.`);
    return true;
  }

  function cancelEditing(returnFocus = true) {
    const current = editingRef.current;

    if (!current) {
      return;
    }

    setEditing(null);
    setAnnouncement('Edição cancelada');
    if (returnFocus) {
      focusLater({ rowKey: current.rowKey, columnId: current.columnId });
    }
  }

  /* Devolve se a edição fechou: com recusa, ela fica aberta e a mensagem é anunciada. */
  function commitEditing() {
    const current = editingRef.current;
    const column = columns.find((candidate) => candidate.id === current?.columnId);
    const row = visibleRows[rowKeys.indexOf(current?.rowKey ?? '')];

    if (!current || !column || row === undefined) {
      setEditing(null);
      return true;
    }

    const result = commitEdit(column, row, current.draft, column.renderEditor !== undefined);

    if (!result.ok) {
      setEditing({ ...current, error: result.error });
      setAnnouncement(result.error);
      return false;
    }

    setEditing(null);
    if (!result.changed) {
      setAnnouncement('Sem alteração');
      return true;
    }

    onCellEdit?.({
      columnId: column.id,
      previousValue: cellValue(column, row),
      row,
      rowId: current.rowKey,
      value: result.value,
    });
    setAnnouncement(`Novo valor de ${column.header}: ${cellText({ ...column, value: () => result.value }, row) || 'vazio'}`);
    return true;
  }

  /* Outra célula com foco encerra a edição: o valor válido fica, o recusado é descartado, com o motivo anunciado. */
  function settleEditing() {
    if (!editingRef.current || commitEditing()) {
      return;
    }

    const refusal = editingRef.current?.error;
    setEditing(null);
    setAnnouncement(`Valor descartado: ${refusal}`);
  }

  function cellFocused(rowKey: string, columnId: string) {
    const current = editingRef.current;

    if (current && (current.rowKey !== rowKey || current.columnId !== columnId)) {
      settleEditing();
    }
    setFocus({ rowKey, columnId });
  }

  function editorOf(column: DataGridColumn<Row>, row: Row, rowKey: string, current: DataGridEditing) {
    const errorId = `${baseId}-edit-error`;
    const change = (value: unknown) => {
      const live = editingRef.current;
      if (live) {
        setEditing({ ...live, draft: value, error: null });
      }
    };

    return (
      <>
        {column.renderEditor ? (
          column.renderEditor({
            cancel: () => cancelEditing(),
            columnId: column.id,
            commit: () => {
              if (commitEditing()) {
                focusLater({ rowKey, columnId: column.id });
              }
            },
            error: current.error,
            errorId,
            onChange: change,
            row,
            value: current.draft,
          })
        ) : (
          <input
            aria-describedby={current.error ? errorId : undefined}
            aria-invalid={current.error ? true : undefined}
            aria-label={`${column.header} de ${rowLabelOf(row, rowKey)}`}
            className={styles.editor}
            value={String(current.draft ?? '')}
            onChange={(event) => change(event.target.value)}
          />
        )}
        {current.error && (
          <span className={styles.editError} id={errorId}>
            {current.error}
          </span>
        )}
      </>
    );
  }

  const editingId = editing ? `${editing.rowKey}\u0000${editing.columnId}` : null;

  /* O campo da célula recebe o foco ao abrir a edição, o texto já selecionado. */
  useEffect(() => {
    const current = editingRef.current;

    if (!current) {
      return;
    }

    const cell = bodyRef.current?.querySelector<HTMLElement>(
      `:scope > [role="row"] > [data-row="${CSS.escape(current.rowKey)}"][data-column="${CSS.escape(current.columnId)}"]`,
    );
    const field = cell && focusablesIn(cell)[0];

    field?.focus();
    if (field instanceof HTMLInputElement) {
      field.select();
    }
  }, [editingId]);

  /* A linha que saiu da tela, por filtro ou página, leva a edição junto. */
  useEffect(() => {
    if (editingRef.current && !rowKeys.includes(editingRef.current.rowKey)) {
      setEditing(null);
    }
  }, [rowKeys]);

  function copiedCellText(cell: HTMLElement) {
    const rowKey = cell.dataset.row ?? '';
    const column = columns.find((candidate) => candidate.id === cell.dataset.column);
    const row = isPinnedKey(rowKey)
      ? pinnedRows?.[pinnedKeys.indexOf(rowKey)]
      : groupIndex?.byKey.has(rowKey)
        ? undefined
        : visibleRows[rowKeys.indexOf(rowKey)];

    return column && row !== undefined ? tsvField(cellText(column, row)) : undefined;
  }

  /* As linhas selecionadas, ou a célula com foco, como a pessoa as vê. Quem decide é a célula com foco; o título,
     o texto selecionado e o campo ficam com a cópia do navegador. */
  function copyToClipboard(event: ClipboardEvent<HTMLDivElement>) {
    const focused = document.activeElement as HTMLElement | null;
    const clipboard = event.clipboardData;
    const inField = (event.target as Element).closest('input, select, textarea, [contenteditable="true"]');

    if (!copyable || !clipboard || !focused || inField || !window.getSelection()?.isCollapsed) {
      return;
    }
    if (ownCellOf(focused, event.currentTarget) !== focused || !focused.dataset.row) {
      return;
    }

    const selectedModel = selectionMode !== 'none' && selectedIds.length > 0 ? exportModelOf('selected') : null;
    const count = selectedModel?.rows.length ?? 0;
    const text = selectedModel && count > 0 ? toTsv(selectedModel, copyHeaders) : copiedCellText(focused);

    if (text === undefined) {
      return;
    }

    event.preventDefault();
    clipboard.setData('text/plain', text);
    setAnnouncement(count > 0 ? `${count} ${count === 1 ? 'linha copiada' : 'linhas copiadas'}` : 'Célula copiada');
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

    if (blockRepeatedPress(event)) {
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

      /* Na primeira coluna, a seta à esquerda sobe da linha filha ao grupo ou à linha-mãe, como na árvore do WAI-ARIA. */
      const parentKey = move === 'left' && columnId === columnIds[0] && rowKey !== null ? parentKeys?.get(rowKey) : undefined;
      if (parentKey !== undefined) {
        goTo({ rowKey: parentKey, columnId });
        return;
      }

      const visible = Math.max((root.scroller?.clientHeight ?? 0) - root.headHeight() - root.footHeight(), rowHeight);
      const index = rowKey === null || isPinnedKey(rowKey) ? 0 : rowKey === SUMMARY_KEY ? itemKeys.length : itemKeys.indexOf(rowKey);
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

  function enterCellControls(event: KeyboardEvent, cell: HTMLElement) {
    const first = focusablesIn(cell)[0];

    if (first) {
      event.preventDefault();
      first.focus();
    }
  }

  /* O grupo abre e fecha por Enter e Espaço: não tem o que selecionar nem editar. */
  function handleGroupKey(event: KeyboardEvent, rowKey: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleRowExpanded(rowKey);
    }
  }

  function handleRowKey(event: KeyboardEvent, cell: HTMLElement, rowKey: string) {
    if (isPinnedKey(rowKey)) {
      if (event.key === 'Enter' || event.key === 'F2') {
        enterCellControls(event, cell);
      }
      return;
    }
    if (groupIndex?.byKey.has(rowKey)) {
      handleGroupKey(event, rowKey);
      return;
    }

    /* Com ação na linha, Enter é dela; F2 sempre edita. */
    const startsEdit = event.key === 'F2' || (event.key === 'Enter' && !event.ctrlKey && rowClickAction === 'none');
    if (startsEdit && beginEdit(rowKey, cell.dataset.column ?? activeFocus.columnId)) {
      event.preventDefault();
    } else if (event.key === ' ' && selectionMode !== 'none') {
      toggleRow(rowKey, event.shiftKey);
    } else if (event.key === 'Enter' && event.ctrlKey) {
      event.preventDefault();
      toggleRowExpanded(rowKey);
    } else if (event.key === 'Enter' && rowClickAction !== 'none') {
      event.preventDefault();
      runRowAction(rowKey, event.shiftKey);
    } else if (event.key === 'Enter' || event.key === 'F2') {
      enterCellControls(event, cell);
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
    const current = editingRef.current;

    if (current && cell.dataset.row === current.rowKey && cell.dataset.column === current.columnId) {
      handleEditorKey(event, current);
      return;
    }

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

  /* Enter e Tab confirmam; com recusa, a edição fica aberta. As outras teclas são do editor. */
  function handleEditorKey(event: KeyboardEvent, current: DataGridEditing) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      cancelEditing();
    } else if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      if (commitEditing()) {
        focusLater({ rowKey: current.rowKey, columnId: current.columnId });
      }
    }
  }

  const status = useMemo(() => selectionStatus({ selectedKeys: selectedSet }, selectableItems), [selectedSet, selectableItems]);
  const hostColumnId = columnIds[0];
  const multiple = selectionMode === 'multiple';
  const filterBuilder = useMemo(
    () => ({
      applyMode: filterApplyMode,
      columns: columns.flatMap((column) => {
        const kind = filterKindIn(column);
        return kind ? [{ id: column.id, header: column.header, filter: kind, filterOperators: operatorsOf(column) }] : [];
      }),
      filter,
      onApply: applyFilterFromPart,
      optionsOf: optionsFromPart,
    }),
    [filterApplyMode, columns, server, filter, applyFilterFromPart, optionsFromPart],
  );
  const contextValue = useMemo(
    () => ({ filterBuilder, label, search, setSearch: searchFromPart, tableMenu: tableMenuFromPart }),
    [filterBuilder, label, search, searchFromPart, tableMenuFromPart],
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

  /* No construtor, a condição pode estar em qualquer grupo: os valores saem das linhas da busca, sem filtro. */
  function optionsForColumn(columnId: string) {
    const column = columns.find((candidate) => candidate.id === columnId);
    return column ? (column.filterOptions ?? distinctTexts(searched, column)) : [];
  }

  function applyGroupBy(next: readonly string[]) {
    setGroupBy(next);
    backToFirstPage();
    setAnnouncement(next.length > 0 ? `Agrupado por ${next.map(headerOf).join(', ')}` : 'Agrupamento removido');
  }
  const draggedColumn = useRef<string | null>(null);

  function columnMenu(column: DataGridColumn<Row>, pin: DataGridPin | undefined): MenuSection[] {
    const direction = sort.find((item) => item.columnId === column.id)?.direction;
    const sorting: MenuSection = {
      key: 'sort',
      items: [
        { key: 'asc', label: 'Ordenar crescente', checked: direction === 'ascending', onSelect: () => applySort(sortBy(sort, column.id, 'ascending')) },
        { key: 'desc', label: 'Ordenar decrescente', checked: direction === 'descending', onSelect: () => applySort(sortBy(sort, column.id, 'descending')) },
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

    const rowGrouping: MenuSection | null =
      column.groupable && !server && !tree
        ? {
            key: 'rowGroup',
            items: [
              groupBy.includes(column.id)
                ? {
                    key: 'ungroup',
                    label: 'Remover do agrupamento de linhas',
                    onSelect: () => applyGroupBy(groupBy.filter((id) => id !== column.id)),
                  }
                : { key: 'groupBy', label: 'Agrupar linhas por esta coluna', onSelect: () => applyGroupBy([...groupBy, column.id]) },
            ],
          }
        : null;

    return [column.sortable === false ? null : sorting, filtering, pinning, arranging, grouping, rowGrouping].filter(
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
        onFocus={() => {
          settleEditing();
          setFocus({ rowKey: null, columnId: column.id });
        }}
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

  function renderPinnedRow(row: Row, index: number) {
    const rowKey = pinnedKeys[index];

    return (
      <DataGridRow
        ariaRowIndex={groupRows + index + 2}
        columns={drawnColumns}
        depth={0}
        editHintId={undefined}
        editing={undefined}
        expanded={undefined}
        focusedColumnId={activeFocus.rowKey === rowKey ? activeFocus.columnId : undefined}
        height={rowHeight}
        key={rowKey}
        level={expandable ? level : undefined}
        loading={false}
        position={undefined}
        row={row}
        rowKey={rowKey}
        selectable={selectionMode !== 'none'}
        selected={undefined}
        setSize={undefined}
        top={undefined}
        withExpander={expandable}
        onCellDoubleClick={undefined}
        onCellFocus={focusFromRow}
        onRowClick={undefined}
        onToggle={toggleFromRow}
        onToggleExpanded={toggleDetailFromRow}
      />
    );
  }

  function renderGroupRow(group: DataGridGroup<Row>, item: DataGridBodyItem, index: number) {
    const node = nodeOf.get(item.rowKey);

    return (
      <DataGridGroupRow
        ariaRowIndex={rowOffset + item.rowIndex + groupRows + 2 + pinnedCount}
        columns={drawnColumns}
        depth={node?.depth ?? 0}
        expanded={node?.expanded ?? false}
        focusedColumnId={activeFocus.rowKey === item.key ? activeFocus.columnId : undefined}
        group={group}
        groupHeader={headerOf(group.columnId)}
        height={rowHeight}
        key={item.key}
        level={level + (node?.depth ?? 0)}
        position={node?.position ?? 1}
        selectable={selectionMode !== 'none'}
        setSize={node?.setSize ?? 1}
        top={layout.offsets[index]}
        onCellFocus={focusFromRow}
        onToggle={toggleDetailFromRow}
      />
    );
  }

  function renderRow(item: DataGridBodyItem, index: number) {
    const row = visibleRows[item.rowIndex];
    const node = nodeOf.get(item.rowKey);
    const group = groupIndex?.byKey.get(item.rowKey);

    if (group) {
      return renderGroupRow(group, item, index);
    }

    const editingColumn = editing?.rowKey === item.rowKey ? columns.find((column) => column.id === editing.columnId) : undefined;

    return (
      <DataGridRow
        ariaRowIndex={rowOffset + item.rowIndex + groupRows + 2 + pinnedCount}
        columns={drawnColumns}
        depth={node?.depth ?? 0}
        editHintId={editableGrid ? editHintId : undefined}
        editing={
          editing && editingColumn
            ? { columnId: editing.columnId, content: editorOf(editingColumn, row, item.rowKey, editing) }
            : undefined
        }
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
        onCellDoubleClick={editableGrid ? editFromRow : undefined}
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
        {drawnColumns.map((column) => {
          const index = column.colIndex - 1;
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
                  settleEditing();
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
      <div aria-rowindex={groupRows + pinnedCount + 2} className={styles.messageRow} role="row">
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
  const summaryRowIndex = groupRows + pinnedCount + bodyRowCount + 2;
  const editableGrid = columns.some((column) => column.editable);
  const editHintId = `${baseId}-edit-hint`;
  const fillsContainer = height === 'fill' && !nested && !fullScreen;

  return (
    <DataGridScrollContext.Provider value={nested ? outerScroll : ownScroll}>
      <DataGridContext.Provider value={contextValue}>
        <div
          {...props}
          className={[styles.dataGrid, nested && styles.nested, fullScreen && styles.fullScreen, fillsContainer && styles.fill, className]
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
                height: nested || fullScreen || height === 'fill' ? undefined : height,
                ...(withDetail && viewWidth > 0 && { '--data-grid-view-width': `${viewWidth}px` }),
              }}
              onScroll={() => {
                readEdges();
                syncColumnWindow();
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
                aria-rowcount={tree && server ? -1 : groupRows + pinnedCount + bodyRowCount + 1 + (showsSummary ? 1 : 0)}
                className={styles.grid}
                role={expandable ? 'treegrid' : 'grid'}
                onBlur={(event) => {
                  gridHasFocus.current = event.currentTarget.contains(event.relatedTarget as Node | null);
                }}
                onCopy={copyToClipboard}
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
                    {drawnColumns.map((column) => renderHeaderCell(rowColumns[column.colIndex - 1], column.colIndex - 1))}
                  </div>
                </div>
                {pinnedCount > 0 && (
                  <div className={styles.pinnedTop} ref={pinnedRef} role="rowgroup" style={{ top: headHeight }}>
                    {(pinnedRows ?? []).map(renderPinnedRow)}
                  </div>
                )}
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
          {editableGrid && (
            <span hidden id={editHintId}>
              {rowClickAction === 'none' ? 'Editável: Enter ou F2 edita.' : 'Editável: F2 edita.'}
            </span>
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
DataGrid.FilterBuilder = DataGridFilterBuilder;
