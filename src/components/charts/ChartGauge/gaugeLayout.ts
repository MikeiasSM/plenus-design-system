import { measureLabel, truncateToWidth, type LabelFont } from '../core';
import type { ChartGaugeScaleLabels, ChartGaugeTicks } from './ChartGauge';
import type { CenterLine, GaugeCenter } from './gaugeReading';

/** Até essa meia-abertura o arco é uma meia-lua, e o centro se apoia na linha de base. */
const SEMICIRCLE_LIMIT = (95 * Math.PI) / 180;
const SEARCH_STEPS = 24;
const OUTSIDE_LABEL_GAP = 5;

export type TextAnchor = 'start' | 'middle' | 'end';

export interface AngledLabel {
  angle: number;
  text: string;
}

export interface OutsideLabel extends AngledLabel {
  kind: 'segment' | 'target';
}

export interface PlacedLabel<T extends AngledLabel = AngledLabel> {
  anchor: TextAnchor;
  label: T;
  x: number;
  y: number;
}

export interface GaugeLayoutInput {
  center: GaugeCenter;
  compact: boolean;
  /** Radianos a partir do topo, no sentido horário. */
  endAngle: number;
  font: LabelFont;
  height: number;
  /** Rótulos de ponta, mínimo e máximo, quando `scaleLabels` é `minMax`. */
  minMaxLabels: readonly [AngledLabel, AngledLabel];
  needle: boolean;
  /** Régua e marca da meta, além do raio externo do arco. */
  outerBand: number;
  outsideLabels: readonly OutsideLabel[];
  scaleLabels: ChartGaugeScaleLabels;
  startAngle: number;
  thickness: number;
  /** Rótulos das marcas principais, na ordem em que disputam espaço. */
  tickLabels: readonly AngledLabel[];
  ticks: ChartGaugeTicks;
  width: number;
}

export interface GaugeCenterLayout {
  height: number;
  lineHeight: number;
  lines: readonly CenterLine[];
  top: number;
  value?: { family: string; size: number; text: string };
  width: number;
}

export interface GaugeLayout {
  center: GaugeCenterLayout;
  cx: number;
  cy: number;
  innerRadius: number;
  outsideLabels: readonly PlacedLabel<OutsideLabel>[];
  pinRadius: number;
  radius: number;
  scaleLabels: readonly PlacedLabel[];
  thickness: number;
}

