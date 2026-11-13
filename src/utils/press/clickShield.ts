const WINDOW_MS = 500;

let disarm: (() => void) | undefined;

export function armClickShield() {
  if (typeof window === 'undefined') {
    return;
  }

  disarm?.();

  const swallow = (event: Event) => {
    if (event.type === 'dblclick' || (event as MouseEvent).detail > 1) {
      event.stopImmediatePropagation();
      event.preventDefault();
    } else {
      disarm?.();
    }
  };
  const timer = setTimeout(() => disarm?.(), WINDOW_MS);

  window.addEventListener('click', swallow, true);
  window.addEventListener('dblclick', swallow, true);

  disarm = () => {
    clearTimeout(timer);
    window.removeEventListener('click', swallow, true);
    window.removeEventListener('dblclick', swallow, true);
    disarm = undefined;
  };
}

export const DISMISS_GUARD_MS = WINDOW_MS;

export function disarmClickShield() {
  disarm?.();
}
