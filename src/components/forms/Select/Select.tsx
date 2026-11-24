import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { useOverlay, useOverlayPosition } from '@react-aria/overlays';
import { ListingOptions } from '../../data-display/List/ListingOptions';
import { useListing, type Listing } from '../../data-display/List/useListing';
import { useAnnouncement } from '../../data-display/List/useAnnouncement';
import { useLoadMore, type LoadMore } from '../../data-display/List/useLoadMore';
import { OPCOES_SEM_JANELA } from '../../data-display/List/useVirtualWindow';
import { useFormReset } from '../../../hooks/useFormReset';
import { useMergedRefs } from '../../../hooks/useMergedRefs';
import { usePortalContainer } from '../../overlays/Portal/PortalContext';
import { useOpenState } from '../../../hooks/useOpenState';
import { useClickShieldOnClose } from '../../../hooks/useOverlayClickGuard';
import { blockRepeatedPress } from '../../../utils/press/press';
import { Field } from '../Field';
import { FormValue } from '../Field/FormValue';
import styles from './Select.module.css';
import { IconChevronDown } from '../../icons';

export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectOption {
  /** Segunda linha da opção, na lista aberta. O nome da opção e o gatilho fechado ficam no rótulo. */
  description?: string;
  disabled?: boolean;
  /** Título do grupo. As opções seguidas de um mesmo grupo aparecem juntas, sob ele. */
  group?: string;
  /** Decorativo, à frente do rótulo, na lista aberta. */
  icon?: ReactNode;
  label: string;
  value: string;
}

/** As propriedades nativas vao ao gatilho, que e o controle; o `className` soma ao do sistema. */
export interface SelectProps
  extends Omit<ComponentPropsWithRef<'button'>, 'children' | 'defaultValue' | 'name' | 'onChange' | 'type' | 'value'> {
  /** Ao lado do campo, na mesma linha, como o botão que o completa. Fica fora da descrição do campo. */
  aside?: ReactNode;
  defaultOpen?: boolean;
  defaultValue?: string;
  error?: string;
  /** Há mais páginas além das opções que chegaram. Sem ele, `onLoadMore` não é chamado. */
  hasMore?: boolean;
  hint?: string;
  label?: string;
  /** Ao lado do rótulo e fora dele, como um selo ou um link. Não entra no nome do campo. */
  labelAddon?: ReactNode;
  /** A contagem anunciada quando uma página chega. */
  loadedMessage?: (count: number) => string;
  /** A linha de espera da próxima página, no rodapé da lista. */
  loadingMoreMessage?: string;
  /**
   * Nome do campo no formulario. Com ele, um input oculto carrega o valor para
   * o `FormData`: sem controle nativo por baixo, o envio ignorava o campo.
   */
  name?: string;
  /**
   * Pede a próxima página, uma vez, quando a rolagem chega a três opções do fim ou a seta para baixo passa da última.
   * O pedido vale até as opções mudarem de tamanho; enquanto isso, uma linha "Carregando mais" fica no rodapé.
   * Se a página não vier, fechar e reabrir a lista permite pedir outra vez.
   */
  onLoadMore?: () => void;
  onOpenChange?: (open: boolean) => void;
  onValueChange?: (value: string) => void;
  open?: boolean;
  options: readonly SelectOption[];
  /** Elemento que recebe o painel. Sem ele vale o `PortalProvider` mais próximo e, sem este, o `document.body`. */
  portalContainer?: HTMLElement | null;
  placeholder?: string;
  required?: boolean;
  size?: SelectSize;
  value?: string;
}

