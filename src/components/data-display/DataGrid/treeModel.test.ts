import { buildTree, flattenTree, pruneTree, sortTree, treeRows } from './treeModel';

interface Account {
  id: string;
  name: string;
  children?: Account[];
}

const accounts: Account[] = [
  {
    id: '1',
    name: 'Receitas',
    children: [
      { id: '1.2', name: 'Serviços' },
      { id: '1.1', name: 'Vendas', children: [{ id: '1.1.1', name: 'Atacado' }] },
    ],
  },
  { id: '2', name: 'Despesas', children: undefined },
  { id: '3', name: 'Ajustes', children: [] },
];

const tree = buildTree(accounts, (account) => account.children);
const idOf = (account: Account) => account.id;
const opened = (keys: string[]) => (key: string) => keys.includes(key);
const keysOf = (nodes: { key: string }[]) => nodes.map((node) => node.key);

describe('tree', () => {
  it('flattens only the open branches, with depth and position among siblings', () => {
    const nodes = flattenTree(tree, idOf, opened(['1']), () => true);

    expect(keysOf(nodes)).toEqual(['1', '1.2', '1.1', '2', '3']);
    expect(nodes[2]).toMatchObject({ depth: 1, position: 2, setSize: 2, expandable: true, expanded: false, rootIndex: 0 });
    expect(nodes[4]).toMatchObject({ expandable: false, rootIndex: 2 });
  });

  it('marks an open branch whose children are not loaded yet', () => {
    const nodes = flattenTree(tree, idOf, opened(['2']), (account) => account.id === '2');

    expect(nodes.find((node) => node.key === '2')).toMatchObject({ expandable: true, expanded: true, loading: true });
  });

  it('keeps the ancestors of a match and the whole branch that matches', () => {
    const all = treeRows(tree);
    const kept = new Set(all.filter((account) => account.name === 'Atacado' || account.name === 'Receitas'));

    expect(keysOf(flattenTree(pruneTree(tree, kept), idOf, opened(['1', '1.1']), () => true))).toEqual([
      '1',
      '1.2',
      '1.1',
      '1.1.1',
    ]);

    const onlyLeaf = new Set(all.filter((account) => account.name === 'Atacado'));
    expect(keysOf(flattenTree(pruneTree(tree, onlyLeaf), idOf, opened(['1', '1.1']), () => true))).toEqual(['1', '1.1', '1.1.1']);
  });

  it('sorts among siblings without taking a child from its parent', () => {
    const byName = (rows: readonly Account[]) => [...rows].sort((a, b) => a.name.localeCompare(b.name));

    expect(keysOf(flattenTree(sortTree(tree, byName), idOf, opened(['1']), () => true))).toEqual(['3', '2', '1', '1.2', '1.1']);
  });
});
