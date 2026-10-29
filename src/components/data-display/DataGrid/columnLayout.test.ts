import {
  defaultColumnState,
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
      collapsedGroups: [],
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

  it('gives the width a flexible column cannot take to the other flexible ones', () => {
    const capped: DataGridColumnSizing[] = [{ id: 'a', maxWidth: 150 }, { id: 'b' }];

    expect(placeColumns(capped, defaultColumnState(capped), 1000, 0).map((item) => item.width)).toEqual([150, 850]);
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
      collapsedGroups: [],
      order: ['total', 'actions', 'customer', 'city', 'id'],
      hidden: ['city'],
      pinned: { actions: 'end', total: 'end' },
      widths: { customer: 150 },
    });
    expect(normalizeColumnState(null, columns)).toEqual(initial);
    expect(normalizeColumnState({ hidden: ['city'] }, columns)).toEqual({ ...initial, hidden: ['city'] });
  });

  describe('groups', () => {
    const definitions: (DataGridColumnSizing | DataGridColumnGroupSizing<DataGridColumnSizing>)[] = [
      { id: 'id', width: 80 },
      {
        id: 'money',
        header: 'Financeiro',
        collapsible: true,
        children: [
          { id: 'values', header: 'Valores', children: [{ id: 'gross', width: 100, hideWhenCollapsed: true }, { id: 'net', width: 100 }] },
          { id: 'items', width: 90 },
        ],
      },
      { id: 'status', header: 'Situação', children: [{ id: 'state', width: 100 }] },
    ];
    const { columns: leaves, groupsOf } = flattenColumns(definitions);
    const state = defaultColumnState(leaves);

    function boxes(columnState = state) {
      const placed = placeColumns(leaves, { ...columnState, hidden: effectiveHidden(columnState, leaves, groupsOf) }, 0, 0);
      return headerSegments(placed, groupsOf).map((s) => `${s.group?.header ?? '-'} ${s.level}/${s.rowSpan} ${s.first}+${s.span}`);
    }

    it('flattens the leaves in order, each with the path of its groups', () => {
      expect(leaves.map((column) => column.id)).toEqual(['id', 'gross', 'net', 'items', 'state']);
      expect(groupsOf.get('net')?.map((group) => group.header)).toEqual(['Financeiro', 'Valores']);
    });

    it('stacks the boxes: a group without subgroups goes down to the titles, and ungrouped columns get one block', () => {
      expect(boxes()).toEqual(['- 0/2 0+1', 'Financeiro 0/1 1+3', 'Situação 0/2 4+1', 'Valores 1/1 1+2', '- 1/1 3+1']);
    });

    it('splits a group at the pinned edge', () => {
      expect(boxes(pinColumn(state, 'gross', 'start'))).toContain('Financeiro 0/1 0+1');
    });

    it('hides the marked columns of a collapsed group', () => {
      expect(effectiveHidden(toggleGroupCollapsed(state, 'money'), leaves, groupsOf)).toEqual(['gross']);
    });

    it('keeps one column of a collapsed group on the screen, so the way back stays', () => {
      const onlyGross = setColumnHidden(setColumnHidden(state, 'net', true), 'items', true);

      expect(effectiveHidden(toggleGroupCollapsed(onlyGross, 'money'), leaves, groupsOf)).toEqual(['net', 'items']);
    });

    it('moves a column only among the siblings of its group', () => {
      const groupKeyOf = (id: string) => groupsOf.get(id)?.at(-1)?.id ?? '';

      expect(moveColumn(state, 'items', -1, groupKeyOf)).toBe(state);
      expect(moveColumn(state, 'net', -1, groupKeyOf).order).toEqual(['id', 'net', 'gross', 'items', 'state']);
      expect(moveColumnTo(state, 'id', 'state', groupKeyOf)).toBe(state);
    });
  });
});
