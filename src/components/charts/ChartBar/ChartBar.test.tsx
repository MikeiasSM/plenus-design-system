import { render, screen } from '@testing-library/react';
import { ChartBar, type ChartBarSeries } from './ChartBar';

const periodos = ['08/2026', '09/2026'];

const dre: ChartBarSeries[] = [
  { label: 'Receita', values: [300000, 210000], intent: 'positive' },
  { label: 'Deduções', values: [179000, 96000], intent: 'warning' },
  { label: 'Despesas', values: [50200, 8000], intent: 'negative' },
];

function fixarLargura(largura = 640) {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: largura });
}

function barras() {
  return [...document.querySelectorAll('rect')];
}

describe('ChartBar', () => {
  beforeEach(() => fixarLargura());
  afterEach(() => Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth'));

  it('nomeia o grafico pelo titulo, para quem usa leitor de tela', () => {
    render(<ChartBar categories={periodos} series={dre} title="Receita × Deduções × Despesas" />);

    expect(screen.getByRole('img', { name: 'Receita × Deduções × Despesas' })).toBeInTheDocument();
  });

  it('desenha uma barra por serie e categoria', () => {
    render(<ChartBar categories={periodos} series={dre} title="DRE" />);

    expect(barras()).toHaveLength(6);
  });

  it('mantem o significado das barras mesmo com cor de tema escolhida', () => {
    const { rerender } = render(<ChartBar accent="#6E2A92" categories={periodos} series={dre} title="DRE" />);
    const comRoxo = barras().map((barra) => barra.getAttribute('fill'));

    rerender(<ChartBar accent="#F26B35" categories={periodos} series={dre} title="DRE" />);

    expect(barras().map((barra) => barra.getAttribute('fill'))).toEqual(comRoxo);
    expect(comRoxo[0]).toBe('var(--pl-chart-positive)');
  });

  it('usa a cor de tema nas series categoricas', () => {
    render(
      <ChartBar
        accent="#6E2A92"
        categories={periodos}
        series={[{ label: 'Serviços', values: [10, 20] }, { label: 'Produtos', values: [30, 40] }]}
        title="Evolução"
      />,
    );

    expect(barras()[0]).toHaveAttribute('fill', '#6E2A92');
    expect(barras()[2]).toHaveAttribute('fill', 'var(--pl-chart-series-1)');
  });

  it('descreve cada barra pelo valor, no formato do consumidor', () => {
    render(
      <ChartBar
        categories={periodos}
        formatValue={(valor) => `R$ ${valor.toLocaleString('pt-BR')}`}
        series={dre}
        title="DRE"
      />,
    );

    expect(barras()[0].querySelector('title')?.textContent).toBe('Receita, 08/2026: R$ 300.000');
  });

  it('empilha as series quando pedido, somando a altura da categoria', () => {
    const { rerender } = render(<ChartBar categories={periodos} series={dre} title="DRE" />);
    const agrupada = Number(barras()[0].getAttribute('width'));

    rerender(<ChartBar categories={periodos} series={dre} stacked title="DRE" />);
    const empilhada = Number(barras()[0].getAttribute('width'));

    expect(empilhada).toBeGreaterThan(agrupada);
  });

  it('vira as barras na horizontal', () => {
    const { rerender } = render(<ChartBar categories={periodos} series={dre} title="DRE" />);
    const vertical = barras()[0];
    const alturaVertical = Number(vertical.getAttribute('height'));

    rerender(<ChartBar categories={periodos} orientation="horizontal" series={dre} title="DRE" />);
    const horizontal = barras()[0];

    expect(Number(horizontal.getAttribute('width'))).toBeGreaterThan(alturaVertical);
  });

  it('exibe a legenda a partir de duas series', () => {
    const { rerender } = render(<ChartBar categories={periodos} series={dre} title="DRE" />);
    expect(screen.getByText('Deduções')).toBeInTheDocument();

    rerender(<ChartBar categories={periodos} series={[dre[0]]} title="DRE" />);
    expect(screen.queryByText('Deduções')).not.toBeInTheDocument();
  });

  it('anuncia a ausencia de dados em vez de desenhar um grafico vazio', () => {
    render(<ChartBar categories={[]} series={[]} title="DRE" />);

    expect(screen.getByText('Sem dados no período')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('rotula os valores das barras quando pedido', () => {
    const rotulosDeBarra = () =>
      [...document.querySelectorAll('text')]
        .filter((no) => no.getAttribute('class')?.includes('value'))
        .map((no) => no.textContent);

    const { rerender } = render(<ChartBar categories={periodos} series={[dre[0]]} title="DRE" />);
    expect(rotulosDeBarra()).toHaveLength(0);

    rerender(<ChartBar categories={periodos} series={[dre[0]]} showValues title="DRE" />);
    expect(rotulosDeBarra()).toEqual(['300000', '210000']);
  });
});
