import { fireEvent, render, screen } from '@testing-library/react';
import { ChartCombo, type ChartComboSeries } from './ChartCombo';

const meses = ['04/26', '05/26', '06/26'];

/**
 * Duas grandezas incomparaveis: faturamento na casa dos milhares e conversao em
 * pontos percentuais. Os dois maximos sao redondos, entao cada escala leva o
 * seu ao topo da area de desenho.
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
 * topo da escala, entao ocupa a area inteira.
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

    // Sem eixo proprio, os tres pontos se amontoam numa faixa de um pixel.
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
});
