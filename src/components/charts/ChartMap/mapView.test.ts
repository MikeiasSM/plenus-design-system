import { geoMercator } from 'd3-geo';
import { centerView, clampView, initialView, isInitialView, panView, projectionOf, viewFrame, zoomView, type ViewFrame } from './mapView';

const WIDTH = 600;
const HEIGHT = 400;

const corners = (west: number, south: number, east: number, north: number) => ({
  coordinates: [
    [west, south],
    [east, north],
  ],
  type: 'MultiPoint' as const,
});

/** Mapa de 0 a 40 graus enquadrado na area; o conteudo pode passar do enquadramento. */
function frameOf(content = corners(0, 0, 40, 20)): ViewFrame {
  const base = geoMercator().fitExtent(
    [
      [12, 12],
      [WIDTH - 12, HEIGHT - 12],
    ],
    corners(0, 0, 40, 20),
  );

  return viewFrame({ base, ceiling: base.scale() * 50, content, height: HEIGHT, width: WIDTH });
}

describe('mapView', () => {
  it('comeca na escala 1, com o centro da area, e a escala vai ate o teto', () => {
    const frame = frameOf();
    const view = initialView(frame);

    expect(view.scale).toBe(1);
    expect(isInitialView(frame, view)).toBe(true);
    expect(frame.maxScale).toBeCloseTo(50);
    expect(clampView(frame, { ...view, scale: 0.2 }).scale).toBe(1);
    expect(clampView(frame, { ...view, scale: 900 }).scale).toBeCloseTo(50);
    expect(clampView(frame, { ...view, scale: Number.NaN }).scale).toBe(1);
  });

  it('com o mapa inteiro enquadrado, nao ha por onde arrastar na escala 1', () => {
    const frame = frameOf();
    const view = initialView(frame);

    expect(isInitialView(frame, panView(frame, view, 120, -80))).toBe(true);
    expect(isInitialView(frame, clampView(frame, { center: [500, 60], scale: 1 }))).toBe(true);
  });

  it('aproxima ancorado no ponto da area: o lugar sob o cursor nao anda', () => {
    const frame = frameOf();
    const anchor: [number, number] = [450, 120];
    const place = projectionOf(frame, initialView(frame)).invert!(anchor)!;
    const zoomed = zoomView(frame, initialView(frame), 4, anchor);
    const [x, y] = projectionOf(frame, zoomed)(place)!;

    expect(zoomed.scale).toBeCloseTo(4);
    expect(x).toBeCloseTo(anchor[0], 3);
    expect(y).toBeCloseTo(anchor[1], 3);
  });

  it('arrasta a vista aproximada pelos pixels do ponteiro, sem sair do conteudo', () => {
    const frame = frameOf();
    const zoomed = zoomView(frame, initialView(frame), 4, [300, 200]);
    const place = projectionOf(frame, zoomed).invert!([300, 200])!;
    const [x, y] = projectionOf(frame, panView(frame, zoomed, 50, -30))(place)!;

    expect(x).toBeCloseTo(350, 3);
    expect(y).toBeCloseTo(170, 3);

    const edge = panView(frame, zoomed, 100000, 0);
    const [left] = projectionOf(frame, edge)([0, 10])!;

    // A longitude 0 fica a 12 px da borda do enquadramento inicial, que a vista aproximada multiplica.
    expect(left).toBeCloseTo(48, 3);
  });

  it('afasta ate o enquadramento inicial e nao passa dele', () => {
    const frame = frameOf();
    const zoomed = zoomView(frame, initialView(frame), 4, [100, 50]);
    const out = zoomView(frame, zoomed, 1 / 8, [100, 50]);

    expect(out.scale).toBe(1);
    expect(isInitialView(frame, out)).toBe(true);
  });

  it('leva ao centro da area o ponto pedido', () => {
    const frame = frameOf(corners(-40, -30, 80, 50));
    const zoomed = zoomView(frame, initialView(frame), 4, [300, 200]);
    const target = projectionOf(frame, zoomed)([10, 8])!;
    const centered = centerView(frame, zoomed, target);
    const [x, y] = projectionOf(frame, centered)([10, 8])!;

    expect(x).toBeCloseTo(WIDTH / 2, 3);
    expect(y).toBeCloseTo(HEIGHT / 2, 3);
  });

  it('a vista inicial reproduz o enquadramento', () => {
    const frame = frameOf();
    const [x, y] = projectionOf(frame, initialView(frame))([25, 7])!;
    const [baseX, baseY] = frame.base([25, 7])!;

    expect(x).toBeCloseTo(baseX, 6);
    expect(y).toBeCloseTo(baseY, 6);
  });
});
