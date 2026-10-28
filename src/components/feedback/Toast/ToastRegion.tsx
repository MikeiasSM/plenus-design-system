import { useEffect, useState, useSyncExternalStore, type ComponentPropsWithRef, type FocusEvent } from 'react';
import { Button } from '../../actions/Button';
import { IconCheckCircle, IconClose, IconExclamationCircle, IconExclamationTriangle, IconInfoCircle } from '../../icons';
import { dismissToast, getServerToasts, getToasts, subscribeToasts, type ToastEntry } from './toastStore';
import styles from './Toast.module.css';

const VISIBLE_LIMIT = 3;
const DEFAULT_DURATION = 6000;

const TONE_ICONS = {
  danger: IconExclamationCircle,
  info: IconInfoCircle,
  success: IconCheckCircle,
  warning: IconExclamationTriangle,
};

export type ToastRegionProps = ComponentPropsWithRef<'div'>;

/** Canto onde os avisos de `showToast` aparecem. Montado uma vez, na raiz da aplicacao. */
export function ToastRegion({ className, ...props }: ToastRegionProps) {
  const toasts = useSyncExternalStore(subscribeToasts, getToasts, getServerToasts);

  return (
    <div {...props} className={[styles.region, className].filter(Boolean).join(' ')}>
      {toasts.slice(-VISIBLE_LIMIT).map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function Toast({ toast }: { toast: ToastEntry }) {
  const { action, description, id, title, tone = 'info' } = toast;
  const duration = toast.duration === undefined ? (tone === 'danger' ? null : DEFAULT_DURATION) : toast.duration;
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const ToneIcon = TONE_ICONS[tone];

  // Quem esta lendo ou operando o aviso nao o perde: ponteiro ou foco dentro param o tempo, que recomeca ao sair.
  useEffect(() => {
    if (duration === null || hovered || focused) {
      return;
    }

    const timer = setTimeout(() => dismissToast(id), duration);
    return () => clearTimeout(timer);
  }, [duration, focused, hovered, id]);

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setFocused(false);
    }
  }

  return (
    <div
      className={[styles.toast, styles[tone]].join(' ')}
      onBlur={handleBlur}
      onFocus={() => setFocused(true)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'}
    >
      <ToneIcon className={styles.icon} />
      <div className={styles.content}>
        <strong className={styles.title}>{title}</strong>
        {description && <p className={styles.description}>{description}</p>}
        {action && (
          <div className={styles.actions}>
            <Button
              onClick={() => {
                action.onClick();
                dismissToast(id);
              }}
              size="sm"
              variant="secondary"
            >
              {action.label}
            </Button>
          </div>
        )}
      </div>
      <button aria-label="Fechar aviso" className={styles.close} onClick={() => dismissToast(id)} type="button">
        <IconClose />
      </button>
    </div>
  );
}
