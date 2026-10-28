/** Disposição das colunas que a pessoa muda pela grade: ordem, ocultas, fixas e larguras. Puro, sem React nem DOM. */

export type DataGridPin = 'start' | 'end';

export interface DataGridColumnState {
  /** Grupos recolhidos pela pessoa. */
  collapsedGroups: readonly string[];
  hidden: readonly string[];
  order: readonly string[];
  pinned: Readonly<Record<string, DataGridPin>>;
  /** Larguras dadas pela pessoa, em pixels: a coluna redimensionada deixa de ser flexível. */
  widths: Readonly<Record<string, number>>;
}

export interface DataGridColumnSizing {
  /** Peso na divisão da sobra de largura. Sem `width`, a coluna é flexível com peso 1. */
  flex?: number;
  /** Sai da tela quando um grupo recolhível acima dela é recolhido. */
  hideWhenCollapsed?: boolean;
  id: string;
  maxWidth?: number;
  minWidth?: number;
  pinned?: DataGridPin;
  /** Largura fixa, em pixels. */
  width?: number;
}

const DEFAULT_MIN_WIDTH = 120;

export function defaultColumnState(columns: readonly DataGridColumnSizing[]): DataGridColumnState {
  const pinned: Record<string, DataGridPin> = {};
  columns.forEach((column) => {
    if (column.pinned) {
      pinned[column.id] = column.pinned;
    }
  });

  return { collapsedGroups: [], hidden: [], order: columns.map((column) => column.id), pinned, widths: {} };
}

function isPin(value: unknown): value is DataGridPin {
  return value === 'start' || value === 'end';
}

function entriesOf(value: unknown) {
  return typeof value === 'object' && value !== null ? Object.entries(value) : [];
}

/**
 * Concilia um estado salvo, ou parcial, com as colunas atuais: o que já não existe sai, e a coluna nova entra na
 * posição padrão, depois da vizinha que a precede na definição.
 */
export function normalizeColumnState(
  saved: unknown,
  columns: readonly DataGridColumnSizing[],
  groupIds: readonly string[] = [],
): DataGridColumnState {
  const fallback = defaultColumnState(columns);

  if (typeof saved !== 'object' || saved === null) {
    return fallback;
  }

  const known = new Set(fallback.order);
  const state = saved as Partial<Record<keyof DataGridColumnState, unknown>>;
  const savedIds = new Set(Array.isArray(state.order) ? state.order : []);
  const order = Array.isArray(state.order)
    ? [...new Set(state.order.filter((id): id is string => known.has(id)))]
    : [...fallback.order];

  fallback.order.forEach((id, index) => {
    if (!order.includes(id)) {
      const previous = fallback.order[index - 1];
      order.splice(previous === undefined ? 0 : order.indexOf(previous) + 1, 0, id);
    }
  });

  return {
    collapsedGroups: Array.isArray(state.collapsedGroups)
      ? state.collapsedGroups.filter((id): id is string => groupIds.includes(id))
      : fallback.collapsedGroups,
    hidden: Array.isArray(state.hidden) ? state.hidden.filter((id): id is string => known.has(id)) : fallback.hidden,
    order,
    pinned:
      state.pinned === undefined
        ? fallback.pinned
        : {
            ...Object.fromEntries(Object.entries(fallback.pinned).filter(([id]) => !savedIds.has(id))),
            ...Object.fromEntries(entriesOf(state.pinned).filter(([id, pin]) => known.has(id) && isPin(pin))),
          },
    widths: Object.fromEntries(
      entriesOf(state.widths).filter(([id, width]) => known.has(id) && typeof width === 'number' && width > 0),
    ),
  };
}

export interface DataGridPlacedColumn<Column> {
  column: Column;
  /** Última fixa no início ou primeira fixa no fim: a divisa com as que rolam. */
  edge: boolean;
  /** Distância da borda em que a coluna fixa cola: esquerda para `start`, direita para `end`. */
  offset: number;
  pin: DataGridPin | undefined;
  width: number;
}

/**
 * Colunas visíveis na ordem da tela: as fixas no início, as que rolam, as fixas no fim. A sobra da largura da tela vai
 * às flexíveis, pelo peso. `hostExtra` é o espaço dos controles da linha, somado à primeira coluna.
 */
