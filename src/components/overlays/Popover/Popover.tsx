import { useRef, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { FocusScope } from '@react-aria/focus';
import { useOverlay, useOverlayPosition } from '@react-aria/overlays';
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

export interface PopoverProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  children: ReactNode;
  offset?: number;
  onClose: () => void;
  open: boolean;
  placement?: PopoverPlacement;
  triggerRef: RefObject<HTMLElement | null>;
}

export function Popover({ open, ...props }: PopoverProps) {
  // No servidor nao ha `document` para o portal; o Popover nasce na hidratacao.
  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(<PopoverContent {...props} />, document.body);
}

function PopoverContent({
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  children,
  offset = 8,
  onClose,
  placement = 'bottom start',
  triggerRef,
}: Omit<PopoverProps, 'open'>) {
  const ref = useRef<HTMLDivElement>(null);

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
        {...overlayProps}
        ref={ref}
        className={styles.popover}
        // Camada de cima: o `ariaHideOutside` do Dialog ignora quem a declara.
        data-react-aria-top-layer="true"
        style={positionProps.style}
        role="dialog"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
      >
        {children}
      </div>
    </FocusScope>
  );
}
