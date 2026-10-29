import {
  cloneElement,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { FocusScope } from '@react-aria/focus';
import { useOverlay, useOverlayPosition } from '@react-aria/overlays';
import { useMergedRefs } from '../../../hooks/useMergedRefs';
import { useSelection, type SelectionItem } from '../../../hooks/useSelection';
import { IconCheck, IconChevronRight } from '../../icons';
import { toAriaKeyShortcuts } from './keyShortcuts';
import styles from './Menu.module.css';

export interface MenuItem {
  /** Com ele, o item e de marcar e mostra o visto quando marcado, como o tipo atual de um bloco. */
  checked?: boolean;
  disabled?: boolean;
  /** Icone decorativo antes do texto. */
  icon?: ReactNode;
  /** Com eles, o item abre um submenu, e o `onSelect` não é chamado. */
  items?: readonly (MenuItem | MenuSection)[];
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

/** Espera do ponteiro antes de abrir ou trocar o submenu: atravessar na diagonal não o fecha. */
const HOVER_DELAY = 150;

type InitialFocus = 'first' | 'last' | null;

export function Menu({ children, defaultOpen = false, items, label, onOpenChange, open: controlledOpen }: MenuProps) {
  const triggerRef = useRef<HTMLElement>(null);
  const ownerId = useId();
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
              anchorRef={triggerRef}
              initialFocus={openedWith}
              items={items}
              label={label}
              ownerId={ownerId}
              onClose={fechar}
            />
          </FocusScope>,
          document.body,
        )}
    </>
  );
}

function ehSecao(entrada: MenuItem | MenuSection): entrada is MenuSection {
  return !('label' in entrada);
}

interface MenuListProps {
  /** O gatilho, no menu; o item pai, no submenu. */
  anchorRef: RefObject<HTMLElement | null>;
  initialFocus: InitialFocus;
  items: readonly (MenuItem | MenuSection)[];
  label: string;
  listRef?: Ref<HTMLDivElement>;
  /** Só no submenu: fecha ele e devolve o foco ao item pai. */
  onBack?: () => void;
  /** Fecha o menu inteiro, com os submenus. */
  onClose: (devolverFoco: boolean) => void;
  onPointerEnter?: () => void;
  ownerId: string;
}

