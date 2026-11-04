import {
  isFilterGroup,
  operatorsOf,
  type DataGridFilter,
  type DataGridFilterColumn,
  type DataGridFilterCondition,
  type DataGridFilterKind,
} from './filterModel';

/** Edição do filtro em árvore pelo construtor: cada operação devolve o filtro novo. Sem React e sem DOM. */

/** Índices dos filhos, da raiz até o item: `[]` é a raiz; `[1, 0]`, o primeiro filho do segundo filho. */
export type DataGridFilterPath = readonly number[];

/** O que o construtor sabe de uma coluna que filtra: o tipo e os operadores saem de `filter` e `filterOperators`. */
export interface DataGridFilterBuilderColumn extends DataGridFilterColumn {
  filter: DataGridFilterKind;
  header: string;
}

type FilterItem = DataGridFilterCondition | DataGridFilter;

function changeGroup(root: DataGridFilter, path: DataGridFilterPath, change: (group: DataGridFilter) => DataGridFilter): DataGridFilter {
  if (path.length === 0) {
    return change(root);
  }

  const [index, ...rest] = path;
  return {
    ...root,
    conditions: root.conditions.map((item, i) =>
      i === index && isFilterGroup(item) ? changeGroup(item, rest, change) : item,
    ),
  };
}

export function newCondition(column: DataGridFilterBuilderColumn): DataGridFilterCondition {
  return { columnId: column.id, operator: operatorsOf(column)[0]?.id ?? '' };
}

export function addItem(root: DataGridFilter, groupPath: DataGridFilterPath, item: FilterItem) {
  return changeGroup(root, groupPath, (group) => ({ ...group, conditions: [...group.conditions, item] }));
}

export function replaceItem(root: DataGridFilter, itemPath: DataGridFilterPath, item: FilterItem) {
  const index = itemPath[itemPath.length - 1];
  return changeGroup(root, itemPath.slice(0, -1), (group) => ({
    ...group,
    conditions: group.conditions.map((current, i) => (i === index ? item : current)),
  }));
}

/** O grupo que esvazia sai junto, para não sobrar um grupo sem condição. */
export function removeItem(root: DataGridFilter, itemPath: DataGridFilterPath): DataGridFilter {
  const index = itemPath[itemPath.length - 1];
  const next = changeGroup(root, itemPath.slice(0, -1), (group) => ({
    ...group,
    conditions: group.conditions.filter((_, i) => i !== index),
  }));

  const parentPath = itemPath.slice(0, -1);
  const parent = parentPath.reduce<FilterItem>((group, i) => (group as DataGridFilter).conditions[i], next);
  return parentPath.length > 0 && isFilterGroup(parent) && parent.conditions.length === 0 ? removeItem(next, parentPath) : next;
}

export function setLogic(root: DataGridFilter, groupPath: DataGridFilterPath, logic: DataGridFilter['logic']) {
  return changeGroup(root, groupPath, (group) => ({ ...group, logic }));
}
