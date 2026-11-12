import { useSyncExternalStore } from 'react';

/** Abaixo de 900px (`--pl-bp-sm`): onde nao ha espaco para empurrar a pagina e o painel vira gaveta. */
const NARROW_VIEWPORT = '(max-width: 899.98px)';

function subscribe(notify: () => void) {
  if (typeof window.matchMedia !== 'function') {
    return () => {};
  }

  const query = window.matchMedia(NARROW_VIEWPORT);
  query.addEventListener('change', notify);
  return () => query.removeEventListener('change', notify);
}

function isNarrow() {
  return typeof window.matchMedia === 'function' && window.matchMedia(NARROW_VIEWPORT).matches;
}

export function useNarrowViewport() {
  return useSyncExternalStore(subscribe, isNarrow, () => false);
}
