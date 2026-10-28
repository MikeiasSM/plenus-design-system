import {
  defaultColumnState,
  moveColumn,
  moveColumnTo,
  normalizeColumnState,
  pinColumn,
  placeColumns,
  resizeColumn,
  setColumnHidden,
  type DataGridColumnSizing,
} from './columnLayout';

const columns: DataGridColumnSizing[] = [
  { id: 'id', width: 80, pinned: 'start' },
  { id: 'customer', flex: 2, minWidth: 100 },
  { id: 'city', minWidth: 100 },
  { id: 'total', width: 120 },
  { id: 'actions', width: 60, pinned: 'end' },
];

const initial = defaultColumnState(columns);

function ids(state = initial, viewWidth = 0) {
  return placeColumns(columns, state, viewWidth, 0).map((item) => item.column.id);
}

describe('columnLayout', () => {
  it('starts from the definition, with the declared pins', () => {
    expect(initial).toEqual({
      hidden: [],
      order: ['id', 'customer', 'city', 'total', 'actions'],
      pinned: { id: 'start', actions: 'end' },
      widths: {},
    });
  });

  it('places the pinned columns at the edges with their offsets and marks the dividers', () => {
    const state = pinColumn(initial, 'total', 'start');
    const placed = placeColumns(columns, state, 0, 0);

    expect(placed.map((item) => item.column.id)).toEqual(['id', 'total', 'customer', 'city', 'actions']);
    expect(placed.map((item) => item.offset)).toEqual([0, 80, 0, 0, 0]);
    expect(placed.filter((item) => item.edge).map((item) => item.column.id)).toEqual(['total', 'actions']);
  });

  it('gives the spare width to the flexible columns by weight, and the controls to the first one', () => {
    const placed = placeColumns(columns, initial, 760, 24);

    expect(placed.map((item) => item.width)).toEqual([104, 284, 192, 120, 60]);
  });

  it('keeps a resized column fixed and leaves the hidden ones out', () => {
    const state = setColumnHidden(resizeColumn(initial, 'customer', 180.4), 'city', true);
    const placed = placeColumns(columns, state, 1000, 0);

    expect(placed.map((item) => item.column.id)).toEqual(['id', 'customer', 'total', 'actions']);
    expect(placed[1].width).toBe(180);
    expect(ids(setColumnHidden(state, 'city', false))).toContain('city');
  });

  it('moves a column one step or onto another, without crossing the pinned edge', () => {
    expect(moveColumn(initial, 'customer', 1).order).toEqual(['id', 'city', 'customer', 'total', 'actions']);
    expect(moveColumn(initial, 'customer', -1)).toBe(initial);
    expect(moveColumnTo(initial, 'total', 'customer').order).toEqual(['id', 'total', 'customer', 'city', 'actions']);
    expect(moveColumnTo(initial, 'customer', 'id')).toBe(initial);
  });

  it('skips hidden columns when stepping', () => {
    const state = setColumnHidden(initial, 'city', true);

    expect(ids(moveColumn(state, 'customer', 1))).toEqual(['id', 'total', 'customer', 'actions']);
  });

  it('reconciles a saved state with the current columns', () => {
    const saved = {
      order: ['total', 'gone', 'customer', 'id'],
      hidden: ['gone', 'city'],
      pinned: { total: 'end', gone: 'start', customer: 'middle' },
      widths: { customer: 150, gone: 90, city: -1 },
    };

    expect(normalizeColumnState(saved, columns)).toEqual({
      order: ['total', 'actions', 'customer', 'city', 'id'],
      hidden: ['city'],
      pinned: { actions: 'end', total: 'end' },
      widths: { customer: 150 },
    });
    expect(normalizeColumnState(null, columns)).toEqual(initial);
    expect(normalizeColumnState({ hidden: ['city'] }, columns)).toEqual({ ...initial, hidden: ['city'] });
  });
});