export function placeColumns<Column extends DataGridColumnSizing>(
  columns: readonly Column[],
  state: DataGridColumnState,
  viewWidth: number,
  hostExtra: number,
): DataGridPlacedColumn<Column>[] {
  const byId = new Map(columns.map((column) => [column.id, column]));
  const hidden = new Set(state.hidden);
  const visible = state.order.flatMap((id) => {
    const column = byId.get(id);
    return column && !hidden.has(id) ? [column] : [];
  });
  const zone = (pin: DataGridPin | undefined) => visible.filter((column) => state.pinned[column.id] === pin);
  const display = [...zone('start'), ...zone(undefined), ...zone('end')];

  const extraOf = (index: number) => (index === 0 ? hostExtra : 0);
  const flexible = (column: Column) => state.widths[column.id] === undefined && column.width === undefined;
  const bases = display.map(
    (column, index) =>
      (state.widths[column.id] ?? column.width ?? column.minWidth ?? DEFAULT_MIN_WIDTH) + extraOf(index),
  );
  const spare = Math.max(viewWidth - bases.reduce((sum, base) => sum + base, 0), 0);
  const weights = display.reduce((sum, column) => sum + (flexible(column) ? (column.flex ?? 1) : 0), 0);

  const placed = display.map((column, index): DataGridPlacedColumn<Column> => {
    const share = flexible(column) && weights > 0 ? Math.floor((spare * (column.flex ?? 1)) / weights) : 0;
    const max = column.maxWidth === undefined ? Infinity : column.maxWidth + extraOf(index);
    return { column, edge: false, offset: 0, pin: state.pinned[column.id], width: Math.min(bases[index] + share, max) };
  });

  let start = 0;
  placed.forEach((item) => {
    if (item.pin === 'start') {
      item.offset = start;
      start += item.width;
    }
  });
  let end = 0;
  [...placed].reverse().forEach((item) => {
    if (item.pin === 'end') {
      item.offset = end;
      end += item.width;
    }
  });

  const lastStart = [...placed].reverse().find((item) => item.pin === 'start');
  const firstEnd = placed.find((item) => item.pin === 'end');
  [lastStart, firstEnd].forEach((item) => {
    if (item) {
      item.edge = true;
    }
  });

  return placed;
}

/** Chave do grupo imediato de cada coluna: ela só se move entre as irmãs dele. */
export type DataGridGroupKeyOf = (columnId: string) => string;

const NO_GROUP: DataGridGroupKeyOf = () => '';

/** Um passo para o lado entre as visíveis da mesma área e do mesmo grupo; não atravessa a divisa das fixas. */
export function moveColumn(
  state: DataGridColumnState,
  columnId: string,
  step: -1 | 1,
  groupKeyOf = NO_GROUP,
): DataGridColumnState {
  const hidden = new Set(state.hidden);
  const pin = state.pinned[columnId];
  const group = groupKeyOf(columnId);
  const siblings = state.order.filter((id) => !hidden.has(id) && state.pinned[id] === pin && groupKeyOf(id) === group);
  const target = siblings[siblings.indexOf(columnId) + step];

  return target === undefined ? state : moveColumnTo(state, columnId, target, groupKeyOf);
}

/** Leva a coluna ao lugar de outra da mesma área e do mesmo grupo, como no arrasto. */
export function moveColumnTo(
  state: DataGridColumnState,
  columnId: string,
  targetId: string,
  groupKeyOf = NO_GROUP,
): DataGridColumnState {
  const elsewhere = state.pinned[columnId] !== state.pinned[targetId] || groupKeyOf(columnId) !== groupKeyOf(targetId);

  if (columnId === targetId || elsewhere) {
    return state;
  }

  const forward = state.order.indexOf(columnId) < state.order.indexOf(targetId);
  const order = state.order.filter((id) => id !== columnId);
  order.splice(order.indexOf(targetId) + (forward ? 1 : 0), 0, columnId);

  return { ...state, order };
}

export function pinColumn(state: DataGridColumnState, columnId: string, pin: DataGridPin | null): DataGridColumnState {
  const pinned = { ...state.pinned };

  if (pin) {
    pinned[columnId] = pin;
  } else {
    delete pinned[columnId];
  }

  return { ...state, pinned };
}

export function setColumnHidden(state: DataGridColumnState, columnId: string, hidden: boolean): DataGridColumnState {
  const others = state.hidden.filter((id) => id !== columnId);
  return { ...state, hidden: hidden ? [...others, columnId] : others };
}

export function toggleGroupCollapsed(state: DataGridColumnState, groupId: string): DataGridColumnState {
  const collapsed = state.collapsedGroups.includes(groupId);
  return {
    ...state,
    collapsedGroups: collapsed ? state.collapsedGroups.filter((id) => id !== groupId) : [...state.collapsedGroups, groupId],
  };
}

