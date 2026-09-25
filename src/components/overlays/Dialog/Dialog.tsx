import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { FocusScope } from '@react-aria/focus';
import { ariaHideOutside, useOverlay, usePreventScroll } from '@react-aria/overlays';
import styles from './Dialog.module.css';
import { IconClose } from '../../icons';

export type DialogSize = 'sm' | 'md' | 'lg';

export interface DialogProps {
  children?: ReactNode;
  description?: string;
  dismissable?: boolean;
  footer?: ReactNode;
  onClose: () => void;
  open: boolean;
  size?: DialogSize;
  title: string;
}

export function Dialog({ open, ...props }: DialogProps) {
  if (!open) {
    return null;
  }

  return createPortal(<DialogContent {...props} />, document.body);
}

function DialogContent({
  children,
  description,
  dismissable = true,
  footer,
  onClose,
  size = 'md',
  title,
}: Omit<DialogProps, 'open'>) {
  const ref = useRef<HTMLDivElement>(null);
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
    <div {...underlayProps} className={styles.underlay}>
      <FocusScope contain restoreFocus autoFocus>
        <div
          {...overlayProps}
          ref={ref}
          className={[styles.dialog, styles[size]].join(' ')}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
        >
          <header className={styles.header}>
            <h2 className={styles.title} id={titleId}>{title}</h2>
            {dismissable && (
              <button className={styles.close} type="button" aria-label="Fechar" onClick={onClose}>
                <IconClose size={16} />
              </button>
            )}
          </header>
          {description && <p className={styles.description} id={descriptionId}>{description}</p>}
          {children && <div className={styles.body}>{children}</div>}
          {footer && <div className={styles.footer}>{footer}</div>}
        </div>
      </FocusScope>
    </div>
  );
}
