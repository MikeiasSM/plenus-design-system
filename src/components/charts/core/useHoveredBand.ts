import { useState } from 'react';

/** Categoria sob o ponteiro: o rótulo e a posição dele em `categories`. */
export interface ChartCategoryHover {
  category: string;
  index: number;
}

export interface HoveredBand {
  hover: (index: number | null) => void;
  hovered: number | null;
}

/**
 * Faixa sob o ponteiro. O gráfico a usa para o realce e o consumidor recebe o
 * aviso pela mesma porta, em vez de cada gráfico repetir estado e callback.
 */
export function useHoveredBand(onHover?: (index: number | null) => void): HoveredBand {
  const [hovered, setHovered] = useState<number | null>(null);

  return {
    hover: (index) => {
      setHovered(index);
      onHover?.(index);
    },
    hovered,
  };
}
