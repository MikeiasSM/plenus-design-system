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
import { useOverlay, useOverlayPosition } from '@react-aria/overlays';
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

export function Menu({ children, items, label }: MenuProps) {
  const triggerRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [openedWith, setOpenedWith] = useState<'first' | 'last'>('first');

  function abrir(from: 'first' | 'last') {
    setOpenedWith(from);
    setOpen(true);
  }

  function fechar() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  const trigger = cloneElement(children, {
    ref: triggerRef,
    'aria-haspopup': 'menu',
    'aria-expanded': open,
    onClick: () => (open ? fechar() : abrir('first')),
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        abrir(event.key === 'ArrowDown' ? 'first' : 'last');
      }
    },
  });

  return (
    <>
      {trigger}
      {open &&
        createPortal(
          <MenuList
            items={items}
            label={label}
            openedWith={openedWith}
            onClose={fechar}
            triggerRef={triggerRef}
          />,
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
  const { overlayProps } = useOverlay({ isOpen: true, onClose, isDismissable: true, shouldCloseOnBlur: false }, ref);
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
