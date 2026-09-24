import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { useOverlayPosition } from '@react-aria/overlays';
import { ListingOptions, optionId } from '../../data-display/List/ListingOptions';
import { useListing } from '../../data-display/List/useListing';
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
  loading?: boolean;
  onSearch?: (term: string) => void;
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
  loading = false,
  onSearch,
  onValueChange,
  options,
  placeholder,
  required = false,
  size = 'md',
  value,
}: ComboBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const baseId = useRef('combobox-' + Math.random().toString(36).slice(2, 9)).current;
  const [open, setOpen] = useState(false);
  const [filtering, setFiltering] = useState(false);

  const listing = useListing({
    items: options,
    selectionMode: 'single',
    defaultValue: defaultValue === undefined ? undefined : options.filter((option) => option.value === defaultValue),
    value: value === undefined ? undefined : options.filter((option) => option.value === value),
    onSearch,
    onSelectionChange: (chosen) => {
      const [first] = chosen;

      if (first) {
        onValueChange?.(first.value);
      }
    },
  });

  const [chosen] = listing.selected;
  const texto = filtering ? listing.term : chosen?.label ?? '';
  const activeIndex = listing.visible.findIndex((option) => option.value === listing.focusedKey);

  const { overlayProps: positionProps } = useOverlayPosition({
    targetRef: inputRef,
    overlayRef: panelRef,
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

  function encerrarFiltro() {
    setFiltering(false);
    listing.filter('');
  }

  function fechar() {
    setOpen(false);
    encerrarFiltro();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' && !open) {
      event.preventDefault();
      setOpen(true);
      listing.focusFirst();
      return;
    }

    if (event.key === 'Escape') {
      fechar();
      return;
    }

    if (event.key === 'Enter') {
      const alvo = listing.visible.find((option) => option.value === listing.focusedKey);

      if (open && alvo && !alvo.disabled) {
        event.preventDefault();
        listing.select(alvo);
        fechar();
      }
      return;
    }

    listing.handleKeyDown(event);
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
            aria-controls={open ? baseId + '-options' : undefined}
            aria-activedescendant={open && activeIndex >= 0 ? optionId(baseId, activeIndex) : undefined}
            aria-required={required || undefined}
            disabled={disabled}
            placeholder={placeholder}
            value={texto}
            onBlur={() => setOpen(false)}
            onChange={(event) => {
              setFiltering(true);
              setOpen(true);
              listing.filter(event.target.value);
            }}
            onClick={() => setOpen(true)}
            onKeyDown={handleKeyDown}
          />
          {open &&
            createPortal(
              <div
                ref={panelRef}
                className={styles.panel}
                style={{ ...positionProps.style, width: largura, maxHeight: alturaMaxima }}
              >
                <ListingOptions
                  baseId={baseId}
                  empty={<p className={styles.empty}>{emptyMessage}</p>}
                  holdsFocus={false}
                  label={label ?? placeholder ?? 'Opcoes'}
                  listing={listing}
                  loading={loading}
                  onSelect={fechar}
                />
              </div>,
              document.body,
            )}
        </>
      )}
    </Field>
  );
}
