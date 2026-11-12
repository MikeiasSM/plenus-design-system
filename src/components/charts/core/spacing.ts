import type { LabelFont } from './measureText';

/**
 * Medidas de espaço do desenho. Elas vivem aqui, e não em cada gráfico, porque
 * são a mesma decisão visual repetida: quando cada arquivo guardava a sua, o
 * mesmo conceito aparecia com valores diferentes em dois vizinhos.
 *
 * Geometria em SVG não le variável CSS, então estes são números — mas números
 * de um lugar só.
 */

/** Distância entre uma marca e o rótulo que a descreve. */
export const CHART_LABEL_OFFSET = 8;

/** Folga mínima nas bordas, para o rótulo das pontas não encostar no limite. */
export const CHART_EDGE_GAP = 12;

/** Teto da banda de rótulos projetados, como fração da largura. */
export const CHART_LABEL_BAND = 0.24;

/**
 * Espaço que um rótulo de valor ocupa acima da marca. Sai da entrelinha medida,
 * e não de um numero fixo: o rótulo ocupa o que o texto ocupa.
 */
export function valueLabelRoom(font: LabelFont) {
  return font.lineHeight + CHART_LABEL_OFFSET / 2;
}

/** Faixa que o título de um eixo ocupa, rente a borda: uma linha de texto e o afastamento dos rótulos. */
export function axisTitleRoom(font: LabelFont) {
  return font.lineHeight + CHART_LABEL_OFFSET;
}

/** Folga entre duas barras vizinhas dentro da mesma faixa. */
export const CHART_BAR_GAP = 2;

export interface BarSlot {
  offset: number;
  thickness: number;
}

/**
 * Faixa de um indice que ainda não existe. Quando entra uma série, o tween
 * devolve o array anterior por um render, e ali a nova não tem presenca.
 */
export const NO_BAR_SLOT: BarSlot = { offset: 0, thickness: 0 };

/**
 * Espessura e deslocamento de cada barra dentro da faixa, a partir da presenca
 * de cada série. A barra desligada encolhe a zero e as demais ocupam o lugar
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

/** Diametro do anel: o lado menor da área disponível, menos a folga. */
export function ringDiameter(width: number, height: number) {
  return Math.max(Math.min(width, height) - CHART_LABEL_OFFSET * 2, 0);
}
