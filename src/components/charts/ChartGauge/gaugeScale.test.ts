import {
  gaugeDomain,
  gaugeOrigin,
  gaugeSegments,
  majorTicks,
  segmentAt,
  tickLabelPriority,
} from './gaugeScale';

describe('gaugeDomain', () => {
  it('vai de 0 a 100 sem escala nem meta', () => {
    expect(gaugeDomain(undefined, undefined, undefined)).toEqual({ min: 0, max: 100 });
  });

  it('vai a 120% da meta quando max e omitido', () => {
    expect(gaugeDomain(undefined, undefined, { value: 2_000_000 })).toEqual({ min: 0, max: 2_400_000 });
  });

  it('respeita o max declarado mesmo com meta', () => {
    expect(gaugeDomain(0, 150, { value: 100 }).max).toBe(150);
  });

  it('troca limites invalidos pelo padrao e nunca deixa a escala vazia', () => {
    expect(gaugeDomain(Number.NaN, Number.POSITIVE_INFINITY, { value: Number.NaN })).toEqual({ min: 0, max: 100 });
    expect(gaugeDomain(50, 50, undefined)).toEqual({ min: 50, max: 51 });
  });
});

describe('gaugeSegments', () => {
  const domain = { min: 0, max: 100 };

  it('encadeia as faixas pelo to, a primeira em min e a ultima ate max', () => {
    const segments = gaugeSegments([{ to: 80 }, { to: 90 }, {}], domain, { unit: 1 });

    expect(segments.map(({ from, to }) => [from, to])).toEqual([
      [0, 80],
      [80, 90],
      [90, 100],
    ]);
  });

  it('ignora faixa invalida ou que nao avanca sobre a anterior', () => {
    const segments = gaugeSegments([{ to: 50 }, { to: 40 }, { to: Number.NaN }, { to: 70 }], domain, { unit: 1 });

    expect(segments.map(({ to }) => to)).toEqual([50, 70]);
  });

  it('le o to como fracao da meta quando a unidade e a meta', () => {
    const segments = gaugeSegments([{ to: 0.7 }, { to: 1 }, {}], { min: 0, max: 240 }, { unit: 200 });

    expect(segments.map(({ to }) => to)).toEqual([140, 200, 240]);
  });

  it('pinta pela regra da familia: cor, intencao e paleta', () => {
    const segments = gaugeSegments([{ to: 30, color: '#123456' }, { to: 60, intent: 'warning' }, {}], domain, { unit: 1 });

    expect(segments.map(({ color }) => color)).toEqual(['#123456', 'var(--pl-chart-warning)', 'var(--pl-chart-series-1)']);
  });
});

describe('segmentAt', () => {
  const segments = gaugeSegments([{ to: 50 }, {}], { min: 0, max: 100 }, { unit: 1 });

  it('poe o limite na faixa de cima e o maximo na ultima', () => {
    expect(segmentAt(segments, 50)).toBe(segments[1]);
    expect(segmentAt(segments, 100)).toBe(segments[1]);
    expect(segmentAt(segments, 49.9)).toBe(segments[0]);
  });
});

describe('gaugeOrigin', () => {
  it('parte do zero quando a escala o cruza, e do minimo quando nao', () => {
    expect(gaugeOrigin(undefined, { min: -100, max: 100 })).toBe(0);
    expect(gaugeOrigin(undefined, { min: 20, max: 100 })).toBe(20);
  });

  it('prende a origem declarada a escala', () => {
    expect(gaugeOrigin(-500, { min: -100, max: 100 })).toBe(-100);
  });
});

describe('majorTicks', () => {
  it('divide a escala em tickCount partes', () => {
    expect(majorTicks({ min: -100, max: 100 }, 4, null)).toEqual([-100, -50, 0, 50, 100]);
  });

  it('em percentual da meta, marca a cada 50% e inclui o fim', () => {
    expect(majorTicks({ min: 0, max: 2_400_000 }, 5, 2_000_000)).toEqual([0, 1_000_000, 2_000_000, 2_400_000]);
  });

  it('numa escala curta, a cada 25% da meta', () => {
    expect(majorTicks({ min: 0, max: 90 }, 5, 100)).toEqual([0, 25, 50, 75, 90]);
  });
});

describe('tickLabelPriority', () => {
  it('poe as pontas e a meta antes das demais marcas', () => {
    expect(tickLabelPriority([0, 25, 50, 75, 100], 75)).toEqual([0, 4, 3, 1, 2]);
  });
});
