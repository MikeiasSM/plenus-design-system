import { polylabel, signedDistance, type Ring } from './polylabel';

const square: Ring = [
  [0, 0],
  [0, 100],
  [100, 100],
  [100, 0],
  [0, 0],
];

// "L" concavo: o centro da caixa, (50, 50), cai fora dele.
const ell: Ring = [
  [0, 0],
  [0, 100],
  [30, 100],
  [30, 30],
  [100, 30],
  [100, 0],
  [0, 0],
];

describe('polylabel', () => {
  it('acha o centro do quadrado', () => {
    const [x, y] = polylabel([square]);

    expect(x).toBeCloseTo(50, 0);
    expect(y).toBeCloseTo(50, 0);
  });

  it('no poligono concavo, poe o ponto dentro e longe das bordas, onde o centro da caixa falharia', () => {
    expect(signedDistance(50, 50, [ell])).toBeLessThan(0);

    const [x, y] = polylabel([ell]);

    expect(signedDistance(x, y, [ell])).toBeGreaterThanOrEqual(14);
  });

  it('respeita o furo como borda', () => {
    const hole: Ring = [
      [40, 40],
      [60, 40],
      [60, 60],
      [40, 60],
      [40, 40],
    ];
    const [x, y] = polylabel([square, hole]);

    expect(signedDistance(x, y, [square, hole])).toBeGreaterThan(15);
    expect(x > 40 && x < 60 && y > 40 && y < 60).toBe(false);
  });
});
