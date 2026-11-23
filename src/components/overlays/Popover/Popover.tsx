import { createContext, useContext, useEffect, useRef, useState, type ComponentPropsWithRef, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { FocusScope } from '@react-aria/focus';
import { useOverlay, useOverlayPosition } from '@react-aria/overlays';
import { useMergedRefs } from '../../../hooks/useMergedRefs';
import { useOverlayClickGuard } from '../../../hooks/useOverlayClickGuard';
import { mergeHandlers } from '../mergeHandlers';
import { usePortalContainer } from '../Portal/PortalContext';
import styles from './Popover.module.css';
import { thinScrollbar } from '../../../utils/scrollbar/scrollbar';

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
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  placement?: PopoverPlacement;
  /** Elemento que recebe o overlay. Sem ele vale o `PortalProvider` mais próximo e, sem este, o `document.body`. */
  portalContainer?: HTMLElement | null;
  triggerRef: RefObject<HTMLElement | null>;
}

export function Popover({ defaultOpen = false, onOpenChange, open, portalContainer, ...props }: PopoverProps) {
  const container = usePortalContainer(portalContainer);
  const [internalOpen, setInternalOpen] = useState(defaultOpen);

  function close() {
    if (open === undefined) {
      setInternalOpen(false);
    }
    onOpenChange?.(false);
  }

  // No servidor nao ha `document` para o portal; o Popover nasce na hidratacao.
  if (!(open ?? internalOpen) || !container) {
    return null;
  }

  return createPortal(<PopoverContent {...props} onClose={close} />, container);
}

type PanelRef = RefObject<HTMLDivElement | null>;

/**
 * Painéis abertos, com o painel de onde cada um abriu: com o foco fora de todos, o Esc fecha só o de cima, o mais
 * recente entre os que não têm outro aberto de dentro deles. O pai conta porque, abertos juntos, o efeito do filho
 * roda antes do efeito do pai.
 */
const openPanels: { panel: PanelRef; parent: PanelRef | null }[] = [];
const ParentPanelContext = createContext<PanelRef | null>(null);

function isTopPanel(panel: PanelRef) {
  const leaves = openPanels.filter((entry) => !openPanels.some((other) => other.parent === entry.panel));
  return leaves.at(-1)?.panel === panel;
}

type PopoverContentProps = Omit<PopoverProps, 'defaultOpen' | 'onOpenChange' | 'open'> & { onClose: () => void };

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
  const parent = useContext(ParentPanelContext);

  const dismiss = useOverlayClickGuard(onClose);
  const { overlayProps } = useOverlay(
    {
      isOpen: true,
      onClose: dismiss,
      isDismissable: true,
      shouldCloseOnBlur: false,
      // O gatilho nao conta como "fora": o clique dele e do consumidor, que decide se alterna.
      shouldCloseOnInteractOutside: (elemento) => !triggerRef.current?.contains(elemento),
    },
    ref,
  );

  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  });

  // Não modal, o foco pode sair do painel aberto, e o Esc dele continua fechando. Com o foco dentro, quem fecha é o
  // `useOverlay`; aqui, só com o foco fora, e sem tirá-lo de onde está. Na captura do `body`, depois da do `document`:
  // a dica do `Tooltip`, que ouve no `document`, fecha antes e marca o evento como tratado.
  useEffect(() => {
    const body = ref.current?.ownerDocument.body ?? document.body;
    const entry = { panel: ref, parent };
    openPanels.push(entry);

    function closeOnEscape(event: globalThis.KeyboardEvent) {
      if (event.key !== 'Escape' || event.defaultPrevented || !isTopPanel(ref)) {
        return;
      }

      const target = event.target instanceof Element ? event.target : null;
      const layer = target?.closest('[data-react-aria-top-layer]');
      // Cede ao próprio painel e à camada de cima aninhada, como um menu aberto de dentro dele, que tratam o Esc.
      if (ref.current?.contains(target) || (layer && !openPanels.some((other) => other.panel.current === layer))) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      closeRef.current();
    }

    body.addEventListener('keydown', closeOnEscape, true);
    return () => {
      body.removeEventListener('keydown', closeOnEscape, true);
      openPanels.splice(openPanels.indexOf(entry), 1);
    };
  }, [parent]);

  const { overlayProps: positionProps } = useOverlayPosition({
    targetRef: triggerRef,
    overlayRef: ref,
    placement,
    offset,
    isOpen: true,
    onClose,
  });

  // Sem `contain`: o Popover nao bloqueia a pagina. O `restoreFocus` leva o Tab da borda ao elemento seguinte
  // ao gatilho, e nao ao fim do `body`, onde o painel vive.
  return (
    <FocusScope restoreFocus autoFocus>
      <div
        {...props}
        {...mergeHandlers(props, overlayProps)}
        ref={mergedRef}
        className={[styles.popover, thinScrollbar, className].filter(Boolean).join(' ')}
        // Camada de cima: o `ariaHideOutside` do Dialog ignora quem a declara.
        data-react-aria-top-layer="true"
        style={{ ...style, ...positionProps.style }}
        role="dialog"
      >
        <ParentPanelContext value={ref}>{children}</ParentPanelContext>
      </div>
    </FocusScope>
  );
}
