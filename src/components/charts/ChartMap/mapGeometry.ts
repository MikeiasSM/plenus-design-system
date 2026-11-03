import { geoArea, geoMercator, type GeoProjection } from 'd3-geo';
import type { Point, Ring } from './polylabel';

type Position = readonly number[];
type Polygon = readonly (readonly Position[])[];

/** Feicao GeoJSON. So `Polygon` e `MultiPolygon` se desenham; os demais tipos ficam de fora. */
export interface ChartMapFeature {
  geometry: { coordinates?: unknown; type: string } | null;
  id?: string | number;
  properties?: Record<string, unknown> | null;
}

export interface ChartMapFeatureCollection {
  features: readonly ChartMapFeature[];
}

/** A feicao como o d3-geo a desenha: sempre multipoligono, com os aneis validos e no sentido dele. */
export interface MapShape {
  geometry: { coordinates: number[][][][]; type: 'MultiPolygon' };
  properties: null;
  type: 'Feature';
}

export interface MapRegion {
  /** Caixa em longitude e latitude: oeste-sul e leste-norte. */
  bounds: readonly [Point, Point];
  feature: ChartMapFeature;
  id: string;
  /** Texto curto do rotulo no desenho, como a sigla. */
  label: string;
  name: string;
  shape: MapShape;
}

export interface MapKeys {
  idKey: string;
  labelKey?: string;
  nameKey: string;
}

export const MAP_PADDING = 12;
/** Teto do enquadramento do recorte, em vezes o do mapa inteiro: sozinho, o DF ocupava o palco. */
export const MAX_FOCUS_ZOOM = 12;
/** Teto do enquadramento pelos marcadores, que chega mais perto que o do recorte: os pontos cabem num bairro. */
export const MAX_MARKER_ZOOM = 100;
/** Lado minimo, em graus, da caixa dos pontos: uns 11 m. */
const MIN_POINT_SPAN = 1e-4;
const HEMISPHERE = 2 * Math.PI;

/** Le um caminho como `properties.sigla` na feicao. */
export function valueAt(source: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (node, key) => (node !== null && typeof node === 'object' ? (node as Record<string, unknown>)[key] : undefined),
      source,
    );
}

function polygonsOf(geometry: ChartMapFeature['geometry']): readonly Polygon[] {
  if (geometry?.type === 'Polygon') {
    return [geometry.coordinates as Polygon];
  }

  return geometry?.type === 'MultiPolygon' ? (geometry.coordinates as readonly Polygon[]) : [];
}

/**
 * Anel com menos de quatro posicoes nao fecha um poligono, e o d3-geo falha nele. O d3-geo le o anel externo no
 * sentido horario, o contrario da RFC 7946: no sentido dela, o poligono viraria o globo menos a regiao.
 */
function validPolygons(geometry: ChartMapFeature['geometry']) {
  return polygonsOf(geometry).flatMap((polygon) => {
    // Sem o anel externo, um furo viraria a regiao.
    if (!((polygon[0]?.length ?? 0) >= 4)) {
      return [];
    }

    const rings = polygon
      .filter((ring) => ring.length >= 4)
      .map((ring) => ring.map((position) => [Number(position[0]), Number(position[1])]));
    const inverted = geoArea({ type: 'Polygon', coordinates: rings }) > HEMISPHERE;

    return [inverted ? rings.map((ring) => [...ring].reverse()) : rings];
  });
}

function boundsOf(polygons: readonly number[][][][]): readonly [Point, Point] {
  let [west, south, east, north] = [Infinity, Infinity, -Infinity, -Infinity];

  for (const polygon of polygons) {
    for (const [longitude, latitude] of polygon[0]) {
      [west, south] = [Math.min(west, longitude), Math.min(south, latitude)];
      [east, north] = [Math.max(east, longitude), Math.max(north, latitude)];
    }
  }

  return [
    [west, south],
    [east, north],
  ];
}

/** Regioes desenhaveis da colecao, cada uma com o identificador, o nome e o rotulo lidos pelos caminhos. */
export function regionsOf(collection: ChartMapFeatureCollection, { idKey, labelKey, nameKey }: MapKeys): MapRegion[] {
  return collection.features.flatMap((feature) => {
    const rawId = valueAt(feature, idKey);
    const coordinates = validPolygons(feature.geometry);

    if ((typeof rawId !== 'string' && typeof rawId !== 'number') || coordinates.length === 0) {
      return [];
    }

    const id = String(rawId);
    const name = valueAt(feature, nameKey);
    const label = labelKey === undefined ? id : valueAt(feature, labelKey);

    return [
      {
        bounds: boundsOf(coordinates),
        feature,
        id,
        label: typeof label === 'string' || typeof label === 'number' ? String(label) : id,
        name: typeof name === 'string' && name ? name : id,
        shape: { geometry: { coordinates, type: 'MultiPolygon' }, properties: null, type: 'Feature' },
      },
    ];
  });
}

