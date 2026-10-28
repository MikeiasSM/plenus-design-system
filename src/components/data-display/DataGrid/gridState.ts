import { formatCurrency, formatDate, formatNumber } from '../../../utils/formatters';
import { containsTerm } from '../../../utils/textSearch';

/** State Motor do DataGrid: estado em fatias, estágios do pipeline de linhas e foco. Sem React e sem DOM. */

export type DataGridColumnType = 'text' | 'number' | 'currency' | 'date' | 'boolean';
export type DataGridAlign = 'start' | 'center' | 'end';
export type DataGridSortDirection = 'asc' | 'desc';

export interface DataGridSortItem {
  columnId: string;
  direction: DataGridSortDirection;
}

/** O que o motor sabe de uma coluna. A interface soma os slots de desenho. */
export interface DataGridColumnModel<Row> {
  align?: DataGridAlign;
  compare?: (a: unknown, b: unknown) => number;
  format?: (value: unknown, row: Row) => string;
  header: string;
  id: string;
  searchable?: boolean;
  sortable?: boolean;
  type?: DataGridColumnType;
  value?: (row: Row) => unknown;
}

export interface DataGridState {
  page: number;
  pageSize: number;
  search: string;
  sort: readonly DataGridSortItem[];
}

export interface DataGridSnapshot extends DataGridState {
  version: 1;
}

interface ColumnTypeDefinition {
  align: DataGridAlign;
  compare: (a: unknown, b: unknown) => number;
  format: (value: unknown) => string;
}

const collator = new Intl.Collator('pt-BR', { numeric: true, sensitivity: 'base' });

function compareNumbers(a: unknown, b: unknown) {
  return Number(a) - Number(b);
}

function timeOf(value: unknown) {
  return new Date(value as Date | string).getTime();
}

const columnTypes: Record<DataGridColumnType, ColumnTypeDefinition> = {
  text: { align: 'start', compare: (a, b) => collator.compare(String(a), String(b)), format: String },
  number: { align: 'end', compare: compareNumbers, format: (value) => formatNumber(Number(value)) },
  currency: { align: 'end', compare: compareNumbers, format: (value) => formatCurrency(Number(value)) },
  date: { align: 'start', compare: (a, b) => timeOf(a) - timeOf(b), format: (value) => formatDate(value as Date | string) },
  boolean: { align: 'center', compare: compareNumbers, format: (value) => (value ? 'Sim' : 'Não') },
};

function typeOf<Row>(column: DataGridColumnModel<Row>) {
  return columnTypes[column.type ?? 'text'];
}

function isEmpty(value: unknown) {
  return value === null || value === undefined || value === '';
}

export function cellValue<Row>(column: DataGridColumnModel<Row>, row: Row) {
  return column.value ? column.value(row) : (row as Record<string, unknown>)[column.id];
}

export function cellText<Row>(column: DataGridColumnModel<Row>, row: Row) {
  const value = cellValue(column, row);

  if (isEmpty(value)) {
    return '';
  }

  return column.format ? column.format(value, row) : typeOf(column).format(value);
}

export function columnAlign<Row>(column: DataGridColumnModel<Row>) {
  return column.align ?? typeOf(column).align;
}

/** A busca compara o texto exibido, e não o valor cru: "1.250,00" acha a moeda que o usuário vê. */
export function searchRows<Row>(rows: readonly Row[], columns: readonly DataGridColumnModel<Row>[], search: string) {
  const term = search.trim();

  if (!term) {
    return rows;
  }

  const searchable = columns.filter((column) => column.searchable !== false);

  return rows.filter((row) => searchable.some((column) => containsTerm(cellText(column, row), term)));
}