interface Box {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export function pointAt(angle: number, radius: number): [number, number] {
  return [radius * Math.sin(angle), -radius * Math.cos(angle)];
}

function lineText(line: CenterLine) {
  if (line.kind === 'text') {
    return line.text;
  }

  return line.kind === 'delta' && line.label ? `${line.glyph} ${line.text} ${line.label}` : `${line.glyph} ${line.text}`;
}

function anchorX(anchor: TextAnchor, x: number, width: number) {
  return anchor === 'start' ? x : anchor === 'end' ? x - width : x - width / 2;
}

/** Rótulo que colide com um já posto não entra. */
function place(placed: Box[], box: Box) {
  if (placed.some((other) => box.x0 < other.x1 && box.x1 > other.x0 && box.y0 < other.y1 && box.y1 > other.y0)) {
    return false;
  }

  placed.push(box);
  return true;
}

/**
 * O centro cabe no vazio do arco: o valor desce na escala tipográfica até caber, e as linhas que não cabem saem, de
 * baixo para cima. Na meia-lua com ponteiro, o bloco vai para baixo do pino, fora do arco.
 */
function layoutCenter(radius: number, input: GaugeLayoutInput, tickLabelWidth: number) {
  const { center, compact, font, needle, scaleLabels, ticks } = input;
  const thickness = Math.min(input.thickness, radius * 0.42);
  const innerRadius = radius - thickness;
  const semicircle = Math.max(Math.abs(input.startAngle), Math.abs(input.endAngle)) <= SEMICIRCLE_LIMIT;
  const belowPin = needle && semicircle;
  const pinRadius = compact ? 4 : 7;
  const lineHeight = font.lineHeight;
  const inset = (ticks !== 'hidden' ? 10 : 3) + (scaleLabels === 'ticks' ? 14 + 0.35 * tickLabelWidth : 0);
  const room = Math.max(innerRadius - inset, 6);
  const maxWidth = belowPin
    ? Infinity
    : (!needle && (semicircle || scaleLabels !== 'ticks') ? 1.8 : 1.6) * room;
  const maxHeight = belowPin ? Infinity : semicircle ? room * 0.92 : needle ? room * 0.8 - pinRadius : room * 1.45;

  const measure = (line: CenterLine) => measureLabel(lineText(line), font);
  // A linha larga demais tenta a forma curta antes de sair.
  const shortened = (line: CenterLine): CenterLine => {
    if (measure(line) <= maxWidth) return line;
    if (line.kind === 'delta') return { ...line, label: undefined };
    return line.kind === 'warn' ? { ...line, text: line.short } : line;
  };
  const fitted = center.lines.map(shortened).filter((line) => measure(line) <= maxWidth);

  const cap = radius * (compact ? 0.36 : 0.3);
  const steps = font.centerSteps.filter((step) => step.size <= cap);
  const candidates = steps.length > 0 ? steps : font.centerSteps.slice(-1);
  const linesHeight = fitted.length * lineHeight + 4;

  // Na meia-lua sem ponteiro, o valor fica no alto do bloco, onde a corda do arco é mais curta.
  const roomFor = (size: number) => {
    const chordY = linesHeight + size * 0.8;
    if (belowPin) return 1.6 * room;
    if (semicircle && !needle) return 1.84 * Math.sqrt(Math.max(room * room - chordY * chordY, room * room * 0.2));
    return 0.95 * maxWidth;
  };

  let value: GaugeCenterLayout['value'];

  if (center.value !== undefined) {
    const fontOf = (size: number, display: boolean) => ({ ...font, family: display ? font.headingFamily : font.family, size });
    const step =
      candidates.find((option) => measureLabel(center.value!, fontOf(option.size, option.display)) <= roomFor(option.size)) ??
      candidates[candidates.length - 1];
    const stepFont = fontOf(step.size, step.display);
    value = { family: stepFont.family, size: step.size, text: truncateToWidth(center.value, stepFont, roomFor(step.size)) };
  }

  const lines = [...fitted];
  const heightOf = () => (value ? value.size : 0) + lines.length * lineHeight;

  while (lines.length > 0 && heightOf() > maxHeight) {
    lines.pop();
  }

  const height = heightOf();
  const top = needle ? pinRadius + (compact ? 3 : 8) : semicircle ? -height - (compact ? 1 : 4) : -height / 2;
  const width = Math.max(
    value ? measureLabel(value.text, { ...font, family: value.family, size: value.size }) : 0,
    ...lines.map(measure),
    0,
  );

  return {
    center: { height, lineHeight, lines, top, value, width },
    innerRadius,
    pinRadius,
    thickness,
  };
}

function outsidePlacement(label: OutsideLabel, radius: number, font: LabelFont) {
  const [x, y] = pointAt(label.angle, radius + OUTSIDE_LABEL_GAP);
  const sin = Math.sin(label.angle);
  const anchor: TextAnchor = sin > 0.3 ? 'start' : sin < -0.3 ? 'end' : 'middle';
  const width = measureLabel(label.text, font);

  return { anchor, label, width, x, y: y - Math.cos(label.angle) * 8 };
}

function minMaxPlacement(label: AngledLabel, radius: number, thickness: number) {
  const [x, y] = pointAt(label.angle, radius - thickness / 2);

  return { anchor: 'middle' as const, label, x, y: y + thickness / 2 + 14 };
}

function extentsAt(radius: number, input: GaugeLayoutInput, tickLabelWidth: number) {
  const metrics = layoutCenter(radius, input, tickLabelWidth);
  const outer = radius + input.outerBand;
  const box: Box = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
  const add = (x0: number, x1: number, y0: number, y1: number) => {
    box.x0 = Math.min(box.x0, x0);
    box.x1 = Math.max(box.x1, x1);
    box.y0 = Math.min(box.y0, y0);
    box.y1 = Math.max(box.y1, y1);
  };
  const addPoint = ([x, y]: [number, number]) => add(x, x, y, y);
  const cardinal = [-Math.PI, -Math.PI / 2, 0, Math.PI / 2, Math.PI].filter(
    (angle) => angle > input.startAngle && angle < input.endAngle,
  );

  [input.startAngle, input.endAngle, ...cardinal].forEach((angle) => addPoint(pointAt(angle, outer)));
  [input.startAngle, input.endAngle].forEach((angle) => addPoint(pointAt(angle, metrics.innerRadius)));

  input.outsideLabels.forEach((label) => {
    const { anchor, width, x, y } = outsidePlacement(label, outer, input.font);
    const x0 = anchorX(anchor, x, width);
    add(x0, x0 + width, y - 8, y + 8);
  });

  if (input.scaleLabels === 'minMax') {
    input.minMaxLabels.forEach((label) => {
      const { x, y } = minMaxPlacement(label, radius, metrics.thickness);
      const width = measureLabel(label.text, input.font);
      add(x - width / 2, x + width / 2, y - 10, y + 4);
    });
  }

  const { center } = metrics;

  if (center.height > 0) {
    add(-center.width / 2, center.width / 2, center.top, center.top + center.height + 2);
  }

  if (input.needle) {
    add(-metrics.pinRadius, metrics.pinRadius, -metrics.pinRadius, metrics.pinRadius);
  }

  return { box, metrics };
}

/** Maior raio em que arco, rótulos e centro cabem na área, e a posição de cada rótulo nele. */
export function layoutGauge(input: GaugeLayoutInput): GaugeLayout {
  const { font, height, width } = input;
  const tickLabelWidth =
    input.scaleLabels === 'ticks' ? Math.max(0, ...input.tickLabels.map((label) => measureLabel(label.text, font))) : 0;
  const fits = (radius: number) => {
    const { box } = extentsAt(radius, input, tickLabelWidth);
    return box.x1 - box.x0 <= width - 2 && box.y1 - box.y0 <= height - 2;
  };

  let low = 4;
  let high = Math.max(width, height);

  for (let step = 0; step < SEARCH_STEPS; step += 1) {
    const middle = (low + high) / 2;
    if (fits(middle)) low = middle;
    else high = middle;
  }

  const radius = low;
  const { box, metrics } = extentsAt(radius, input, tickLabelWidth);
  const { center, innerRadius, thickness } = metrics;

  const outsidePlaced: Box[] = [];
  const outsideLabels = [...input.outsideLabels]
    .sort((a, b) => Number(b.kind === 'target') - Number(a.kind === 'target'))
    .map((label) => outsidePlacement(label, radius + input.outerBand, font))
    .filter(({ anchor, width: labelWidth, x, y }) => {
      const x0 = anchorX(anchor, x, labelWidth);
      return place(outsidePlaced, { x0: x0 - 3, x1: x0 + labelWidth + 3, y0: y - 7, y1: y + 7 });
    })
    .map(({ anchor, label, x, y }) => ({ anchor, label, x, y }));

  return {
    center,
    cx: -box.x0 + (width - (box.x1 - box.x0)) / 2,
    cy: -box.y0 + (height - (box.y1 - box.y0)) / 2,
    innerRadius,
    outsideLabels,
    pinRadius: metrics.pinRadius,
    radius,
    scaleLabels: placeScaleLabels(input, innerRadius, radius, thickness, center),
    thickness,
  };
}

function placeScaleLabels(
  input: GaugeLayoutInput,
  innerRadius: number,
  radius: number,
  thickness: number,
  center: GaugeCenterLayout,
): PlacedLabel[] {
  if (input.scaleLabels === 'minMax') {
    return input.minMaxLabels.map((label) => minMaxPlacement(label, radius, thickness));
  }

  if (input.scaleLabels === 'hidden') {
    return [];
  }

  const labelRadius = innerRadius - (input.ticks !== 'hidden' ? 14 : 6);
  const placed: Box[] = [
    { x0: -center.width / 2 - 3, x1: center.width / 2 + 3, y0: center.top - 2, y1: center.top + center.height + 2 },
  ];

  return input.tickLabels.flatMap((label) => {
    const [x, baseY] = pointAt(label.angle, labelRadius);
    const sin = Math.sin(label.angle);
    const y = baseY + Math.cos(label.angle) * 6;
    const anchor: TextAnchor = sin > 0.3 ? 'end' : sin < -0.3 ? 'start' : 'middle';
    const labelWidth = measureLabel(label.text, input.font);
    const x0 = anchorX(anchor, x, labelWidth);

    return place(placed, { x0: x0 - 2, x1: x0 + labelWidth + 2, y0: y - 7, y1: y + 7 }) ? [{ anchor, label, x, y }] : [];
  });
}