export function Select({
  'aria-describedby': ariaDescribedBy,
  aside,
  className,
  defaultOpen = false,
  defaultValue,
  name,
  disabled = false,
  error,
  hasMore = false,
  hint,
  id: providedId,
  label,
  labelAddon,
  loadedMessage = (count) => (count === 1 ? '1 resultado' : `${count} resultados`),
  loadingMoreMessage = 'Carregando mais',
  onClick,
  onKeyDown,
  onLoadMore,
  onOpenChange,
  onValueChange,
  open: controlledOpen,
  portalContainer,
  options,
  placeholder = 'Selecione',
  ref,
  required = false,
  size = 'md',
  value,
  ...props
}: SelectProps) {
  const container = usePortalContainer(portalContainer);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useOpenState({ defaultOpen, onOpenChange, open: controlledOpen });
  useClickShieldOnClose(open);
  const wasOpenRef = useRef(open);
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
  const anuncio = useAnnouncement();
  const paginas = useLoadMore({
    count: options.length,
    hasMore,
    onArrive: (count) => anuncio.announce(loadedMessage(count)),
    onLoadMore,
  });

  function fechar() {
    setOpen(false);
  }

  // Cobre todo fechamento, inclusive o feito pelo produto ao mudar `open`.
  useEffect(() => {
    if (wasOpenRef.current && !open) {
      triggerRef.current?.focus({ preventScroll: true });
      paginas.cancel();
    }
    wasOpenRef.current = open;
  }, [open]);

  useEffect(() => {
    if (open) {
      listing.focus(chosen?.value ?? options.find((option) => !option.disabled)?.value);
    }
    // Só ao abrir: a escolha e as opções mudam com o painel já aberto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function abrir() {
    if (disabled) {
      return;
    }

    setOpen(true);
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    onKeyDown?.(event);

    if (blockRepeatedPress(event)) {
      return;
    }

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
    <Field
      aria-describedby={ariaDescribedBy}
      aside={aside}
      error={error}
      hint={hint}
      id={providedId}
      label={label}
      labelAddon={labelAddon}
      required={required}
    >
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
          {onLoadMore && (
            <span className={styles.visuallyHidden} role="status">
              {anuncio.message}
            </span>
          )}
          {open &&
            container &&
            createPortal(
              <SelectListbox
                label={label ?? props['aria-label'] ?? placeholder}
                listing={listing}
                loadingMoreMessage={loadingMoreMessage}
                onClose={fechar}
                pages={paginas}
                triggerRef={triggerRef}
              />,
              container,
            )}
        </>
      )}
    </Field>
  );
}

function SelectListbox({
  label,
  listing,
  loadingMoreMessage,
  onClose,
  pages,
  triggerRef,
}: {
  label: string;
  listing: Listing;
  loadingMoreMessage: string;
  onClose: () => void;
  pages: LoadMore;
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
    onClose,
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
    // O Escape fecha pelo `useOverlay`: tratá-lo aqui avisaria duas vezes.
    if (event.key === 'Tab') {
      onClose();
      return;
    }

    if (blockRepeatedPress(event)) {
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

    // A seta para baixo na última opção pede a próxima página; o foco fica onde está até ela chegar.
    if (event.key === 'ArrowDown') {
      const indice = listing.visible.findIndex((option) => option.value === listing.focusedKey);

      if (indice >= 0 && !listing.visible.slice(indice + 1).some((option) => !option.disabled)) {
        pages.request();
      }
    }

    listing.handleKeyDown(event);
  }

  return (
    <div
      {...overlayProps}
      ref={panelRef}
      className={styles.panel}
      // Camada de cima: o `ariaHideOutside` do Dialog ignora quem a declara.
      data-react-aria-top-layer="true"
      style={{ ...positionProps.style, width: largura, maxHeight: alturaMaxima, zIndex: 'var(--pl-z-popover)' }}
    >
      <ListingOptions
        baseId={baseId}
        elementRef={listboxRef}
        height={listing.visible.length > OPCOES_SEM_JANELA ? alturaMaxima : undefined}
        label={label}
        listing={listing}
        loadingMore={pages.pending}
        loadingMoreMessage={loadingMoreMessage}
        onNearEnd={pages.enabled ? pages.request : undefined}
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
