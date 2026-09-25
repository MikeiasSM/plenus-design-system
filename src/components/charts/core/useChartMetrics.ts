import { useCallback, useEffect, useRef, useState } from 'react';
import { labelFontOf, type LabelFont } from './measureText';

export interface ChartMetrics {
  font: LabelFont;
  height: number;
  /** Raio dos cantos, lido do token: geometria de caminho nao le variavel CSS. */
  radius: number;
  ref: (node: HTMLElement | null) => void;
  width: number;
}

const RAIO_PADRAO = 5;

function raioDe(node: Element | null) {
  if (!node || typeof getComputedStyle !== 'function') {
    return RAIO_PADRAO;
  }

  return Number.parseFloat(getComputedStyle(node).getPropertyValue('--pl-radius-sm')) || RAIO_PADRAO;
}

/**
 * Mede o espaco em que o grafico sera desenhado: largura, altura e a fonte que
 * os rotulos vao usar. A area de desenho nao entra no fluxo, entao a medida e
 * sempre o que o layout concedeu, e nunca o que o proprio grafico ocupou.
 *
 * A fonte sai da mesma medida porque as duas vem do elemento e mudam juntas:
 * as margens do grafico dependem da largura dos rotulos, e a largura de um
 * rotulo depende da fonte resolvida ali.
 */
export function useChartMetrics(): ChartMetrics {
  const [medida, setMedida] = useState<{
    font: LabelFont;
    height: number;
    radius: number;
    width: number;
  }>(() => ({ font: labelFontOf(null), height: 0, radius: RAIO_PADRAO, width: 0 }));
  const elemento = useRef<HTMLElement | null>(null);

  const medir = useCallback(() => {
    const node = elemento.current;
    const width = node?.clientWidth ?? 0;
    const height = node?.clientHeight ?? 0;
    const font = labelFontOf(node);
    const radius = raioDe(node);

    setMedida((atual) =>
      atual.width === width &&
      atual.height === height &&
      atual.radius === radius &&
      atual.font.family === font.family &&
      atual.font.size === font.size &&
      atual.font.lineHeight === font.lineHeight
        ? atual
        : { font, height, radius, width },
    );
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

  return {
    font: medida.font,
    height: medida.height,
    radius: medida.radius,
    ref,
    width: medida.width,
  };
}
