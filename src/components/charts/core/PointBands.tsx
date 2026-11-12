import type { ChartPlot } from './cartesianLayout';
import type { ChartPoint } from './shapes';
import styles from './Chart.module.css';

export interface PointBandsProps {
  /** Clique na faixa da categoria, quando o gráfico tem clique no ponto. */
  onActivate?: (index: number) => void;
  onHover: (index: number | null) => void;
  /** Altura do ponteiro na área de desenho, para quem escolhe a série mais próxima dele. */
  onPointerY?: (y: number | null) => void;
  plot: ChartPlot;
  /** Posição de cada categoria no eixo, na ordem das categorias. */
  positions: readonly number[];
}

/**
 * Faixas invisíveis sobre a área de desenho, uma por categoria, que vão do ponto
 * até o meio do caminho para cada vizinho: o ponteiro sempre cai no ponto mais próximo.
 */
export function PointBands({ onActivate, onHover, onPointerY, plot, positions }: PointBandsProps) {
  return (
    <g>
      {positions.map((position, index) => {
        const start = index === 0 ? 0 : (positions[index - 1] + position) / 2;
        const end = index === positions.length - 1 ? plot.width : (position + positions[index + 1]) / 2;

        return (
          <rect
            className={onActivate ? `${styles.hoverBand} ${styles.hoverBandActive}` : styles.hoverBand}
            data-band={onActivate ? index : undefined}
            height={plot.height}
            key={index}
            onClick={onActivate && (() => onActivate(index))}
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

/** A série visível com ponto na categoria cujo ponto fica mais perto da altura do ponteiro. */
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
