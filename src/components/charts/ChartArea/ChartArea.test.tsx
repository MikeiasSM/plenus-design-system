import { render, screen } from '@testing-library/react';
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

  it('preenche com gradiente quando as areas nao empilham', () => {
    render(<ChartArea categories={meses} series={series} title="Volume" />);

    expect(document.querySelectorAll('linearGradient')).toHaveLength(2);
    expect(preenchimentos()[0]).toMatch(/^url\(#/);
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
});
