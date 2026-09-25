import { area, curveLinear, curveMonotoneX, line } from 'd3-shape';

export type ChartCurve = 'smooth' | 'straight';

export interface ChartPoint {
  x: number;
  y: number;
}

export interface ChartBand {
  x: number;
  y0: number;
  y1: number;
}

function curveOf(curve: ChartCurve) {
  return curve === 'smooth' ? curveMonotoneX : curveLinear;
}

/**
 * Caminho de uma curva, com interrupcao onde o valor nao existe. Emendar sobre
 * o buraco desenharia um trecho que o dado nao afirma.
 */
export function linePath(points: readonly (ChartPoint | null)[], curve: ChartCurve) {
  return (
    line<ChartPoint | null>()
      .defined((ponto) => ponto !== null)
      .x((ponto) => ponto?.x ?? 0)
      .y((ponto) => ponto?.y ?? 0)
      .curve(curveOf(curve))(points) ?? ''
  );
}

/** Caminho da faixa entre duas linhas. A base varia quando as areas empilham. */
export function areaPath(bands: readonly (ChartBand | null)[], curve: ChartCurve) {
  return (
    area<ChartBand | null>()
      .defined((banda) => banda !== null)
      .x((banda) => banda?.x ?? 0)
      .y0((banda) => banda?.y0 ?? 0)
      .y1((banda) => banda?.y1 ?? 0)
      .curve(curveOf(curve))(bands) ?? ''
  );
}
