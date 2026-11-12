import { widestLabel, type LabelFont } from './measureText';
import { axisTitleRoom, CHART_EDGE_GAP, CHART_LABEL_OFFSET } from './spacing';
import { linearScale, ticksFor, type NumericRange } from '../scales';

export type AxisLabelRotation = 0 | 45 | 90;
export type AxisLabelAngle = AxisLabelRotation | 'auto';

/**
 * Como o eixo se mostra. `onHover` não reserva a calha: o desenho ocupa o espaço
 * todo e, depois de um instante com o ponteiro sobre o gráfico, encolhe para o
 * eixo entrar; `hidden` dispensa o eixo de vez.
 */
export type AxisVisibility = 'visible' | 'hidden' | 'onHover';

/** Como pontos e rotulos de valor se mostram. `onHover` mostra os da série sob o ponteiro, e só eles. */
export type MarkVisibility = 'visible' | 'hidden' | 'onHover';

/** Se a marca da série aparece: sempre, nunca, ou só com a série sob o ponteiro. */
export function markShown(visibility: MarkVisibility, seriesFocused: boolean) {
  return visibility === 'visible' || (visibility === 'onHover' && seriesFocused);
}

export type AxisPosition = 'bottom' | 'top';

/** Altura do desenho, sem o cabeçalho nem a legenda, que ficam fora dela: um número fixa, `fill` entrega a decisão ao contêiner. */
export type ChartHeight = number | 'fill';

export interface ResolvedHeight {
  fillHeight: boolean;
  value: number;
}

/**
 * Altura efetiva do desenho. Com `fill`, ela vem da medida do contêiner, o que
 * permite ao gráfico ocupar a célula de um painel sem que ninguem repita a
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

/** Títulos dos eixos, pelo lugar na tela: `x` no eixo das categorias de baixo, `y` no da esquerda. Só a presenca importa aqui. */
export interface AxisTitles {
  x?: string;
  y?: string;
  yRight?: string;
}

export interface CartesianLayoutOptions {
  axisTitles?: AxisTitles;
  bottomLabels: readonly string[];
  font: LabelFont;
  height: number;
  labelAngle: AxisLabelAngle;
  leftLabels: readonly string[];
  /** Os eixos `onHover` estao a vista e ocupam a calha. */
  revealed?: boolean;
  rightLabels: readonly string[];
  /** Espaço mínimo a direita do desenho, para o que passa da ponta dele, como o rótulo de dado de uma barra horizontal. */
  rightRoom?: number;
  topRoom: number;
  width: number;
  xAxis: AxisVisibility;
  xAxisPosition?: AxisPosition;
  yAxis: AxisVisibility;
  yAxisRight: AxisVisibility;
}

export interface CartesianLayout {
  margins: ChartMargins;
  plot: ChartPlot;
  rotation: AxisLabelRotation;
}

/** Se o eixo ocupa a calha agora: o `onHover` só enquanto revelado. */
function ocupa(visibility: AxisVisibility, revealed: boolean) {
  return visibility === 'visible' || (visibility === 'onHover' && revealed);
}

/** O título acompanha o eixo `onHover`: surge e some com ele. Nos outros modos, fica sempre. */
function comTitulo(title: string | undefined, visibility: AxisVisibility, revealed: boolean) {
  return Boolean(title) && (visibility !== 'onHover' || revealed);
}

function calha(ocupada: boolean, labels: readonly string[], font: LabelFont) {
  return ocupada ? widestLabel(labels, font) + CHART_LABEL_OFFSET : 0;
}

/**
 * Ângulo dos rotulos do eixo de baixo. Em zero grau, dois rotulos vizinhos não
 * podem se tocar. Girados, o que precisa caber e a distância perpendicular
 * entre duas linhas de base vizinhas, que vale o passo vezes o seno do ângulo.
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

/** Altura que os rotulos de baixo ocupam, que e a caixa do texto já girado. */
function alturaDosRotulos(
  labels: readonly string[],
  font: LabelFont,
  rotation: AxisLabelRotation,
  ocupada: boolean,
) {
  if (!ocupada) {
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
 * Margens derivadas do conteúdo, e não de constantes. A ordem resolve sozinha a
 * dependência entre elas: as calhas laterais definem a largura util, a largura
 * util define o passo entre categorias, o passo define o ângulo dos rotulos e o
 * ângulo define a altura que eles ocupam embaixo.
 */
export function cartesianLayout({
  axisTitles = {},
  bottomLabels,
  font,
  height,
  labelAngle,
  leftLabels,
  revealed = false,
  rightLabels,
  rightRoom = 0,
  topRoom,
  width,
  xAxis,
  xAxisPosition = 'bottom',
  yAxis,
  yAxisRight,
}: CartesianLayoutOptions): CartesianLayout {
  const embaixo = ocupa(xAxis, revealed);
  const meioRotulo = embaixo ? widestLabel(bottomLabels, font) / 2 : 0;

  const left = Math.max(calha(ocupa(yAxis, revealed), leftLabels, font), CHART_EDGE_GAP);
  const right = Math.max(calha(ocupa(yAxisRight, revealed), rightLabels, font), CHART_EDGE_GAP, rightRoom);
  const salaX = comTitulo(axisTitles.x, xAxis, revealed) ? axisTitleRoom(font) : 0;
  const salaY = comTitulo(axisTitles.y, yAxis, revealed) ? axisTitleRoom(font) : 0;
  const salaYDireita = comTitulo(axisTitles.yRight, yAxisRight, revealed) ? axisTitleRoom(font) : 0;
  const plotWidth = Math.max(width - left - right - salaY - salaYDireita, 0);

  const rotation =
    labelAngle === 'auto'
      ? bottomLabelRotation(bottomLabels, font, plotWidth / Math.max(bottomLabels.length, 1))
      : labelAngle;

  // Sem rotação o rótulo das pontas transborda meia largura para cada lado; a
  // folga só precisa cobrir o que a calha lateral ainda não cobre.
  const bordaLateral = rotation === 0 ? meioRotulo : 0;
  const rotulos = alturaDosRotulos(bottomLabels, font, rotation, embaixo);
  const emCima = xAxisPosition === 'top';
  const girados = emCima && embaixo && rotation !== 0;
  const bordaDosGirados = girados ? widestLabel(bottomLabels, font) * Math.cos((rotation * Math.PI) / 180) : 0;
  const margins: ChartMargins = {
    bottom: emCima ? 0 : rotulos + salaX,
    left: Math.max(left, bordaLateral) + salaY,
    right: Math.max(right, bordaLateral, bordaDosGirados) + salaYDireita,
    top: Math.max(topRoom, emCima ? rotulos : 0, CHART_EDGE_GAP) + (emCima ? salaX : 0),
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
 * Rótulos de valor usados apenas para medir a calha do eixo, antes de a área de
 * desenho existir. Eles saem da altura total em vez da altura util, o que pode
 * render uma marca a mais ou a menos: a largura do rótulo mais largo não muda
 * por isso, e e só ela que a medida precisa.
 */
export function valueLabelsFor(
  domain: NumericRange,
  length: number,
  format: (value: number) => string,
  minTickStep?: number,
) {
  const escala = linearScale({ domain, range: [length, 0] });

  return ticksFor(escala, length, undefined, minTickStep).map(format);
}
