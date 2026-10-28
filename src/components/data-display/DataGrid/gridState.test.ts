import {
  cellText,
  clampPage,
  columnAlign,
  moveFocus,
  pageRows,
  reconcileFocus,
  restoreSnapshot,
  searchRows,
  snapshotOf,
  sortRows,
  toggleSort,
  type DataGridColumnModel,
  type DataGridState,
} from './gridState';

interface Order {
  id: string;
  customer: string;
  total: number | null;
  issuedAt: string;
  urgent: boolean;
}

const columns: DataGridColumnModel<Order>[] = [
  { id: 'id', header: 'Nº', sortable: false },
  { id: 'customer', header: 'Cliente' },
  { id: 'total', header: 'Total', type: 'currency' },
  { id: 'issuedAt', header: 'Emissão', type: 'date' },
  { id: 'urgent', header: 'Urgente', type: 'boolean', searchable: false },
];

const orders: Order[] = [
  { id: '1', customer: 'Óleos Brasil', total: 1250, issuedAt: '2026-03-02', urgent: true },
  { id: '2', customer: 'Atacado Sul', total: null, issuedAt: '2026-01-15', urgent: false },
  { id: '3', customer: 'atacado norte', total: 300, issuedAt: '2026-02-20', urgent: false },
  { id: '4', customer: 'Item 10', total: 300, issuedAt: '2026-02-20', urgent: true },
  { id: '5', customer: 'Item 9', total: 80, issuedAt: '2026-04-01', urgent: false },
];

const ids = (rows: readonly Order[]) => rows.map((row) => row.id);

describe('cells', () => {
  it('formats by type and leaves empty values blank', () => {
    expect(cellText(columns[2], orders[0])).toBe('R$ 1.250,00');
    expect(cellText(columns[3], orders[0])).toBe('02/03/2026');
    expect(cellText(columns[4], orders[0])).toBe('Sim');
    expect(cellText(columns[2], orders[1])).toBe('');
  });

  it('prefers the column accessor and formatter', () => {
    const column: DataGridColumnModel<Order> = {
      id: 'label',
      header: 'Rótulo',
      value: (row) => row.customer.length,
      format: (value) => `${value} letras`,
    };

    expect(cellText(column, orders[1])).toBe('11 letras');
  });

  it('aligns numbers to the end unless the column says otherwise', () => {
    expect(columnAlign(columns[2])).toBe('end');
    expect(columnAlign(columns[1])).toBe('start');
    expect(columnAlign({ ...columns[2], align: 'center' })).toBe('center');
  });
});

describe('searchRows', () => {
  it('matches the displayed text, ignoring case and accents', () => {
    expect(ids(searchRows(orders, columns, 'oleos'))).toEqual(['1']);
    expect(ids(searchRows(orders, columns, '1.250,00'))).toEqual(['1']);
    expect(ids(searchRows(orders, columns, '20/02'))).toEqual(['3', '4']);
  });

  it('skips columns that opt out of search', () => {
    expect(searchRows(orders, columns, 'Sim')).toEqual([]);
  });

  it('returns the same rows for a blank term', () => {
    expect(searchRows(orders, columns, '  ')).toBe(orders);
  });
});

describe('sortRows', () => {
  it('orders text naturally and ignores case', () => {
    const sorted = sortRows(orders, columns, [{ columnId: 'customer', direction: 'asc' }]);

    expect(ids(sorted)).toEqual(['3', '2', '5', '4', '1']);
  });

  it('keeps empty values last in both directions', () => {
    expect(ids(sortRows(orders, columns, [{ columnId: 'total', direction: 'asc' }])).at(-1)).toBe('2');
    expect(ids(sortRows(orders, columns, [{ columnId: 'total', direction: 'desc' }])).at(-1)).toBe('2');
  });

  it('breaks ties with the next criterion and keeps the original order after that', () => {
    const byTotal = sortRows(orders, columns, [{ columnId: 'total', direction: 'desc' }]);
    const stacked = sortRows(orders, columns, [
      { columnId: 'total', direction: 'desc' },
      { columnId: 'customer', direction: 'desc' },
    ]);

    expect(ids(byTotal)).toEqual(['1', '3', '4', '5', '2']);
    expect(ids(stacked)).toEqual(['1', '4', '3', '5', '2']);
  });

  it('orders dates chronologically', () => {
    expect(ids(sortRows(orders, columns, [{ columnId: 'issuedAt', direction: 'asc' }]))).toEqual(['2', '3', '4', '1', '5']);
  });

  it('ignores criteria for unknown or unsortable columns', () => {
    expect(sortRows(orders, columns, [{ columnId: 'id', direction: 'desc' }])).toBe(orders);
    expect(sortRows(orders, columns, [{ columnId: 'gone', direction: 'asc' }])).toBe(orders);
  });
});

describe('toggleSort', () => {
  it('cycles ascending, descending and none, replacing other columns', () => {
    const first = toggleSort([{ columnId: 'total', direction: 'asc' }], 'customer');

    expect(first).toEqual([{ columnId: 'customer', direction: 'asc' }]);
    expect(toggleSort(first, 'customer')).toEqual([{ columnId: 'customer', direction: 'desc' }]);
    expect(toggleSort([{ columnId: 'customer', direction: 'desc' }], 'customer')).toEqual([]);
  });

  it('stacks a new column after the others and changes one in place', () => {
    const sort = toggleSort([{ columnId: 'total', direction: 'asc' }], 'customer', true);

    expect(sort).toEqual([
      { columnId: 'total', direction: 'asc' },
      { columnId: 'customer', direction: 'asc' },
    ]);
    expect(toggleSort(sort, 'total', true)).toEqual([
      { columnId: 'total', direction: 'desc' },
      { columnId: 'customer', direction: 'asc' },
    ]);
    expect(toggleSort([{ columnId: 'total', direction: 'desc' }, ...sort.slice(1)], 'total', true)).toEqual([
      { columnId: 'customer', direction: 'asc' },
    ]);
  });
});

