import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { useOverlay, useOverlayPosition } from '@react-aria/overlays';
import { ListingOptions } from '../../data-display/List/ListingOptions';
import { useListing, type Listing } from '../../data-display/List/useListing';
import { Field } from '../Field';
import styles from './Select.module.css';
import { IconChevronDown } from '../../icons';

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

  const listing = useListing({
    items: options,
    selectionMode: 'single',
    defaultValue: defaultValue === undefined ? undefined : options.filter((option) => option.value === defaultValue),
    value: value === undefined ? undefined : options.filter((option) => option.value === value),
    onSelectionChange: (chosen) => {
      const [first] = chosen;

      if (first) {
        onValueChange?.(first.value);
      }
    },
  });

  const [chosen] = listing.selected;

  function fechar() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function abrir() {
    if (disabled) {
      return;
    }

    listing.focus(chosen?.value ?? options.find((option) => !option.disabled)?.value);
    setOpen(true);
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      abrir();
    }
  }

  return (
    <Field error={error} hint={hint} id={providedId} label={label} required={required}>
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
            <IconChevronDown className={styles.chevron} size={14} />
          </button>
          {open &&
            createPortal(
              <SelectListbox
                label={label ?? placeholder}
                listing={listing}
                onClose={fechar}
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
  listing,
  onClose,
  triggerRef,
}: {
  label: string;
  listing: Listing;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLElement | null>(null);
  const baseId = useRef('listbox-' + Math.random().toString(36).slice(2, 9)).current;

  const { overlayProps } = useOverlay(
    { isOpen: true, onClose, isDismissable: true, shouldCloseOnBlur: false },
    panelRef,
  );
  const { overlayProps: positionProps } = useOverlayPosition({
    targetRef: triggerRef,
    overlayRef: panelRef,
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
    listboxRef.current?.focus();
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape' || event.key === 'Tab') {
      onClose();
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const alvo = listing.visible.find((option) => option.value === listing.focusedKey);

      if (alvo && !alvo.disabled) {
        listing.select(alvo);
        onClose();
      }
      return;
    }

    if (event.key.length === 1 && !event.metaKey && !event.ctrlKey) {
      listing.typeahead(event.key);
      return;
    }

    listing.handleKeyDown(event);
  }

  return (
    <div
      {...overlayProps}
      ref={panelRef}
      className={styles.panel}
      style={{ ...positionProps.style, width: largura, maxHeight: alturaMaxima }}
    >
      <ListingOptions
        baseId={baseId}
        elementRef={listboxRef}
        label={label}
        listing={listing}
        onKeyDown={(event) => {
          // Espalhar overlayProps antes nao basta: este onKeyDown o substituiria.
          handleKeyDown(event);
          overlayProps.onKeyDown?.(event as KeyboardEvent<HTMLDivElement>);
        }}
        onSelect={onClose}
        tabIndex={-1}
      />
    </div>
  );
}
