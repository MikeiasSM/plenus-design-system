import { useEffect, useId, useRef, type ComponentPropsWithRef, type KeyboardEvent, type ReactNode } from 'react';
import { useNarrowViewport } from '../../../hooks/useNarrowViewport';
import { useOpenState } from '../../../hooks/useOpenState';
import { ButtonIcon } from '../../actions/ButtonIcon';
import { IconClose } from '../../icons';
import { Drawer } from '../Drawer';
import styles from './SidePanel.module.css';

export type SidePanelSide = 'left' | 'right';
export type SidePanelSize = 'sm' | 'md' | 'lg';

export interface SidePanelProps extends Omit<ComponentPropsWithRef<'aside'>, 'title'> {
  children?: ReactNode;
  /** Aberto no início, no modo não controlado. */
  defaultOpen?: boolean;
  /** Rodapé fixo, com as ações. */
  footer?: ReactNode;
  onOpenChange?: (open: boolean) => void;
  /** Aberto, no modo controlado. */
  open?: boolean;
  /** Lado da página em que fica. O painel ocupa o lugar e a página cede a largura. */
  side?: SidePanelSide;
  /** Largura de 240, 272 ou 360px. */
  size?: SidePanelSize;
  /** Título visível e nome acessível. */
  title: string;
}

/**
 * Painel não modal ao lado do conteúdo. Empurra a página, que continua usável; sem foco preso nem fundo inerte.
 * Vive numa linha flex, ao lado da página. Em largura estreita, passa a se comportar como o `Drawer`.
 */
export function SidePanel({
  children,
  className,
  defaultOpen,
  footer,
  onKeyDown,
  onOpenChange,
  open: controlledOpen,
  ref,
  side = 'right',
  size = 'md',
  title,
  ...props
}: SidePanelProps) {
  const narrow = useNarrowViewport();
  const [open, setOpen] = useOpenState({ defaultOpen, onOpenChange, open: controlledOpen });
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const wasOpen = useRef(open);
  const previousFocus = useRef<HTMLElement | null>(null);
  const returnFocus = useRef(false);

  // Não modal: o foco vai ao painel ao abrir e volta a quem abriu quando o pedido de fechar veio de dentro dele.
  useEffect(() => {
    if (open && !wasOpen.current) {
      previousFocus.current = document.activeElement as HTMLElement | null;
      panelRef.current?.focus();
    }
    if (!open && wasOpen.current && returnFocus.current) {
      previousFocus.current?.focus();
    }
    returnFocus.current = false;
    wasOpen.current = open;
  }, [open]);

  function requestClose() {
    returnFocus.current = Boolean(panelRef.current?.contains(document.activeElement));
    setOpen(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    onKeyDown?.(event);

    if (event.key === 'Escape' && open && !event.defaultPrevented) {
      requestClose();
    }
  }

  if (narrow) {
    return (
      <Drawer footer={footer} onOpenChange={setOpen} open={open} side={side} size={size} title={title}>
        {children}
      </Drawer>
    );
  }

  return (
    <aside
      {...props}
      aria-labelledby={titleId}
      className={[styles.sidePanel, styles[size], styles[side], className].filter(Boolean).join(' ')}
      data-open={open}
      inert={!open}
      onKeyDown={handleKeyDown}
      ref={ref}
    >
      <div className={styles.inner} ref={panelRef} tabIndex={-1}>
        <header className={styles.header}>
          <h2 className={styles.title} id={titleId}>{title}</h2>
          <ButtonIcon icon={<IconClose />} label="Fechar" onClick={requestClose} size="sm" variant="ghost" />
        </header>
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </aside>
  );
}
