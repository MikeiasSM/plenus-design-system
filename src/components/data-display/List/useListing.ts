import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useSelection, type SelectionItem, type SelectionStatus } from '../../../hooks/useSelection';
import { containsTerm } from '../../../utils/textSearch';

export type ListingSelectionMode = 'none' | 'single' | 'multiple';

export interface ListingItem {
  disabled?: boolean;
  label: string;
  value: string;
}

export interface UseListingOptions {
  defaultValue?: readonly ListingItem[];
  items: readonly ListingItem[];
  onSearch?: (term: string) => void;
  onSelectionChange?: (items: readonly ListingItem[]) => void;
  selectionMode?: ListingSelectionMode;
  value?: readonly ListingItem[];
}

export interface Listing {
  detached: readonly ListingItem[];
  focus: (value?: string) => void;
  focusFirst: () => void;
  focusLast: () => void;
  focusedKey?: string;
  handleKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  isSelected: (value: string) => boolean;
  filter: (term: string) => void;
  typeahead: (character: string) => void;
  select: (item: ListingItem, extend?: boolean) => void;
  selected: readonly ListingItem[];
  selectionMode: ListingSelectionMode;
  status: SelectionStatus;
  toggleAll: () => void;
  term: string;
  visible: readonly ListingItem[];
}

function toListingItem(item: SelectionItem): ListingItem {
  return { value: item.key, label: item.textValue ?? item.key };
}

export function useListing({
  defaultValue,
  items,
  onSearch,
  onSelectionChange,
  selectionMode = 'none',
  value,
}: UseListingOptions): Listing {
  const [term, setTerm] = useState('');

  const visible = useMemo(() => {
    if (onSearch || !term) {
      return items;
    }

    return items.filter((item) => containsTerm(item.label, term));
  }, [items, onSearch, term]);

  const collection = useMemo<SelectionItem[]>(
    () => visible.map((item) => ({ key: item.value, disabled: item.disabled, textValue: item.label })),
    [visible],
  );

  // Toda opcao ja vista fica registrada. Com busca assincrona, `items` e
  // trocada a cada consulta, e resolver a escolha so contra ela descartava o
  // que veio de uma busca anterior.
  const conhecidos = useRef(new Map<string, ListingItem>());

  for (const item of items) {
    conhecidos.current.set(item.value, item);
  }

  const selection = useSelection({
    items: collection,
    mode: selectionMode,
    defaultSelectedKeys: defaultValue?.map((item) => item.value),
    selectedKeys: value?.map((item) => item.value),
    onSelectionChange: (keys) =>
      onSelectionChange?.(
        [...keys].map((chave) => conhecidos.current.get(chave)).filter((item) => item !== undefined),
      ),
  });

  const selected = value ?? selection.selectedItems.map(toListingItem);

  const detached = useMemo(() => {
    if (!term || selectionMode !== 'multiple') {
      return [];
    }

    const visibleValues = new Set(visible.map((item) => item.value));

    return selected.filter((item) => !visibleValues.has(item.value));
  }, [selected, selectionMode, term, visible]);

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (selectionMode === 'none') {
      return;
    }

    const estender = event.shiftKey;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (selection.focusedKey === undefined) {
        selection.focusFirst(estender);
      } else {
        selection.focusNext(estender);
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      selection.focusPrevious(estender);
    } else if (event.key === 'Home') {
      event.preventDefault();
      selection.focusFirst(estender);
    } else if (event.key === 'End') {
      event.preventDefault();
      selection.focusLast(estender);
    } else if (event.key === 'Enter' || event.key === ' ') {
      const focused = visible.find((item) => item.value === selection.focusedKey);

      if (focused && !focused.disabled) {
        event.preventDefault();
        selection.select(focused.value);
      }
    }
  }

  return {
    detached,
    focus: selection.focus,
    focusFirst: selection.focusFirst,
    focusLast: selection.focusLast,
    focusedKey: selection.focusedKey,
    handleKeyDown,
    isSelected: (itemValue) => selected.some((item) => item.value === itemValue),
    filter: (nextTerm) => {
      setTerm(nextTerm);
      selection.focus(undefined);
      onSearch?.(nextTerm);
    },
    typeahead: selection.search,
    select: (item, extend) => {
      if (item.disabled) {
        return;
      }

      if (extend && selectionMode === 'multiple') {
        selection.selectRange(item.value);
        return;
      }

      selection.select(item.value);
    },
    selected,
    selectionMode,
    status: selection.status,
    toggleAll: selection.toggleAll,
    term,
    visible,
  };
}
