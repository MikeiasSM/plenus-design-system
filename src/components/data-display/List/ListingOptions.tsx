import { Fragment, useCallback, useEffect, type CSSProperties, type KeyboardEvent, type ReactNode, type RefObject } from 'react';
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

interface RenderedOption {
  item: ListingItem;
  position: number;
}

/** Junta as opções seguidas de um mesmo grupo; as sem grupo ficam soltas, cada uma no seu bloco. */
function groupConsecutive(options: readonly RenderedOption[]) {
  const blocks: { group?: string; options: RenderedOption[] }[] = [];

  for (const option of options) {
    const last = blocks.at(-1);

    if (option.item.group !== undefined && last?.group === option.item.group) {
      last.options.push(option);
    } else {
      blocks.push({ group: option.item.group, options: [option] });
    }
  }

  return blocks;
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
        <li aria-hidden="true" className={styles.spacer} style={{ height: padding.before }} />
        {rendered.map((item, index) => (
          <li className={styles.option} key={item.value} ref={index === 0 ? measureItem : undefined}>
            {item.label}
          </li>
        ))}
        <li aria-hidden="true" className={styles.spacer} style={{ height: padding.after }} />
        {!loading && visible.length === 0 && empty}
      </ul>
    );
  }

  function renderOption(item: ListingItem, position: number, measured: boolean) {
    const selected = isSelected(item.value);
    const id = position > 0 ? optionId(baseId, position - 1) : `${baseId}-selected-${item.value}`;

    return (
      <div
        aria-describedby={item.description ? `${id}-description` : undefined}
        aria-disabled={item.disabled || undefined}
        aria-labelledby={item.description ? `${id}-label` : undefined}
        aria-posinset={position > 0 ? position : undefined}
        aria-selected={selected}
        aria-setsize={position > 0 ? visible.length : undefined}
        className={[styles.option, focusedKey === item.value && styles.focused, item.disabled && styles.disabled]
          .filter(Boolean)
          .join(' ')}
        id={id}
        key={item.value}
        onClick={(event) => choose(item, event.shiftKey)}
        // So segura o foco onde ele esta quando quem o tem e o campo de busca; a lista que detem o foco o recebe.
        onMouseDown={holdsFocus ? undefined : (event) => event.preventDefault()}
        ref={measured ? measureItem : undefined}
        role="option"
      >
        {selectionMode === 'multiple' && (
          <span aria-hidden="true" className={[styles.box, selected && styles.checked].filter(Boolean).join(' ')} />
        )}
        {item.icon && (
          <span aria-hidden="true" className={styles.optionIcon}>
            {item.icon}
          </span>
        )}
        {item.description ? (
          <span className={styles.optionText}>
            <span id={`${id}-label`}>{item.label}</span>
            <span className={styles.optionDescription} id={`${id}-description`}>
              {item.description}
            </span>
          </span>
        ) : (
          item.label
        )}
      </div>
    );
  }

  const blocks = groupConsecutive(rendered.map((item, index) => ({ item, position: start + index + 1 })));

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
      <div aria-hidden="true" className={styles.spacer} style={{ height: padding.before }} />
      {blocks.map(({ group, options }) => {
        const [first] = options;
        const rendering = options.map(({ item, position }) => renderOption(item, position, position === start + 1));

        if (group === undefined) {
          return <Fragment key={first.item.value}>{rendering}</Fragment>;
        }

        const titleId = `${baseId}-group-${first.position}`;

        return (
          <div aria-labelledby={titleId} className={styles.section} key={`${group}:${first.item.value}`} role="group">
            <div className={styles.sectionTitle} id={titleId} role="presentation">
              {group}
            </div>
            {rendering}
          </div>
        );
      })}
      <div aria-hidden="true" className={styles.spacer} style={{ height: padding.after }} />
      {!loading && visible.length === 0 && empty}
    </div>
  );
}
