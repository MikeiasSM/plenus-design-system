import { cellText, summarize, type DataGridColumnModel } from './gridState';
import type { DataGridTreeNode } from './treeModel';

/** Agrupamento por coluna do DataGrid: os grupos aninhados, os agregados de cada um e a lista das linhas abertas. */

/** Chave de grupo: não colide com o id de nenhuma linha. */
const GROUP_PREFIX = '\u0003';

export interface DataGridGroup<Row> {
  /** Por coluna, o agregado definido em `summary`, sobre as linhas do grupo. */
  aggregates: Readonly<Record<string, unknown>>;
  children: DataGridGroup<Row>[];
  columnId: string;
  key: string;
  /** Todas as linhas do grupo, dos subgrupos inclusive, na ordem recebida. */
  rows: Row[];
  /** O valor do grupo, como a célula o mostra; vazio quando a célula não tem valor. */
  text: string;
}

function groupLevel<Row>(
  rows: readonly Row[],
  columns: readonly DataGridColumnModel<Row>[],
  columnIds: readonly string[],
  parentKey: string,
): DataGridGroup<Row>[] {
  const [columnId, ...deeper] = columnIds;
  const column = columns.find((candidate) => candidate.id === columnId);

  if (!column) {
    return [];
  }

  const byText = new Map<string, Row[]>();
  rows.forEach((row) => {
    const text = cellText(column, row);
    byText.set(text, [...(byText.get(text) ?? []), row]);
  });

  return [...byText].map(([text, members]) => {
    const key = `${parentKey}${dataGridGroupKey([text])}`;
    return {
      aggregates: summarize(members, columns),
      children: groupLevel(members, columns, deeper, key),
      columnId: column.id,
      key,
      rows: members,
      text,
    };
  });
}

/**
 * A chave com que o grupo entra em `expandedIds`: os valores do grupo, do primeiro nível ao dele, como a célula os
 * mostra. O produto a monta por aqui para abrir um grupo; o formato não é contrato.
 */
export function dataGridGroupKey(values: readonly string[]) {
  return values.map((value) => `${GROUP_PREFIX}${value}`).join('');
}

/** Os grupos na ordem em que aparecem nas linhas, que chegam já ordenadas. Coluna desconhecida encerra o aninhamento. */
export function buildGroups<Row>(
  rows: readonly Row[],
  columns: readonly DataGridColumnModel<Row>[],
  columnIds: readonly string[],
) {
  return groupLevel(rows, columns, columnIds, '');
}

/** Todos os grupos por chave, e o pai de cada grupo e de cada linha, para o foco subir ao grupo que recolheu. */
export function indexGroups<Row>(groups: readonly DataGridGroup<Row>[], rowIdOf: (row: Row) => string) {
  const byKey = new Map<string, DataGridGroup<Row>>();
  const parents = new Map<string, string>();

  function visit(level: readonly DataGridGroup<Row>[], parentKey?: string) {
    level.forEach((group) => {
      byKey.set(group.key, group);
      if (parentKey !== undefined) {
        parents.set(group.key, parentKey);
      }
      if (group.children.length > 0) {
        visit(group.children, group.key);
      } else {
        group.rows.forEach((row) => parents.set(rowIdOf(row), group.key));
      }
    });
  }

  visit(groups);
  return { byKey, parents };
}

/**
 * As linhas da tela: o grupo e, se aberto, o que há dentro dele. No nó do grupo, `row` é a primeira linha dele, só
 * para o nó ter uma linha; quem o desenha lê o grupo pela chave.
 */
export function flattenGroups<Row>(
  groups: readonly DataGridGroup<Row>[],
  rowIdOf: (row: Row) => string,
  isExpanded: (key: string) => boolean,
): DataGridTreeNode<Row>[] {
  const nodes: DataGridTreeNode<Row>[] = [];

  function visit(level: readonly DataGridGroup<Row>[], depth: number, rootIndex: number) {
    level.forEach((group, index) => {
      const root = depth === 0 ? index : rootIndex;
      const expanded = isExpanded(group.key);

      nodes.push({
        depth,
        expandable: true,
        expanded,
        key: group.key,
        loading: false,
        position: index + 1,
        rootIndex: root,
        row: group.rows[0],
        setSize: level.length,
      });
      if (!expanded) {
        return;
      }
      if (group.children.length > 0) {
        visit(group.children, depth + 1, root);
        return;
      }
      group.rows.forEach((row, rowIndex) =>
        nodes.push({
          depth: depth + 1,
          expandable: false,
          expanded: false,
          key: rowIdOf(row),
          loading: false,
          position: rowIndex + 1,
          rootIndex: root,
          row,
          setSize: group.rows.length,
        }),
      );
    });
  }

  visit(groups, 0, 0);
  return nodes;
}

/** As linhas na ordem em que a tela as mostra com os grupos abertos: grupo a grupo, do mais fundo. */
export function leafRows<Row>(groups: readonly DataGridGroup<Row>[]): Row[] {
  return groups.flatMap((group) => (group.children.length > 0 ? leafRows(group.children) : group.rows));
}
