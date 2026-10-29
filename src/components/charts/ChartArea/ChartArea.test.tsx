import { act, fireEvent, render, screen } from '@testing-library/react';
import chartStyles from '../core/Chart.module.css';
import { ChartArea, type ChartAreaSeries } from './ChartArea';

const meses = ['04/26', '05/26', '06/26'];

const series: ChartAreaSeries[] = [
  { label: 'Serviços', values: [40, 60, 50] },
  { label: 'Produtos', values: [20, 30, 25] },
];

function fixarLargura(largura = 640) {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: largura });
}

function preenchimentos() {
  return [...document.querySelectorAll('path')]
    .map((no) => no.getAttribute('fill'))
    .filter((fill) => fill !== 'none');
}

describe('ChartArea', () => {
  beforeEach(() => fixarLargura());
  afterEach(() => Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth'));

  it('nomeia o grafico pelo titulo, para quem usa leitor de tela', () => {
    render(<ChartArea categories={meses} series={series} title="Volume acumulado" />);

    expect(screen.getByRole('img', { name: 'Volume acumulado' })).toBeInTheDocument();
  });

  it('tira a grade e a linha do zero com showGrid desligado', () => {
    const { container, rerender } = render(<ChartArea categories={meses} series={series} title="Receita" />);
    expect(container.querySelectorAll(`.${chartStyles.gridLine}, .${chartStyles.gridBaseline}`).length).toBeGreaterThan(0);

    rerender(<ChartArea categories={meses} series={series} showGrid={false} title="Receita" />);
    expect(container.querySelectorAll(`.${chartStyles.gridLine}, .${chartStyles.gridBaseline}`)).toHaveLength(0);
  });

  it('preenche com gradiente quando as areas nao empilham', () => {
    render(<ChartArea categories={meses} series={series} title="Volume" />);

    expect(document.querySelectorAll('linearGradient')).toHaveLength(2);
    expect(preenchimentos()[0]).toMatch(/^url\(#/);
  });

  it('clareia o gradiente rumo ao zero, e nao rumo a base, quando a serie tem negativo', () => {
    render(<ChartArea categories={meses} series={[{ label: 'Saldo', values: [10, -10, 10] }]} title="Saldo" />);
    const paradas = [...document.querySelectorAll('stop')].map((parada) => [
      Number(parada.getAttribute('offset')),
      Number(parada.getAttribute('stop-opacity')),
    ]);

    expect(paradas).toHaveLength(3);
    expect(paradas[1]).toEqual([0.5, 0.05]);
    expect(paradas[2][1]).toBe(0.6);
  });

  it('preenche com cor solida quando as areas empilham, onde o gradiente se somaria', () => {
    render(<ChartArea categories={meses} series={series} stacked title="Volume" />);

    expect(document.querySelectorAll('linearGradient')).toHaveLength(0);
    expect(preenchimentos()[0]).toBe('var(--pl-chart-series-1)');
  });

  it('contorna cada area, para o limite entre faixas vizinhas ficar legivel', () => {
    render(<ChartArea categories={meses} series={series} stacked title="Volume" />);

    const contornos = [...document.querySelectorAll('path')].filter(
      (no) => no.getAttribute('fill') === 'none',
    );

    expect(contornos).toHaveLength(2);
  });

  it('empilha a segunda serie sobre a primeira, em vez de sobrepor', () => {
    const topoDaPrimeiraCategoria = () => {
      const pontos = [...document.querySelectorAll('circle')].map((no) => Number(no.getAttribute('cy')));
      return { primeira: pontos[0], segunda: pontos[3] };
    };

    const { rerender } = render(<ChartArea categories={meses} series={series} title="Volume" />);
    const sobreposta = topoDaPrimeiraCategoria();

    rerender(<ChartArea categories={meses} series={series} stacked title="Volume" />);
    const empilhada = topoDaPrimeiraCategoria();

    expect(sobreposta.segunda).toBeGreaterThan(sobreposta.primeira);
    expect(empilhada.segunda).toBeLessThan(empilhada.primeira);
  });

  it('interrompe a faixa onde o valor nao existe', () => {
    render(
      <ChartArea categories={meses} series={[{ label: 'Serviços', values: [40, null, 50] }]} title="Volume" />,
    );

    expect(document.querySelectorAll('path')[0].getAttribute('d')?.match(/M/g)).toHaveLength(2);
  });

  it('descreve cada ponto pelo valor, no formato do consumidor', () => {
    render(
      <ChartArea
        categories={meses}
        formatValue={(valor) => `${valor}%`}
        series={[series[0]]}
        title="Volume"
      />,
    );

    expect(document.querySelector('circle')?.getAttribute('aria-label')).toBe('Serviços, 04/26: 40%');
  });

  it('anuncia a ausencia de dados em vez de desenhar um grafico vazio', () => {
    render(<ChartArea categories={[]} series={[]} title="Volume" />);

    expect(screen.getByText('Sem dados no período')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('com a costura, avisa a categoria sob o ponteiro e tira o <title> dos pontos', () => {
    const onHoverCategory = vi.fn();
    render(<ChartArea categories={meses} onHoverCategory={onHoverCategory} series={series} title="Volume" />);

    fireEvent.mouseEnter(document.querySelectorAll(`.${chartStyles.hoverBand}`)[1]);

    expect(onHoverCategory).toHaveBeenCalledWith(1);
    expect(document.querySelector('circle title')).toBeNull();
  });

  it('com clique no ponto, os pontos sao botoes e as setas andam entre categorias e series', () => {
    const aoClicar = vi.fn();
    render(<ChartArea categories={meses} onPointClick={aoClicar} series={series} title="Receita" />);
    const primeiro = screen.getByRole('button', { name: /^Serviços, 04\/26/ });

    expect(screen.getByRole('group', { name: 'Receita' })).toBeInTheDocument();
    expect(primeiro).toHaveAttribute('tabindex', '0');

    act(() => primeiro.focus());
    fireEvent.keyDown(primeiro, { key: 'ArrowRight' });
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
    expect(screen.getByRole('button', { name: /^Produtos, 05\/26/ })).toHaveFocus();

    fireEvent.keyDown(document.activeElement!, { key: 'Enter' });
    expect(aoClicar).toHaveBeenCalledWith({ category: '05/26', index: 1, series: 'Produtos', value: series[1].values[1] });
  });
});
