import { alignZeros, linearScale, stackDiverging, type NumericRange } from '../scales';
import { seriesInScale } from './useSeriesToggle';

/**
 * Eixo de valor a que a serie pertence. A escolha e sempre do produto: o
 * grafico nunca parte a escala por conta propria.
 */
export type ChartValueAxis = 'left' | 'right';

export function axisOf(serie: { axis?: ChartValueAxis }): ChartValueAxis {
  return serie.axis ?? 'left';
}

/** Dominio com os limites arredondados que o eixo mostraria sozinho. */
function rounded(domain: NumericRange): NumericRange {
  const [min = 0, max = 0] = linearScale({ domain, range: [0, 1] }).domain();

  return { max, min };
}

export interface ValueAxisDomainsOptions<T extends { label: string }> {
  /** Alinha o zero dos dois eixos. Desligue quando o dominio nao precisa conter o zero. */
  alignZero?: boolean;
  /** Eixo de cada serie, na ordem de `series`. */
  axes: readonly ChartValueAxis[];
  /** Dominio de um eixo, calculado so pelas series dele que entram na escala. */
  domainOfSeries: (series: readonly T[]) => NumericRange;
  isOutOfScale: (label: string) => boolean;
  series: readonly T[];
}

/**
 * Dominio do eixo esquerdo e do direito, cada um formado so pelas series dele.
 * Sem serie a direita, o dominio e unico e o eixo direito espelha o esquerdo.
 */
export function valueAxisDomains<T extends { label: string }>({
  alignZero = true,
  axes,
  domainOfSeries,
  isOutOfScale,
  series,
}: ValueAxisDomainsOptions<T>): [NumericRange, NumericRange] {
  const domainOfAxis = (axis: ChartValueAxis) =>
    rounded(domainOfSeries(seriesInScale(series.filter((_, index) => axes[index] === axis), isOutOfScale)));
  const left = domainOfAxis('left');

  if (!axes.includes('right')) {
    return [left, left];
  }

  const right = domainOfAxis('right');

  return alignZero ? alignZeros(left, right) : [left, right];
}

/**
 * Pilha divergente de cada eixo: uma serie so empilha sobre as do mesmo eixo, porque
 * eixos distintos tem unidades distintas. O segmento volta na ordem das series.
 */
export function stackByAxis(contributions: readonly number[], axes: readonly ChartValueAxis[]): [number, number][] {
  const segments: [number, number][] = [];

  for (const axis of ['left', 'right'] as const) {
    const indices = axes.flatMap((current, index) => (current === axis ? [index] : []));

    stackDiverging(indices.map((index) => contributions[index])).forEach((segment, position) => {
      segments[indices[position]] = segment;
    });
  }

  return segments;
}
