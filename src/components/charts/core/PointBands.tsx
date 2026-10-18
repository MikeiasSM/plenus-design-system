import type { ChartPlot } from './cartesianLayout';
import type { ChartPoint } from './shapes';
import styles from './Chart.module.css';

export interface PointBandsProps {
  onHover: (index: number | null) => void;
  /** Altura do ponteiro na area de desenho, para quem escolhe a serie mais proxima dele. */
  onPointerY?: (y: number | null) => void;
  plot: ChartPlot;
  /** Posicao de cada categoria no eixo, na ordem das categorias. */
  positions: readonly number[];
}

/**
 * Faixas invisiveis sobre a area de desenho, uma por categoria, que vao do ponto
 * ate o meio do caminho para cada vizinho: o ponteiro sempre cai no ponto mais proximo.
 */
export function PointBands({ onHover, onPointerY, plot, positions }: PointBandsProps) {
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
            onMouseLeave={() => {
              onHover(null);
              onPointerY?.(null);
            }}
            onMouseMove={(evento) => onPointerY?.(evento.clientY - evento.currentTarget.getBoundingClientRect().top)}
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

/** A serie visivel com ponto na categoria cujo ponto fica mais perto da altura do ponteiro. */
export function nearestSeriesAt(
  pointsBySeries: readonly (readonly (ChartPoint | null)[])[],
  category: number | null,
  y: number | null,
  isHidden: (seriesIndex: number) => boolean,
) {
  if (category === null || y === null) {
    return null;
  }

  let maisPerto: number | null = null;
  let menorDistancia = Infinity;

  pointsBySeries.forEach((pontos, indice) => {
    const ponto = pontos[category];

    if (ponto && !isHidden(indice) && Math.abs(ponto.y - y) < menorDistancia) {
      menorDistancia = Math.abs(ponto.y - y);
      maisPerto = indice;
    }
  });

  return maisPerto;
}
