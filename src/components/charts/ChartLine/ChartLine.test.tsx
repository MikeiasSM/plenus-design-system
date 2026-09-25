import { render, screen } from '@testing-library/react';
import { ChartLine, type ChartLineSeries } from './ChartLine';

const meses = ['04/26', '05/26', '06/26'];

const series: ChartLineSeries[] = [
  { label: 'Serviços', values: [42000, 58000, 39000] },
  { label: 'Produtos', values: [38000, 62000, 41000] },
];

function fixarLargura(largura = 640) {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: largura });
}

function curvas() {
  return [...document.querySelectorAll('path')];
}

function marcadores() {
  return [...document.querySelectorAll('circle')];
}

describe('ChartLine', () => {
  beforeEach(() => fixarLargura());
  afterEach(() => Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth'));

  it('nomeia o grafico pelo titulo, para quem usa leitor de tela', () => {
    render(<ChartLine categories={meses} series={series} title="Evolução do faturamento" />);

    expect(screen.getByRole('img', { name: 'Evolução do faturamento' })).toBeInTheDocument();
  });

  it('desenha uma curva por serie', () => {
    render(<ChartLine categories={meses} series={series} title="Evolução" />);

    expect(curvas()).toHaveLength(2);
  });

  it('interrompe a curva onde o valor nao existe, em vez de emendar sobre o buraco', () => {
    render(
      <ChartLine
        categories={meses}
        series={[{ label: 'Serviços', values: [42000, null, 39000] }]}
        title="Evolução"
      />,
    );

    const trechos = curvas()[0].getAttribute('d')?.match(/M/g);

    expect(trechos).toHaveLength(2);
  });

  it('traca a curva suave ou reta conforme pedido', () => {
    const { rerender } = render(<ChartLine categories={meses} series={series} title="Evolução" />);
    expect(curvas()[0].getAttribute('d')).toContain('C');

    rerender(<ChartLine categories={meses} curve="straight" series={series} title="Evolução" />);
    expect(curvas()[0].getAttribute('d')).not.toContain('C');
  });

  it('descreve cada ponto pelo valor, no formato do consumidor', () => {
    render(
      <ChartLine
        categories={meses}
        formatValue={(valor) => `R$ ${valor.toLocaleString('pt-BR')}`}
        series={series}
        title="Evolução"
      />,
    );

    expect(marcadores()[0].querySelector('title')?.textContent).toBe('Serviços, 04/26: R$ 42.000');
  });

  it('marca um ponto por valor presente, e nenhum onde o valor falta', () => {
    render(
      <ChartLine
        categories={meses}
        series={[{ label: 'Serviços', values: [42000, null, 39000] }]}
        title="Evolução"
      />,
    );

    expect(marcadores()).toHaveLength(2);
  });

  it('mantem o significado das series quando a cor de tema muda', () => {
    const comIntencao: ChartLineSeries[] = [{ label: 'Meta', values: [10, 20, 30], intent: 'positive' }];
    const { rerender } = render(<ChartLine accent="#6E2A92" categories={meses} series={comIntencao} title="Meta" />);
    const comRoxo = curvas()[0].getAttribute('stroke');

    rerender(<ChartLine accent="#F26B35" categories={meses} series={comIntencao} title="Meta" />);

    expect(curvas()[0]).toHaveAttribute('stroke', comRoxo);
    expect(comRoxo).toBe('var(--pl-chart-positive)');
  });

  it('anuncia a ausencia de dados em vez de desenhar um grafico vazio', () => {
    render(<ChartLine categories={[]} series={[]} title="Evolução" />);

    expect(screen.getByText('Sem dados no período')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
