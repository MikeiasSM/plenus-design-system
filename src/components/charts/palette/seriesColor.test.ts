import { toOklch } from '../../../utils/palette/color';
import { resolveSeriesColors, textColorOn } from './seriesColor';

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

describe('texto sobre a cor da serie', () => {
  it('usa o token de texto da cor da paleta e da intencao, medido em cada tema', () => {
    expect(textColorOn('var(--pl-chart-series-2)')).toBe('var(--pl-chart-on-series-2)');
    expect(textColorOn('var(--pl-chart-negative)')).toBe('var(--pl-chart-on-negative)');
  });

  it('mede a cor informada em hexadecimal e escreve do lado que contrasta mais', () => {
    expect(textColorOn('#30416A')).toBe('var(--pl-chart-on-dark)');
    expect(textColorOn('#FCB52F')).toBe('var(--pl-chart-on-light)');
    expect(textColorOn('#fff')).toBe('var(--pl-chart-on-light)');
  });

  it('mantem o texto branco sobre a cor que nao sabe medir', () => {
    expect(textColorOn('var(--marca-da-aplicacao)')).toBe('var(--pl-chart-on-dark)');
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

  it('a lista do grafico gira entre as series sem cor e vence a cor de tema', () => {
    expect(
      resolveSeriesColors([{}, { color: '#123456' }, {}, {}], { accent: '#F26B35', palette: ['#0E7C6B', '#E0A030'] }),
    ).toEqual(['#0E7C6B', '#123456', '#E0A030', '#0E7C6B']);
  });

  it('a cor base gera tons da mesma matiz, do mais escuro ao mais claro, com texto medido', () => {
    const cores = resolveSeriesColors([{}, {}, {}, {}], { palette: { base: '#1F6FB2' } });
    const luminosidade = cores.map((cor) => toOklch(cor).L);

    expect(new Set(cores).size).toBe(4);
    luminosidade.slice(1).forEach((valor, indice) => expect(valor).toBeGreaterThan(luminosidade[indice]));
    cores.forEach((cor) => expect(textColorOn(cor)).toMatch(/on-(light|dark)/));
  });

  it('uma serie so com cor base recebe a propria cor', () => {
    expect(resolveSeriesColors([{}], { palette: { base: '#1F6FB2' } })).toEqual(['#1F6FB2']);
  });
});
