import type { ChartPlot } from './cartesianLayout';
import styles from './Chart.module.css';

export interface PointBandsProps {
  onHover: (index: number | null) => void;
  plot: ChartPlot;
  /** Posicao de cada categoria no eixo, na ordem das categorias. */
  positions: readonly number[];
}

/**
 * Faixas invisiveis sobre a area de desenho, uma por categoria, que vao do ponto
 * ate o meio do caminho para cada vizinho: o ponteiro sempre cai no ponto mais proximo.
 */
export function PointBands({ onHover, plot, positions }: PointBandsProps) {
  return (
    <g>
      {positions.map((position, index) => {
        const start = index === 0 ? 0 : (positions[index - 1] + position) / 2;
        const end = index === positions.length - 1 ? plot.width : (position + positions[index + 1]) / 2;

        return (
          <rect
            className={styles.hoverBand}
            height={plot.height}
            key={index}
            onMouseEnter={() => onHover(index)}
            onMouseLeave={() => onHover(null)}
            width={Math.max(0, end - start)}
            x={start}
            y={0}
          />
        );
      })}
    </g>
  );
}

/** Guia vertical no ponto sob o ponteiro, atras das marcas. */
export function PointCursor({ plot, position }: { plot: ChartPlot; position: number }) {
  return <line className={styles.pointCursor} x1={position} x2={position} y1={0} y2={plot.height} />;
}
