import { flattenGroups, buildGroups, indexGroups, leafRows } from './groupModel';
import type { DataGridColumnModel } from './gridState';

interface Sale {
  id: string;
  region: string;
  seller: string;
  total: number;
}

const columns: DataGridColumnModel<Sale>[] = [
  { id: 'region', header: 'Região' },
  { id: 'seller', header: 'Vendedor' },
  { id: 'total', header: 'Total', type: 'number', summary: 'sum' },
];

const sales: Sale[] = [
  { id: '1', region: 'Sul', seller: 'Ana', total: 10 },
  { id: '2', region: 'Norte', seller: 'Bia', total: 20 },
  { id: '3', region: 'Sul', seller: 'Caio', total: 30 },
  { id: '4', region: 'Sul', seller: 'Ana', total: 40 },
];
const rowIdOf = (sale: Sale) => sale.id;

describe('groupModel', () => {
  it('groups by the displayed text, in order of appearance, with the column aggregates', () => {
    const groups = buildGroups(sales, columns, ['region']);

    expect(groups.map((group) => [group.text, group.rows.length, group.aggregates.total])).toEqual([
      ['Sul', 3, 80],
      ['Norte', 1, 20],
    ]);
    expect(groups[0].children).toEqual([]);
  });

  it('nests groups by the next column and aggregates at every level', () => {
    const [south] = buildGroups(sales, columns, ['region', 'seller']);

    expect(south.children.map((group) => [group.text, group.aggregates.total])).toEqual([
      ['Ana', 50],
      ['Caio', 30],
    ]);
  });

  it('lists a group row and, only when open, what is inside it', () => {
    const groups = buildGroups(sales, columns, ['region']);
    const closed = flattenGroups(groups, rowIdOf, () => false);
    const open = flattenGroups(groups, rowIdOf, (key) => key === groups[0].key);

    expect(closed.map((node) => node.depth)).toEqual([0, 0]);
    expect(open.map((node) => [node.depth, node.key === groups[0].key ? 'group' : node.key])).toEqual([
      [0, 'group'],
      [1, '1'],
      [1, '3'],
      [1, '4'],
      [0, groups[1].key],
    ]);
    expect(open[1]).toMatchObject({ position: 1, setSize: 3, rootIndex: 0 });
    expect(open[4].rootIndex).toBe(1);
  });

  it('maps every group and row to its parent group', () => {
    const groups = buildGroups(sales, columns, ['region', 'seller']);
    const { byKey, parents } = indexGroups(groups, rowIdOf);

    expect(byKey.size).toBe(5);
    expect(parents.get('1')).toBe(groups[0].children[0].key);
    expect(parents.get(groups[0].children[0].key)).toBe(groups[0].key);
  });
});

describe('leafRows', () => {
  it('lists the rows in the order the groups show them', () => {
    const groups = buildGroups(sales, columns, ['region', 'seller']);

    expect(leafRows(groups).map((sale) => sale.id)).toEqual(['1', '4', '3', '2']);
  });
});