/** Ordenação estável em vários níveis. Valor vazio fica no fim nos dois sentidos. */
export function sortRows<Row>(
  rows: readonly Row[],
  columns: readonly DataGridColumnModel<Row>[],
  sort: readonly DataGridSortItem[],
) {
  const criteria = sort.flatMap((item) => {
    const column = columns.find((candidate) => candidate.id === item.columnId && candidate.sortable !== false);

    if (!column) {
      return [];
    }

    return [{ column, compare: column.compare ?? typeOf(column).compare, sign: item.direction === 'asc' ? 1 : -1 }];
  });

  if (criteria.length === 0) {
    return rows;
  }

  return [...rows].sort((a, b) => {
    for (const { column, compare, sign } of criteria) {
      const valueA = cellValue(column, a);
      const valueB = cellValue(column, b);

      if (isEmpty(valueA) || isEmpty(valueB)) {
        if (isEmpty(valueA) !== isEmpty(valueB)) {
          return isEmpty(valueA) ? 1 : -1;
        }
        continue;
      }

      const result = compare(valueA, valueB) * sign;

      if (result !== 0) {
        return result;
      }
    }

    return 0;
  });
}

/** Sem empilhar, a coluna passa a ser a única ordenação. Cada clique avança: crescente, decrescente, sem ordem. */
export function toggleSort(sort: readonly DataGridSortItem[], columnId: string, stack = false): DataGridSortItem[] {
  const current = sort.find((item) => item.columnId === columnId);
  const next: DataGridSortDirection | undefined =
    current === undefined ? 'asc' : current.direction === 'asc' ? 'desc' : undefined;

  if (!stack) {
    return next ? [{ columnId, direction: next }] : [];
  }

  if (!current) {
    return [...sort, { columnId, direction: 'asc' }];
  }

  return sort.flatMap((item) => (item.columnId !== columnId ? [item] : next ? [{ columnId, direction: next }] : []));
}

export function pageCountOf(totalRows: number, pageSize: number) {
  return Math.max(1, Math.ceil(totalRows / pageSize));
}

export function clampPage(page: number, totalRows: number, pageSize: number) {
  return Math.min(Math.max(page, 1), pageCountOf(totalRows, pageSize));
}

export function pageRows<Row>(rows: readonly Row[], page: number, pageSize: number) {
  const start = (clampPage(page, rows.length, pageSize) - 1) * pageSize;

  return rows.slice(start, start + pageSize);
}

export function snapshotOf(state: DataGridState): DataGridSnapshot {
  return { version: 1, sort: state.sort, search: state.search, page: state.page, pageSize: state.pageSize };
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 1;
}

/**
 * Restaura de uma vez, tolerante ao que mudou desde que o retrato foi salvo: versão desconhecida volta ao padrão,
 * coluna que já não existe ou não ordena sai da ordenação, e o campo inválido fica com o valor padrão.
 */
export function restoreSnapshot<Row>(
  snapshot: unknown,
  columns: readonly DataGridColumnModel<Row>[],
  fallback: DataGridState,
): DataGridState {
  if (typeof snapshot !== 'object' || snapshot === null || (snapshot as { version?: unknown }).version !== 1) {
    return fallback;
  }

  const saved = snapshot as Partial<Record<keyof DataGridState, unknown>>;
  const sortable = new Set(columns.filter((column) => column.sortable !== false).map((column) => column.id));
  const sort = Array.isArray(saved.sort)
    ? saved.sort.filter(
        (item): item is DataGridSortItem =>
          sortable.has(item?.columnId) && (item.direction === 'asc' || item.direction === 'desc'),
      )
    : fallback.sort;

  return {
    sort,
    search: typeof saved.search === 'string' ? saved.search : fallback.search,
    page: isPositiveInteger(saved.page) ? saved.page : fallback.page,
    pageSize: isPositiveInteger(saved.pageSize) ? saved.pageSize : fallback.pageSize,
  };
}

const DETAIL_PREFIX = '\u0000';

export function detailKeyOf(rowKey: string) {
  return DETAIL_PREFIX + rowKey;
}

export function isDetailKey(key: string | null) {
  return key !== null && key.startsWith(DETAIL_PREFIX);
}

/** Linha `null` é a do cabeçalho. A posição é por chave, para o foco acompanhar a linha quando a ordem muda. */
export interface DataGridFocus {
  columnId: string;
  rowKey: string | null;
}

