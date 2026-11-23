import {
  cloneElement,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ElementType,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { FocusScope } from '@react-aria/focus';
import { useOverlay, useOverlayPosition } from '@react-aria/overlays';
import { useMergedRefs } from '../../../hooks/useMergedRefs';
import { useOverlayClickGuard } from '../../../hooks/useOverlayClickGuard';
import { usePortalContainer } from '../Portal/PortalContext';
import type { PopoverPlacement } from '../Popover/Popover';
import { useSelection, type SelectionItem } from '../../../hooks/useSelection';
import { IconCheck, IconChevronRight } from '../../icons';
import { blockRepeatedPress, isRepeatedClick } from '../../../utils/press/press';
import { toAriaKeyShortcuts } from './keyShortcuts';
import styles from './Menu.module.css';
import { thinScrollbar } from '../../../utils/scrollbar/scrollbar';

export interface MenuItem {
  /** Com ele, o item e de marcar e mostra o visto quando marcado, como o tipo atual de um bloco. */
  checked?: boolean;
  /**
   * Valor curto à direita do texto, como a escolha atual de um submenu ("Escuro" em "Tema"). Entra no nome do item,
   * depois do texto e de uma vírgula: "Tema, Escuro".
   */
  detail?: string;
  disabled?: boolean;
  /** Com ele, o item é um link: `<a role="menuitem">`, ou o componente de link do `as` do `Menu`. */
  href?: string;
  /** Icone decorativo antes do texto. */
  icon?: ReactNode;
  /** Com eles, o item abre um submenu, e o `onSelect` não é chamado. */
  items?: readonly (MenuItem | MenuSection)[];
  key: string;
  label: string;
  /** Propriedades entregues ao componente de link, para o roteador que não usa `href`; com elas, o item é um link. */
  linkProps?: Record<string, unknown>;
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
  /** Componente de link da aplicação, para os itens com `href` ou `linkProps`. Sem ele, o link é um `<a>`. */
  as?: ElementType;
  children: ReactElement<Record<string, unknown>>;
  /** Abertura inicial no modo nao controlado. */
  defaultOpen?: boolean;
  /**
   * Bloco no topo do painel, fora da lista, como a conta de quem está conectado. Não é focável nem interativo: o foco
   * fica nos itens. Descreve o menu, por `aria-describedby`.
   */
  header?: ReactNode;
  items: readonly (MenuItem | MenuSection)[];
  label: string;
  /** Avisa cada abertura e fechamento pedidos pelo gatilho, pelo teclado, pela opcao ou pelo clique fora. */
  onOpenChange?: (open: boolean) => void;
  /** Controla a abertura; sem ele, o menu guarda o proprio estado. */
  open?: boolean;
  /** Lado e alinhamento do painel em relação ao gatilho, com os nomes do `Popover`. O padrão é `bottom start`. */
  placement?: PopoverPlacement;
  /** Elemento que recebe o overlay. Sem ele vale o `PortalProvider` mais próximo e, sem este, o `document.body`. */
  portalContainer?: HTMLElement | null;
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

export function Menu({
  as: linkAs = 'a',
  children,
  defaultOpen = false,
  header,
  items,
  label,
  onOpenChange,
  open: controlledOpen,
  placement = 'bottom start',
  portalContainer,
}: MenuProps) {
  const container = usePortalContainer(portalContainer);
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
      triggerRef.current?.focus({ preventScroll: true });
    }
  }

  const dono = children.props;
  const mergedTriggerRef = useMergedRefs(triggerRef, dono.ref as Ref<HTMLElement> | undefined);
  const trigger = cloneElement(children, {
    ref: mergedTriggerRef,
    'aria-haspopup': 'menu',
    'aria-expanded': open,
    onClick: encadear(dono.onClick as (evento: unknown) => void, (event: MouseEvent) => {
      if (!open) {
        abrir('first');
      } else if (!isRepeatedClick(event)) {
        fechar(true);
      }
    }),
    onKeyDown: encadear(dono.onKeyDown as (evento: KeyboardEvent) => void, (event: KeyboardEvent) => {
      if (blockRepeatedPress(event)) {
        return;
      }

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
        container &&
        createPortal(
          // O escopo proprio poe o menu na arvore de escopos do Dialog, cujo `contain` puxaria o foco de volta.
          // Sem `contain` aqui: ele disputaria o foco com o gatilho quando o menu fecha.
          <FocusScope>
            <MenuList
              anchorRef={triggerRef}
              container={container}
              header={header}
              initialFocus={openedWith}
              linkAs={linkAs}
              items={items}
              label={label}
              ownerId={ownerId}
              onClose={fechar}
              placement={placement}
            />
          </FocusScope>,
          container,
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
  /** Destino do portal dos submenus. */
  container: HTMLElement;
  /** Só no menu. */
  header?: ReactNode;
  initialFocus: InitialFocus;
  items: readonly (MenuItem | MenuSection)[];
  label: string;
  linkAs: ElementType;
  listRef?: Ref<HTMLDivElement>;
  /** Só no submenu: fecha ele e devolve o foco ao item pai. */
  onBack?: () => void;
  /** Fecha o menu inteiro, com os submenus. */
  onClose: (devolverFoco: boolean) => void;
  onPointerEnter?: () => void;
  ownerId: string;
  /** Só no menu: o submenu abre sempre à direita do item pai. */
  placement?: PopoverPlacement;
}

function MenuList({
  anchorRef,
  container,
  header,
  initialFocus,
  items: entradas,
  label,
  linkAs: Link,
  listRef,
  onBack,
  onClose,
  onPointerEnter,
  ownerId,
  placement = 'bottom start',
}: MenuListProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRefs(ref, listRef);
  // Com `header`, rola só a lista, embaixo dele; sem, o próprio painel.
  const scrollRef = useRef<HTMLDivElement>(null);
  const headerId = `${useId()}-header`;
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
  const dismiss = useOverlayClickGuard(() => onClose(false), !isSubmenu);
  const { overlayProps } = useOverlay(
    {
      isOpen: !isSubmenu,
      onClose: dismiss,
      isDismissable: true,
      shouldCloseOnBlur: false,
      shouldCloseOnInteractOutside: (elemento) =>
        !anchorRef.current?.contains(elemento) && !elemento.closest(`[data-menu-owner="${ownerId}"]`),
    },
    ref,
  );
  // Sem `onClose`: o react-aria fecharia o painel também quando a página rola. O fechamento pela rolagem é o abaixo.
  const { overlayProps: positionProps, updatePosition } = useOverlayPosition({
    targetRef: anchorRef,
    overlayRef: ref,
    placement: isSubmenu ? 'end top' : placement,
    offset: isSubmenu ? 2 : 6,
    crossOffset: isSubmenu ? -5 : 0,
    containerPadding: 8,
    isOpen: true,
    onClose: null,
  });

  const onScroll = useRef({ close: () => {}, follow: () => {} });

  useEffect(() => {
    onScroll.current = { close: isSubmenu ? onBack : () => onClose(true), follow: updatePosition };
  });

  // Rolar a página não fecha o menu: o painel a acompanha, como a lista nativa. Rolar um contêiner interno que
  // contém a âncora fecha, porque o painel ficaria solto dela, que pode até sair da área visível do contêiner. No
  // submenu, a âncora é o item pai, e rolar o menu de fora fecha só o submenu.
  useEffect(() => {
    function handleScroll(event: Event) {
      const target = event.target;
      const doc = anchorRef.current?.ownerDocument ?? document;

      if (!(target instanceof Element) || target === doc.documentElement || target === doc.body) {
        onScroll.current.follow();
        return;
      }

      // O campo rola o próprio texto para mostrar o cursor, sem a página mexer.
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        return;
      }

      if (anchorRef.current && target.contains(anchorRef.current)) {
        onScroll.current.close();
      }
    }

    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [anchorRef]);

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
      focusItem(focusedKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedKey]);

  // O foco não rola a página nem os contêineres em volta, como o `scrollIntoView` faria: só o painel rola, o bastante
  // para o item ficar à vista.
  function focusItem(key: string) {
    const node = nodes.current.get(key);
    const panel = scrollRef.current ?? ref.current;

    node?.focus({ preventScroll: true });

    if (!node || !panel) {
      return;
    }

    if (node.offsetTop < panel.scrollTop) {
      panel.scrollTop = node.offsetTop;
    } else if (node.offsetTop + node.offsetHeight > panel.scrollTop + panel.clientHeight) {
      panel.scrollTop = node.offsetTop + node.offsetHeight - panel.clientHeight;
    }
  }

  function openSubmenu(item: MenuItem, initial: InitialFocus) {
    clearTimeout(hoverTimer.current);
    returnFocusFromSubmenu();
    submenuAnchor.current = nodes.current.get(item.key) ?? null;
    setSubmenu({ key: item.key, focus: initial });
  }

  /* O foco que estava no submenu volta ao item pai, e nao se perde no `body` quando ele sai ou troca. */
  function returnFocusFromSubmenu() {
    if (submenu && submenuList.current?.contains(document.activeElement)) {
      focus(submenu.key);
      focusItem(submenu.key);
    }
  }

  function closeSubmenu() {
    clearTimeout(hoverTimer.current);
    returnFocusFromSubmenu();
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

    if (isLink(item)) {
      // O link sai da página só depois do clique: fechar agora o tiraria do documento antes, e o navegador não
      // seguiria o `href`. O roteador do `as` age no próprio clique, antes de o menu fechar.
      item.onSelect?.();
      setTimeout(() => onClose(true));
      return;
    }

    onClose(true);
    item.onSelect?.();
  }

  function renderizarItem(item: MenuItem) {
    const marcavel = item.checked !== undefined;
    const conteudo = (
      <>
        {item.icon && (
          <span aria-hidden="true" className={styles.icon}>
            {item.icon}
          </span>
        )}
        <span className={styles.label}>{item.label}</span>
        {item.detail && <span className={styles.detail}>{item.detail}</span>}
        {item.shortcut && (
          <kbd aria-hidden="true" className={styles.shortcut}>
            {item.shortcut}
          </kbd>
        )}
        {marcavel && <IconCheck className={[styles.check, item.checked && styles.checkOn].filter(Boolean).join(' ')} />}
        {item.items && <IconChevronRight aria-hidden="true" className={styles.submenuMark} />}
      </>
    );
    const comum = {
      // Os nós do texto e do valor, que são itens flex, se juntariam com um espaço só; a vírgula separa os dois na fala.
      'aria-label': item.detail ? `${item.label}, ${item.detail}` : undefined,
      'aria-keyshortcuts': item.shortcutKeys ?? (item.shortcut ? toAriaKeyShortcuts(item.shortcut) : undefined),
      className: [styles.item, item.tone === 'danger' && styles.danger].filter(Boolean).join(' '),
      onClick: (event: MouseEvent) => !isRepeatedClick(event) && acionar(item),
      onPointerEnter: () => hover(item),
      ref: (node: HTMLElement | null) => {
        if (node) {
          nodes.current.set(item.key, node);
        } else {
          nodes.current.delete(item.key);
        }
      },
      tabIndex: focusedKey === item.key ? 0 : -1,
    };

    if (isLink(item)) {
      return (
        <Link
          {...item.linkProps}
          {...comum}
          href={item.href}
          key={item.key}
          onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
            if (blockRepeatedPress(event)) {
              return;
            }
            // O link nativo só responde ao Enter; no menu, o Espaço também aciona o item.
            if (event.key === ' ') {
              event.preventDefault();
              event.currentTarget.click();
            }
          }}
          role="menuitem"
        >
          {conteudo}
        </Link>
      );
    }

    return (
      <button
        {...comum}
        aria-checked={marcavel ? item.checked : undefined}
        aria-expanded={item.items ? submenu?.key === item.key : undefined}
        aria-haspopup={item.items ? 'menu' : undefined}
        disabled={item.disabled}
        key={item.key}
        onKeyDown={blockRepeatedPress}
        role={marcavel ? 'menuitemcheckbox' : 'menuitem'}
        type="button"
      >
        {conteudo}
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

  // O `onKeyDown` do `useOverlay` vai para a lista, junto do da própria lista; o painel recebe o resto.
  const { onKeyDown: overlayKeyDown, ...panelProps } = overlayProps;
  const listProps = {
    'aria-label': label,
    onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
      // O submenu fica no menu pela arvore do React: a tecla dele nao sobe ao menu de fora.
      if (isSubmenu) {
        event.stopPropagation();
      }
      // Espalhar overlayProps antes nao basta: este onKeyDown o substituiria.
      handleKeyDown(event);
      // O Esc já fechou acima, devolvendo o foco; o do `useOverlay` fecharia de novo e avisaria o produto duas vezes.
      // A tecla para aqui, como pararia nele: não chega à camada em volta, como um Dialog, pela árvore do React.
      if (event.key === 'Escape') {
        event.stopPropagation();
      } else {
        overlayKeyDown?.(event);
      }
    },
    role: 'menu',
  };
  const lista = entradas.map((entrada, indice) => {
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
  });
  const submenuPortal =
    openItem?.items &&
    createPortal(
      <FocusScope key={openItem.key}>
        <MenuList
          anchorRef={submenuAnchor}
          container={container}
          initialFocus={submenu?.focus ?? null}
          items={openItem.items}
          label={openItem.label}
          linkAs={Link}
          listRef={submenuList}
          ownerId={ownerId}
          onBack={closeSubmenu}
          onClose={onClose}
          onPointerEnter={() => clearTimeout(hoverTimer.current)}
        />
      </FocusScope>,
      container,
    );
  const painel = {
    ...panelProps,
    'data-menu-owner': ownerId,
    'data-react-aria-top-layer': 'true',
    onPointerEnter,
    ref: mergedRef,
    style: { ...positionProps.style, maxHeight: alturaMaxima, zIndex: 'var(--pl-z-popover)' },
  };

  // Com o cabeçalho, ele fica fora do `role="menu"`, que só contém itens, e o descreve.
  if (header) {
    return (
      <div {...painel} className={[styles.menu, styles.withHeader].join(' ')}>
        <div className={styles.header} id={headerId}>
          {header}
        </div>
        <div {...listProps} aria-describedby={headerId} className={[styles.list, thinScrollbar].join(' ')} ref={scrollRef}>
          {lista}
        </div>
        {submenuPortal}
      </div>
    );
  }

  return (
    <div {...painel} {...listProps} className={[styles.menu, thinScrollbar].join(' ')}>
      {lista}
      {submenuPortal}
    </div>
  );
}

/** O item com `href` ou `linkProps` é link, desde que não abra submenu, não seja de marcar nem esteja desabilitado. */
function isLink(item: MenuItem) {
  return (item.href !== undefined || item.linkProps !== undefined) && !item.items && item.checked === undefined && !item.disabled;
}
