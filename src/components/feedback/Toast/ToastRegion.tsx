import { useEffect, useState, useSyncExternalStore, type ComponentPropsWithRef, type FocusEvent } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../../actions/Button';
import { IconCheckCircle, IconClose, IconExclamationCircle, IconExclamationTriangle, IconInfoCircle } from '../../icons';
import { useChosenPortalContainer } from '../../overlays/Portal/PortalContext';
import { useToastStore } from './ToastProvider';
import { MAX_TOAST_ACTIONS, type ToastEntry, type ToastStore } from './toastStore';
import styles from './Toast.module.css';

const VISIBLE_LIMIT = 3;
const DEFAULT_DURATION = 6000;

const TONE_ICONS = {
  danger: IconExclamationCircle,
  info: IconInfoCircle,
  success: IconCheckCircle,
  warning: IconExclamationTriangle,
};

export interface ToastRegionProps extends ComponentPropsWithRef<'div'> {
  /** Elemento que recebe o canto de avisos. Sem ele vale o `PortalProvider` mais proximo; sem este, o canto fica onde foi montado. */
  portalContainer?: HTMLElement | null;
}

/** Canto onde os avisos aparecem: os de `showToast`, ou os do `ToastProvider` mais proximo. Montado uma vez na arvore. */
export function ToastRegion({ className, portalContainer, ...props }: ToastRegionProps) {
  const store = useToastStore();
  const container = useChosenPortalContainer(portalContainer);
  const toasts = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  const region = (
    <div {...props} className={[styles.region, className].filter(Boolean).join(' ')}>
      {toasts.slice(-VISIBLE_LIMIT).map((toast) => (
        <Toast key={toast.id} store={store} toast={toast} />
      ))}
    </div>
  );

  return container ? createPortal(region, container) : region;
}

function Toast({ store, toast }: { store: ToastStore; toast: ToastEntry }) {
  const { description, id, title, tone = 'info' } = toast;
  const actions = (toast.actions ?? (toast.action ? [toast.action] : [])).slice(0, MAX_TOAST_ACTIONS);
  const duration = toast.duration === undefined ? (tone === 'danger' ? null : DEFAULT_DURATION) : toast.duration;
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const ToneIcon = TONE_ICONS[tone];

  // Quem esta lendo ou operando o aviso nao o perde: ponteiro ou foco dentro param o tempo, que recomeca ao sair.
  useEffect(() => {
    if (duration === null || hovered || focused) {
      return;
    }

    const timer = setTimeout(() => store.dismiss(id), duration);
    return () => clearTimeout(timer);
  }, [duration, focused, hovered, id, store]);

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
        {actions.length > 0 && (
          <div className={styles.actions}>
            {actions.map((action) => (
              <Button
                key={action.label}
                onClick={() => {
                  action.onClick();
                  store.dismiss(id);
                }}
                size="sm"
                variant="secondary"
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
      <button aria-label="Fechar aviso" className={styles.close} onClick={() => store.dismiss(id)} type="button">
        <IconClose />
      </button>
    </div>
  );
}
