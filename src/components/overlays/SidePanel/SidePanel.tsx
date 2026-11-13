import { useEffect, useId, useLayoutEffect, useRef, type ComponentPropsWithRef, type KeyboardEvent, type ReactNode } from 'react';
import { useNarrowViewport } from '../../../hooks/useNarrowViewport';
import { useOpenState } from '../../../hooks/useOpenState';
import { useScrollFocusable } from '../../../hooks/useScrollFocusable';
import { ButtonIcon } from '../../actions/ButtonIcon';
import { IconClose } from '../../icons';
import { Drawer, type DrawerProps } from '../Drawer';
import styles from './SidePanel.module.css';
import { thinScrollbar } from '../../../utils/scrollbar/scrollbar';

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
  const scroll = useScrollFocusable();
  const titleId = useId();
  const wasOpen = useRef(open);
  const previousFocus = useRef<HTMLElement | null>(null);

  // Não modal: o foco vai ao painel ao abrir. Ao fechar, se ainda está dentro dele, volta a quem abriu, venha o
  // fechamento do X, do Escape ou do produto. No layout, antes de o navegador soltar o foco do elemento que ficou inerte.
  useLayoutEffect(() => {
    if (open && !wasOpen.current) {
      previousFocus.current = document.activeElement as HTMLElement | null;
      panelRef.current?.focus();
    }
    if (!open && wasOpen.current && panelRef.current?.contains(document.activeElement) && previousFocus.current?.isConnected) {
      previousFocus.current.focus();
    }
    wasOpen.current = open;
  }, [open]);

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    onKeyDown?.(event);

    if (event.key === 'Escape' && open && !event.defaultPrevented) {
      event.preventDefault();
      setOpen(false);
    }
  }

  if (narrow) {
    return (
      <Drawer
        {...(props as Omit<DrawerProps, 'aria-label' | 'footer' | 'title'>)}
        className={className}
        footer={footer}
        onKeyDown={onKeyDown as ComponentPropsWithRef<'div'>['onKeyDown']}
        onOpenChange={setOpen}
        open={open}
        ref={ref as ComponentPropsWithRef<'div'>['ref']}
        side={side}
        size={size}
        title={title}
      >
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
          <ButtonIcon icon={<IconClose />} label="Fechar" onClick={() => setOpen(false)} size="sm" variant="ghost" />
        </header>
        <div
          aria-label={scroll.focusable ? `Conteúdo de ${title}` : undefined}
          className={[styles.body, thinScrollbar].join(' ')}
          ref={scroll.ref}
          role={scroll.focusable ? 'region' : undefined}
          tabIndex={scroll.focusable ? 0 : undefined}
        >
          {children}
        </div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </aside>
  );
}
