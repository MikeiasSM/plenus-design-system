import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { useOverlayPosition } from '@react-aria/overlays';
import { ListingOptions, optionId } from '../../data-display/List/ListingOptions';
import { useListing } from '../../data-display/List/useListing';
import { useFormReset } from '../../../hooks/useFormReset';
import { useMergedRefs } from '../../../hooks/useMergedRefs';
import { Field } from '../Field';
import { FormValue } from '../Field/FormValue';
import styles from './ComboBox.module.css';

export type ComboBoxSize = 'sm' | 'md';

export interface ComboBoxOption {
  disabled?: boolean;
  label: string;
  value: string;
}

/** As propriedades nativas vao ao campo de texto, que e o controle; o `className` soma ao do sistema. */
export interface ComboBoxProps
  extends Omit<ComponentPropsWithRef<'input'>, 'defaultValue' | 'name' | 'onChange' | 'size' | 'type' | 'value'> {
  defaultValue?: string;
  emptyMessage?: string;
  error?: string;
  hint?: string;
  label?: string;
  /**
   * Nome do campo no formulario. Com ele, um input oculto carrega o valor para
   * o `FormData`: sem controle nativo por baixo, o envio ignorava o campo.
   */
  name?: string;
  loading?: boolean;
  onSearch?: (term: string) => void;
  onValueChange?: (value: string) => void;
  options: readonly ComboBoxOption[];
  size?: ComboBoxSize;
  value?: string;
}

export function ComboBox({
  'aria-describedby': ariaDescribedBy,
  className,
  defaultValue,
  name,
  disabled = false,
  emptyMessage = 'Nenhum resultado',
  error,
  hint,
  id: providedId,
  label,
  loading = false,
  onBlur,
  onClick,
  onKeyDown,
  onSearch,
  onValueChange,
  options,
  placeholder,
  ref,
  required = false,
  size = 'md',
  value,
  ...props
}: ComboBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const baseId = `combobox-${useId()}`;
  const [open, setOpen] = useState(false);
  const [filtering, setFiltering] = useState(false);
  const resetRef = useFormReset<HTMLInputElement>(() => {
    listing.reset();
    fechar();
  });
  const mergedRef = useMergedRefs(inputRef, resetRef, ref);

  // O valor e a chave, e nao a opcao: com opcoes que chegam depois, filtrar por elas perdia a escolha.
  const listing = useListing({
    items: options,
    selectionMode: 'single',
    defaultValue: defaultValue === undefined ? undefined : [{ value: defaultValue, label: '' }],
    value: value === undefined ? undefined : [{ value, label: '' }],
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
    onKeyDown?.(event);

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
    <Field aria-describedby={ariaDescribedBy} error={error} hint={hint} id={providedId} label={label} required={required}>
      {({ id, describedBy, invalid }) => (
        <>
          <FormValue
            disabled={disabled}
            name={name}
            onFocus={() => inputRef.current?.focus()}
            required={required}
            value={chosen?.value ?? ''}
          />
          <input
            {...props}
            ref={mergedRef}
            className={[styles.input, styles[size], error && styles.error, className].filter(Boolean).join(' ')}
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
            // Sair do campo desfaz a busca: o texto volta a dizer o que esta escolhido.
            onBlur={(event: FocusEvent<HTMLInputElement>) => {
              fechar();
              onBlur?.(event);
            }}
            onChange={(event) => {
              setFiltering(true);
              setOpen(true);
              listing.filter(event.target.value);
            }}
            onClick={(event: MouseEvent<HTMLInputElement>) => {
              setOpen(true);
              onClick?.(event);
            }}
            onKeyDown={handleKeyDown}
          />
          {open &&
            createPortal(
              <div
                ref={panelRef}
                className={styles.panel}
                // O clique no painel, fora de uma opcao, nao tira o foco do campo nem fecha a lista.
                onMouseDown={(event) => event.preventDefault()}
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
