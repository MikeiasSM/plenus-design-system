import {
  cloneElement,
  useCallback,
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
} from 'react';
import { createPortal } from 'react-dom';
import { useOverlayPosition } from '@react-aria/overlays';
import { useMergedRefs } from '../../../hooks/useMergedRefs';
import styles from './Tooltip.module.css';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  children: ReactElement<Record<string, unknown>>;
  content: ReactNode;
  delay?: number;
  placement?: TooltipPlacement;
}

/** Tempo para o ponteiro atravessar a folga entre o gatilho e o balao. */
const TRAVESSIA = 120;

function chain<E>(own: ((event: E) => void) | undefined, next: (event: E) => void) {
  return (event: E) => {
    own?.(event);
    next(event);
  };
}

export function Tooltip({ children, content, delay = 500, placement = 'top' }: TooltipProps) {
  const triggerRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const id = `tooltip-${useId()}`;

  const hide = useCallback(() => {
    clearTimeout(timer.current);
    setOpen(false);
  }, []);

  // O balao aceita o ponteiro (WCAG 1.4.13): sair do gatilho espera a travessia ate ele antes de fechar.
  const hideSoon = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), TRAVESSIA);
  }, []);

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
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  placement: TooltipPlacement;
  triggerRef: React.RefObject<HTMLElement | null>;
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
