import {
  cloneElement,
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { useFocusRing } from '@react-aria/focus';
import { useOverlayPosition } from '@react-aria/overlays';
import { useMergedRefs } from '../../../hooks/useMergedRefs';
import { usePortalContainer } from '../Portal/PortalContext';
import styles from './Tooltip.module.css';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

interface TooltipCommonProps {
  content: ReactNode;
  /** Avisa cada pedido de abrir ou fechar: ponteiro, foco, blur e Escape. */
  onOpenChange?: (open: boolean) => void;
  placement?: TooltipPlacement;
  /** Elemento que recebe o overlay. Sem ele vale o `PortalProvider` mais próximo e, sem este, o `document.body`. */
  portalContainer?: HTMLElement | null;
}

interface TooltipOnChildProps extends TooltipCommonProps {
  anchorRef?: never;
  /** O gatilho: o Tooltip o clona, soma os manipuladores e liga a descrição por `aria-describedby`. */
  children: ReactElement<Record<string, unknown>>;
  /** Aberto no inicio, no modo não controlado. */
  defaultOpen?: boolean;
  delay?: number;
  id?: never;
  /** Controla a abertura; sem ele, o Tooltip guarda o próprio estado. */
  open?: boolean;
}

interface TooltipOnAnchorProps extends TooltipCommonProps {
  /** Âncora que não é filho do Tooltip, como um elemento que precisa da própria referência e não pode ser clonado. */
  anchorRef: RefObject<HTMLElement | null>;
  children?: never;
  defaultOpen?: never;
  delay?: never;
  /** Id do balão. O produto o põe no `aria-describedby` da âncora enquanto `open`. */
  id: string;
  /** Com âncora externa, a abertura é sempre do produto. */
  open: boolean;
}

export type TooltipProps = TooltipOnChildProps | TooltipOnAnchorProps;

/** Tempo para o ponteiro atravessar a folga entre o gatilho e o balão. */
const TRAVESSIA = 120;

function chain<E>(own: ((event: E) => void) | undefined, next: (event: E) => void) {
  return (event: E) => {
    own?.(event);
    next(event);
  };
}

export function Tooltip(props: TooltipProps) {
  return props.anchorRef ? <TooltipOnAnchor {...props} /> : <TooltipOnChild {...props} />;
}

function TooltipOnChild({
  children,
  content,
  defaultOpen = false,
  delay = 500,
  onOpenChange,
  open: controlledOpen,
  placement = 'top',
  portalContainer,
}: TooltipOnChildProps) {
  const container = usePortalContainer(portalContainer);
  const triggerRef = useRef<HTMLElement>(null);
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = controlledOpen ?? internalOpen;
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const id = `tooltip-${useId()}`;
  const { focusProps, isFocusVisible } = useFocusRing({ within: true });

  function setOpen(next: boolean) {
    setInternalOpen(next);
    onOpenChange?.(next);
  }

  function hide() {
    clearTimeout(timer.current);
    setOpen(false);
  }

  // O balão aceita o ponteiro (WCAG 1.4.13): sair do gatilho espera a travessia até ele antes de fechar.
  function hideSoon() {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), TRAVESSIA);
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  // Só o foco por teclado abre a dica: clique e `focus()` programático não são pedidos de ajuda.
  useEffect(() => {
    if (isFocusVisible) {
      setOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocusVisible]);

  const props = children.props;
  const mergedTriggerRef = useMergedRefs(triggerRef, props.ref as Ref<HTMLElement> | undefined);
  const trigger = cloneElement(children, {
    ref: mergedTriggerRef,
    'aria-describedby': open ? [props['aria-describedby'], id].filter(Boolean).join(' ') : props['aria-describedby'],
    onMouseEnter: chain(props.onMouseEnter as (e: MouseEvent) => void, () => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setOpen(true), delay);
    }),
    onMouseLeave: chain(props.onMouseLeave as (e: MouseEvent) => void, hideSoon),
    onFocus: chain(props.onFocus as (e: FocusEvent<HTMLElement>) => void, focusProps.onFocus!),
    onBlur: chain(props.onBlur as (e: FocusEvent<HTMLElement>) => void, (event) => {
      focusProps.onBlur!(event);
      hide();
    }),
    onKeyDown: chain(props.onKeyDown as (e: KeyboardEvent) => void, (event) => {
      // Só com o balão aberto: o Escape fecha a dica e é consumido, para o painel ou o diálogo em volta ficar aberto.
      if (event.key === 'Escape' && open && !event.defaultPrevented) {
        hide();
        event.preventDefault();
      }
    }),
  });

  return (
    <>
      {trigger}
      {open &&
        container &&
        createPortal(
          <TooltipBubble
            content={content}
            id={id}
            onClose={hide}
            onMouseEnter={() => clearTimeout(timer.current)}
            onMouseLeave={hide}
            placement={placement}
            triggerRef={triggerRef}
          />,
          container,
        )}
    </>
  );
}

