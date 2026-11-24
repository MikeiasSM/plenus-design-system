import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { FocusScope } from '@react-aria/focus';
import { ariaHideOutside, useOverlay, usePreventScroll } from '@react-aria/overlays';
import { useMergedRefs } from '../../../hooks/useMergedRefs';
import { useScrollFocusable } from '../../../hooks/useScrollFocusable';
import { useOverlayClickGuard } from '../../../hooks/useOverlayClickGuard';
import { IconClose, IconQuestionCircle } from '../../icons';
import { mergeHandlers } from '../mergeHandlers';
import { usePortalContainer } from '../Portal/PortalContext';
import { Tooltip } from '../Tooltip';
import type { DialogBaseProps, DialogRole } from './Dialog';
import { blockRepeatedPress } from '../../../utils/press/press';
import styles from './Dialog.module.css';
import { thinScrollbar } from '../../../utils/scrollbar/scrollbar';

export interface DialogFrameProps extends DialogBaseProps {
  'aria-label'?: string;
  description?: ReactNode;
  flush?: boolean;
  /** Classe a mais no rodapé, para a superfície que estende o fundo dele, como a área segura do `Drawer` na base. */
  footerClassName?: string;
  help?: string;
  icon?: ReactNode;
  role?: DialogRole;
  surfaceClassName: string;
  title?: ReactNode;
  underlayClassName: string;
}

/** Mecanica modal do `Dialog` e do `Drawer`: portal, foco preso, rolagem travada, cabecalho, corpo e rodape. Interna. */
export function DialogFrame({
  defaultOpen = false,
  onBeforeClose,
  onOpenChange,
  open,
  portalContainer,
  ...props
}: DialogFrameProps) {
  const container = usePortalContainer(portalContainer);
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const awaitingPermission = useRef(false);
  const openCycle = useRef(0);
  const isOpen = open ?? internalOpen;

  useEffect(() => {
    openCycle.current += 1;
    awaitingPermission.current = false;
  }, [isOpen]);

  function close() {
    if (open === undefined) {
      setInternalOpen(false);
    }
    onOpenChange?.(false);
  }

  // Enquanto a promessa de `onBeforeClose` nao resolve, novos pedidos de fechamento nao abrem outra consulta.
  async function requestClose() {
    if (awaitingPermission.current) {
      return;
    }

    const permission = onBeforeClose?.() ?? true;

    if (typeof permission === 'boolean') {
      if (permission) {
        close();
      }
      return;
    }

    const cycle = openCycle.current;
    awaitingPermission.current = true;

    try {
      if ((await permission) && cycle === openCycle.current) {
        close();
      }
    } catch (erro) {
      console.error(erro);
    } finally {
      if (cycle === openCycle.current) {
        awaitingPermission.current = false;
      }
    }
  }

  // No servidor nao ha `document` para o portal; o modal nasce na hidratacao.
  if (!isOpen || !container) {
    return null;
  }

  return createPortal(<DialogFrameContent {...props} onClose={requestClose} />, container);
}

type DialogFrameContentProps = Omit<DialogFrameProps, 'defaultOpen' | 'onOpenChange' | 'open'> & {
  onClose: () => void;
};

function DialogFrameContent({
  children,
  className,
  description,
  dismissable = true,
  flush,
  footer,
  footerClassName,
  help,
  icon,
  onClose,
  ref: refDoConsumidor,
  role = 'dialog',
  surfaceClassName,
  title,
  underlayClassName,
  ...props
}: DialogFrameContentProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRefs(ref, refDoConsumidor);
  const generatedId = useId();
  const titleId = `${generatedId}-title`;
  const descriptionId = `${generatedId}-description`;
  const bodyLabelId = `${generatedId}-body-label`;
  const scroll = useScrollFocusable();
  const helpRef = useRef<HTMLSpanElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const hasTitle = title !== undefined && title !== null && title !== false && title !== '';

  const dismiss = useOverlayClickGuard(onClose);
  const { overlayProps, underlayProps } = useOverlay(
    {
      isOpen: true,
      onClose: dismiss,
      isDismissable: dismissable,
      isKeyboardDismissDisabled: !dismissable,
    },
    ref,
  );

  usePreventScroll();

  useEffect(() => (ref.current ? ariaHideOutside([ref.current]) : undefined), []);

  // O ícone de ajuda vem antes do botão Fechar e seria o primeiro focável: o foco inicial continua no Fechar, como sem
  // ele. No layout, antes do `autoFocus` do `FocusScope`, que roda depois e respeita o foco já dentro do diálogo; o
  // campo com `autoFocus`, focado antes pelo React, continua com o foco.
  useLayoutEffect(() => {
    if (helpRef.current && closeRef.current && !ref.current?.contains(document.activeElement)) {
      closeRef.current.focus();
    }
  }, []);

  return (
    <div {...underlayProps} className={underlayClassName}>
      <FocusScope contain restoreFocus autoFocus>
        <div
          {...props}
          {...mergeHandlers(props, overlayProps)}
          ref={mergedRef}
          className={[surfaceClassName, className].filter(Boolean).join(' ')}
          role={role}
          aria-modal="true"
          aria-labelledby={hasTitle ? titleId : undefined}
          aria-describedby={[description && descriptionId, props['aria-describedby']].filter(Boolean).join(' ') || undefined}
        >
          {hasTitle && (
            <header className={[styles.header, children && styles.headerDivided].filter(Boolean).join(' ')}>
              {icon && (
                <span aria-hidden="true" className={styles.icon}>
                  {icon}
                </span>
              )}
              <div className={styles.heading}>
                {help ? (
                  // A ajuda fica fora do `h2`: o título é o nome do diálogo, e ela é a descrição do próprio ícone.
                  <div className={styles.titleRow}>
                    <h2 className={styles.title} id={titleId}>{title}</h2>
                    <Tooltip content={help} placement="bottom">
                      <span aria-label={help} className={styles.help} ref={helpRef} role="img" tabIndex={0}>
                        <IconQuestionCircle size={16} />
                      </span>
                    </Tooltip>
                  </div>
                ) : (
                  <h2 className={styles.title} id={titleId}>{title}</h2>
                )}
                {description && <p className={styles.description} id={descriptionId}>{description}</p>}
              </div>
              {dismissable && (
                <button className={styles.close} ref={closeRef} type="button" aria-label="Fechar" onClick={onClose} onKeyDown={blockRepeatedPress}>
                  <IconClose size={20} />
                </button>
              )}
            </header>
          )}
          {children && (
            <div
              // Com título, o nome vem do próprio título, que pode ser um nó; sem ele, do `aria-label` do diálogo.
              aria-label={scroll.focusable && !hasTitle ? `Conteúdo${props['aria-label'] ? ` de ${props['aria-label']}` : ''}` : undefined}
              aria-labelledby={scroll.focusable && hasTitle ? `${bodyLabelId} ${titleId}` : undefined}
              className={[styles.body, flush && styles.bodyFlush, thinScrollbar].filter(Boolean).join(' ')}
              ref={scroll.ref}
              role={scroll.focusable ? 'region' : undefined}
              tabIndex={scroll.focusable ? 0 : undefined}
            >
              {scroll.focusable && hasTitle && (
                <span hidden id={bodyLabelId}>
                  Conteúdo de
                </span>
              )}
              {children}
            </div>
          )}
          {footer && <div className={[styles.footer, footerClassName].filter(Boolean).join(' ')}>{footer}</div>}
        </div>
      </FocusScope>
    </div>
  );
}
