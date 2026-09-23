import { useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { useOverlayPosition } from '@react-aria/overlays';
import { useSelection, type SelectionItem } from '../../../hooks/useSelection';
import { Field } from '../Field';
import styles from './ComboBox.module.css';

export type ComboBoxSize = 'sm' | 'md';

export interface ComboBoxOption {
  disabled?: boolean;
  label: string;
  value: string;
}

export interface ComboBoxProps {
  defaultValue?: string;
  disabled?: boolean;
  emptyMessage?: string;
  error?: string;
  hint?: string;
  id?: string;
  label?: string;
  onValueChange?: (value: string) => void;
  options: readonly ComboBoxOption[];
  placeholder?: string;
  required?: boolean;
  size?: ComboBoxSize;
  value?: string;
}

export function ComboBox({
  defaultValue,
  disabled = false,
  emptyMessage = 'Nenhum resultado',
  error,
  hint,
  id: providedId,
  label,
  onValueChange,
  options,
  placeholder,
  required = false,
  size = 'md',
  value,
}: ComboBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const baseId = useRef(`combobox-${Math.random().toString(36).slice(2, 9)}`).current;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [filtering, setFiltering] = useState(false);

  const visible = useMemo(() => {
    if (!filtering || !query) {
      return options;
    }

    const termo = query.toLowerCase();
    return options.filter((option) => option.label.toLowerCase().includes(termo));
  }, [filtering, options, query]);

  const collection = useMemo<SelectionItem[]>(
    () => visible.map((option) => ({ key: option.value, disabled: option.disabled, textValue: option.label })),
    [visible],
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
  const texto = filtering ? query : options.find((option) => option.value === selected)?.label ?? '';
  const activeIndex = visible.findIndex((option) => option.value === selection.focusedKey);

  const { overlayProps: positionProps } = useOverlayPosition({
    targetRef: inputRef,
    overlayRef: listRef,
    placement: 'bottom start',
    offset: 6,
    containerPadding: 8,
    isOpen: open,
  });
  const [largura, setLargura] = useState<number>();
  const alturaMaxima = Math.min(Number(positionProps.style?.maxHeight) || 280, 280);

  useLayoutEffect(() => {
    setLargura(inputRef.current?.offsetWidth);
  }, [open]);

  function escolher(option: ComboBoxOption) {
    if (option.disabled) {
      return;
    }

    selection.select(option.value);
    setFiltering(false);
    setQuery('');
    setOpen(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        selection.focusFirst();
      } else {
        selection.focusNext();
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      selection.focusPrevious();
    } else if (event.key === 'Enter') {
      const alvo = visible.find((option) => option.value === selection.focusedKey);
      if (open && alvo) {
        event.preventDefault();
        escolher(alvo);
      }
    } else if (event.key === 'Escape') {
      setOpen(false);
      setFiltering(false);
      setQuery('');
    }
  }

  return (
    <Field error={error} hint={hint} id={providedId} label={label} required={required}>
      {({ id, describedBy, invalid }) => (
        <>
          <input
            ref={inputRef}
            className={[styles.input, styles[size], error && styles.error].filter(Boolean).join(' ')}
            id={id}
            type="text"
            role="combobox"
            autoComplete="off"
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            aria-expanded={open}
            aria-autocomplete="list"
            aria-controls={open ? `${baseId}-listbox` : undefined}
            aria-activedescendant={open && activeIndex >= 0 ? `${baseId}-${activeIndex}` : undefined}
            aria-required={required || undefined}
            disabled={disabled}
            placeholder={placeholder}
            value={texto}
            onBlur={() => setOpen(false)}
            onChange={(event) => {
              setQuery(event.target.value);
              setFiltering(true);
              setOpen(true);
              selection.focus(undefined);
            }}
            onClick={() => setOpen(true)}
            onKeyDown={handleKeyDown}
          />
          {open &&
            createPortal(
              <div
                ref={listRef}
                className={styles.listbox}
                style={{ ...positionProps.style, width: largura, maxHeight: alturaMaxima }}
                id={`${baseId}-listbox`}
                role="listbox"
                aria-label={label ?? placeholder ?? 'Opcoes'}
              >
                {visible.length === 0 && <p className={styles.empty}>{emptyMessage}</p>}
                {visible.map((option, index) => (
                  <div
                    key={option.value}
                    className={[
                      styles.option,
                      selection.focusedKey === option.value && styles.focused,
                      option.disabled && styles.disabled,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    id={`${baseId}-${index}`}
                    role="option"
                    aria-selected={selection.selectedKeys.has(option.value)}
                    aria-disabled={option.disabled || undefined}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => escolher(option)}
                  >
                    {option.label}
                  </div>
                ))}
              </div>,
              document.body,
            )}
        </>
      )}
    </Field>
  );
}
