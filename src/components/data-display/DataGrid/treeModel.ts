/** Árvore do DataGrid: os filhos são linhas da mesma grade. Montar, podar pelo filtro, ordenar irmãos e achatar. */

/** `children` indefinido: filhos ainda não carregados. */
export interface DataGridTreeBranch<Row> {
  children: readonly DataGridTreeBranch<Row>[] | undefined;
  row: Row;
}

export function buildTree<Row>(
  rows: readonly Row[],
  getChildren: (row: Row) => readonly Row[] | undefined,
): DataGridTreeBranch<Row>[] {
  return rows.map((row) => {
    const children = getChildren(row);
    return { row, children: children && buildTree(children, getChildren) };
  });
}

/** Todas as linhas carregadas, em pré-ordem: é sobre elas que a busca e o filtro rodam. */
export function treeRows<Row>(branches: readonly DataGridTreeBranch<Row>[]): Row[] {
  return branches.flatMap((branch) => [branch.row, ...treeRows(branch.children ?? [])]);
}

/** Fica o ramo que atende, inteiro, e os ancestrais de quem atende, com o caminho até ele. */
export function pruneTree<Row>(branches: readonly DataGridTreeBranch<Row>[], kept: ReadonlySet<Row>): DataGridTreeBranch<Row>[] {
  return branches.flatMap((branch) => {
    if (kept.has(branch.row)) {
      return [branch];
    }

    const children = pruneTree(branch.children ?? [], kept);
    return children.length > 0 ? [{ row: branch.row, children }] : [];
  });
}

/** Os mais altos que atendem: sem filtro, as raízes; com filtro, cada ramo que atende, sem contar duas vezes. */
export function topRows<Row>(branches: readonly DataGridTreeBranch<Row>[], kept: ReadonlySet<Row> | null): Row[] {
  return branches.flatMap((branch) =>
    !kept || kept.has(branch.row) ? [branch.row] : topRows(branch.children ?? [], kept),
  );
}

/** O pai de cada linha carregada, para o foco subir quando o ramo recolhe. */
export function parentKeysOf<Row>(branches: readonly DataGridTreeBranch<Row>[], rowIdOf: (row: Row) => string) {
  const parents = new Map<string, string>();

  function visit(level: readonly DataGridTreeBranch<Row>[], parent: string | undefined) {
    level.forEach((branch) => {
      const key = rowIdOf(branch.row);
      if (parent !== undefined) {
        parents.set(key, parent);
      }
      visit(branch.children ?? [], key);
    });
  }

  visit(branches, undefined);
  return parents;
}

/** A ordem vale entre irmãos: o filho nunca sai de baixo do pai. */
export function sortTree<Row>(
  branches: readonly DataGridTreeBranch<Row>[],
  sortSiblings: (rows: readonly Row[]) => readonly Row[],
): DataGridTreeBranch<Row>[] {
  const byRow = new Map(branches.map((branch) => [branch.row, branch]));

  return sortSiblings(branches.map((branch) => branch.row)).map((row) => {
    const branch = byRow.get(row) as DataGridTreeBranch<Row>;
    return { row, children: branch.children && sortTree(branch.children, sortSiblings) };
  });
}

export interface DataGridTreeNode<Row> {
  depth: number;
  expandable: boolean;
  expanded: boolean;
  key: string;
  /** Aberto, mas com os filhos ainda por carregar. */
  loading: boolean;
  /** Posição entre os irmãos, a partir de 1, e quantos são. */
  position: number;
  /** Índice da raiz de que o nó descende: a paginação é pelas raízes. */
  rootIndex: number;
  row: Row;
  setSize: number;
}

export function flattenTree<Row>(
  branches: readonly DataGridTreeBranch<Row>[],
  rowIdOf: (row: Row) => string,
  isExpanded: (key: string) => boolean,
  hasChildren: (row: Row) => boolean,
): DataGridTreeNode<Row>[] {
  const nodes: DataGridTreeNode<Row>[] = [];

  function visit(level: readonly DataGridTreeBranch<Row>[], depth: number, rootIndex: number) {
    level.forEach((branch, index) => {
      const key = rowIdOf(branch.row);
      const expandable = branch.children ? branch.children.length > 0 : hasChildren(branch.row);
      const expanded = expandable && isExpanded(key);
      const root = depth === 0 ? index : rootIndex;

      nodes.push({
        depth,
        expandable,
        expanded,
        key,
        loading: expanded && branch.children === undefined,
        position: index + 1,
        rootIndex: root,
        row: branch.row,
        setSize: level.length,
      });
      if (expanded && branch.children) {
        visit(branch.children, depth + 1, root);
      }
    });
  }

  visit(branches, 0, 0);
  return nodes;
}
