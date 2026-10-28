import { containsTerm, endsWithTerm, equalsTerm, startsWithTerm } from '../../../utils/textSearch';

/** Modelo de filtro do DataGrid: dados serializáveis, com grupos E/OU, e os operadores de cada tipo. Sem React. */

export type DataGridFilterKind = 'text' | 'number' | 'date' | 'boolean' | 'set';
export type DataGridFilterLogic = 'and' | 'or';

export interface DataGridFilterCondition {
  columnId: string;
  operator: string;
  /** Número, data `AAAA-MM-DD`, par `[de, até]` no "entre" ou lista de textos no conjunto. */
  value?: unknown;
}

export interface DataGridFilter {
  conditions: readonly (DataGridFilterCondition | DataGridFilter)[];
  logic: DataGridFilterLogic;
}

/** O que o operador pede: nada, um valor, um par ou uma lista. */
export type DataGridFilterOperand = 'none' | 'single' | 'range' | 'list';

export interface DataGridFilterOperator {
  id: string;
  label: string;
  operand: DataGridFilterOperand;
  /** Recebe o valor cru da célula, o valor do filtro e o texto exibido. */
  test: (value: unknown, operand: unknown, text: string) => boolean;
}

/** O que o filtro sabe de uma coluna. */
export interface DataGridFilterColumn {
  filter?: DataGridFilterKind | false;
  filterOperators?: readonly DataGridFilterOperator[];
  id: string;
  type?: string;
}

export const EMPTY_FILTER: DataGridFilter = { logic: 'and', conditions: [] };

function isBlank(value: unknown) {
  return value === null || value === undefined || value === '' || (typeof value === 'number' && Number.isNaN(value));
}

/** Aceita a vírgula decimal do campo; o texto parcial, como "-", vira `NaN`, que conta como vazio. */
export function numberOf(value: unknown) {
  return typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
}

function rangeOf(operand: unknown) {
  return Array.isArray(operand) ? operand : [];
}

/** Dia local `AAAA-MM-DD`, que se compara como texto: o filtro por data não depende da hora. */
function dayOf(value: unknown) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value as Date | string);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const EMPTY_OPERATORS: DataGridFilterOperator[] = [
  { id: 'empty', label: 'Vazio', operand: 'none', test: (value) => isBlank(value) },
  { id: 'notEmpty', label: 'Preenchido', operand: 'none', test: (value) => !isBlank(value) },
];

function filled(test: DataGridFilterOperator['test']): DataGridFilterOperator['test'] {
  return (value, operand, text) => !isBlank(value) && test(value, operand, text);
}

function numeric(id: string, label: string, test: (value: number, operand: number) => boolean): DataGridFilterOperator {
  return { id, label, operand: 'single', test: filled((value, operand) => test(numberOf(value), numberOf(operand))) };
}

function daily(id: string, label: string, test: (day: string, operand: string) => boolean): DataGridFilterOperator {
  return {
    id,
    label,
    operand: 'single',
    test: filled((value, operand) => dayOf(value) !== '' && test(dayOf(value), String(operand))),
  };
}

/** Operadores de fábrica por tipo. Para estender, a coluna recebe `filterOperators` com a lista do tipo e os seus. */
export const dataGridFilterOperators: Record<DataGridFilterKind, readonly DataGridFilterOperator[]> = {
  text: [
    { id: 'contains', label: 'Contém', operand: 'single', test: (_, operand, text) => containsTerm(text, String(operand)) },
    { id: 'notContains', label: 'Não contém', operand: 'single', test: (_, operand, text) => !containsTerm(text, String(operand)) },
    { id: 'equals', label: 'Igual a', operand: 'single', test: (_, operand, text) => equalsTerm(text, String(operand)) },
    { id: 'notEquals', label: 'Diferente de', operand: 'single', test: (_, operand, text) => !equalsTerm(text, String(operand)) },
    { id: 'startsWith', label: 'Começa com', operand: 'single', test: (_, operand, text) => startsWithTerm(text, String(operand)) },
    { id: 'endsWith', label: 'Termina com', operand: 'single', test: (_, operand, text) => endsWithTerm(text, String(operand)) },
    ...EMPTY_OPERATORS,
  ],
  number: [
    numeric('equals', 'Igual a', (value, operand) => value === operand),
    numeric('notEquals', 'Diferente de', (value, operand) => value !== operand),
    numeric('greaterThan', 'Maior que', (value, operand) => value > operand),
    numeric('greaterThanOrEqual', 'Maior ou igual a', (value, operand) => value >= operand),
    numeric('lessThan', 'Menor que', (value, operand) => value < operand),
    numeric('lessThanOrEqual', 'Menor ou igual a', (value, operand) => value <= operand),
    {
      id: 'between',
      label: 'Entre',
      operand: 'range',
      test: filled((value, operand) => {
        const [from, to] = rangeOf(operand).map(numberOf);
        return numberOf(value) >= from && numberOf(value) <= to;
      }),
    },
    ...EMPTY_OPERATORS,
  ],
  date: [
    daily('equals', 'No dia', (day, operand) => day === operand),
    daily('before', 'Antes de', (day, operand) => day < operand),
    daily('after', 'Depois de', (day, operand) => day > operand),
    {
      id: 'between',
      label: 'Entre',
      operand: 'range',
      test: filled((value, operand) => {
        const [from, to] = rangeOf(operand).map(String);
        const day = dayOf(value);
        return day !== '' && day >= from && day <= to;
      }),
    },
    ...EMPTY_OPERATORS,
  ],
  boolean: [
    { id: 'true', label: 'Sim', operand: 'none', test: (value) => value === true },
    { id: 'false', label: 'Não', operand: 'none', test: (value) => value === false },
  ],
  set: [{ id: 'in', label: 'Está entre', operand: 'list', test: (_, operand, text) => rangeOf(operand).includes(text) }],
};

