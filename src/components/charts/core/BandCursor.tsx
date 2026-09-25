import type { ChartPlot } from './cartesianLayout';
import styles from './Chart.module.css';

export type BandOrientation = 'vertical' | 'horizontal';

export interface BandCursorProps {
  /** Comeco da faixa no eixo de categorias. */
  offset: number;
  orientation?: BandOrientation;
  plot: ChartPlot;
  /** Largura da faixa, que e a banda da escala de categorias. */
  size: number;
}

/**
 * Realce da faixa sob o ponteiro, atras das marcas. Na vertical ele e uma
 * coluna e na horizontal uma linha: so o eixo troca.
 */
export function BandCursor({ offset, orientation = 'vertical', plot, size }: BandCursorProps) {
  const vertical = orientation === 'vertical';

  return (
    <rect
      className={styles.cursor}
      height={vertical ? plot.height : size}
      width={vertical ? size : plot.width}
      x={vertical ? offset : 0}
      y={vertical ? 0 : offset}
    />
  );
}
