export type SelectionMode = 'none' | 'single' | 'multiple';

export interface SelectionItem {
  key: string;
  disabled?: boolean;
  textValue?: string;
}

export interface SelectionState {
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
  const term = query.trim().toLowerCase();

  if (!term || items.length === 0) {
    return undefined;
  }

  const start = indexOfKey(items, from);

  for (let step = 1; step <= items.length; step += 1) {
    const item = items[(start + step + items.length) % items.length];

    if (item.disabled) {
      continue;
    }

    if ((item.textValue ?? item.key).toLowerCase().startsWith(term)) {
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

  return { focusedKey: key, selectedKeys };
}

export function clearSelection(state: SelectionState): SelectionState {
  return { focusedKey: state.focusedKey, selectedKeys: new Set() };
}

export function sanitizeSelection(state: SelectionState, items: readonly SelectionItem[]): SelectionState {
  const available = new Set(items.map((item) => item.key));
  const selectedKeys = new Set([...state.selectedKeys].filter((key) => available.has(key)));
  const focusedKey = state.focusedKey && available.has(state.focusedKey) ? state.focusedKey : undefined;

  return { focusedKey, selectedKeys };
}
