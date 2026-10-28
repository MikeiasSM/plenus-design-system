import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { FocusScope } from '@react-aria/focus';
import { ariaHideOutside, useOverlay, usePreventScroll } from '@react-aria/overlays';
import { useMergedRefs } from '../../../hooks/useMergedRefs';
import { IconClose } from '../../icons';
import type { DialogBaseProps, DialogRole } from './Dialog';
import styles from './Dialog.module.css';

export interface DialogFrameProps extends DialogBaseProps {
  'aria-label'?: string;
  description?: string;
  icon?: ReactNode;
  role?: DialogRole;
  surfaceClassName: string;
  title?: string;
  underlayClassName: string;
}

/** Mecanica modal do `Dialog` e do `Drawer`: portal, foco preso, rolagem travada, cabecalho, corpo e rodape. Interna. */
export function DialogFrame({ defaultOpen = false, onClose, onOpenChange, open, ...props }: DialogFrameProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);

  function close() {
    if (open === undefined) {
      setInternalOpen(false);
    }
    onOpenChange?.(false);
    onClose?.();
  }

  // No servidor nao ha `document` para o portal; o modal nasce na hidratacao.
  if (!(open ?? internalOpen) || typeof document === 'undefined') {
    return null;
  }

  return createPortal(<DialogFrameContent {...props} onClose={close} />, document.body);
}

type DialogFrameContentProps = Omit<DialogFrameProps, 'defaultOpen' | 'onClose' | 'onOpenChange' | 'open'> & {
  onClose: () => void;
};

function DialogFrameContent({
  children,
  className,
  description,
  dismissable = true,
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

  const { overlayProps, underlayProps } = useOverlay(
    {
      isOpen: true,
      onClose,
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
          aria-describedby={description ? descriptionId : undefined}
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
                <button className={styles.close} type="button" aria-label="Fechar" onClick={onClose}>
                  <IconClose size={20} />
                </button>
              )}
            </header>
          )}
          {children && <div className={styles.body}>{children}</div>}
          {footer && <div className={styles.footer}>{footer}</div>}
        </div>
      </FocusScope>
    </div>
  );
}
