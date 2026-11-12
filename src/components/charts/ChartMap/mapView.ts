import { geoMercator, type GeoProjection } from 'd3-geo';
import type { MapCorners } from './mapGeometry';
import type { Point } from './polylabel';

/** Vista do mapa: o ponto no centro da area e quantas vezes o enquadramento inicial foi aproximado. */
export interface ChartMapView {
  /** `[longitude, latitude]`. */
  center: [number, number];
  /** 1 e o enquadramento inicial. */
  scale: number;
}

/**
 * A area de desenho, o enquadramento inicial e os limites da vista. As contas correm em pixels do enquadramento
 * inicial (`base`): na Mercator, aproximar e deslocar sao uma semelhanca, e a vista e um retangulo nesse plano.
 */
export interface ViewFrame {
  base: GeoProjection;
  /** Caixa do conteudo e da area inicial, em pixels do enquadramento inicial: a vista nao sai dela. */
  bounds: readonly [Point, Point];
  height: number;
  maxScale: number;
  width: number;
}

export interface ViewFrameInput {
  base: GeoProjection;
  /** Cantos do conteudo, em longitude e latitude. */
  content: MapCorners;
  height: number;
  /** Escala da projecao no teto da aproximacao. */
  ceiling: number;
  width: number;
}

/** Quanto cada botao e cada tecla aproximam. */
export const ZOOM_STEP = 2;

const CENTER_TOLERANCE = 0.5;

export function viewFrame({ base, ceiling, content, height, width }: ViewFrameInput): ViewFrame {
  const [[x0, y0], [x1, y1]] = content.coordinates.map((corner) => base(corner as [number, number]) ?? [0, 0]);

  return {
    base,
    bounds: [
      [Math.min(x0, x1, 0), Math.min(y0, y1, 0)],
      [Math.max(x0, x1, width), Math.max(y0, y1, height)],
    ],
    height,
    maxScale: Math.max(1, ceiling / base.scale()),
    width,
  };
}

function pixelsOf({ base }: ViewFrame, view: ChartMapView): Point {
  return base(view.center) ?? [0, 0];
}

function viewAt(frame: ViewFrame, [x, y]: Point, scale: number): ChartMapView {
  const [longitude, latitude] = frame.base.invert!([x, y])!;

  return { center: [longitude, latitude], scale };
}

function limitAxis(center: number, span: number, low: number, high: number) {
  return high - low <= span ? (low + high) / 2 : Math.min(Math.max(center, low + span / 2), high - span / 2);
}

function place(frame: ViewFrame, [x, y]: Point, scale: number): ChartMapView {
  const limited = Math.min(Math.max(Number.isFinite(scale) ? scale : 1, 1), frame.maxScale);
  const [[left, top], [right, bottom]] = frame.bounds;

  return viewAt(
    frame,
    [limitAxis(x, frame.width / limited, left, right), limitAxis(y, frame.height / limited, top, bottom)],
    limited,
  );
}

/** O enquadramento inicial: o centro da area de desenho, na escala 1. */
export function initialView(frame: ViewFrame): ChartMapView {
  return viewAt(frame, [frame.width / 2, frame.height / 2], 1);
}

export function isInitialView(frame: ViewFrame, view: ChartMapView) {
  const [x, y] = pixelsOf(frame, view);

  return (
    Math.abs(view.scale - 1) < 1e-6 &&
    Math.hypot(x - frame.width / 2, y - frame.height / 2) < CENTER_TOLERANCE
  );
}

/** As duas vistas desenham o mesmo mapa, a menos de uma fracao de pixel. */
export function sameView(frame: ViewFrame, a: ChartMapView, b: ChartMapView) {
  const [ax, ay] = pixelsOf(frame, a);
  const [bx, by] = pixelsOf(frame, b);

  return Math.abs(a.scale - b.scale) < 1e-6 && Math.hypot(ax - bx, ay - by) < 0.01;
}

/** Traz a vista para dentro dos limites: escala entre 1 e o teto, e o centro de modo que a area nao saia do conteudo. */
export function clampView(frame: ViewFrame, view: ChartMapView): ChartMapView {
  const [longitude, latitude] = view.center;

  return Number.isFinite(longitude) && Number.isFinite(latitude)
    ? place(frame, pixelsOf(frame, view), view.scale)
    : initialView(frame);
}

/**
 * Multiplica a escala por `factor` e leva o ponto da area que estava em `from` para `to`, ambos em pixels da area
 * de desenho. Com `from` igual a `to`, aproxima ancorado nele; com `factor` 1, desloca.
 */
export function transformView(frame: ViewFrame, view: ChartMapView, factor: number, from: Point, to: Point): ChartMapView {
  const [x, y] = pixelsOf(frame, view);
  const scale = Math.min(Math.max(view.scale * factor, 1), frame.maxScale);
  const anchorX = x + (from[0] - frame.width / 2) / view.scale;
  const anchorY = y + (from[1] - frame.height / 2) / view.scale;

  return place(
    frame,
    [anchorX - (to[0] - frame.width / 2) / scale, anchorY - (to[1] - frame.height / 2) / scale],
    scale,
  );
}

export function zoomView(frame: ViewFrame, view: ChartMapView, factor: number, anchor: Point): ChartMapView {
  return transformView(frame, view, factor, anchor, anchor);
}

/** Arrasta o mapa `dx` e `dy` pixels. */
export function panView(frame: ViewFrame, view: ChartMapView, dx: number, dy: number): ChartMapView {
  return transformView(frame, view, 1, [0, 0], [dx, dy]);
}

/** Leva para o centro da area o ponto dela em `point`. */
export function centerView(frame: ViewFrame, view: ChartMapView, [x, y]: Point): ChartMapView {
  return panView(frame, view, frame.width / 2 - x, frame.height / 2 - y);
}

export function projectionOf(frame: ViewFrame, view: ChartMapView): GeoProjection {
  return geoMercator()
    .scale(frame.base.scale() * view.scale)
    .center(view.center)
    .translate([frame.width / 2, frame.height / 2]);
}
