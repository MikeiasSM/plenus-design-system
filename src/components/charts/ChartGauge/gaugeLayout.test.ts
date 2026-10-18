import { labelFontOf } from '../core';
import { layoutGauge, type GaugeLayoutInput } from './gaugeLayout';

const half = Math.PI / 2;

function input(overrides: Partial<GaugeLayoutInput> = {}): GaugeLayoutInput {
  return {
    center: { lines: [{ kind: 'text', text: 'chamados no prazo' }], value: '87,4%' },
    compact: false,
    endAngle: half,
    font: labelFontOf(null),
    height: 220,
    minMaxLabels: [
      { angle: -half, text: '0%' },
      { angle: half, text: '100%' },
    ],
    needle: false,
    outerBand: 0,
    outsideLabels: [],
    scaleLabels: 'minMax',
    startAngle: -half,
    thickness: 16,
    tickLabels: [],
    ticks: 'hidden',
    width: 360,
    ...overrides,
  };
}

describe('layoutGauge', () => {
  it('cabe a meia-lua na area e cresce com ela', () => {
    const small = layoutGauge(input());
    const large = layoutGauge(input({ height: 400, width: 720 }));

    expect(small.radius).toBeGreaterThan(100);
    expect(small.radius).toBeLessThan(220);
    expect(large.radius).toBeGreaterThan(small.radius);
  });

  it('cede raio para os rotulos de fora do arco', () => {
    const bare = layoutGauge(input());
    const labeled = layoutGauge(
      input({ outsideLabels: [{ angle: half * 0.9, kind: 'target', text: 'Meta de atendimento 95%' }] }),
    );

    expect(labeled.radius).toBeLessThan(bare.radius);
    expect(labeled.outsideLabels).toHaveLength(1);
  });

  it('deixa de fora o rotulo que colide com um ja posto, e a meta vem primeiro', () => {
    const layout = layoutGauge(
      input({
        outsideLabels: [
          { angle: 0, kind: 'segment', text: 'Atenção' },
          { angle: 0.01, kind: 'target', text: 'Meta 95%' },
        ],
      }),
    );

    expect(layout.outsideLabels.map(({ label }) => label.kind)).toEqual(['target']);
  });

  it('desce o valor do centro na escala tipografica num arco pequeno', () => {
    const roomy = layoutGauge(input({ height: 300, width: 600 }));
    const tight = layoutGauge(input({ compact: true, height: 96, thickness: 8, width: 140 }));

    expect(tight.center.value!.size).toBeLessThan(roomy.center.value!.size);
  });
});