const KIND_OF_TYPE: Record<string, DataGridFilterKind> = {
  text: 'text',
  number: 'number',
  currency: 'number',
  date: 'date',
  boolean: 'boolean',
};

/** Sem `filter`, o tipo da coluna decide; `filter: false` tira o funil. */
export function filterKindOf(column: DataGridFilterColumn): DataGridFilterKind | null {
  if (column.filter === false) {
    return null;
  }

  return column.filter ?? KIND_OF_TYPE[column.type ?? 'text'] ?? 'text';
}

export function operatorsOf(column: DataGridFilterColumn) {
  const kind = filterKindOf(column);
  return kind ? (column.filterOperators ?? dataGridFilterOperators[kind]) : [];
}

export function isFilterGroup(item: DataGridFilterCondition | DataGridFilter): item is DataGridFilter {
  return 'conditions' in item;
}

/** A condição sem o valor que o operador pede ainda está sendo escrita: não filtra. */
export function isComplete(condition: DataGridFilterCondition, operator: DataGridFilterOperator) {
  if (operator.operand === 'none') {
    return true;
  }
  if (operator.operand === 'single') {
    return !isBlank(condition.value);
  }

  const values = rangeOf(condition.value);
  return operator.operand === 'list' ? Array.isArray(condition.value) : values.length === 2 && !values.some(isBlank);
}

/** Só o que filtra de fato: condições completas de colunas conhecidas. Marca o funil e diz se a grade está filtrada. */
export function activeFilterOf(filter: DataGridFilter, columns: readonly DataGridFilterColumn[]): DataGridFilter {
  const byId = new Map(columns.map((column) => [column.id, column]));

  function prune(group: DataGridFilter): DataGridFilter {
    const conditions = group.conditions.flatMap((item): (DataGridFilterCondition | DataGridFilter)[] => {
      if (isFilterGroup(item)) {
        const nested = prune(item);
        return nested.conditions.length > 0 ? [nested] : [];
      }

      const column = byId.get(item.columnId);
      const operator = column && operatorsOf(column).find((candidate) => candidate.id === item.operator);
      return operator && isComplete(item, operator) ? [item] : [];
    });

    return { logic: group.logic, conditions };
  }

  return prune(filter);
}

export function matchesFilter(filter: DataGridFilter, test: (condition: DataGridFilterCondition) => boolean): boolean {
  if (filter.conditions.length === 0) {
    return true;
  }

  const matches = (item: DataGridFilterCondition | DataGridFilter) =>
    isFilterGroup(item) ? matchesFilter(item, test) : test(item);

  return filter.logic === 'and' ? filter.conditions.every(matches) : filter.conditions.some(matches);
}

function isLogic(value: unknown): value is DataGridFilterLogic {
  return value === 'and' || value === 'or';
}

/**
 * Tolerante, como a restauração das colunas: condição de coluna que já não existe, que não filtra ou de operador
 * desconhecido sai; o grupo que ficou vazio também.
 */
export function normalizeFilter(saved: unknown, columns: readonly DataGridFilterColumn[]): DataGridFilter {
  const byId = new Map(columns.map((column) => [column.id, column]));

  function normalizeGroup(value: unknown): DataGridFilter | null {
    const group = value as Partial<DataGridFilter> | null;
    if (typeof group !== 'object' || group === null || !isLogic(group.logic) || !Array.isArray(group.conditions)) {
      return null;
    }

    const conditions = group.conditions.flatMap((item): (DataGridFilterCondition | DataGridFilter)[] => {
      if (typeof item !== 'object' || item === null) {
        return [];
      }
      if ('conditions' in item) {
        const nested = normalizeGroup(item);
        return nested && nested.conditions.length > 0 ? [nested] : [];
      }

      const column = byId.get(item.columnId);
      const known = column && operatorsOf(column).some((operator) => operator.id === item.operator);
      return known ? [{ columnId: item.columnId, operator: item.operator, value: item.value }] : [];
    });

    return { logic: group.logic, conditions };
  }

  return normalizeGroup(saved) ?? EMPTY_FILTER;
}

function targetsOnly(item: DataGridFilterCondition | DataGridFilter, columnId: string): boolean {
  return isFilterGroup(item)
    ? item.conditions.length > 0 && item.conditions.every((child) => !isFilterGroup(child) && child.columnId === columnId)
    : item.columnId === columnId;
}

/** O filtro do funil de uma coluna: a condição, ou o grupo de condições, do primeiro nível que só fala dela. */
export function columnFilterOf(filter: DataGridFilter, columnId: string): DataGridFilter | null {
  const item = filter.conditions.find((candidate) => targetsOnly(candidate, columnId));

  if (!item) {
    return null;
  }

  return isFilterGroup(item) ? item : { logic: 'and', conditions: [item] };
}

/** Troca o filtro do funil da coluna e preserva o resto, inclusive grupos que o produto montou. */
export function setColumnFilter(filter: DataGridFilter, columnId: string, next: DataGridFilter | null): DataGridFilter {
  const others = filter.conditions.filter((candidate) => !targetsOnly(candidate, columnId));
  const added = !next || next.conditions.length === 0 ? [] : next.conditions.length === 1 ? next.conditions : [next];

  return { logic: filter.logic, conditions: [...others, ...added] };
}

/** Colunas citadas em qualquer nível: o funil delas fica destacado. */
export function filteredColumnIds(filter: DataGridFilter): Set<string> {
  const ids = new Set<string>();

  function collect(group: DataGridFilter) {
    group.conditions.forEach((item) => (isFilterGroup(item) ? collect(item) : ids.add(item.columnId)));
  }

  collect(filter);
  return ids;
}
