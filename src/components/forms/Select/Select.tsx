import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { useOverlay, useOverlayPosition } from '@react-aria/overlays';
import { ListingOptions } from '../../data-display/List/ListingOptions';
import { useListing, type Listing } from '../../data-display/List/useListing';
import { useFormReset } from '../../../hooks/useFormReset';
import { useMergedRefs } from '../../../hooks/useMergedRefs';
import { Field } from '../Field';
import { FormValue } from '../Field/FormValue';
import styles from './Select.module.css';
import { IconChevronDown } from '../../icons';

export type SelectSize = 'sm' | 'md';

export interface SelectOption {
  disabled?: boolean;
  label: string;
  value: string;
}

/** As propriedades nativas vao ao gatilho, que e o controle; o `className` soma ao do sistema. */
export interface SelectProps
  extends Omit<ComponentPropsWithRef<'button'>, 'children' | 'defaultValue' | 'name' | 'onChange' | 'type' | 'value'> {
  defaultValue?: string;
  error?: string;
  hint?: string;
  label?: string;
  /**
   * Nome do campo no formulario. Com ele, um input oculto carrega o valor para
   * o `FormData`: sem controle nativo por baixo, o envio ignorava o campo.
   */
  name?: string;
  onValueChange?: (value: string) => void;
  options: readonly SelectOption[];
  placeholder?: string;
  required?: boolean;
  size?: SelectSize;
  value?: string;
}

export function Select({
  'aria-describedby': ariaDescribedBy,
  className,
  defaultValue,
  name,
  disabled = false,
  error,
  hint,
  id: providedId,
  label,
  onClick,
  onKeyDown,
  onValueChange,
  options,
  placeholder = 'Selecione',
  ref,
  required = false,
  size = 'md',
  value,
  ...props
}: SelectProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const resetRef = useFormReset<HTMLButtonElement>(() => listing.reset());
  const mergedRef = useMergedRefs(triggerRef, resetRef, ref);

  // O valor e a chave, e nao a opcao: com opcoes que chegam depois, filtrar por elas perdia a escolha.
  const listing = useListing({
    items: options,
    selectionMode: 'single',
    defaultValue: defaultValue === undefined ? undefined : [{ value: defaultValue, label: '' }],
    value: value === undefined ? undefined : [{ value, label: '' }],
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
    onKeyDown?.(event);

    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      abrir();
    }
  }

  function handleTriggerClick(event: MouseEvent<HTMLButtonElement>) {
    onClick?.(event);

    if (open) {
      fechar();
    } else {
      abrir();
    }
  }

  return (
    <Field aria-describedby={ariaDescribedBy} error={error} hint={hint} id={providedId} label={label} required={required}>
      {({ id, describedBy, invalid }) => (
        <>
          <FormValue
            disabled={disabled}
            name={name}
            onFocus={() => triggerRef.current?.focus()}
            required={required}
            value={chosen?.value ?? ''}
          />
          <button
            {...props}
            ref={mergedRef}
            className={[styles.trigger, styles[size], error && styles.error, className].filter(Boolean).join(' ')}
            type="button"
            id={id}
            role="combobox"
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-required={required || undefined}
            disabled={disabled}
            onClick={handleTriggerClick}
            onKeyDown={handleTriggerKeyDown}
          >
            <span className={chosen?.label ? styles.value : styles.placeholder}>{chosen?.label || placeholder}</span>
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
  // `Math.random` mudava entre servidor e cliente.
  const baseId = `listbox-${useId()}`;

  const { overlayProps } = useOverlay(
    {
      isOpen: true,
      onClose,
      isDismissable: true,
      shouldCloseOnBlur: false,
      // O gatilho nao conta como "fora": sem isto o ponteiro fecha o painel e o
      // clique dele reabre em seguida, e ele pisca sem abrir.
      shouldCloseOnInteractOutside: (elemento) => !triggerRef.current?.contains(elemento),
    },
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