/** As feicoes desenhaveis da colecao, so para contornar: sem identificador, nome nem rotulo. */
export function outlinesOf(collection: ChartMapFeatureCollection): MapShape[] {
  return collection.features.flatMap((feature) => {
    const coordinates = validPolygons(feature.geometry);

    return coordinates.length > 0
      ? [{ geometry: { coordinates, type: 'MultiPolygon' as const }, properties: null, type: 'Feature' as const }]
      : [];
  });
}

/** Cantos opostos de uma caixa em longitude e latitude: oeste-sul e leste-norte. */
export type MapCorners = ReturnType<typeof cornersOf>;

/**
 * Os cantos da caixa das regioes e dos pontos. Na Mercator, longitude e latitude projetam cada uma num eixo, entao
 * enquadrar os cantos e enquadrar o desenho, sem percorrer de novo milhares de vertices.
 */
export function cornersOf(regions: readonly MapRegion[], points: readonly Point[] = []) {
  const [[west, south], [east, north]] = regions.reduce<readonly [Point, Point]>(
    ([[w, s], [e, n]], { bounds: [[rw, rs], [re, rn]] }) => [
      [Math.min(w, rw), Math.min(s, rs)],
      [Math.max(e, re), Math.max(n, rn)],
    ],
    points.reduce<readonly [Point, Point]>(
      ([[w, s], [e, n]], [longitude, latitude]) => [
        [Math.min(w, longitude), Math.min(s, latitude)],
        [Math.max(e, longitude), Math.max(n, latitude)],
      ],
      [
        [Infinity, Infinity],
        [-Infinity, -Infinity],
      ],
    ),
  );

  // Pontos coincidentes dariam caixa sem area, e a projecao nao se ajusta a ela.
  const span = points.length > 0 ? MIN_POINT_SPAN : 0;

  return {
    coordinates: [
      [west, south],
      [Math.max(east, west + span), Math.max(north, south + span)],
    ],
    type: 'MultiPoint' as const,
  };
}

/** Caixa projetada da regiao: oeste-norte em cima a esquerda, leste-sul embaixo a direita. */
export function projectedBounds(region: MapRegion, projection: GeoProjection): readonly [Point, Point] {
  const [[west, south], [east, north]] = region.bounds;

  return [projection([west, north]) ?? [0, 0], projection([east, south]) ?? [0, 0]];
}

/** Altura que o desenho pede quando ocupa a largura toda: com ela, nao sobra faixa vazia acima e abaixo. */
export function naturalHeight(corners: MapCorners, width: number, padding = MAP_PADDING) {
  const projection = geoMercator().fitWidth(Math.max(width - 2 * padding, 1), corners);
  const [[, top], [, bottom]] = corners.coordinates.map((corner) => projection(corner as [number, number]) ?? [0, 0]);

  return Math.ceil(Math.abs(bottom - top) + 2 * padding);
}

interface FitOptions {
  /** Teto da aproximacao, em vezes a do mapa inteiro. Sem ele, a caixa preenche a area. */
  maxZoom?: number;
  padding?: number;
}

/** Projecao que enquadra a caixa na area, com teto de aproximacao relativo ao mapa inteiro quando pedido. */
export function fitProjection(
  corners: MapCorners,
  all: readonly MapRegion[],
  width: number,
  height: number,
  { maxZoom, padding = MAP_PADDING }: FitOptions,
): GeoProjection {
  const extent: [[number, number], [number, number]] = [
    [padding, padding],
    [Math.max(width - padding, padding + 1), Math.max(height - padding, padding + 1)],
  ];
  const projection = geoMercator().fitExtent(extent, corners);

  if (maxZoom === undefined) {
    return projection;
  }

  const ceiling = geoMercator().fitExtent(extent, cornersOf(all)).scale() * maxZoom;

  if (projection.scale() > ceiling) {
    projection.scale(ceiling);
    const [[x0, y0], [x1, y1]] = corners.coordinates.map((corner) => projection(corner as [number, number]) ?? [0, 0]);
    const [tx, ty] = projection.translate();
    projection.translate([tx + width / 2 - (x0 + x1) / 2, ty + height / 2 - (y0 + y1) / 2]);
  }

  return projection;
}

/**
 * Partes da regiao na tela, sem os vertices a menos de um pixel do anterior: a busca do rotulo percorre centenas de
 * pontos, e nao os milhares da malha.
 */
export function projectedParts(region: MapRegion, projection: GeoProjection): Ring[][] {
  return region.shape.geometry.coordinates.map((polygon) =>
    polygon.map((ring) => {
      const points: Point[] = [];

      for (const position of ring) {
        const point = projection(position as [number, number]);
        const last = points.at(-1);

        if (point && (!last || Math.abs(point[0] - last[0]) + Math.abs(point[1] - last[1]) >= 1)) {
          points.push(point);
        }
      }

      return points;
    }),
  );
}
