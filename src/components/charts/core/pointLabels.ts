import type { ChartPoint } from './shapes';

export interface PointLabelPlacement {
  /** Abaixo do ponto, quando outra serie tem ponto logo acima na mesma categoria. */
  below: boolean;
  /** Afastamento horizontal do ponto: nas pontas, o rotulo sai de lado para nao encostar no marcador. */
  dx: number;
  textAnchor: 'start' | 'middle' | 'end';
}

const AFASTAMENTO = { end: -6, middle: 0, start: 6 } as const;

/** O rotulo acima fica 10px sobre o ponto; o marcador tem 4px de raio. */
const FOLGA_ACIMA = 14;

/**
 * Onde vai o rotulo de um ponto. Nas pontas ele se alinha para dentro, para nao cobrir os numeros do eixo; e,
 * quando o rotulo de uma serie alcancaria o ponto de outra logo acima, na mesma categoria, ele desce para baixo do ponto.
 */
export function pointLabelPlacement(
  pointsBySeries: readonly (readonly (ChartPoint | null)[])[],
  series: number,
  category: number,
  lineHeight: number,
  isHidden: (seriesIndex: number) => boolean,
): PointLabelPlacement {
  const ponto = pointsBySeries[series][category];
  const ultima = pointsBySeries[series].length - 1;
  const textAnchor = category === 0 ? 'start' : category === ultima ? 'end' : 'middle';

  const below =
    ponto !== null &&
    pointsBySeries.some((pontos, outra) => {
      const vizinho = pontos[category];

      if (outra === series || isHidden(outra) || !vizinho) {
        return false;
      }

      const acima = vizinho.y < ponto.y || (vizinho.y === ponto.y && outra < series);

      return acima && ponto.y - vizinho.y < lineHeight + FOLGA_ACIMA;
    });

  return { below, dx: AFASTAMENTO[textAnchor], textAnchor };
}
