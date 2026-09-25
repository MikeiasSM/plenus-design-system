import { resolveSeriesColors } from './seriesColor';

describe('cor de cada serie', () => {
  it('usa a paleta do sistema quando nada e informado', () => {
    expect(resolveSeriesColors([{}, {}, {}])).toEqual([
      'var(--pl-chart-series-1)',
      'var(--pl-chart-series-2)',
      'var(--pl-chart-series-3)',
    ]);
  });

  it('a cor informada pelo implementador vence tudo', () => {
    expect(resolveSeriesColors([{ color: '#123456', intent: 'negative' }, {}])).toEqual([
      '#123456',
      'var(--pl-chart-series-1)',
    ]);
  });

  it('a intencao semantica ignora a paleta e a cor de tema', () => {
    const cores = resolveSeriesColors(
      [{ intent: 'positive' }, { intent: 'warning' }, { intent: 'negative' }],
      { accent: '#6E2A92' },
    );

    expect(cores).toEqual([
      'var(--pl-chart-positive)',
      'var(--pl-chart-warning)',
      'var(--pl-chart-negative)',
    ]);
  });

  it('acomoda total e subtotal como neutros', () => {
    expect(resolveSeriesColors([{ intent: 'neutral' }])).toEqual(['var(--pl-chart-neutral)']);
  });

  it('abre a rotacao com a cor de tema do usuario', () => {
    expect(resolveSeriesColors([{}, {}], { accent: '#6E2A92' })).toEqual([
      '#6E2A92',
      'var(--pl-chart-series-1)',
    ]);
  });

  it('series com intencao nao consomem posicao da paleta', () => {
    const cores = resolveSeriesColors([{ intent: 'positive' }, {}, { color: '#000' }, {}]);

    expect(cores).toEqual([
      'var(--pl-chart-positive)',
      'var(--pl-chart-series-1)',
      '#000',
      'var(--pl-chart-series-2)',
    ]);
  });

  it('mantem a rotacao quando ha mais series categoricas que cores', () => {
    const cores = resolveSeriesColors(Array.from({ length: 8 }, () => ({})));

    expect(cores[6]).toBe('var(--pl-chart-series-1)');
    expect(cores).toHaveLength(8);
  });

  it('aceita colecao vazia', () => {
    expect(resolveSeriesColors([])).toEqual([]);
  });
});

describe('o cenario do DRE', () => {
  it('mantem o significado das barras mesmo com cor de tema escolhida', () => {
    const dre = [
      { intent: 'positive' as const },
      { intent: 'warning' as const },
      { intent: 'negative' as const },
    ];

    expect(resolveSeriesColors(dre, { accent: '#6E2A92' })).toEqual(
      resolveSeriesColors(dre, { accent: '#F26B35' }),
    );
  });
});
