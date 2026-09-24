import { startsWithTerm } from '../../utils/textSearch';

export type SelectionMode = 'none' | 'single' | 'multiple';

export interface SelectionItem {
  key: string;
  disabled?: boolean;
  textValue?: string;
}

export type SelectionStatus = 'none' | 'partial' | 'all';

export interface SelectionState {
  anchorKey?: string;
  focusedKey?: string;
  selectedKeys: ReadonlySet<string>;
}

export const emptySelection: SelectionState = { selectedKeys: new Set() };

function indexOfKey(items: readonly SelectionItem[], key: string | undefined) {
  return key === undefined ? -1 : items.findIndex((item) => item.key === key);
}

export function firstKey(items: readonly SelectionItem[]) {
  return items.find((item) => !item.disabled)?.key;
}

export function lastKey(items: readonly SelectionItem[]) {
  for (let i = items.length - 1; i >= 0; i -= 1) {
    if (!items[i].disabled) {
      return items[i].key;
    }
  }

  return undefined;
}

export function nextKey(items: readonly SelectionItem[], from: string | undefined) {
  for (let i = indexOfKey(items, from) + 1; i < items.length; i += 1) {
    if (!items[i].disabled) {
      return items[i].key;
    }
  }

  return undefined;
}

export function previousKey(items: readonly SelectionItem[], from: string | undefined) {
  const start = indexOfKey(items, from);

  for (let i = (start < 0 ? items.length : start) - 1; i >= 0; i -= 1) {
    if (!items[i].disabled) {
      return items[i].key;
    }
  }

  return undefined;
}

export function matchKey(items: readonly SelectionItem[], query: string, from: string | undefined) {
  const term = query.trim();

  if (!term || items.length === 0) {
    return undefined;
  }

  const start = indexOfKey(items, from);

  for (let step = 1; step <= items.length; step += 1) {
    const item = items[(start + step + items.length) % items.length];

    if (item.disabled) {
      continue;
    }

    if (startsWithTerm(item.textValue ?? item.key, term)) {
      return item.key;
    }
  }

  return undefined;
}

export function select(state: SelectionState, key: string, mode: SelectionMode): SelectionState {
  if (mode === 'none') {
    return state;
  }

  if (mode === 'single') {
    return { focusedKey: key, selectedKeys: new Set([key]) };
  }

  const selectedKeys = new Set(state.selectedKeys);

  if (selectedKeys.has(key)) {
    selectedKeys.delete(key);
  } else {
    selectedKeys.add(key);
  }

  return { anchorKey: key, focusedKey: key, selectedKeys };
}

export function selectRange(
  state: SelectionState,
  key: string,
  items: readonly SelectionItem[],
): SelectionState {
  const anchor = state.anchorKey ?? state.focusedKey ?? key;
  const from = indexOfKey(items, anchor);
  const to = indexOfKey(items, key);

  if (from < 0 || to < 0) {
    return select(state, key, 'multiple');
  }

  const [inicio, fim] = from <= to ? [from, to] : [to, from];
  const selectedKeys = new Set(state.selectedKeys);

  for (let i = inicio; i <= fim; i += 1) {
    if (!items[i].disabled) {
      selectedKeys.add(items[i].key);
    }
  }

  return { anchorKey: anchor, focusedKey: key, selectedKeys };
}

export function selectionStatus(state: SelectionState, items: readonly SelectionItem[]): SelectionStatus {
  const available = items.filter((item) => !item.disabled);
  const chosen = available.filter((item) => state.selectedKeys.has(item.key)).length;

  if (chosen === 0) {
    return 'none';
  }

  return chosen === available.length ? 'all' : 'partial';
}

export function toggleAll(state: SelectionState, items: readonly SelectionItem[]): SelectionState {
  const available = items.filter((item) => !item.disabled);
  const selectedKeys = new Set(state.selectedKeys);
  const marcar = selectionStatus(state, items) !== 'all';

  available.forEach((item) => (marcar ? selectedKeys.add(item.key) : selectedKeys.delete(item.key)));

  return { ...state, selectedKeys };
}

export function clearSelection(state: SelectionState): SelectionState {
  return { focusedKey: state.focusedKey, selectedKeys: new Set() };
}
