import { useLayoutEffect, useRef, type RefObject } from 'react';

const REMOVE_MARK = 'data-removes';

/**
 * Se o item sai com o foco num botão de remover seu, o foco vai ao próximo botão de remover do mesmo
 * contêiner; sem próximo, ao anterior; sem nenhum, ao contêiner ou ao `fallback`. Nunca fica no `body`.
 */
export function useFocusNeighborOnRemove(
  ref: RefObject<HTMLElement | null>,
  fallback?: () => HTMLElement | null | undefined,
) {
  const fallbackRef = useRef(fallback);

  useLayoutEffect(() => {
    fallbackRef.current = fallback;
  });

  useLayoutEffect(() => {
    const item = ref.current;

    return () => {
      const active = document.activeElement;

      if (!item || !(active instanceof HTMLElement) || !item.contains(active) || !active.hasAttribute(REMOVE_MARK)) {
        return;
      }

      const container = item.parentElement;
      const others = Array.from(container?.querySelectorAll<HTMLElement>(`[${REMOVE_MARK}]:not(:disabled)`) ?? []).filter(
        (button) => !item.contains(button),
      );
      const next = others.find((button) => item.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING);
      const previous = others.filter((button) => item.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_PRECEDING).pop();
      const target = next ?? previous ?? fallbackRef.current?.() ?? container;

      if (target && !target.hasAttribute('tabindex') && !target.matches('a[href], button, input, select, textarea')) {
        target.tabIndex = -1;
      }

      target?.focus({ preventScroll: true });
    };
  }, [ref]);
}
