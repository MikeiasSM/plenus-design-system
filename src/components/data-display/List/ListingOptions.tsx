import { useCallback, useEffect, type CSSProperties, type KeyboardEvent, type ReactNode, type RefObject } from 'react';
import type { Listing, ListingItem } from './useListing';
import { useVirtualWindow } from './useVirtualWindow';
import styles from './List.module.css';

export interface ListingOptionsProps {
  baseId: string;
  className?: string;
  elementRef?: RefObject<HTMLElement | null>;
  empty?: ReactNode;
  height?: number;
  label?: string;
  listing: Listing;
  loading?: boolean;
  loadingMessage?: string;
  holdsFocus?: boolean;
  onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
  onSelect?: (item: ListingItem) => void;
  style?: CSSProperties;
  tabIndex?: number;
}

export function optionId(baseId: string, index: number) {
  return baseId + '-option-' + index;
}

export function ListingOptions({
  baseId,
  className,
  elementRef,
  empty,
  height,
  holdsFocus = true,
  label,
  listing,
  loading = false,
  loadingMessage = 'Carregando',
  onKeyDown,
  onSelect,
  style,
  tabIndex = 0,
}: ListingOptionsProps) {
  const { detached, focusedKey, isSelected, select, selectionMode, visible } = listing;
  const activeIndex = visible.findIndex((item) => item.value === focusedKey);

  function choose(item: ListingItem, extend: boolean) {
    if (item.disabled) {
      return;
    }

    select(item, extend);
    onSelect?.(item);
  }
  const { active, attachScroll, measureItem, onScroll, padding, scrollToIndex, start, end } = useVirtualWindow(
    visible.length,
    height,
  );

  const attachElement = useCallback(
    (node: HTMLElement | null) => {
      attachScroll(node);

      if (elementRef) {
        elementRef.current = node;
      }
    },
    [attachScroll, elementRef],
  );

  useEffect(() => {
    const index = visible.findIndex((item) => item.value === focusedKey);

    if (focusedKey === undefined || index < 0) {
      return;
    }

    if (active) {
      scrollToIndex(index);
    } else {
      document.getElementById(optionId(baseId, index))?.scrollIntoView?.({ block: 'nearest' });
    }
  }, [active, baseId, focusedKey, scrollToIndex, visible]);

  const rendered = visible.slice(start, end);

  if (selectionMode === 'none') {
    return (
      <ul
        aria-busy={loading || undefined}
        className={[styles.options, className].filter(Boolean).join(' ')}
        id={baseId + '-options'}
        onScroll={onScroll}
        ref={attachElement}
        style={{ height, ...style }}
      >
        {loading && <li className={styles.status}>{loadingMessage}</li>}
        <li aria-hidden="true" style={{ height: padding.before }} />
        {rendered.map((item, index) => (
          <li className={styles.option} key={item.value} ref={index === 0 ? measureItem : undefined}>
            {item.label}
          </li>
        ))}
        <li aria-hidden="true" style={{ height: padding.after }} />
        {!loading && visible.length === 0 && empty}
      </ul>
    );
  }

  function renderOption(item: ListingItem, position: number, measured: boolean) {
    const selected = isSelected(item.value);

    return (
      <div
        aria-disabled={item.disabled || undefined}
        aria-posinset={position > 0 ? position : undefined}
        aria-selected={selected}
        aria-setsize={position > 0 ? visible.length : undefined}
        className={[styles.option, focusedKey === item.value && styles.focused, item.disabled && styles.disabled]
          .filter(Boolean)
          .join(' ')}
        id={position > 0 ? optionId(baseId, position - 1) : undefined}
        key={item.value}
        onClick={(event) => choose(item, event.shiftKey)}
        onMouseDown={(event) => event.preventDefault()}
        ref={measured ? measureItem : undefined}
        role="option"
      >
        {selectionMode === 'multiple' && (
          <span aria-hidden="true" className={[styles.box, selected && styles.checked].filter(Boolean).join(' ')} />
        )}
        {item.label}
      </div>
    );
  }

  return (
    <div
      aria-activedescendant={holdsFocus && activeIndex >= 0 ? optionId(baseId, activeIndex) : undefined}
      aria-busy={loading || undefined}
      aria-label={label}
      aria-multiselectable={selectionMode === 'multiple' || undefined}
      className={[styles.options, className].filter(Boolean).join(' ')}
      id={baseId + '-options'}
      onKeyDown={onKeyDown}
      onScroll={onScroll}
      ref={attachElement}
      role="listbox"
      style={{ height, ...style }}
      tabIndex={holdsFocus ? tabIndex : undefined}
    >
      {loading && <p className={styles.status}>{loadingMessage}</p>}
      {detached.length > 0 && (
        <div aria-label="Selecionados" className={styles.group} role="group">
          {detached.map((item) => renderOption(item, 0, false))}
        </div>
      )}
      <div aria-hidden="true" style={{ height: padding.before }} />
      {rendered.map((item, index) => renderOption(item, start + index + 1, index === 0))}
      <div aria-hidden="true" style={{ height: padding.after }} />
      {!loading && visible.length === 0 && empty}
    </div>
  );
}
