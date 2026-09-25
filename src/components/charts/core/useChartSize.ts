import { useCallback, useEffect, useRef, useState } from 'react';

export interface ChartSize {
  height: number;
  width: number;
}

export interface UseChartSizeOptions {
  height?: number;
}

/**
 * Largura disponivel do grafico, medida do elemento que o contem. A altura e
 * declarada pelo consumidor: o grafico ocupa a largura da coluna em que foi
 * posto, mas a altura e decisao de layout, nao consequencia do conteudo.
 *
 * Sem ResizeObserver, a largura fica na medida do primeiro layout.
 */
export function useChartSize({ height = 240 }: UseChartSizeOptions = {}) {
  const [width, setWidth] = useState(0);
  const elemento = useRef<HTMLElement | null>(null);

  const medir = useCallback(() => {
    const largura = elemento.current?.clientWidth ?? 0;

    setWidth((atual) => (atual === largura ? atual : largura));
  }, []);

  const ref = useCallback(
    (node: HTMLElement | null) => {
      elemento.current = node;
      medir();
    },
    [medir],
  );

  useEffect(() => {
    const node = elemento.current;

    if (!node || typeof ResizeObserver === 'undefined') {
      return;
    }

    const observador = new ResizeObserver(medir);
    observador.observe(node);

    return () => observador.disconnect();
  }, [medir]);

  return { height, ref, size: { width, height } satisfies ChartSize, width };
}
