import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { FocusScope } from '@react-aria/focus';
import { ariaHideOutside, useOverlay, usePreventScroll } from '@react-aria/overlays';
import { useMergedRefs } from '../../../hooks/useMergedRefs';
import { useScrollFocusable } from '../../../hooks/useScrollFocusable';
import { useOverlayClickGuard } from '../../../hooks/useOverlayClickGuard';
import { IconClose } from '../../icons';
import { usePortalContainer } from '../Portal/PortalContext';
import type { DialogBaseProps, DialogRole } from './Dialog';
import { blockRepeatedPress } from '../../../utils/press/press';
import styles from './Dialog.module.css';
import { thinScrollbar } from '../../../utils/scrollbar/scrollbar';

export interface DialogFrameProps extends DialogBaseProps {
  'aria-label'?: string;
  description?: string;
  flush?: boolean;
  icon?: ReactNode;
  role?: DialogRole;
  surfaceClassName: string;
  title?: string;
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
  const scroll = useScrollFocusable();
  const dialogLabel = title ?? props['aria-label'];

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

  return (
    <div {...underlayProps} className={underlayClassName}>
      <FocusScope contain restoreFocus autoFocus>
        <div
          {...props}
          {...overlayProps}
          ref={mergedRef}
          className={[surfaceClassName, className].filter(Boolean).join(' ')}
          role={role}
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={[description && descriptionId, props['aria-describedby']].filter(Boolean).join(' ') || undefined}
        >
          {title && (
            <header className={[styles.header, children && styles.headerDivided].filter(Boolean).join(' ')}>
              {icon && (
                <span aria-hidden="true" className={styles.icon}>
                  {icon}
                </span>
              )}
              <div className={styles.heading}>
                <h2 className={styles.title} id={titleId}>{title}</h2>
                {description && <p className={styles.description} id={descriptionId}>{description}</p>}
              </div>
              {dismissable && (
                <button className={styles.close} type="button" aria-label="Fechar" onClick={onClose} onKeyDown={blockRepeatedPress}>
                  <IconClose size={20} />
                </button>
              )}
            </header>
          )}
          {children && (
            <div
              aria-label={scroll.focusable ? `Conteúdo${dialogLabel ? ` de ${dialogLabel}` : ''}` : undefined}
              className={[styles.body, flush && styles.bodyFlush, thinScrollbar].filter(Boolean).join(' ')}
              ref={scroll.ref}
              role={scroll.focusable ? 'region' : undefined}
              tabIndex={scroll.focusable ? 0 : undefined}
            >
              {children}
            </div>
          )}
          {footer && <div className={styles.footer}>{footer}</div>}
        </div>
      </FocusScope>
    </div>
  );
}
