import { arc, pie } from 'd3-shape';

export const VOLTA = Math.PI * 2;

export interface ArcAngles {
  endAngle: number;
  startAngle: number;
}

export interface ArcShape extends ArcAngles {
  cornerRadius?: number;
  innerRadius: number;
  outerRadius: number;
  padAngle?: number;
}

export interface SliceAnglesOptions {
  endAngle?: number;
  padAngle?: number;
  startAngle?: number;
}

/**
 * Angulo de cada fatia, **na ordem recebida**. A ordenacao por valor fica de
 * fora: a fatia precisa ficar onde o consumidor a colocou, porque e essa ordem
 * que a legenda repete.
 */
export function sliceAngles(
  values: readonly number[],
  { endAngle = VOLTA, padAngle = 0, startAngle = 0 }: SliceAnglesOptions = {},
): ArcAngles[] {
  return pie<number>()
    .sort(null)
    .sortValues(null)
    .value((valor) => Math.max(valor, 0))
    .startAngle(startAngle)
    .endAngle(endAngle)
    .padAngle(padAngle)(
    [...values],
  ).map(({ endAngle: fim, startAngle: comeco }) => ({ endAngle: fim, startAngle: comeco }));
}

export function arcPath({ cornerRadius = 0, endAngle, innerRadius, outerRadius, padAngle = 0, startAngle }: ArcShape) {
  return (
    arc<ArcShape>()
      .cornerRadius(cornerRadius)
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .padAngle(padAngle)
      .startAngle(startAngle)
      .endAngle(endAngle)({ cornerRadius, endAngle, innerRadius, outerRadius, padAngle, startAngle }) ?? ''
  );
}

/** Centro geometrico do arco, onde um rotulo sobre a fatia se apoia. */
export function arcCentroid({ endAngle, innerRadius, outerRadius, startAngle }: ArcShape): [number, number] {
  const raio = (innerRadius + outerRadius) / 2;
  const angulo = (startAngle + endAngle) / 2 - Math.PI / 2;

  return [Math.cos(angulo) * raio, Math.sin(angulo) * raio];
}

/** Ponto na borda do arco, de onde parte o conector de um rotulo externo. */
export function arcAnchor(angles: ArcAngles, radius: number): [number, number] {
  const angulo = (angles.startAngle + angles.endAngle) / 2 - Math.PI / 2;

  return [Math.cos(angulo) * radius, Math.sin(angulo) * radius];
}
