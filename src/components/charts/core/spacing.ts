import type { LabelFont } from './measureText';

/**
 * Medidas de espaco do desenho. Elas vivem aqui, e nao em cada grafico, porque
 * sao a mesma decisao visual repetida: quando cada arquivo guardava a sua, o
 * mesmo conceito aparecia com valores diferentes em dois vizinhos.
 *
 * Geometria em SVG nao le variavel CSS, entao estes sao numeros — mas numeros
 * de um lugar so.
 */

/** Distancia entre uma marca e o rotulo que a descreve. */
export const CHART_LABEL_OFFSET = 8;

/** Folga minima nas bordas, para o rotulo das pontas nao encostar no limite. */
export const CHART_EDGE_GAP = 12;

/** Teto da banda de rotulos projetados, como fracao da largura. */
export const CHART_LABEL_BAND = 0.24;

/**
 * Espaco que um rotulo de valor ocupa acima da marca. Sai da entrelinha medida,
 * e nao de um numero fixo: o rotulo ocupa o que o texto ocupa.
 */
export function valueLabelRoom(font: LabelFont) {
  return font.lineHeight + CHART_LABEL_OFFSET / 2;
}

/** Folga entre duas barras vizinhas dentro da mesma faixa. */
export const CHART_BAR_GAP = 2;

export interface BarSlot {
  offset: number;
  thickness: number;
}

/**
 * Espessura e deslocamento de cada barra dentro da faixa, a partir da presenca
 * de cada serie. A barra desligada encolhe a zero e as demais ocupam o lugar
 * dela, sem deixar a folga sobrando no fim.
 */
export function barSlots(band: number, presences: readonly number[]): BarSlot[] {
  const total = presences.reduce((soma, presenca) => soma + presenca, 0);
  const unit = Math.max((band - CHART_BAR_GAP * Math.max(total - 1, 0)) / Math.max(total, 1), 0);

  return presences.map((presenca, indice) => ({
    offset: presences
      .slice(0, indice)
      .reduce((soma, anterior) => soma + (unit + CHART_BAR_GAP) * anterior, 0),
    thickness: unit * presenca,
  }));
}

/** Diametro do anel: o lado menor da area disponivel, menos a folga. */
export function ringDiameter(width: number, height: number) {
  return Math.max(Math.min(width, height) - CHART_LABEL_OFFSET * 2, 0);
}
