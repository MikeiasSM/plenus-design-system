import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  clearSelection,
  firstKey,
  lastKey,
  matchKey,
  nextKey,
  previousKey,
  select,
  type SelectionItem,
  type SelectionMode,
  type SelectionState,
} from './selection';

export interface UseSelectionOptions {
  defaultSelectedKeys?: Iterable<string>;
  items: readonly SelectionItem[];
  mode?: SelectionMode;
  onSelectionChange?: (keys: ReadonlySet<string>) => void;
  selectedKeys?: Iterable<string>;
  typeaheadDelay?: number;
}

export interface UseSelectionResult extends SelectionState {
  clear: () => void;
  focus: (key?: string) => void;
  focusFirst: () => void;
  focusLast: () => void;
  focusNext: () => void;
  focusPrevious: () => void;
  search: (character: string) => void;
  select: (key: string) => void;
}

export function useSelection({
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

  return {
    ...state,
    clear: () => applySelection(clearSelection(state)),
    focus,
    focusFirst: () => focus(firstKey(items)),
    focusLast: () => focus(lastKey(items)),
    focusNext: () => focus(nextKey(items, state.focusedKey) ?? state.focusedKey),
    focusPrevious: () => focus(previousKey(items, state.focusedKey) ?? state.focusedKey),
    select: (key: string) => applySelection(select(state, key, mode)),
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
