import { useEffect, useId, useRef, type ComponentPropsWithRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { FocusScope } from '@react-aria/focus';
import { ariaHideOutside, useOverlay, usePreventScroll } from '@react-aria/overlays';
import { useMergedRefs } from '../../../hooks/useMergedRefs';
import styles from './Dialog.module.css';
import { IconClose } from '../../icons';

export type DialogSize = 'sm' | 'md' | 'lg';
export type DialogRole = 'dialog' | 'alertdialog';

/** As propriedades nativas vao ao elemento do dialogo; o `className` soma ao do sistema. */
export interface DialogProps extends Omit<ComponentPropsWithRef<'div'>, 'children' | 'role' | 'title'> {
  children?: ReactNode;
  description?: string;
  dismissable?: boolean;
  footer?: ReactNode;
  /** Opcional. Desenhado ao lado do titulo, fora da leitura: quem fala e o titulo. */
  icon?: ReactNode;
  onClose: () => void;
  open: boolean;
  /** `alertdialog` para a confirmacao que interrompe e exige resposta, como a de uma acao destrutiva. */
  role?: DialogRole;
  size?: DialogSize;
  title: string;
}

export function Dialog({ open, ...props }: DialogProps) {
  // No servidor nao ha `document` para o portal; o Dialog nasce na hidratacao.
  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(<DialogContent {...props} />, document.body);
}

function DialogContent({
  children,
  className,
  description,
  dismissable = true,
  footer,
  icon,
  onClose,
  ref: refDoConsumidor,
  role = 'dialog',
  size = 'md',
  title,
  ...props
}: Omit<DialogProps, 'open'>) {
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
    <div {...underlayProps} className={styles.underlay}>
      <FocusScope contain restoreFocus autoFocus>
        <div
          {...props}
          {...overlayProps}
          ref={mergedRef}
          className={[styles.dialog, styles[size], className].filter(Boolean).join(' ')}
          role={role}
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
        >
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
          {children && <div className={styles.body}>{children}</div>}
          {footer && <div className={styles.footer}>{footer}</div>}
        </div>
      </FocusScope>
    </div>
  );
}