/** As ocultas pela pessoa e as que saem com um grupo recolhido acima delas. */
export function effectiveHidden<Column extends DataGridColumnSizing>(
  state: DataGridColumnState,
  columns: readonly Column[],
  groupsOf: ReadonlyMap<string, readonly DataGridGroupInfo[]>,
) {
  const collapsed = new Set(state.collapsedGroups);
  const byCollapse = columns.filter(
    (column) => column.hideWhenCollapsed && (groupsOf.get(column.id) ?? []).some((group) => collapsed.has(group.id)),
  );

  return byCollapse.length === 0 ? state.hidden : [...state.hidden, ...byCollapse.map((column) => column.id)];
}

export function resizeColumn(state: DataGridColumnState, columnId: string, width: number): DataGridColumnState {
  return { ...state, widths: { ...state.widths, [columnId]: Math.round(width) } };
}

export interface DataGridGroupInfo {
  collapsible: boolean;
  header: string;
  id: string;
}

/** Grupo de títulos: as colunas de `children` ficam debaixo dele, em quantos níveis houver. */
export interface DataGridColumnGroupSizing<Column> {
  children: readonly (Column | DataGridColumnGroupSizing<Column>)[];
  /** Mostra a seta que recolhe o grupo, escondendo as colunas com `hideWhenCollapsed`. */
  collapsible?: boolean;
  header: string;
  id: string;
}

export function isColumnGroup<Column>(
  definition: Column | DataGridColumnGroupSizing<Column>,
): definition is DataGridColumnGroupSizing<Column> {
  return typeof definition === 'object' && definition !== null && 'children' in definition;
}

/** As colunas da definição, na ordem, cada uma com o caminho dos grupos acima dela. */
export function flattenColumns<Column extends DataGridColumnSizing>(
  definitions: readonly (Column | DataGridColumnGroupSizing<Column>)[],
  path: readonly DataGridGroupInfo[] = [],
  groupsOf = new Map<string, readonly DataGridGroupInfo[]>(),
): { columns: Column[]; groupsOf: Map<string, readonly DataGridGroupInfo[]> } {
  const columns: Column[] = [];

  definitions.forEach((definition) => {
    if (isColumnGroup(definition)) {
      const group = { collapsible: definition.collapsible ?? false, header: definition.header, id: definition.id };
      columns.push(...flattenColumns(definition.children, [...path, group], groupsOf).columns);
    } else {
      groupsOf.set(definition.id, path);
      columns.push(definition);
    }
  });

  return { columns, groupsOf };
}

export interface DataGridHeaderSegment {
  /** Coluna inicial na tela e quantas o segmento cobre. */
  first: number;
  group: DataGridGroupInfo | null;
  key: string;
  /** Linha do cabeçalho, a partir de 0, e quantas linhas o segmento ocupa. */
  level: number;
  offset: number;
  pin: DataGridPin | undefined;
  rowSpan: number;
  span: number;
  width: number;
}

/**
 * Caixas da área de grupos, acima dos títulos. O grupo sem subgrupo desce até os títulos; acima das colunas sem
 * grupo, um bloco só, dividido apenas na divisa das fixas.
 */
export function headerSegments<Column extends DataGridColumnSizing>(
  placed: readonly DataGridPlacedColumn<Column>[],
  groupsOf: ReadonlyMap<string, readonly DataGridGroupInfo[]>,
): DataGridHeaderSegment[] {
  const paths = placed.map((item) => groupsOf.get(item.column.id) ?? []);
  const depth = Math.max(0, ...paths.map((path) => path.length));
  const coveredUntil = placed.map(() => -1);
  const segments: DataGridHeaderSegment[] = [];

  for (let level = 0; level < depth; level += 1) {
    const row: DataGridHeaderSegment[] = [];
    let current: DataGridHeaderSegment | null = null;

    placed.forEach((item, index) => {
      if (coveredUntil[index] >= level) {
        current = null;
        return;
      }

      const group = paths[index][level] ?? null;
      const parent = paths[index][level - 1]?.id ?? '';
      const key = `${group ? `g:${group.id}` : `b:${parent}`}|${item.pin ?? ''}|${level}`;

      if (current?.key === key) {
        current.span += 1;
        current.width += item.width;
        if (item.pin === 'end') {
          current.offset = item.offset;
        }
        return;
      }

      current = { first: index, group, key, level, offset: item.offset, pin: item.pin, rowSpan: 1, span: 1, width: item.width };
      row.push(current);
    });

    row.forEach((segment) => {
      const indexes = Array.from({ length: segment.span }, (_, i) => segment.first + i);
      const deeper = segment.group !== null && indexes.some((index) => paths[index][level + 1]);
      segment.rowSpan = deeper ? 1 : depth - level;
      indexes.forEach((index) => {
        coveredUntil[index] = level + segment.rowSpan - 1;
      });
    });
    segments.push(...row);
  }

  return segments;
}
