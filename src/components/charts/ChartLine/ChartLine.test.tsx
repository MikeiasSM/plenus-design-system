import { act, fireEvent, render, screen } from '@testing-library/react';
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
    const onHover = vi.fn();
    render(<ChartLine categories={meses} onHover={onHover} series={series} title="Faturamento" />);

    const faixas = [...document.querySelectorAll<SVGRectElement>(`.${chartStyles.hoverBand}`)];
    const larguras = faixas.map((faixa) => Number(faixa.getAttribute('width')));

    // Cada faixa vai ate o meio do caminho para o vizinho: as das pontas tem metade da do meio.
    expect(larguras[1]).toBeCloseTo(larguras[0] * 2);
    expect(larguras[2]).toBeCloseTo(larguras[0]);

    fireEvent.mouseEnter(faixas[2]);
    fireEvent.mouseLeave(faixas[2]);

    expect(onHover.mock.calls).toEqual([[{ category: '06/26', index: 2 }], [null]]);
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
    expect(document.querySelectorAll(`text.${chartStyles.valueLabelHidden}`).length).toBe(3);
  });

  it('com clique no ponto, os pontos sao botoes e as setas andam entre categorias e series', () => {
    const aoClicar = vi.fn();
    render(<ChartLine categories={meses} onMarkClick={aoClicar} series={series} title="Receita" />);
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

  it('aceita passo minimo das marcas e titulos nos tres eixos de valor e de categoria', () => {
    const contagem = [{ label: 'Pedidos', values: [1, 2, 2] }];
    const { container } = render(
      <ChartLine
        categories={meses}
        minTickStep={1}
        series={contagem}
        title="Pedidos"
        xAxisTitle="Mês"
        yAxisRight="visible"
        yAxisRightTitle="Total"
        yAxisTitle="Unidades"
      />,
    );
    const textos = [...container.querySelectorAll('text')].map((no) => no.textContent);

    expect(textos).toEqual(expect.arrayContaining(['Mês', 'Unidades', 'Total']));
    expect(textos.some((texto) => texto === '0,5')).toBe(false);
    expect(screen.getByText('Unidades')).toHaveAttribute('aria-hidden', 'true');
  });

  describe('eixo por série', () => {
    const duasEscalas: ChartLineSeries[] = [
      { label: 'Faturamento', values: [600, 800, 1000] },
      { axis: 'right', label: 'Conversão', values: [6, 8, 10] },
    ];
    const alturasDosPontos = () => marcadores().map((ponto) => Number(ponto.getAttribute('cy')));
    const rotulos = () => [...document.querySelectorAll('text')].map((no) => no.textContent);

    it('forma a escala da direita só pelas séries da direita', () => {
      render(<ChartLine categories={meses} series={duasEscalas} title="Faturamento" />);
      const ys = alturasDosPontos();

      // O maior valor de cada série encosta no topo da escala que é dela.
      expect(ys[2]).toBeCloseTo(ys[5]);
      expect(ys[3]).toBeCloseTo(ys[0]);
    });

    it('mostra o eixo da direita no formato próprio assim que há série nele', () => {
      render(
        <ChartLine
          categories={meses}
          formatRightValue={(valor) => `${valor}%`}
          formatValue={(valor) => `R$ ${valor}`}
          series={duasEscalas}
          title="Faturamento"
        />,
      );

      expect(rotulos()).toContain('10%');
      expect(rotulos()).toContain('R$ 1000');
      expect(marcadores()[3].getAttribute('aria-label')).toBe('Conversão, 04/26: 6%');
      expect(marcadores()[0].getAttribute('aria-label')).toBe('Faturamento, 04/26: R$ 600');
    });

    it('formata o balão de cada série pelo eixo dela', () => {
      render(
        <ChartLine
          categories={meses}
          formatRightValue={(valor) => `${valor}%`}
          formatTooltipValue={(valor) => `R$ ${valor}`}
          series={duasEscalas}
          title="Faturamento"
        />,
      );
      const faixa = document.querySelectorAll(`.${chartStyles.hoverBand}`)[0];

      fireEvent.pointerMove(faixa, { clientX: 10, clientY: 10 });
      fireEvent.mouseEnter(faixa);

      expect(document.querySelector('[class*="tooltip"]')).toHaveTextContent('R$ 600');
      expect(document.querySelector('[class*="tooltip"]')).toHaveTextContent('6%');
    });

    it('não muda nada sem série à direita: o eixo direito segue escondido ou espelhando o esquerdo', () => {
      const { container, rerender } = render(<ChartLine categories={meses} series={series} title="Receita" />);
      const semEixo = container.innerHTML;

      rerender(
        <ChartLine
          categories={meses}
          formatRightValue={(valor) => `${valor}%`}
          series={series.map((item) => ({ ...item, axis: 'left' as const }))}
          title="Receita"
        />,
      );
      expect(container.innerHTML).toBe(semEixo);

      rerender(
        <ChartLine
          categories={meses}
          formatValue={(valor) => `R$ ${valor}`}
          series={[duasEscalas[0]]}
          title="Receita"
          yAxisRight="visible"
        />,
      );
      expect(rotulos().filter((rotulo) => rotulo === 'R$ 1000')).toHaveLength(2);
    });
  });
});
