import { useCallback, useRef, useState } from 'react';

const OVERSCAN = 6;

/**
 * Quantos itens entram antes da primeira medida. A janela so liga depois de
 * conhecer o passo entre itens, e o passo sai do DOM — montar a colecao inteira
 * para medir um item custava dez mil nos num primeiro render.
 */
const PRIMEIRA_JANELA = 24;

export function useVirtualWindow(total: number, height?: number) {
  const scrollElement = useRef<HTMLElement | null>(null);
  const [itemHeight, setItemHeight] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  // O passo entre itens inclui o espaco que o container coloca entre eles.
  // Medir apenas a altura do item acumula erro e faz a janela descolar da
  // rolagem conforme a lista avanca.
  const measureItem = useCallback((node: HTMLElement | null) => {
    if (!node) {
      return;
    }

    const proximo = node.nextElementSibling as HTMLElement | null;
    const passo = proximo ? proximo.offsetTop - node.offsetTop : node.offsetHeight;

    if (passo > 0) {
      setItemHeight((current) => (current === passo ? current : passo));
    }
  }, []);

  const attachScroll = useCallback((node: HTMLElement | null) => {
    scrollElement.current = node;
  }, []);

  const onScroll = useCallback(() => {
    setScrollTop(scrollElement.current?.scrollTop ?? 0);
  }, []);

  const active = height !== undefined && itemHeight > 0 && total * itemHeight > height;
  const medindo = height !== undefined && itemHeight === 0;

  const scrollToIndex = useCallback(
    (index: number) => {
      const element = scrollElement.current;

      if (!element || index < 0) {
        return;
      }

      const top = index * itemHeight;
      const bottom = top + itemHeight;

      if (top < element.scrollTop) {
        element.scrollTop = top;
      } else if (bottom > element.scrollTop + element.clientHeight) {
        element.scrollTop = bottom - element.clientHeight;
      }
    },
    [itemHeight],
  );

  if (!active) {
    return {
      active,
      attachScroll,
      measureItem,
      onScroll,
      padding: { before: 0, after: 0 },
      scrollToIndex,
      start: 0,
      end: medindo ? Math.min(total, PRIMEIRA_JANELA) : total,
    };
  }

  const perScreen = Math.ceil(height / itemHeight);
  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - OVERSCAN);
  const end = Math.min(total, start + perScreen + OVERSCAN * 2);

  return {
    active,
    attachScroll,
    measureItem,
    onScroll,
    padding: { before: start * itemHeight, after: (total - end) * itemHeight },
    scrollToIndex,
    start,
    end,
  };
}