function MenuList({
  anchorRef,
  initialFocus,
  items: entradas,
  label,
  listRef,
  onBack,
  onClose,
  onPointerEnter,
  ownerId,
}: MenuListProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRefs(ref, listRef);
  const nodes = useRef(new Map<string, HTMLElement>());
  const isSubmenu = onBack !== undefined;
  const [submenu, setSubmenu] = useState<{ key: string; focus: InitialFocus } | null>(null);
  const submenuAnchor = useRef<HTMLElement | null>(null);
  const submenuList = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // O teclado percorre os itens de todos os grupos como uma lista so.
  const items = useMemo(() => entradas.flatMap((entrada) => (ehSecao(entrada) ? entrada.items : [entrada])), [entradas]);
  const collection = useMemo<SelectionItem[]>(
    () => items.map((item) => ({ key: item.key, disabled: item.disabled, textValue: item.label })),
    [items],
  );
  const selection = useSelection({ items: collection, mode: 'none' });
  const { focus, focusedKey, focusFirst, focusLast, focusNext, focusPrevious, search } = selection;
  const openItem = submenu ? items.find((item) => item.key === submenu.key) : undefined;

  // useOverlayPosition entrega toda a altura disponivel; limitamos para que
  // uma lista longa nao ocupe a tela inteira.
  // Sem isto o gatilho conta como "fora": o ponteiro fecha o menu e o clique
  // dele reabre em seguida, e o menu pisca sem abrir.
  // O submenu vive noutro portal: clicar nele nao e clicar fora.
  const { overlayProps } = useOverlay(
    {
      isOpen: !isSubmenu,
      onClose: () => onClose(false),
      isDismissable: true,
      shouldCloseOnBlur: false,
      shouldCloseOnInteractOutside: (elemento) =>
        !anchorRef.current?.contains(elemento) && !elemento.closest(`[data-menu-owner="${ownerId}"]`),
    },
    ref,
  );
  const { overlayProps: positionProps } = useOverlayPosition({
    targetRef: anchorRef,
    overlayRef: ref,
    placement: isSubmenu ? 'end top' : 'bottom start',
    offset: isSubmenu ? 2 : 6,
    crossOffset: isSubmenu ? -5 : 0,
    containerPadding: 8,
    isOpen: true,
  });

  const alturaMaxima = Math.min(Number(positionProps.style?.maxHeight) || 360, 360);

  useEffect(() => {
    if (initialFocus === 'last') {
      focusLast();
    } else if (initialFocus === 'first') {
      focusFirst();
    }
    // O submenu aberto pelo ponteiro recebe o foco depois, quando o teclado entra nele.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFocus]);

  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  useEffect(() => {
    if (focusedKey) {
      nodes.current.get(focusedKey)?.focus();
    }
  }, [focusedKey]);

  function openSubmenu(item: MenuItem, initial: InitialFocus) {
    clearTimeout(hoverTimer.current);
    submenuAnchor.current = nodes.current.get(item.key) ?? null;
    setSubmenu({ key: item.key, focus: initial });
  }

  /* O foco que estava no submenu volta ao item pai, e nao se perde no `body`. */
  function closeSubmenu() {
    clearTimeout(hoverTimer.current);
    if (submenu && submenuList.current?.contains(document.activeElement)) {
      focus(submenu.key);
      nodes.current.get(submenu.key)?.focus();
    }
    setSubmenu(null);
  }

  function hover(item: MenuItem) {
    const next = item.items && !item.disabled ? item : null;
    clearTimeout(hoverTimer.current);
    if ((submenu?.key ?? null) !== (next?.key ?? null)) {
      hoverTimer.current = setTimeout(() => (next ? openSubmenu(next, null) : closeSubmenu()), HOVER_DELAY);
    }
  }

  function acionar(item: MenuItem) {
    if (item.disabled) {
      return;
    }

    if (item.items) {
      openSubmenu(item, 'first');
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
        aria-expanded={item.items ? submenu?.key === item.key : undefined}
        aria-haspopup={item.items ? 'menu' : undefined}
        aria-keyshortcuts={item.shortcutKeys ?? (item.shortcut ? toAriaKeyShortcuts(item.shortcut) : undefined)}
        className={[styles.item, item.tone === 'danger' && styles.danger].filter(Boolean).join(' ')}
        disabled={item.disabled}
        key={item.key}
        onClick={() => acionar(item)}
        onPointerEnter={() => hover(item)}
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
        {item.items && <IconChevronRight aria-hidden="true" className={styles.submenuMark} />}
      </button>
    );
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const focusedItem = items.find((item) => item.key === focusedKey);

    if (event.key === 'ArrowRight' && focusedItem?.items && !focusedItem.disabled) {
      event.preventDefault();
      openSubmenu(focusedItem, 'first');
    } else if (onBack && (event.key === 'ArrowLeft' || event.key === 'Escape')) {
      event.preventDefault();
      onBack();
    } else if (event.key === 'ArrowDown') {
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
      data-menu-owner={ownerId}
      data-react-aria-top-layer="true"
      ref={mergedRef}
      className={styles.menu}
      style={{ ...positionProps.style, maxHeight: alturaMaxima }}
      role="menu"
      aria-label={label}
      onKeyDown={(event) => {
        // O submenu fica no menu pela arvore do React: a tecla dele nao sobe ao menu de fora.
        if (isSubmenu) {
          event.stopPropagation();
        }
        // Espalhar overlayProps antes nao basta: este onKeyDown o substituiria.
        handleKeyDown(event);
        overlayProps.onKeyDown?.(event);
      }}
      onPointerEnter={onPointerEnter}
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
      {openItem?.items &&
        createPortal(
          <FocusScope>
            <MenuList
              anchorRef={submenuAnchor}
              initialFocus={submenu?.focus ?? null}
              items={openItem.items}
              label={openItem.label}
              listRef={submenuList}
              ownerId={ownerId}
              onBack={closeSubmenu}
              onClose={onClose}
              onPointerEnter={() => clearTimeout(hoverTimer.current)}
            />
          </FocusScope>,
          document.body,
        )}
    </div>
  );
}
