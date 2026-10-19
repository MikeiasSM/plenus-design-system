import {
  cloneElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { createPortal } from 'react-dom';
import { FocusScope } from '@react-aria/focus';
import { useOverlay, useOverlayPosition } from '@react-aria/overlays';
import { useMergedRefs } from '../../../hooks/useMergedRefs';
import { useSelection, type SelectionItem } from '../../../hooks/useSelection';
import { IconCheck } from '../../icons';
import { toAriaKeyShortcuts } from './keyShortcuts';
import styles from './Menu.module.css';

export interface MenuItem {
  /** Com ele, o item e de marcar e mostra o visto quando marcado, como o tipo atual de um bloco. */
  checked?: boolean;
  disabled?: boolean;
  /** Icone decorativo antes do texto. */
  icon?: ReactNode;
  key: string;
  label: string;
  onSelect?: () => void;
  /** Atalho escrito à direita, como `Ctrl+D` ou `⌘⇧D`; convertido nos nomes de tecla de `aria-keyshortcuts`. */
  shortcut?: string;
  /** Valor de `aria-keyshortcuts` quando a conversão do `shortcut` não basta, como `Control+Shift+D Meta+Shift+D`. */
  shortcutKeys?: string;
  /** `danger` para a acao que destroi, como remover. */
  tone?: 'danger';
}

/** Grupo de itens, com titulo opcional; entre dois grupos, o menu desenha o divisor. */
export interface MenuSection {
  items: readonly MenuItem[];
  key: string;
  title?: string;
}

export interface MenuProps {
  children: ReactElement<Record<string, unknown>>;
  /** Abertura inicial no modo nao controlado. */
  defaultOpen?: boolean;
  items: readonly (MenuItem | MenuSection)[];
  label: string;
  /** Avisa cada abertura e fechamento pedidos pelo gatilho, pelo teclado, pela opcao ou pelo clique fora. */
  onOpenChange?: (open: boolean) => void;
  /** Controla a abertura; sem ele, o menu guarda o proprio estado. */
  open?: boolean;
}

/** Encadeia o manipulador do gatilho ao do menu, em vez de substitui-lo. */
function encadear<E>(proprio: ((evento: E) => void) | undefined, seguinte: (evento: E) => void) {
  return (evento: E) => {
    proprio?.(evento);
    seguinte(evento);
  };
}

export function Menu({ children, defaultOpen = false, items, label, onOpenChange, open: controlledOpen }: MenuProps) {
  const triggerRef = useRef<HTMLElement>(null);
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [openedWith, setOpenedWith] = useState<'first' | 'last'>('first');
  const open = controlledOpen ?? internalOpen;

  function setOpen(proximo: boolean) {
    setInternalOpen(proximo);
    onOpenChange?.(proximo);
  }

  function abrir(from: 'first' | 'last') {
    setOpenedWith(from);
    setOpen(true);
  }

  // O foco volta na hora, antes de o `onSelect` montar o que vem depois, como um campo com `autoFocus` ou
  // um Dialog, que guarda o elemento em foco para devolver. Clique fora nao devolve: o foco e de quem foi clicado.
  function fechar(devolverFoco: boolean) {
    setOpen(false);

    if (devolverFoco) {
      triggerRef.current?.focus();
    }
  }

  const dono = children.props;
  const mergedTriggerRef = useMergedRefs(triggerRef, dono.ref as Ref<HTMLElement> | undefined);
  const trigger = cloneElement(children, {
    ref: mergedTriggerRef,
    'aria-haspopup': 'menu',
    'aria-expanded': open,
    onClick: encadear(dono.onClick as (evento: unknown) => void, () =>
      open ? fechar(true) : abrir('first'),
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
        typeof document !== 'undefined' &&
        createPortal(
          // O escopo proprio poe o menu na arvore de escopos do Dialog, cujo `contain` puxaria o foco de volta.
          // Sem `contain` aqui: ele disputaria o foco com o gatilho quando o menu fecha.
          <FocusScope>
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

function ehSecao(entrada: MenuItem | MenuSection): entrada is MenuSection {
  return 'items' in entrada;
}

function MenuList({
  items: entradas,
  label,
  onClose,
  openedWith,
  triggerRef,
}: {
  items: readonly (MenuItem | MenuSection)[];
  label: string;
  onClose: (devolverFoco: boolean) => void;
  openedWith: 'first' | 'last';
  triggerRef: React.RefObject<HTMLElement | null>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const nodes = useRef(new Map<string, HTMLElement>());
  // O teclado percorre os itens de todos os grupos como uma lista so.
  const items = useMemo(() => entradas.flatMap((entrada) => (ehSecao(entrada) ? entrada.items : [entrada])), [entradas]);
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
      onClose: () => onClose(false),
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

    onClose(true);
    item.onSelect?.();
  }

  function renderizarItem(item: MenuItem) {
    const marcavel = item.checked !== undefined;

    return (
      <button
        aria-checked={marcavel ? item.checked : undefined}
        aria-keyshortcuts={item.shortcutKeys ?? (item.shortcut ? toAriaKeyShortcuts(item.shortcut) : undefined)}
        className={[styles.item, item.tone === 'danger' && styles.danger].filter(Boolean).join(' ')}
        disabled={item.disabled}
        key={item.key}
        onClick={() => acionar(item)}
        ref={(node) => {
          if (node) {
            nodes.current.set(item.key, node);
          } else {
            nodes.current.delete(item.key);
          }
        }}
        role={marcavel ? 'menuitemcheckbox' : 'menuitem'}
        tabIndex={focusedKey === item.key ? 0 : -1}
        type="button"
      >
        {item.icon && (
          <span aria-hidden="true" className={styles.icon}>
            {item.icon}
          </span>
        )}
        <span className={styles.label}>{item.label}</span>
        {item.shortcut && (
          <kbd aria-hidden="true" className={styles.shortcut}>
            {item.shortcut}
          </kbd>
        )}
        {marcavel && <IconCheck className={[styles.check, item.checked && styles.checkOn].filter(Boolean).join(' ')} />}
      </button>
    );
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
      onClose(true);
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
      {entradas.map((entrada, indice) => {
        if (!ehSecao(entrada)) {
          return renderizarItem(entrada);
        }

        return (
          <div aria-label={entrada.title} className={styles.section} key={entrada.key} role="group">
            {indice > 0 && <div aria-hidden="true" className={styles.divider} />}
            {entrada.title && (
              <div aria-hidden="true" className={styles.sectionTitle}>
                {entrada.title}
              </div>
            )}
            {entrada.items.map(renderizarItem)}
          </div>
        );
      })}
    </div>
  );
}
