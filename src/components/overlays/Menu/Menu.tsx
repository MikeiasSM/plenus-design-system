import {
  cloneElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
} from 'react';
import { createPortal } from 'react-dom';
import { FocusScope } from '@react-aria/focus';
import { useOverlay, useOverlayPosition } from '@react-aria/overlays';
import { mergeRefs } from '../../../utils/mergeRefs';
import { useSelection, type SelectionItem } from '../../../hooks/useSelection';
import styles from './Menu.module.css';

export interface MenuItem {
  disabled?: boolean;
  key: string;
  label: string;
  onSelect?: () => void;
}

export interface MenuProps {
  children: ReactElement<Record<string, unknown>>;
  items: readonly MenuItem[];
  label: string;
}

/** Encadeia o manipulador do gatilho ao do menu, em vez de substitui-lo. */
function encadear<E>(proprio: ((evento: E) => void) | undefined, seguinte: (evento: E) => void) {
  return (evento: E) => {
    proprio?.(evento);
    seguinte(evento);
  };
}

export function Menu({ children, items, label }: MenuProps) {
  const triggerRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [openedWith, setOpenedWith] = useState<'first' | 'last'>('first');
  const devolverFoco = useRef(false);

  function abrir(from: 'first' | 'last') {
    setOpenedWith(from);
    setOpen(true);
  }

  function fechar() {
    devolverFoco.current = true;
    setOpen(false);
  }

  // O foco volta ao gatilho **depois** que o menu sai. Enquanto ele esta na
  // tela, o `FocusScope contain` puxa o foco de volta para dentro.
  useEffect(() => {
    if (!open && devolverFoco.current) {
      devolverFoco.current = false;
      triggerRef.current?.focus();
    }
  }, [open]);

  const dono = children.props;
  const trigger = cloneElement(children, {
    ref: mergeRefs(triggerRef, (children as { ref?: React.Ref<HTMLElement> }).ref),
    'aria-haspopup': 'menu',
    'aria-expanded': open,
    onClick: encadear(dono.onClick as (evento: unknown) => void, () =>
      open ? fechar() : abrir('first'),
    ),
    onKeyDown: encadear(dono.onKeyDown as (evento: KeyboardEvent) => void, (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        abrir(event.key === 'ArrowDown' ? 'first' : 'last');
      }
    }),
  });

  return (
    <>
      {trigger}
      {open &&
        createPortal(
          // O escopo proprio e o que da foco ao menu dentro de um Dialog, cujo
          // `FocusScope contain` puxaria o foco de volta. Sem `restoreFocus`:
          // quem devolve o foco ao gatilho e o proprio `fechar`.
          <FocusScope contain>
            <MenuList
              items={items}
              label={label}
              openedWith={openedWith}
              onClose={fechar}
              triggerRef={triggerRef}
            />
          </FocusScope>,
          document.body,
        )}
    </>
  );
}

function MenuList({
  items,
  label,
  onClose,
  openedWith,
  triggerRef,
}: {
  items: readonly MenuItem[];
  label: string;
  onClose: () => void;
  openedWith: 'first' | 'last';
  triggerRef: React.RefObject<HTMLElement | null>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const nodes = useRef(new Map<string, HTMLElement>());
  const collection = useMemo<SelectionItem[]>(
    () => items.map((item) => ({ key: item.key, disabled: item.disabled, textValue: item.label })),
    [items],
  );
  const selection = useSelection({ items: collection, mode: 'none' });
  const { focusedKey, focusFirst, focusLast, focusNext, focusPrevious, search } = selection;

  // useOverlayPosition entrega toda a altura disponivel; limitamos para que
  // uma lista longa nao ocupe a tela inteira.
  // Sem isto o gatilho conta como "fora": o ponteiro fecha o menu e o clique
  // dele reabre em seguida, e o menu pisca sem abrir.
  const { overlayProps } = useOverlay(
    {
      isOpen: true,
      onClose,
      isDismissable: true,
      shouldCloseOnBlur: false,
      shouldCloseOnInteractOutside: (elemento) => !triggerRef.current?.contains(elemento),
    },
    ref,
  );
  const { overlayProps: positionProps } = useOverlayPosition({
    targetRef: triggerRef,
    overlayRef: ref,
    placement: 'bottom start',
    offset: 6,
    containerPadding: 8,
    isOpen: true,
  });

  const alturaMaxima = Math.min(Number(positionProps.style?.maxHeight) || 360, 360);

  useEffect(() => {
    if (openedWith === 'last') {
      focusLast();
    } else {
      focusFirst();
    }
    // Posicao inicial depende apenas de como o menu foi aberto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (focusedKey) {
      nodes.current.get(focusedKey)?.focus();
    }
  }, [focusedKey]);

  function acionar(item: MenuItem) {
    if (item.disabled) {
      return;
    }

    item.onSelect?.();
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
    } else if (event.key === 'Escape' || event.key === 'Tab') {
      onClose();
    } else if (event.key.length === 1 && !event.metaKey && !event.ctrlKey) {
      search(event.key);
    }
  }

  return (
    <div
      {...overlayProps}
      data-react-aria-top-layer="true"
      ref={ref}
      className={styles.menu}
      style={{ ...positionProps.style, maxHeight: alturaMaxima }}
      role="menu"
      aria-label={label}
      onKeyDown={(event) => {
        // Espalhar overlayProps antes nao basta: este onKeyDown o substituiria.
        handleKeyDown(event);
        overlayProps.onKeyDown?.(event);
      }}
    >
      {items.map((item) => (
        <button
          key={item.key}
          ref={(node) => {
            if (node) {
              nodes.current.set(item.key, node);
            } else {
              nodes.current.delete(item.key);
            }
          }}
          className={styles.item}
          type="button"
          role="menuitem"
          disabled={item.disabled}
          tabIndex={focusedKey === item.key ? 0 : -1}
          onClick={() => acionar(item)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
