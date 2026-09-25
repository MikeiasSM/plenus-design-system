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
