import { useState } from 'react';

export interface HoveredBand {
  hover: (index: number | null) => void;
  hovered: number | null;
}

/**
 * Faixa sob o ponteiro. O grafico a usa para o realce e o consumidor recebe o
 * aviso pela mesma porta, em vez de cada grafico repetir estado e callback.
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
