import { useCallback, useSyncExternalStore } from 'react';

/** Abaixo de 900px (`--pl-bp-sm`): onde nao ha espaco para empurrar a pagina e o painel vira gaveta. */
const DEFAULT_NARROW_BELOW = 900;

function queryFor(below: number) {
  return `(max-width: ${below - 0.02}px)`;
}

export function isNarrowNow(below: number = DEFAULT_NARROW_BELOW) {
  return typeof window.matchMedia === 'function' && window.matchMedia(queryFor(below)).matches;
}

export function useNarrowViewport(below: number = DEFAULT_NARROW_BELOW) {
  const subscribe = useCallback(
    (notify: () => void) => {
      if (typeof window.matchMedia !== 'function') {
        return () => {};
      }

      const query = window.matchMedia(queryFor(below));
      query.addEventListener('change', notify);
      return () => query.removeEventListener('change', notify);
    },
    [below],
  );
  const isNarrow = useCallback(() => isNarrowNow(below), [below]);

  return useSyncExternalStore(subscribe, isNarrow, () => false);
}
