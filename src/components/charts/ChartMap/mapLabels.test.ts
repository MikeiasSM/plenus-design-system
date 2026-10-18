import { largestPart, planLabels, type LabelCandidate } from './mapLabels';
import { signedDistance, type Ring } from './polylabel';

const rect = (x: number, y: number, width: number, height: number): Ring => [
  [x, y],
  [x, y + height],
  [x + width, y + height],
  [x + width, y],
  [x, y],
];

function candidate(id: string, ring: Ring, value?: string): LabelCandidate {
  const xs = ring.map(([x]) => x);
  const ys = ring.map(([, y]) => y);

  return {
    bounds: [
      [Math.min(...xs), Math.min(...ys)],
      [Math.max(...xs), Math.max(...ys)],
    ],
    id,
    parts: [[ring]],
    title: id,
    value,
  };
}

// Cada caractere mede 7 px; a linha, 14.
const options = {
  callouts: true,
  calloutStep: 16,
  height: 300,
  lineHeight: 14,
  measure: (text: string) => text.length * 7,
  right: 400,
};

describe('rotulos do mapa', () => {
  it('poe sigla e valor dentro da regiao que comporta os dois', () => {
    const { callouts, inside } = planLabels([candidate('SP', rect(0, 0, 200, 200), '48 mil')], options);

    expect(inside).toEqual([{ id: 'SP', title: 'SP', value: '48 mil', x: 100, y: 100 }]);
    expect(callouts).toEqual([]);
  });

  it('sem espaco para o valor, fica so a sigla', () => {
    const { inside } = planLabels([candidate('ES', rect(0, 0, 30, 20), '4.310')], options);

    expect(inside).toHaveLength(1);
    expect(inside[0].value).toBeUndefined();
  });

  it('sem espaco nem para a sigla, leva o rotulo para a coluna junto ao desenho, com o ponto de origem na regiao', () => {
    const { callouts, inside } = planLabels(
      [candidate('MG', rect(0, 0, 200, 200)), candidate('DF', rect(150, 40, 6, 6), '5.640')],
      options,
    );

    expect(inside.map((label) => label.id)).toEqual(['MG']);
    expect(callouts).toHaveLength(1);
    expect(callouts[0]).toMatchObject({ id: 'DF', title: 'DF', value: '5.640', x: 216 });
    expect(callouts[0].anchor[0]).toBeCloseTo(153, 0);
  });

  it('no "L", o rotulo entra no braco, e nao no centro da caixa, que cai fora', () => {
    const ell: Ring = [
      [0, 0],
      [0, 100],
      [30, 100],
      [30, 30],
      [100, 30],
      [100, 0],
      [0, 0],
    ];
    const { inside } = planLabels([candidate('GO', ell)], options);

    expect(inside).toHaveLength(1);
    expect(signedDistance(inside[0].x, inside[0].y, [ell])).toBeGreaterThan(10);
  });

  it('nao deixa um rotulo cobrir outro', () => {
    const { callouts, inside } = planLabels(
      [candidate('AAAA', rect(0, 0, 80, 40)), candidate('BBBB', rect(0, 0, 80, 40))],
      options,
    );

    expect(inside.map((label) => label.id)).toEqual(['AAAA']);
    expect(callouts.map((label) => label.id)).toEqual(['BBBB']);
  });

  it('deixa sem rotulo a regiao pequena do lado oposto a coluna, em vez de cruzar o desenho com a linha guia', () => {
    const { callouts } = planLabels(
      [candidate('MG', rect(0, 0, 200, 200)), candidate('AC', rect(10, 40, 6, 6)), candidate('DF', rect(150, 40, 6, 6))],
      options,
    );

    expect(callouts.map((label) => label.id)).toEqual(['DF']);
  });

  it('quando a coluna nao comporta os pequenos, como nos municipios, nenhum vai para ela', () => {
    const tiny = Array.from({ length: 40 }, (_, index) => candidate(`m${index}`, rect(index * 2.5, 0, 2, 2)));

    expect(planLabels(tiny, options).callouts).toEqual([]);
    expect(planLabels(tiny.slice(0, 3), { ...options, callouts: false }).callouts).toEqual([]);
  });

  it('escolhe a maior parte da regiao, para a ilha nao deslocar o rotulo', () => {
    const island = rect(300, 300, 2, 2);
    const mainland = rect(0, 0, 50, 50);

    expect(largestPart([[island], [mainland]])).toEqual([mainland]);
  });
});
