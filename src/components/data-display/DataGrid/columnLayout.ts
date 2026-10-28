/** Disposição das colunas que a pessoa muda pela grade: ordem, ocultas, fixas e larguras. Puro, sem React nem DOM. */

export type DataGridPin = 'start' | 'end';

export interface DataGridColumnState {
  hidden: readonly string[];
  order: readonly string[];
  pinned: Readonly<Record<string, DataGridPin>>;
  /** Larguras dadas pela pessoa, em pixels: a coluna redimensionada deixa de ser flexível. */
  widths: Readonly<Record<string, number>>;
}

export interface DataGridColumnSizing {
  /** Peso na divisão da sobra de largura. Sem `width`, a coluna é flexível com peso 1. */
  flex?: number;
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

  return { hidden: [], order: columns.map((column) => column.id), pinned, widths: {} };
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
export function normalizeColumnState(saved: unknown, columns: readonly DataGridColumnSizing[]): DataGridColumnState {
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

/** Um passo para o lado entre as visíveis da mesma área; a coluna não atravessa a divisa das fixas. */
export function moveColumn(state: DataGridColumnState, columnId: string, step: -1 | 1): DataGridColumnState {
  const hidden = new Set(state.hidden);
  const pin = state.pinned[columnId];
  const siblings = state.order.filter((id) => !hidden.has(id) && state.pinned[id] === pin);
  const target = siblings[siblings.indexOf(columnId) + step];

  return target === undefined ? state : moveColumnTo(state, columnId, target);
}

/** Leva a coluna ao lugar de outra da mesma área, como no arrasto. */
export function moveColumnTo(state: DataGridColumnState, columnId: string, targetId: string): DataGridColumnState {
  if (columnId === targetId || state.pinned[columnId] !== state.pinned[targetId]) {
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

export function resizeColumn(state: DataGridColumnState, columnId: string, width: number): DataGridColumnState {
  return { ...state, widths: { ...state.widths, [columnId]: Math.round(width) } };
}