export type DataGridFocusMove =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'rowStart'
  | 'rowEnd'
  | 'gridStart'
  | 'gridEnd'
  | 'pageUp'
  | 'pageDown';

export interface DataGridFocusBounds {
  columnIds: readonly string[];
  pageStep: number;
  rowKeys: readonly string[];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function moveFocus(focus: DataGridFocus, move: DataGridFocusMove, bounds: DataGridFocusBounds): DataGridFocus {
  const { columnIds, pageStep, rowKeys } = bounds;
  const lastRow = rowKeys.length - 1;
  const lastColumn = columnIds.length - 1;
  const row = focus.rowKey === null ? -1 : rowKeys.indexOf(focus.rowKey);
  const column = Math.max(columnIds.indexOf(focus.columnId), 0);

  const [nextRow, nextColumn] = {
    up: [row - 1, column],
    down: [row + 1, column],
    left: [row, column - 1],
    right: [row, column + 1],
    rowStart: [row, 0],
    rowEnd: [row, lastColumn],
    gridStart: [-1, 0],
    gridEnd: [lastRow, lastColumn],
    pageUp: [row - pageStep, column],
    pageDown: [row + pageStep, column],
  }[move];
  const targetRow = clamp(nextRow, -1, lastRow);

  return {
    rowKey: targetRow === -1 ? null : rowKeys[targetRow],
    columnId: columnIds[clamp(nextColumn, 0, lastColumn)],
  };
}

/**
 * A célula com foco que saiu da tela — linha removida ou filtrada, coluna oculta — cede o lugar à que ocupa a mesma
 * posição, ou à última que restou. O detalhe recolhido devolve o foco à linha-mãe.
 */
export function reconcileFocus(
  focus: DataGridFocus,
  rowKeys: readonly string[],
  columnIds: readonly string[],
  lastRowIndex = 0,
) {
  const columnId = columnIds.includes(focus.columnId) ? focus.columnId : columnIds[0];
  const parentKey = isDetailKey(focus.rowKey) ? (focus.rowKey as string).slice(DETAIL_PREFIX.length) : null;
  const rowKey =
    focus.rowKey === null || rowKeys.includes(focus.rowKey)
      ? focus.rowKey
      : parentKey !== null && rowKeys.includes(parentKey)
        ? parentKey
        : (rowKeys[Math.min(lastRowIndex, rowKeys.length - 1)] ?? null);

  return columnId === focus.columnId && rowKey === focus.rowKey ? focus : { columnId, rowKey };
}

export type DataGridExpandMode = 'single' | 'multiple';

/** Na `single`, abrir um detalhe fecha o outro. */
export function toggleExpanded(expandedIds: readonly string[], rowKey: string, mode: DataGridExpandMode) {
  if (expandedIds.includes(rowKey)) {
    return expandedIds.filter((id) => id !== rowKey);
  }

  return mode === 'single' ? [rowKey] : [...expandedIds, rowKey];
}

/** Linha ou detalhe aberto, na ordem da tela: o detalhe vem logo depois da linha-mãe. */
export interface DataGridBodyItem {
  detail: boolean;
  /** Chave de foco: a da linha, ou a do detalhe, que não colide com nenhuma linha. */
  key: string;
  rowIndex: number;
  rowKey: string;
}

export function bodyItems(rowKeys: readonly string[], opened: (rowKey: string, rowIndex: number) => boolean) {
  const items: DataGridBodyItem[] = [];

  rowKeys.forEach((rowKey, rowIndex) => {
    items.push({ detail: false, key: rowKey, rowIndex, rowKey });
    if (opened(rowKey, rowIndex)) {
      items.push({ detail: true, key: detailKeyOf(rowKey), rowIndex, rowKey });
    }
  });

  return items;
}

/** Endereço de um detalhe entre os níveis: as alturas e o estado guardados sobrevivem ao desmonte por ele. */
export function detailPathOf(gridPath: string, rowKey: string) {
  return `${gridPath}\u001f${rowKey}`;
}