function TooltipOnAnchor({
  anchorRef,
  content,
  id,
  onOpenChange,
  open,
  placement = 'top',
  portalContainer,
}: TooltipOnAnchorProps) {
  const container = usePortalContainer(portalContainer);

  // O foco pode estar fora da âncora, como no editor que a contém; o Escape vale em qualquer ponto da página.
  // Na captura, para fechar a dica antes de uma camada em volta, como o `SidePanel`, e marcar o evento como tratado.
  useEffect(() => {
    if (!open) {
      return;
    }

    function requestCloseOnEscape(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape' && !event.defaultPrevented) {
        event.preventDefault();
        onOpenChange?.(false);
      }
    }

    document.addEventListener('keydown', requestCloseOnEscape, true);
    return () => document.removeEventListener('keydown', requestCloseOnEscape, true);
  }, [onOpenChange, open]);

  if (!open || !container) {
    return null;
  }

  return createPortal(
    <TooltipBubble
      content={content}
      id={id}
      onClose={() => onOpenChange?.(false)}
      placement={placement}
      triggerRef={anchorRef}
    />,
    container,
  );
}

function TooltipBubble({
  content,
  id,
  onClose,
  onMouseEnter,
  onMouseLeave,
  placement,
  triggerRef,
}: {
  content: ReactNode;
  id: string;
  onClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  placement: TooltipPlacement;
  triggerRef: RefObject<HTMLElement | null>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { overlayProps, updatePosition } = useOverlayPosition({
    targetRef: triggerRef,
    overlayRef: ref,
    placement,
    offset: 6,
    isOpen: true,
    onClose,
  });

  // A âncora anda numa transição ou animação sem scroll nem resize avisarem, como na barra que o submenu empurra.
  // O balão a segue quadro a quadro enquanto ela se move, e para quando ela para.
  useEffect(() => {
    let frame = 0;
    let last: DOMRect | undefined;

    function follow() {
      const rect = triggerRef.current?.getBoundingClientRect();
      const moved = rect !== undefined && (rect.left !== last?.left || rect.top !== last?.top);
      last = rect;
      if (moved) {
        updatePosition();
      }
      frame = moved ? requestAnimationFrame(follow) : 0;
    }

    function watch() {
      last = undefined;
      if (!frame) {
        frame = requestAnimationFrame(follow);
      }
    }

    watch();
    document.addEventListener('transitionstart', watch);
    document.addEventListener('animationstart', watch);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('transitionstart', watch);
      document.removeEventListener('animationstart', watch);
    };
  }, [triggerRef, updatePosition]);

  return (
    <div
      ref={ref}
      className={styles.tooltip}
      data-react-aria-top-layer="true"
      id={id}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="tooltip"
      style={overlayProps.style}
    >
      {content}
    </div>
  );
}
