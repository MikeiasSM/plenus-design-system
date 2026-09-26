import type { Ref } from 'react';

/**
 * Junta o ref interno do componente ao que veio de fora. Sem isto, um dos dois
 * se perde: o interno, porque `{...props}` o sobrescreve, ou o de fora, porque
 * o componente aplica o seu depois.
 */
export function mergeRefs<T>(...refs: readonly (Ref<T> | undefined)[]) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as { current: T | null }).current = node;
      }
    }
  };
}
