import { useCallback, useRef, useState } from 'react';

const OVERSCAN = 6;

/** Quantos itens entram antes da primeira medida: montar dez mil nos para medir um custava o primeiro render. */
const PRIMEIRA_JANELA = 24;

/** O passo entre itens inclui o espaco que o container coloca entre eles; so a altura acumulava erro. */
function medirPasso(node: HTMLElement) {
  const proximo = node.nextElementSibling as HTMLElement | null;

  return proximo ? proximo.offsetTop - node.offsetTop : node.offsetHeight;
}

export function useVirtualWindow(total: number, height?: number) {
  const scrollElement = useRef<HTMLElement | null>(null);
  const firstItem = useRef<HTMLElement | null>(null);
  const firstIndex = useRef(0);
  const observer = useRef<ResizeObserver | null>(null);
  // `null` e "ainda nao medido"; zero e "sem layout", como no jsdom ou na lista montada escondida.
  const [itemHeight, setItemHeight] = useState<number | null>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const measureItem = useCallback((node: HTMLElement | null) => {
    firstItem.current = node;

    if (node) {
      const passo = medirPasso(node);
      setItemHeight((current) => (passo > 0 ? passo : (current ?? 0)));
    }
  }, []);

  const attachScroll = useCallback((node: HTMLElement | null) => {
    scrollElement.current = node;
    observer.current?.disconnect();
    observer.current = null;

    if (!node || typeof ResizeObserver === 'undefined') {
      return;
    }

    // Montada escondida, a lista mede zero; quando aparece, o tamanho muda e ela mede de novo.
    observer.current = new ResizeObserver(() => {
      const passo = firstItem.current ? medirPasso(firstItem.current) : 0;

      if (passo > 0) {
        setItemHeight(passo);
      }
    });
    observer.current.observe(node);
  }, []);

  const onScroll = useCallback(() => {
    setScrollTop(scrollElement.current?.scrollTop ?? 0);
  }, []);

  const passo = itemHeight ?? 0;
  const active = height !== undefined && passo > 0 && total * passo > height;
  const medindo = height !== undefined && itemHeight === null;

  const scrollToIndex = useCallback(
    (index: number) => {
      const element = scrollElement.current;
      const primeiro = firstItem.current;

      if (!element || !primeiro || index < 0 || passo <= 0) {
        return;
      }

      // A conta parte do primeiro item montado, e nao do topo: antes dele pode haver o grupo de selecionados.
      const topoDoPrimeiro = primeiro.getBoundingClientRect().top - element.getBoundingClientRect().top + element.scrollTop;
      const top = topoDoPrimeiro + (index - firstIndex.current) * passo;
      const bottom = top + passo;

      if (top < element.scrollTop) {
        element.scrollTop = top;
      } else if (bottom > element.scrollTop + element.clientHeight) {
        element.scrollTop = bottom - element.clientHeight;
      }
    },
    [passo],
  );

  if (!active) {
    firstIndex.current = 0;

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

  const perScreen = Math.ceil(height / passo);
  const start = Math.max(0, Math.floor(scrollTop / passo) - OVERSCAN);
  const end = Math.min(total, start + perScreen + OVERSCAN * 2);

  firstIndex.current = start;

  return {
    active,
    attachScroll,
    measureItem,
    onScroll,
    padding: { before: start * passo, after: (total - end) * passo },
    scrollToIndex,
    start,
    end,
  };
}
