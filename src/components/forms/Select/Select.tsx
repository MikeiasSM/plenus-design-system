import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { useOverlay, useOverlayPosition } from '@react-aria/overlays';
import { useSelection, type SelectionItem } from '../../../hooks/useSelection';
import { Field } from '../Field';
import styles from './Select.module.css';

export type SelectSize = 'sm' | 'md';

export interface SelectOption {
  disabled?: boolean;
  label: string;
  value: string;
}

export interface SelectProps {
  defaultValue?: string;
  disabled?: boolean;
  error?: string;
  hint?: string;
  id?: string;
  label?: string;
  onValueChange?: (value: string) => void;
  options: readonly SelectOption[];
  placeholder?: string;
  required?: boolean;
  size?: SelectSize;
  value?: string;
}

export function Select({
  defaultValue,
  disabled = false,
  error,
  hint,
  id: providedId,
  label,
  onValueChange,
  options,
  placeholder = 'Selecione',
  required = false,
  size = 'md',
  value,
}: SelectProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const collection = useMemo<SelectionItem[]>(
    () => options.map((option) => ({ key: option.value, disabled: option.disabled, textValue: option.label })),
    [options],
  );
  const selection = useSelection({
    items: collection,
    mode: 'single',
    defaultSelectedKeys: defaultValue === undefined ? undefined : [defaultValue],
    selectedKeys: value === undefined ? undefined : [value],
    onSelectionChange: (keys) => {
      const [chosen] = keys;
      if (chosen !== undefined) {
        onValueChange?.(chosen);
      }
    },
  });
  const [selected] = selection.selectedKeys;
  const chosen = options.find((option) => option.value === selected);

  function fechar() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function abrir() {
    if (disabled) {
      return;
    }

    selection.focus(selected ?? collection.find((item) => !item.disabled)?.key);
    setOpen(true);
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      abrir();
    }
  }

  return (
    <Field
      error={error}
      hint={hint}
      id={providedId}
      label={label}
      required={required}
    >
      {({ id, describedBy, invalid }) => (
        <>
          <button
            ref={triggerRef}
            className={[styles.trigger, styles[size], error && styles.error].filter(Boolean).join(' ')}
            type="button"
            id={id}
            role="combobox"
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-required={required || undefined}
            disabled={disabled}
            onClick={() => (open ? fechar() : abrir())}
            onKeyDown={handleTriggerKeyDown}
          >
            <span className={chosen ? styles.value : styles.placeholder}>{chosen?.label ?? placeholder}</span>
            <svg className={styles.chevron} viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {open &&
            createPortal(
              <SelectListbox
                label={label ?? placeholder}
                onClose={fechar}
                options={options}
                selection={selection}
                triggerRef={triggerRef}
              />,
              document.body,
            )}
        </>
      )}
    </Field>
  );
}

function SelectListbox({
  label,
  onClose,
  options,
  selection,
  triggerRef,
}: {
  label: string;
  onClose: () => void;
  options: readonly SelectOption[];
  selection: ReturnType<typeof useSelection>;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const baseId = useRef(`listbox-${Math.random().toString(36).slice(2, 9)}`).current;
  const { focusedKey, focusFirst, focusLast, focusNext, focusPrevious, search, selectedKeys } = selection;
  const activeIndex = options.findIndex((option) => option.value === focusedKey);

  const { overlayProps } = useOverlay({ isOpen: true, onClose, isDismissable: true, shouldCloseOnBlur: false }, ref);
  const { overlayProps: positionProps } = useOverlayPosition({
    targetRef: triggerRef,
    overlayRef: ref,
    placement: 'bottom start',
    offset: 6,
    containerPadding: 8,
    isOpen: true,
  });
  const [largura, setLargura] = useState<number>();
  // useOverlayPosition entrega toda a altura disponivel; limitamos para que
  // uma lista longa nao ocupe a tela inteira.
  const alturaMaxima = Math.min(Number(positionProps.style?.maxHeight) || 280, 280);

  useLayoutEffect(() => {
    setLargura(triggerRef.current?.offsetWidth);
  }, [triggerRef]);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  function escolher(option: SelectOption) {
    if (option.disabled) {
      return;
    }

    selection.select(option.value);
    onClose();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusNext();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusPrevious();
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusFirst();
    } else if (event.key === 'End') {
      event.preventDefault();
      focusLast();
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const alvo = options.find((option) => option.value === focusedKey);
      if (alvo) {
        escolher(alvo);
      }
    } else if (event.key === 'Escape' || event.key === 'Tab') {
      onClose();
    } else if (event.key.length === 1 && !event.metaKey && !event.ctrlKey) {
      search(event.key);
    }
  }

  return (
      <div
        {...overlayProps}
        ref={ref}
        className={styles.listbox}
        style={{ ...positionProps.style, width: largura, maxHeight: alturaMaxima }}
        role="listbox"
        aria-label={label}
        aria-activedescendant={activeIndex >= 0 ? `${baseId}-${activeIndex}` : undefined}
        tabIndex={-1}
        onKeyDown={(event) => {
          // Espalhar overlayProps antes nao basta: este onKeyDown o substituiria.
          handleKeyDown(event);
          overlayProps.onKeyDown?.(event);
        }}
      >
        {options.map((option, index) => (
          <div
            key={option.value}
            className={[
              styles.option,
              focusedKey === option.value && styles.focused,
              option.disabled && styles.disabled,
            ]
              .filter(Boolean)
              .join(' ')}
            id={`${baseId}-${index}`}
            role="option"
            aria-selected={selectedKeys.has(option.value)}
            aria-disabled={option.disabled || undefined}
            onClick={() => escolher(option)}
          >
            {option.label}
          </div>
        ))}
      </div>
  );
}
