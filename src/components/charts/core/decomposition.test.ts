import { legendRoom, plotRoom, removedParts } from './decomposition';
import type { LabelFont } from './measureText';

const font = { centerSteps: [], family: 'sans-serif', headingFamily: 'sans-serif', labelWeight: 600, lineHeight: 16, size: 12 } as LabelFont;
const entries = [
  { color: 'red', label: 'Receita' },
  { color: 'blue', label: 'Custo' },
];

describe('removedParts', () => {
  const order = ['legend', 'titles', 'labels'] as const;
  const minimum = { height: 100, width: 100 };
  /** Cada parte devolve largura ou altura: a legenda e os títulos, largura; os rótulos, altura. */
  const medir = (removed: ReadonlySet<string>) => ({
    height: 60 + (removed.has('labels') ? 50 : 0),
    width: 60 + (removed.has('legend') ? 20 : 0) + (removed.has('titles') ? 30 : 0),
  });

  it('nao retira nada enquanto a area cabe', () => {
    expect([...removedParts(order, () => ({ height: 100, width: 100 }), minimum)]).toEqual([]);
  });

  it('retira na ordem e para na primeira parte que faz a area caber', () => {
    const removed = removedParts(order, medir, { height: 60, width: 100 });

    expect([...removed]).toEqual(['legend', 'titles']);
  });

  it('nao retira a parte que nao devolve espaco na dimensao que falta', () => {
    expect([...removedParts(order, medir, { height: 100, width: 60 })]).toEqual(['labels']);
  });

  it('a ultima instancia sai so quando as demais nao bastaram', () => {
    expect([...removedParts(order, () => ({ height: 0, width: 0 }), minimum, 'labels')]).toEqual(['labels']);
    expect([...removedParts(order, () => ({ height: 100, width: 100 }), minimum, 'labels')]).toEqual([]);
  });
});

describe('legendRoom', () => {
  it('ao lado tira largura, e em cima ou embaixo tira altura so quando a altura e do conteiner', () => {
    expect(legendRoom(entries, 'right', font, 400, false).width).toBeGreaterThan(0);
    expect(legendRoom(entries, 'bottom', font, 400, false)).toEqual({ height: 0, width: 0 });
    expect(legendRoom(entries, 'bottom', font, 400, true).height).toBeGreaterThan(0);
  });

  it('a legenda que quebra em linhas tira mais altura', () => {
    const uma = legendRoom(entries, 'bottom', font, 400, true).height;
    const varias = legendRoom(entries, 'bottom', font, 60, true).height;

    expect(varias).toBeGreaterThan(uma);
  });

  it('sem legenda, ou abaixo do minimo de entradas, nao tira nada', () => {
    expect(legendRoom(entries, 'none', font, 400, true)).toEqual({ height: 0, width: 0 });
    expect(legendRoom(entries.slice(0, 1), 'right', font, 400, true, 2)).toEqual({ height: 0, width: 0 });
  });
});

describe('plotRoom', () => {
  const legend = { height: 20, width: 80 };
  const measured = { height: 100, width: 200 };

  it('mantem a medida quando a legenda continua como estava', () => {
    expect(plotRoom(measured, legend, true, true)).toEqual(measured);
    expect(plotRoom(measured, legend, false, false)).toEqual(measured);
  });

  it('devolve o espaco da legenda que saiu e desconta o da que voltou', () => {
    expect(plotRoom(measured, legend, true, false)).toEqual({ height: 120, width: 280 });
    expect(plotRoom(measured, legend, false, true)).toEqual({ height: 80, width: 120 });
  });
});
