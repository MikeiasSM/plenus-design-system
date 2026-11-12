import { useEffect, useRef } from 'react';
import { armClickShield, DISMISS_GUARD_MS } from '../utils/press/clickShield';

export function useClickShieldOnClose(open: boolean) {
  useEffect(() => (open ? armClickShield : undefined), [open]);
}

export function useOverlayClickGuard(onDismiss: () => void, enabled = true) {
  const openedAt = useRef(0);
  const lastDetail = useRef(0);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    openedAt.current = Date.now();

    const record = (event: MouseEvent) => {
      lastDetail.current = event.detail;
    };
    const reset = () => {
      lastDetail.current = 0;
    };

    document.addEventListener('mousedown', record, true);
    document.addEventListener('keydown', reset, true);

    return () => {
      document.removeEventListener('mousedown', record, true);
      document.removeEventListener('keydown', reset, true);
      armClickShield();
    };
  }, [enabled]);

  return () => {
    if (enabled && lastDetail.current > 1 && Date.now() - openedAt.current < DISMISS_GUARD_MS) {
      return;
    }

    onDismiss();
  };
}
