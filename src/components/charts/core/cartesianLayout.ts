import { widestLabel, type LabelFont } from './measureText';
import { CHART_EDGE_GAP, CHART_LABEL_OFFSET } from './spacing';
import { linearScale, ticksFor, type NumericRange } from '../scales';

export type AxisLabelRotation = 0 | 45 | 90;
export type AxisLabelAngle = AxisLabelRotation | 'auto';

/**
 * Como o eixo se mostra. `onHover` reserva a calha e desliza o eixo para dentro
 * dela, de modo que o desenho nao se mexa sob o ponteiro; `hidden` dispensa a
 * calha, e e o unico modo em que a area de desenho realmente cresce.
 */
export type AxisVisibility = 'visible' | 'hidden' | 'onHover';

/** Altura do desenho: um numero fixa, `fill` entrega a decisao ao contêiner. */
export type ChartHeight = number | 'fill';

export interface ResolvedHeight {
  fillHeight: boolean;
  value: number;
}

/**
 * Altura efetiva do desenho. Com `fill`, ela vem da medida do contêiner, o que
 * permite ao grafico ocupar a celula de um painel sem que ninguem repita a
 * medida em JavaScript.
 */
export function chartHeight(height: ChartHeight, measured: number): ResolvedHeight {
  return { fillHeight: height === 'fill', value: height === 'fill' ? measured : height };
}

export interface ChartMargins {
  bottom: number;
  left: number;
  right: number;
  top: number;
}

export interface ChartPlot {
  height: number;
  width: number;
}

export interface CartesianLayoutOptions {
  bottomLabels: readonly string[];
  font: LabelFont;
  height: number;
  labelAngle: AxisLabelAngle;
  leftLabels: readonly string[];
  rightLabels: readonly string[];
  topRoom: number;
  width: number;
  xAxis: AxisVisibility;
  yAxis: AxisVisibility;
  yAxisRight: AxisVisibility;
}

export interface CartesianLayout {
  margins: ChartMargins;
  plot: ChartPlot;
  rotation: AxisLabelRotation;
}

function calha(visibility: AxisVisibility, labels: readonly string[], font: LabelFont) {
  return visibility === 'hidden' ? 0 : widestLabel(labels, font) + CHART_LABEL_OFFSET;
}

/**
 * Angulo dos rotulos do eixo de baixo. Em zero grau, dois rotulos vizinhos nao
 * podem se tocar. Girados, o que precisa caber e a distancia perpendicular
 * entre duas linhas de base vizinhas, que vale o passo vezes o seno do angulo.
 */
export function bottomLabelRotation(
  labels: readonly string[],
  font: LabelFont,
  step: number,
): AxisLabelRotation {
  if (labels.length === 0 || step <= 0) {
    return 0;
  }

  if (widestLabel(labels, font) + CHART_LABEL_OFFSET <= step) {
    return 0;
  }

  return step * Math.SQRT1_2 >= font.lineHeight ? 45 : 90;
}

/** Altura que os rotulos de baixo ocupam, que e a caixa do texto ja girado. */
function alturaDosRotulos(
  labels: readonly string[],
  font: LabelFont,
  rotation: AxisLabelRotation,
  visibility: AxisVisibility,
) {
  if (visibility === 'hidden') {
    return 0;
  }

  if (rotation === 0) {
    return font.lineHeight + CHART_LABEL_OFFSET;
  }

  const radianos = (rotation * Math.PI) / 180;
  const caixa = widestLabel(labels, font) * Math.sin(radianos) + font.lineHeight * Math.cos(radianos);

  return caixa + CHART_LABEL_OFFSET;
}

/**
 * Margens derivadas do conteudo, e nao de constantes. A ordem resolve sozinha a
 * dependencia entre elas: as calhas laterais definem a largura util, a largura
 * util define o passo entre categorias, o passo define o angulo dos rotulos e o
 * angulo define a altura que eles ocupam embaixo.
 */
export function cartesianLayout({
  bottomLabels,
  font,
  height,
  labelAngle,
  leftLabels,
  rightLabels,
  topRoom,
  width,
  xAxis,
  yAxis,
  yAxisRight,
}: CartesianLayoutOptions): CartesianLayout {
  const meioRotulo = xAxis === 'hidden' ? 0 : widestLabel(bottomLabels, font) / 2;

  const left = Math.max(calha(yAxis, leftLabels, font), CHART_EDGE_GAP);
  const right = Math.max(calha(yAxisRight, rightLabels, font), CHART_EDGE_GAP);
  const plotWidth = Math.max(width - left - right, 0);

  const rotation =
    labelAngle === 'auto'
      ? bottomLabelRotation(bottomLabels, font, plotWidth / Math.max(bottomLabels.length, 1))
      : labelAngle;

  // Sem rotacao o rotulo das pontas transborda meia largura para cada lado; a
  // folga so precisa cobrir o que a calha lateral ainda nao cobre.
  const bordaLateral = rotation === 0 ? meioRotulo : 0;
  const margins: ChartMargins = {
    bottom: alturaDosRotulos(bottomLabels, font, rotation, xAxis),
    left: Math.max(left, bordaLateral),
    right: Math.max(right, bordaLateral),
    top: Math.max(topRoom, CHART_EDGE_GAP),
  };

  return {
    margins,
    plot: {
      width: Math.max(width - margins.left - margins.right, 0),
      height: Math.max(height - margins.top - margins.bottom, 0),
    },
    rotation,
  };
}

/**
 * Rotulos de valor usados apenas para medir a calha do eixo, antes de a area de
 * desenho existir. Eles saem da altura total em vez da altura util, o que pode
 * render uma marca a mais ou a menos: a largura do rotulo mais largo nao muda
 * por isso, e e so ela que a medida precisa.
 */
export function valueLabelsFor(
  domain: NumericRange,
  length: number,
  format: (value: number) => string,
) {
  const escala = linearScale({ domain, range: [length, 0] });

  return ticksFor(escala, length).map(format);
}
