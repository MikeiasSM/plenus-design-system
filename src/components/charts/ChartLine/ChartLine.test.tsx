import { fireEvent, render, screen } from '@testing-library/react';
import chartStyles from '../core/Chart.module.css';
import { ChartLine, type ChartLineSeries } from './ChartLine';
import lineStyles from './ChartLine.module.css';

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

  it('descreve cada ponto pelo valor, no formato do consumidor, e sem balao tambem sob o ponteiro', () => {
    render(
      <ChartLine
        categories={meses}
        formatValue={(valor) => `R$ ${valor.toLocaleString('pt-BR')}`}
        series={series}
        showDots="visible"
        showTooltip={false}
        title="Evolução"
      />,
    );

    expect(marcadores()[0].getAttribute('aria-label')).toBe('Serviços, 04/26: R$ 42.000');
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

  it('com a costura, avisa a categoria do ponto mais proximo e tira o <title> dos pontos', () => {
    const onHoverCategory = vi.fn();
    render(<ChartLine categories={meses} onHoverCategory={onHoverCategory} series={series} title="Faturamento" />);

    const faixas = [...document.querySelectorAll<SVGRectElement>(`.${chartStyles.hoverBand}`)];
    const larguras = faixas.map((faixa) => Number(faixa.getAttribute('width')));

    // Cada faixa vai ate o meio do caminho para o vizinho: as das pontas tem metade da do meio.
    expect(larguras[1]).toBeCloseTo(larguras[0] * 2);
    expect(larguras[2]).toBeCloseTo(larguras[0]);

    fireEvent.mouseEnter(faixas[2]);
    fireEvent.mouseLeave(faixas[2]);

    expect(onHoverCategory.mock.calls).toEqual([[2], [null]]);
    expect(document.querySelector('circle title')).toBeNull();
  });

  it('em onHover, mostra os pontos e rotulos so da serie mais proxima do ponteiro', () => {
    render(<ChartLine categories={meses} series={series} showDataLabels="onHover" title="Faturamento" />);
    const faixa = document.querySelectorAll(`.${chartStyles.hoverBand}`)[1];
    const visiveisDe = (rotulo: string) =>
      marcadores().filter((ponto) => ponto.getAttribute('aria-label')?.startsWith(rotulo) && ponto.getAttribute('class')?.includes('dotVisible'));
    // Em 05/26, Produtos (62000) fica acima de Servicos (58000): o ponteiro no topo esta mais perto dele.
    vi.spyOn(faixa, 'getBoundingClientRect').mockReturnValue({ top: 0 } as DOMRect);

    fireEvent.mouseEnter(faixa);
    fireEvent.mouseMove(faixa, { clientY: 0 });

    expect(visiveisDe('Produtos')).toHaveLength(3);
    expect(visiveisDe('Serviços')).toHaveLength(0);
    expect(document.querySelectorAll(`text.${lineStyles.valueLabelHidden}`).length).toBe(3);
  });
});