describe('pagination', () => {
  it('slices the requested page and clamps it to the range', () => {
    expect(ids(pageRows(orders, 2, 2))).toEqual(['3', '4']);
    expect(ids(pageRows(orders, 9, 2))).toEqual(['5']);
    expect(clampPage(0, 5, 2)).toBe(1);
    expect(clampPage(4, 0, 25)).toBe(1);
  });
});

describe('snapshots', () => {
  const fallback: DataGridState = { sort: [], search: '', page: 1, pageSize: 25 };

  it('round-trips the state', () => {
    const state: DataGridState = { sort: [{ columnId: 'total', direction: 'desc' }], search: 'sul', page: 3, pageSize: 50 };

    expect(restoreSnapshot(JSON.parse(JSON.stringify(snapshotOf(state))), columns, fallback)).toEqual(state);
  });

  it('falls back on an unknown version or shape', () => {
    expect(restoreSnapshot({ version: 2, page: 4 }, columns, fallback)).toBe(fallback);
    expect(restoreSnapshot('salvo', columns, fallback)).toBe(fallback);
  });

  it('drops what no longer applies and keeps the rest', () => {
    const restored = restoreSnapshot(
      {
        version: 1,
        sort: [
          { columnId: 'gone', direction: 'asc' },
          { columnId: 'id', direction: 'asc' },
          { columnId: 'customer', direction: 'sideways' },
          { columnId: 'total', direction: 'desc' },
        ],
        search: 7,
        page: 2,
        pageSize: 0,
      },
      columns,
      fallback,
    );

    expect(restored).toEqual({ sort: [{ columnId: 'total', direction: 'desc' }], search: '', page: 2, pageSize: 25 });
  });
});

describe('focus', () => {
  const bounds = { columnIds: ['a', 'b', 'c'], rowKeys: ['r1', 'r2', 'r3', 'r4'], pageStep: 2 };

  it('moves between cells and stops at the edges', () => {
    expect(moveFocus({ rowKey: 'r1', columnId: 'a' }, 'right', bounds)).toEqual({ rowKey: 'r1', columnId: 'b' });
    expect(moveFocus({ rowKey: 'r1', columnId: 'a' }, 'left', bounds)).toEqual({ rowKey: 'r1', columnId: 'a' });
    expect(moveFocus({ rowKey: 'r4', columnId: 'c' }, 'down', bounds)).toEqual({ rowKey: 'r4', columnId: 'c' });
  });

  it('treats the header as the first row', () => {
    expect(moveFocus({ rowKey: 'r1', columnId: 'b' }, 'up', bounds)).toEqual({ rowKey: null, columnId: 'b' });
    expect(moveFocus({ rowKey: null, columnId: 'b' }, 'up', bounds)).toEqual({ rowKey: null, columnId: 'b' });
    expect(moveFocus({ rowKey: null, columnId: 'b' }, 'down', bounds)).toEqual({ rowKey: 'r1', columnId: 'b' });
  });

  it('jumps to the row and grid edges and by pages', () => {
    expect(moveFocus({ rowKey: 'r2', columnId: 'b' }, 'rowEnd', bounds)).toEqual({ rowKey: 'r2', columnId: 'c' });
    expect(moveFocus({ rowKey: 'r2', columnId: 'b' }, 'gridEnd', bounds)).toEqual({ rowKey: 'r4', columnId: 'c' });
    expect(moveFocus({ rowKey: 'r2', columnId: 'b' }, 'gridStart', bounds)).toEqual({ rowKey: null, columnId: 'a' });
    expect(moveFocus({ rowKey: 'r1', columnId: 'b' }, 'pageDown', bounds)).toEqual({ rowKey: 'r3', columnId: 'b' });
    expect(moveFocus({ rowKey: 'r1', columnId: 'b' }, 'pageUp', bounds)).toEqual({ rowKey: null, columnId: 'b' });
  });

  it('stays on the header when there are no rows', () => {
    expect(moveFocus({ rowKey: null, columnId: 'a' }, 'down', { ...bounds, rowKeys: [] })).toEqual({
      rowKey: null,
      columnId: 'a',
    });
  });

  it('gives the place of a vanished cell to the one in the same position, or the last left', () => {
    const focus = { rowKey: 'r2', columnId: 'b' };

    expect(reconcileFocus(focus, ['r1', 'r2'], ['a', 'b'])).toBe(focus);
    expect(reconcileFocus(focus, ['r3'], ['a'])).toEqual({ rowKey: 'r3', columnId: 'a' });
    expect(reconcileFocus(focus, [], ['b'])).toEqual({ rowKey: null, columnId: 'b' });
    expect(reconcileFocus(focus, ['r1', 'r3'], ['b'], 1)).toEqual({ rowKey: 'r3', columnId: 'b' });
    expect(reconcileFocus(focus, ['r1'], ['b'], 1)).toEqual({ rowKey: 'r1', columnId: 'b' });
  });
});
