import { useEffect, useRef } from 'react';
import { armClickShield, DISMISS_GUARD_MS } from '../utils/press/clickShield';

/**
 * Protege o gesto de clique duplo que abre ou fecha uma camada: o segundo clique de quem a fechou não
 * atravessa para a página, e o de quem a abriu não conta como clique fora. Devolve o fechamento protegido.
 */
export function useOverlayClickGuard(onDismiss: () => void, enabled = true) {
  const openedAt = useRef(Date.now());
  const lastDetail = useRef(0);

  useEffect(() => {
    if (!enabled) {
      return;
    }

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
