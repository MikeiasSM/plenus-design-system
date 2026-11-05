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
    const onHover = vi.fn();
    render(<ChartArea categories={meses} onHover={onHover} series={series} title="Volume" />);

    fireEvent.mouseEnter(document.querySelectorAll(`.${chartStyles.hoverBand}`)[1]);

    expect(onHover).toHaveBeenCalledWith({ category: '05/26', index: 1 });
    expect(document.querySelector('circle title')).toBeNull();
  });

  it('com clique no ponto, os pontos sao botoes e as setas andam entre categorias e series', () => {
    const aoClicar = vi.fn();
    render(<ChartArea categories={meses} onMarkClick={aoClicar} series={series} title="Receita" />);
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
      <ChartArea
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
    const duasEscalas: ChartAreaSeries[] = [
      { label: 'Faturamento', values: [600, 800, 1000] },
      { axis: 'right', label: 'Conversão', values: [6, 8, 10] },
    ];
    const alturasDosPontos = () =>
      [...document.querySelectorAll('circle')].map((ponto) => Number(ponto.getAttribute('cy')));
    const rotulos = () => [...document.querySelectorAll('text')].map((no) => no.textContent);

    it('forma a escala da direita só pelas séries da direita', () => {
      render(<ChartArea categories={meses} series={duasEscalas} title="Faturamento" />);
      const ys = alturasDosPontos();

      expect(ys[2]).toBeCloseTo(ys[5]);
      expect(ys[3]).toBeCloseTo(ys[0]);
    });

    it('mostra o eixo da direita no formato próprio assim que há série nele', () => {
      render(
        <ChartArea
          categories={meses}
          formatRightValue={(valor) => `${valor}%`}
          formatValue={(valor) => `R$ ${valor}`}
          series={duasEscalas}
          title="Faturamento"
        />,
      );

      expect(rotulos()).toContain('10%');
      expect(rotulos()).toContain('R$ 1000');
      expect(document.querySelectorAll('circle')[3].getAttribute('aria-label')).toBe('Conversão, 04/26: 6%');
    });

    it('formata o balão de cada série pelo eixo dela', () => {
      render(
        <ChartArea
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

    it('empilha só entre séries do mesmo eixo, cada eixo com a sua pilha', () => {
      render(
        <ChartArea
          categories={meses}
          series={[
            { label: 'A', values: [600, 800, 1000] },
            { label: 'B', values: [400, 200, 0] },
            { axis: 'right', label: 'C', values: [6, 8, 10] },
          ]}
          stacked
          title="Pilhas"
        />,
      );
      const ys = alturasDosPontos();

      // A pilha da esquerda soma 1000 em todo mês; a da direita não se soma a ela e chega a 10.
      expect(ys[3]).toBeCloseTo(ys[4]);
      expect(ys[4]).toBeCloseTo(ys[5]);
      expect(ys[8]).toBeCloseTo(ys[5]);
      expect(ys[6]).toBeCloseTo(ys[0]);
    });

    it('não muda nada sem série à direita', () => {
      const { container, rerender } = render(<ChartArea categories={meses} series={series} title="Receita" />);
      const semEixo = container.innerHTML;

      rerender(
        <ChartArea categories={meses} series={series.map((item) => ({ ...item, axis: 'left' as const }))} title="Receita" />,
      );

      expect(container.innerHTML).toBe(semEixo);
    });
  });
});
