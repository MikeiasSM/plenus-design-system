import { useRef, useState, type ComponentPropsWithRef, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { FocusScope } from '@react-aria/focus';
import { useOverlay, useOverlayPosition } from '@react-aria/overlays';
import { useMergedRefs } from '../../../hooks/useMergedRefs';
import styles from './Popover.module.css';

export type PopoverPlacement =
  | 'top'
  | 'top start'
  | 'top end'
  | 'bottom'
  | 'bottom start'
  | 'bottom end'
  | 'left'
  | 'right';

/** As propriedades nativas vao ao elemento do painel; o `className` soma ao do sistema. */
export interface PopoverProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  children: ReactNode;
  /** Aberto no inicio, no modo nao controlado. */
  defaultOpen?: boolean;
  offset?: number;
  /** @deprecated Use `onOpenChange`. */
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  placement?: PopoverPlacement;
  triggerRef: RefObject<HTMLElement | null>;
}

export function Popover({ defaultOpen = false, onClose, onOpenChange, open, ...props }: PopoverProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);

  function close() {
    if (open === undefined) {
      setInternalOpen(false);
    }
    onOpenChange?.(false);
    onClose?.();
  }

  // No servidor nao ha `document` para o portal; o Popover nasce na hidratacao.
  if (!(open ?? internalOpen) || typeof document === 'undefined') {
    return null;
  }

  return createPortal(<PopoverContent {...props} onClose={close} />, document.body);
}

type PopoverContentProps = Omit<PopoverProps, 'defaultOpen' | 'onClose' | 'onOpenChange' | 'open'> & { onClose: () => void };

function PopoverContent({
  children,
  className,
  offset = 8,
  onClose,
  placement = 'bottom start',
  ref: refDoConsumidor,
  style,
  triggerRef,
  ...props
}: PopoverContentProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRefs(ref, refDoConsumidor);

  const { overlayProps } = useOverlay(
    {
      isOpen: true,
      onClose,
      isDismissable: true,
      shouldCloseOnBlur: false,
      // O gatilho nao conta como "fora": o clique dele e do consumidor, que decide se alterna.
      shouldCloseOnInteractOutside: (elemento) => !triggerRef.current?.contains(elemento),
    },
    ref,
  );

  const { overlayProps: positionProps } = useOverlayPosition({
    targetRef: triggerRef,
    overlayRef: ref,
    placement,
    offset,
    isOpen: true,
  });

  // Sem `contain`: o Popover nao bloqueia a pagina. O `restoreFocus` leva o Tab da borda ao elemento seguinte
  // ao gatilho, e nao ao fim do `body`, onde o painel vive.
  return (
    <FocusScope restoreFocus autoFocus>
      <div
        {...props}
        {...overlayProps}
        ref={mergedRef}
        className={[styles.popover, className].filter(Boolean).join(' ')}
        // Camada de cima: o `ariaHideOutside` do Dialog ignora quem a declara.
        data-react-aria-top-layer="true"
        style={{ ...style, ...positionProps.style }}
        role="dialog"
      >
        {children}
      </div>
    </FocusScope>
  );
}
