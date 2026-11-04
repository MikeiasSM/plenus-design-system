import { describe, expect, it } from 'vitest';
import { posicionarSankey, type OpcoesDoLeiaute } from './leiauteDoSankey';

const opcoes: OpcoesDoLeiaute = {
  align: 'justify',
  flows: [
    { source: 'A', target: 'B', value: 10 },
    { source: 'A', target: 'C', value: 30 },
    { source: 'B', target: 'D', value: 10 },
    { source: 'C', target: 'D', value: 20 },
  ],
  labels: ['A', 'B', 'C', 'D'],
  nodePadding: 10,
  nodeWidth: 10,
  x0: 0,
  x1: 100,
  y0: 0,
  y1: 100,
};

const arredondar = (valor: number) => Math.round(valor * 10000) / 10000 + 0;

describe('posicionarSankey', () => {
  it('reproduz o leiaute do d3-sankey 0.12 num grafo de referencia', () => {
    const { links, nodes } = posicionarSankey(opcoes);

    expect(nodes.map((no) => [no.label, no.layer, no.x0, arredondar(no.y0), arredondar(no.y1)])).toEqual([
      ['A', 0, 0, 7.5629, 97.5629],
      ['B', 1, 45, 0, 22.5],
      ['C', 1, 45, 32.5, 100],
      ['D', 2, 90, 6.7221, 74.2221],
    ]);
    expect(links.map((ligacao) => [arredondar(ligacao.width), arredondar(ligacao.y0), arredondar(ligacao.y1)])).toEqual([
      [22.5, 18.8129, 11.25],
      [67.5, 63.8129, 66.25],
      [22.5, 11.25, 17.9721],
      [45, 55, 51.7221],
    ]);
  });

  it('da ao no a soma maior entre o que entra e o que sai', () => {
    const { nodes } = posicionarSankey({
      ...opcoes,
      flows: [
        { source: 'A', target: 'B', value: 10 },
        { source: 'B', target: 'C', value: 7 },
        { source: 'B', target: 'D', value: 2 },
      ],
      labels: ['A', 'B', 'C', 'D'],
    });

    expect(nodes.map((no) => no.value)).toEqual([10, 10, 7, 2]);
  });

  it('mantem os nos dentro da extensao e separados pelo espaco', () => {
    const { nodes } = posicionarSankey(opcoes);
    const coluna = nodes.filter((no) => no.layer === 1).sort((a, b) => a.y0 - b.y0);

    expect(Math.min(...nodes.map((no) => no.y0))).toBeGreaterThanOrEqual(-1e-9);
    expect(Math.max(...nodes.map((no) => no.y1))).toBeLessThanOrEqual(100 + 1e-9);
    expect(coluna[1].y0 - coluna[0].y1).toBeGreaterThanOrEqual(10 - 1e-9);
  });

  it.each([
    ['justify', 2],
    ['left', 1],
    ['right', 2],
    ['center', 1],
  ] as const)('com `%s`, o no sem saida e de profundidade 1 cai na camada %i', (align, camada) => {
    const { nodes } = posicionarSankey({
      ...opcoes,
      align,
      flows: [...opcoes.flows, { source: 'A', target: 'E', value: 5 }],
      labels: ['A', 'B', 'C', 'D', 'E'],
    });

    expect(nodes[4].layer).toBe(camada);
  });

  it('lanca em ciclo e em no ausente', () => {
    const ciclo = [
      { source: 'A', target: 'B', value: 1 },
      { source: 'B', target: 'A', value: 1 },
    ];

    expect(() => posicionarSankey({ ...opcoes, flows: ciclo, labels: ['A', 'B'] })).toThrow('ligacao circular');
    expect(() => posicionarSankey({ ...opcoes, labels: ['A', 'B', 'C'] })).toThrow('no ausente: D');
  });
});
