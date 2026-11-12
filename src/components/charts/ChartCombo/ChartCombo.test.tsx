import { act, fireEvent, render, screen } from '@testing-library/react';
import { ChartCombo, type ChartComboSeries } from './ChartCombo';

const meses = ['04/26', '05/26', '06/26'];

/**
 * Duas grandezas incomparáveis: faturamento na casa dos milhares e conversão em
 * pontos percentuais. Os dois maximos são redondos, então cada escala leva o
 * seu ao topo da área de desenho.
 */
const faturamentoEConversao: ChartComboSeries[] = [
  { kind: 'bar', label: 'Faturamento', values: [600, 800, 1000] },
  { axis: 'right', kind: 'line', label: 'Conversão', values: [6, 8, 10] },
];

function fixarLargura(largura = 640) {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: largura });
}

function barras() {
  return [...document.querySelectorAll('path')].filter((no) => no.getAttribute('fill') !== 'none');
}

function curvas() {
  return [...document.querySelectorAll('path')].filter((no) => no.getAttribute('fill') === 'none');
}

function marcadores() {
  return [...document.querySelectorAll('circle')];
}

function rotulos() {
  return [...document.querySelectorAll('text')].map((no) => no.textContent);
}

function alturasDa(barra: Element) {
  const numeros = (barra.getAttribute('d') ?? '').match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];

  return numeros.filter((_, indice) => indice % 2 === 1);
}

/**
 * Altura util do desenho, medida pela barra do maior valor: ela vai do zero ao
 * topo da escala, então ocupa a área inteira.
 */
function alturaDoDesenho() {
  const ys = alturasDa(barras()[2]);

  return Math.max(...ys) - Math.min(...ys);
}

/** Amplitude vertical da curva, do ponto mais alto ao mais baixo. */
function amplitudeDaCurva() {
  const ys = marcadores().map((marca) => Number(marca.getAttribute('cy')));

  return Math.max(...ys) - Math.min(...ys);
}

