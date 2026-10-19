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
import { useOverlayPosition } from '@react-aria/overlays';
import { useMergedRefs } from '../../../hooks/useMergedRefs';
import styles from './Tooltip.module.css';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

interface TooltipCommonProps {
  content: ReactNode;
  /** Avisa cada pedido de abrir ou fechar: ponteiro, foco, blur e Escape. */
  onOpenChange?: (open: boolean) => void;
  placement?: TooltipPlacement;
}

interface TooltipOnChildProps extends TooltipCommonProps {
  anchorRef?: never;
  /** O gatilho: o Tooltip o clona, soma os manipuladores e liga a descrição por `aria-describedby`. */
  children: ReactElement<Record<string, unknown>>;
  delay?: number;
  id?: never;
  /** Controla a abertura; sem ele, o Tooltip guarda o próprio estado. */
  open?: boolean;
}

interface TooltipOnAnchorProps extends TooltipCommonProps {
  /** Âncora que não é filho do Tooltip, como um elemento que precisa da própria referência e não pode ser clonado. */
  anchorRef: RefObject<HTMLElement | null>;
  children?: never;
  delay?: never;
  /** Id do balão. O produto o põe no `aria-describedby` da âncora enquanto `open`. */
  id: string;
  /** Com âncora externa, a abertura é sempre do produto. */
  open: boolean;
}

export type TooltipProps = TooltipOnChildProps | TooltipOnAnchorProps;

/** Tempo para o ponteiro atravessar a folga entre o gatilho e o balao. */
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
  delay = 500,
  onOpenChange,
  open: controlledOpen,
  placement = 'top',
}: TooltipOnChildProps) {
  const triggerRef = useRef<HTMLElement>(null);
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const id = `tooltip-${useId()}`;

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
    onFocus: chain(props.onFocus as (e: FocusEvent) => void, () => setOpen(true)),
    onBlur: chain(props.onBlur as (e: FocusEvent) => void, hide),
    onKeyDown: chain(props.onKeyDown as (e: KeyboardEvent) => void, (event) => {
      if (event.key === 'Escape') {
        hide();
      }
    }),
  });

  return (
    <>
      {trigger}
      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <TooltipBubble
            content={content}
            id={id}
            onMouseEnter={() => clearTimeout(timer.current)}
            onMouseLeave={hide}
            placement={placement}
            triggerRef={triggerRef}
          />,
          document.body,
        )}
    </>
  );
}

function TooltipOnAnchor({ anchorRef, content, id, onOpenChange, open, placement = 'top' }: TooltipOnAnchorProps) {
  // O foco pode estar fora da âncora, como no editor que a contém; o Escape vale em qualquer ponto da página.
  useEffect(() => {
    if (!open) {
      return;
    }

    function requestCloseOnEscape(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') {
        onOpenChange?.(false);
      }
    }

    document.addEventListener('keydown', requestCloseOnEscape);
    return () => document.removeEventListener('keydown', requestCloseOnEscape);
  }, [onOpenChange, open]);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(<TooltipBubble content={content} id={id} placement={placement} triggerRef={anchorRef} />, document.body);
}

function TooltipBubble({
  content,
  id,
  onMouseEnter,
  onMouseLeave,
  placement,
  triggerRef,
}: {
  content: ReactNode;
  id: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  placement: TooltipPlacement;
  triggerRef: RefObject<HTMLElement | null>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { overlayProps } = useOverlayPosition({
    targetRef: triggerRef,
    overlayRef: ref,
    placement,
    offset: 6,
    isOpen: true,
  });

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
