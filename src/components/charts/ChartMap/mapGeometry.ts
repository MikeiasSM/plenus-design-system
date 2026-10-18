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

/**
 * Os cantos da caixa das regioes. Na Mercator, longitude e latitude projetam cada uma num eixo, entao enquadrar os
 * cantos e enquadrar o desenho, sem percorrer de novo milhares de vertices.
 */
function cornersOf(regions: readonly MapRegion[]) {
  const [[west, south], [east, north]] = regions.reduce<readonly [Point, Point]>(
    ([[w, s], [e, n]], { bounds: [[rw, rs], [re, rn]] }) => [
      [Math.min(w, rw), Math.min(s, rs)],
      [Math.max(e, re), Math.max(n, rn)],
    ],
    [
      [Infinity, Infinity],
      [-Infinity, -Infinity],
    ],
  );

  return {
    coordinates: [
      [west, south],
      [east, north],
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
export function naturalHeight(target: readonly MapRegion[], width: number) {
  const corners = cornersOf(target);
  const projection = geoMercator().fitWidth(Math.max(width - 2 * MAP_PADDING, 1), corners);
  const [[, top], [, bottom]] = corners.coordinates.map((corner) => projection(corner as [number, number]) ?? [0, 0]);

  return Math.ceil(Math.abs(bottom - top) + 2 * MAP_PADDING);
}

/** Projecao que enquadra o recorte na area, com teto de aproximacao relativo ao mapa inteiro. */
export function fitProjection(
  target: readonly MapRegion[],
  all: readonly MapRegion[],
  width: number,
  height: number,
): GeoProjection {
  const extent: [[number, number], [number, number]] = [
    [MAP_PADDING, MAP_PADDING],
    [Math.max(width - MAP_PADDING, MAP_PADDING + 1), Math.max(height - MAP_PADDING, MAP_PADDING + 1)],
  ];
  const corners = cornersOf(target);
  const projection = geoMercator().fitExtent(extent, corners);

  if (target.length === all.length) {
    return projection;
  }

  const ceiling = geoMercator().fitExtent(extent, cornersOf(all)).scale() * MAX_FOCUS_ZOOM;

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