describe('ChartCombo', () => {
  beforeEach(() => fixarLargura());
  afterEach(() => Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth'));

  it('nomeia o grafico pelo titulo, para quem usa leitor de tela', () => {
    render(<ChartCombo categories={meses} series={faturamentoEConversao} title="Faturamento e conversão" />);

    expect(screen.getByRole('img', { name: 'Faturamento e conversão' })).toBeInTheDocument();
  });

  it('desenha barra e linha sobre o mesmo eixo de categorias', () => {
    render(<ChartCombo categories={meses} series={faturamentoEConversao} title="Faturamento" />);

    expect(barras()).toHaveLength(3);
    expect(curvas()).toHaveLength(1);
  });

  it('da escala propria a serie do eixo direito, em vez de esmaga-la contra a base', () => {
    render(<ChartCombo categories={meses} series={faturamentoEConversao} title="Faturamento" />);

    // O maior valor de cada serie encosta no topo da escala que e dele.
    expect(Number(marcadores()[2].getAttribute('cy'))).toBeCloseTo(Math.min(...alturasDa(barras()[2])));
    expect(amplitudeDaCurva()).toBeGreaterThan(alturaDoDesenho() / 3);
  });

  it('alinha o zero dos dois eixos, para as barras de cada um crescerem da mesma base', () => {
    render(
      <ChartCombo
        categories={meses}
        series={[
          { kind: 'bar', label: 'Resultado', values: [-400, 600, 1000] },
          { axis: 'right', kind: 'bar', label: 'Margem', values: [5, 8, 10] },
        ]}
        title="Resultado e margem"
      />,
    );
    const base = (barra: Element) => Math.max(...alturasDa(barra));

    expect(base(barras()[4])).toBeCloseTo(base(barras()[1]));
  });

  it('achata a serie contra a base quando ela compartilha o eixo esquerdo', () => {
    render(
      <ChartCombo
        categories={meses}
        series={[
          faturamentoEConversao[0],
          { kind: 'line', label: 'Conversão', values: [6, 8, 10] },
        ]}
        title="Faturamento"
      />,
    );

    // Sem eixo próprio, os tres pontos se amontoam numa faixa de um pixel.
    expect(amplitudeDaCurva()).toBeLessThan(alturaDoDesenho() / 100);
  });

  it('mostra o eixo direito assim que uma serie pertence a ele', () => {
    render(
      <ChartCombo
        categories={meses}
        formatRightValue={(valor) => `${valor}%`}
        formatValue={(valor) => `R$ ${valor}`}
        series={faturamentoEConversao}
        title="Faturamento"
      />,
    );

    expect(rotulos()).toContain('10%');
    expect(rotulos()).toContain('R$ 1000');
  });

  it('dispensa o eixo direito quando nenhuma serie pertence a ele', () => {
    render(
      <ChartCombo
        categories={meses}
        formatRightValue={(valor) => `${valor}%`}
        formatValue={(valor) => `R$ ${valor}`}
        series={[faturamentoEConversao[0]]}
        title="Faturamento"
      />,
    );

    expect(rotulos().some((rotulo) => rotulo?.endsWith('%'))).toBe(false);
  });

  it('espelha a escala da esquerda no eixo direito pedido sem serie propria', () => {
    render(
      <ChartCombo
        categories={meses}
        formatValue={(valor) => `R$ ${valor}`}
        series={[faturamentoEConversao[0]]}
        title="Faturamento"
        yAxisRight="visible"
      />,
    );

    expect(rotulos().filter((rotulo) => rotulo === 'R$ 1000')).toHaveLength(2);
  });

  it('interrompe a curva e dispensa a barra onde o valor nao existe', () => {
    render(
      <ChartCombo
        categories={meses}
        series={[
          { kind: 'bar', label: 'Faturamento', values: [600, null, 1000] },
          { kind: 'line', label: 'Meta', values: [600, null, 1000] },
        ]}
        title="Faturamento"
      />,
    );

    expect(barras()).toHaveLength(2);
    expect(curvas()[0].getAttribute('d')?.match(/M/g)).toHaveLength(2);
  });

  it('descreve cada marca pelo formato do eixo a que ela pertence', () => {
    render(
      <ChartCombo
        categories={meses}
        formatRightValue={(valor) => `${valor}%`}
        formatValue={(valor) => `R$ ${valor}`}
        series={faturamentoEConversao}
        title="Faturamento"
      />,
    );

    expect(barras()[0].getAttribute('aria-label')).toBe('Faturamento, 04/26: R$ 600');
    expect(marcadores()[0].getAttribute('aria-label')).toBe('Conversão, 04/26: 6%');
  });

  it('desliga a serie pela legenda sem repintar as demais', () => {
    render(<ChartCombo categories={meses} series={faturamentoEConversao} title="Faturamento" />);

    const corDaLinha = curvas()[0].getAttribute('stroke');

    fireEvent.click(screen.getByRole('button', { name: 'Faturamento' }));

    expect(screen.getByRole('button', { name: 'Faturamento' })).toHaveAttribute('aria-pressed', 'false');
    expect(curvas()[0]).toHaveAttribute('stroke', corDaLinha);
  });

  it('anuncia a ausencia de dados em vez de desenhar um grafico vazio', () => {
    render(<ChartCombo categories={[]} series={[]} title="Faturamento" />);

    expect(screen.getByText('Sem dados no período')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('com clique na marca, barras e pontos sao botoes de uma grade so', () => {
    const aoClicar = vi.fn();
    render(<ChartCombo categories={meses} onMarkClick={aoClicar} series={faturamentoEConversao} title="Vendas" />);
    const barra = screen.getByRole('button', { name: /^Faturamento, 05\/26/ });

    expect(screen.getByRole('group', { name: 'Vendas' })).toBeInTheDocument();

    act(() => barra.focus());
    fireEvent.keyDown(barra, { key: 'ArrowDown' });
    expect(screen.getByRole('button', { name: /^Conversão, 05\/26/ })).toHaveFocus();

    fireEvent.keyDown(document.activeElement!, { key: 'Enter' });
    expect(aoClicar).toHaveBeenCalledWith({ category: '05/26', index: 1, series: 'Conversão', value: 8 });

    fireEvent.click(barra);
    expect(aoClicar).toHaveBeenLastCalledWith({ category: '05/26', index: 1, series: 'Faturamento', value: 800 });
  });

  describe('configuracao por serie', () => {
    const proximas: ChartComboSeries[] = [
      { kind: 'bar', label: 'Meta', values: [100, 110, 120] },
      { kind: 'line', label: 'Realizado', values: [101, 108, 121] },
    ];
    const rotulosVisiveis = () =>
      document.querySelectorAll('[class*="valueLabel"]:not([class*="valueLabelHidden"])').length;

    it('deixa a serie declarar o proprio rotulo de dado, que vence o do grafico', () => {
      const { rerender } = render(<ChartCombo categories={meses} series={proximas} title="Meta" />);
      expect(rotulosVisiveis()).toBe(0);

      rerender(
        <ChartCombo
          categories={meses}
          series={[proximas[0], { ...proximas[1], showDataLabels: 'visible' }]}
          title="Meta"
        />,
      );
      expect(rotulosVisiveis()).toBe(3);

      rerender(
        <ChartCombo
          categories={meses}
          series={[proximas[0], { ...proximas[1], showDataLabels: 'hidden' }]}
          showDataLabels="visible"
          title="Meta"
        />,
      );
      expect(rotulosVisiveis()).toBe(3);
    });

    it('deixa a serie de linha declarar a propria curva, que vence a do grafico', () => {
      const { rerender } = render(<ChartCombo categories={meses} series={proximas} title="Meta" />);
      expect(curvas()[0].getAttribute('d')).toContain('C');

      rerender(
        <ChartCombo categories={meses} series={[proximas[0], { ...proximas[1], curve: 'straight' }]} title="Meta" />,
      );
      expect(curvas()[0].getAttribute('d')).not.toContain('C');
    });

    it('aceita passo minimo e titulo em cada eixo de valor', () => {
      render(
        <ChartCombo
          categories={meses}
          minRightTickStep={1}
          series={[
            { kind: 'bar', label: 'Faturamento', values: [600, 800, 1000] },
            { axis: 'right', kind: 'line', label: 'Conversão', values: [1, 2, 2] },
          ]}
          title="Meta"
          xAxisTitle="Mês"
          yAxisRightTitle="Conversão (%)"
          yAxisTitle="Faturamento (R$)"
        />,
      );

      expect(rotulos()).toEqual(expect.arrayContaining(['Mês', 'Faturamento (R$)', 'Conversão (%)']));
      expect(rotulos().some((texto) => texto === '0,5')).toBe(false);
    });
  });
});
