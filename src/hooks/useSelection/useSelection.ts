import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  clearSelection,
  firstKey,
  lastKey,
  matchKey,
  nextKey,
  previousKey,
  select,
  selectRange,
  selectionStatus,
  toggleAll,
  type SelectionItem,
  type SelectionMode,
  type SelectionState,
  type SelectionStatus,
} from './selection';

export interface UseSelectionOptions {
  /** Em modo unico, escolher de novo o mesmo item desfaz a escolha. */
  allowEmpty?: boolean;
  defaultSelectedKeys?: Iterable<string>;
  items: readonly SelectionItem[];
  mode?: SelectionMode;
  onSelectionChange?: (keys: ReadonlySet<string>) => void;
  selectedKeys?: Iterable<string>;
  typeaheadDelay?: number;
}

export interface UseSelectionResult extends SelectionState {
  selectedItems: readonly SelectionItem[];
  clear: () => void;
  focus: (key?: string) => void;
  focusFirst: (extend?: boolean) => void;
  focusLast: (extend?: boolean) => void;
  focusNext: (extend?: boolean) => void;
  focusPrevious: (extend?: boolean) => void;
  search: (character: string) => void;
  select: (key: string) => void;
  selectRange: (key: string) => void;
  status: SelectionStatus;
  toggleAll: () => void;
}

export function useSelection({
  allowEmpty = false,
  defaultSelectedKeys,
  items,
  mode = 'single',
  onSelectionChange,
  selectedKeys,
  typeaheadDelay = 500,
}: UseSelectionOptions): UseSelectionResult {
  const [internal, setInternal] = useState<SelectionState>(() => ({
    selectedKeys: new Set(defaultSelectedKeys ?? []),
  }));
  const controlledKeys = useMemo(
    () => (selectedKeys === undefined ? undefined : new Set(selectedKeys)),
    [selectedKeys],
  );
  const state: SelectionState = controlledKeys
    ? { focusedKey: internal.focusedKey, selectedKeys: controlledKeys }
    : internal;

  const itemsByKey = useMemo(() => new Map(items.map((item) => [item.key, item])), [items]);
  const retained = useRef(new Map<string, SelectionItem>());
  const selectedItems = useMemo(() => {
    const resolved = [...state.selectedKeys].map(
      (key) => itemsByKey.get(key) ?? retained.current.get(key) ?? { key },
    );

    retained.current = new Map(resolved.map((item) => [item.key, item]));

    return resolved;
  }, [itemsByKey, state.selectedKeys]);

  const buffer = useRef('');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const focus = useCallback((key?: string) => {
    setInternal((current) => (current.focusedKey === key ? current : { ...current, focusedKey: key }));
  }, []);

  const applySelection = useCallback(
    (next: SelectionState) => {
      setInternal((current) => ({ ...next, selectedKeys: controlledKeys ? current.selectedKeys : next.selectedKeys }));
      onSelectionChange?.(next.selectedKeys);
    },
    [controlledKeys, onSelectionChange],
  );

  function move(key: string | undefined, extend?: boolean) {
    if (key === undefined) {
      return;
    }

    if (extend && mode === 'multiple') {
      applySelection(selectRange(state, key, items));
      return;
    }

    focus(key);
  }

  return {
    ...state,
    selectedItems,
    clear: () => applySelection(clearSelection(state)),
    focus,
    focusFirst: (extend?: boolean) => move(firstKey(items), extend),
    focusLast: (extend?: boolean) => move(lastKey(items), extend),
    focusNext: (extend?: boolean) => move(nextKey(items, state.focusedKey) ?? state.focusedKey, extend),
    focusPrevious: (extend?: boolean) => move(previousKey(items, state.focusedKey) ?? state.focusedKey, extend),
    select: (key: string) => applySelection(select(state, key, mode, { allowEmpty })),
    selectRange: (key: string) => applySelection(selectRange(state, key, items)),
    status: selectionStatus(state, items),
    toggleAll: () => applySelection(toggleAll(state, items)),
    search: (character: string) => {
      buffer.current += character;
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        buffer.current = '';
      }, typeaheadDelay);

      // Com mais de um caractere a busca inclui o item focado, para que
      // digitar "ca" nao pule o "Cartao" que "c" acabou de encontrar.
      const origin = buffer.current.length > 1 ? previousKey(items, state.focusedKey) : state.focusedKey;
      const found = matchKey(items, buffer.current, origin);

      if (found) {
        focus(found);
      }
    },
  };
}
