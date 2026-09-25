import { paletteWithAccent, seriesColors } from './palette';

describe('cores do Design System', () => {
  it('entrega uma variavel por serie, na ordem fixa', () => {
    expect(seriesColors(3)).toEqual([
      'var(--pl-chart-series-1)',
      'var(--pl-chart-series-2)',
      'var(--pl-chart-series-3)',
    ]);
  });

  it('recomeca o ciclo depois da sexta serie', () => {
    const cores = seriesColors(8);

    expect(cores[6]).toBe('var(--pl-chart-series-1)');
    expect(cores).toHaveLength(8);
  });

  it('aceita pedido vazio', () => {
    expect(seriesColors(0)).toEqual([]);
  });
});

describe('paleta com a cor da aplicacao', () => {
  it('abre com a cor escolhida, sem alterá-la', () => {
    expect(paletteWithAccent('#00A3A3', 4)[0]).toBe('#00A3A3');
  });

  it('segue com as cores do sistema', () => {
    expect(paletteWithAccent('#00A3A3', 3)).toEqual([
      '#00A3A3',
      'var(--pl-chart-series-1)',
      'var(--pl-chart-series-2)',
    ]);
  });

  it('salta a posicao que repetiria a cor escolhida', () => {
    const paleta = paletteWithAccent('#F26B35', 3);

    expect(paleta).toEqual(['#F26B35', 'var(--pl-chart-series-1)', 'var(--pl-chart-series-3)']);
    expect(paleta).not.toContain('var(--pl-chart-series-2)');
  });

  it('reconhece a cor escolhida independente da caixa', () => {
    expect(paletteWithAccent('#49619C', 2)[1]).toBe('var(--pl-chart-series-2)');
    expect(paletteWithAccent('#49619c', 2)[1]).toBe('var(--pl-chart-series-2)');
  });

  it('continua ciclando quando ha mais series que cores', () => {
    const paleta = paletteWithAccent('#00A3A3', 8);

    expect(paleta).toHaveLength(8);
    expect(paleta[7]).toBe('var(--pl-chart-series-1)');
  });

  it('devolve apenas a cor escolhida quando ha uma serie', () => {
    expect(paletteWithAccent('#00A3A3', 1)).toEqual(['#00A3A3']);
  });

  it('aceita pedido vazio', () => {
    expect(paletteWithAccent('#00A3A3', 0)).toEqual([]);
  });
});
