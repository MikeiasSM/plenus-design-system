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
      .defined((ponto) => ponto !== null && Number.isFinite(ponto.x) && Number.isFinite(ponto.y))
      .x((ponto) => ponto?.x ?? 0)
      .y((ponto) => ponto?.y ?? 0)
      .curve(curveOf(curve))(points) ?? ''
  );
}

/** Caminho da faixa entre duas linhas. A base varia quando as areas empilham. */
export function areaPath(bands: readonly (ChartBand | null)[], curve: ChartCurve) {
  return (
    area<ChartBand | null>()
      .defined((banda) => banda !== null && Number.isFinite(banda.y0) && Number.isFinite(banda.y1))
      .x((banda) => banda?.x ?? 0)
      .y0((banda) => banda?.y0 ?? 0)
      .y1((banda) => banda?.y1 ?? 0)
      .curve(curveOf(curve))(bands) ?? ''
  );
}

/** Raios dos quatro cantos, no sentido horario a partir do superior esquerdo. */
export type CornerRadii = [number, number, number, number];

/**
 * Retangulo com raio por canto, arredondado por curva quadratica com o controle
 * no proprio canto. O atributo `rx` arredonda os quatro de uma vez, e numa barra
 * empilhada isso separa os segmentos: a pilha precisa das duas pontas
 * arredondadas e do meio reto, para parecer uma barra so.
 */
export function roundedBarPath(
  x: number,
  y: number,
  width: number,
  height: number,
  radii: CornerRadii,
) {
  const limite = Math.max(Math.min(width, height) / 2, 0);
  const [se, sd, id, ie] = radii.map((raio) => Math.max(Math.min(raio, limite), 0));
  const direita = x + width;
  const base = y + height;

  // Todos os comandos levam par de coordenadas, sem `H` nem `V`: o caminho fica
  // uniforme e as suas medidas saem dele sem interpretar comando a comando.
  return [
    `M${x + se},${y}`,
    `L${direita - sd},${y}`,
    sd ? `Q${direita},${y} ${direita},${y + sd}` : '',
    `L${direita},${base - id}`,
    id ? `Q${direita},${base} ${direita - id},${base}` : '',
    `L${x + ie},${base}`,
    ie ? `Q${x},${base} ${x},${base - ie}` : '',
    `L${x},${y + se}`,
    se ? `Q${x},${y} ${x + se},${y}` : '',
    'Z',
  ]
    .filter(Boolean)
    .join('');
}
