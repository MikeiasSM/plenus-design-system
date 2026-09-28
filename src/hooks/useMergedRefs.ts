import { useMemo, type Ref } from 'react';

function attach<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === 'function') {
    const cleanup = ref(node);
    return typeof cleanup === 'function' ? cleanup : () => ref(null);
  }

  if (ref) {
    ref.current = node;
    return () => {
      ref.current = null;
    };
  }

  return () => undefined;
}

/**
 * Junta o ref interno ao que veio de fora numa funcao estavel, que devolve a limpeza do React 19.
 * Nova a cada render, ela desligava e religava o elemento em todo render.
 */
export function useMergedRefs<T>(...refs: readonly (Ref<T> | undefined)[]) {
  return useMemo(
    () => (node: T | null) => {
      const cleanups = refs.map((ref) => attach(ref, node));

      return () => cleanups.forEach((cleanup) => cleanup());
    },
    refs,
  );
}
