import { fireEvent, render, screen } from '@testing-library/react';
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
  return [...document.querySelectorAll('path')];
}

/** Caixa que envolve o caminho da barra, a partir das coordenadas dele. */
function caixaDe(barra: Element) {
  const numeros = (barra.getAttribute('d') ?? '').match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
  const xs = numeros.filter((_, indice) => indice % 2 === 0);
  const ys = numeros.filter((_, indice) => indice % 2 === 1);

  return {
    altura: Math.max(...ys) - Math.min(...ys),
    largura: Math.max(...xs) - Math.min(...xs),
    x: Math.min(...xs),
    y: Math.min(...ys),
  };
}

function rotulosDoEixo() {
  return [...document.querySelectorAll('text')].map((no) => no.textContent);
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
    const agrupada = caixaDe(barras()[0]).largura;

    rerender(<ChartBar categories={periodos} series={dre} stacked title="DRE" />);
    const empilhada = caixaDe(barras()[0]).largura;

    expect(empilhada).toBeGreaterThan(agrupada);
  });

  it('arredonda so as pontas da pilha, para os segmentos lerem como uma barra so', () => {
    const cantos = (barra: Element) => (barra.getAttribute('d') ?? '').match(/Q/g)?.length ?? 0;

    render(<ChartBar categories={periodos} series={dre} stacked title="DRE" />);

    // Uma barra por serie e categoria, na ordem das series.
    const [base, meio, topo] = [barras()[0], barras()[2], barras()[4]];

    expect(cantos(base)).toBe(2);
    expect(cantos(meio)).toBe(0);
    expect(cantos(topo)).toBe(2);
  });

  it('arredonda os quatro cantos quando a barra nao empilha', () => {
    render(<ChartBar categories={periodos} series={[dre[0]]} title="DRE" />);

    expect((barras()[0].getAttribute('d') ?? '').match(/Q/g)).toHaveLength(4);
  });

  it('vira as barras na horizontal', () => {
    const { rerender } = render(<ChartBar categories={periodos} series={dre} title="DRE" />);
    const alturaVertical = caixaDe(barras()[0]).altura;

    rerender(<ChartBar categories={periodos} orientation="horizontal" series={dre} title="DRE" />);

    expect(caixaDe(barras()[0]).largura).toBeGreaterThan(alturaVertical);
  });

  it('exibe a legenda a partir de duas series', () => {
    const { rerender } = render(<ChartBar categories={periodos} series={dre} title="DRE" />);
    expect(screen.getByText('Deduções')).toBeInTheDocument();

    rerender(<ChartBar categories={periodos} series={[dre[0]]} title="DRE" />);
    expect(screen.queryByText('Deduções')).not.toBeInTheDocument();
  });

  it('deriva a calha do eixo do rotulo mais largo, em vez de uma constante', () => {
    const larguraDoDesenho = () => Number(document.querySelector('svg g')?.getAttribute('transform')?.match(/translate\(([\d.]+)/)?.[1]);

    const { rerender } = render(
      <ChartBar categories={periodos} formatValue={(valor) => String(valor)} series={dre} title="DRE" />,
    );
    const estreita = larguraDoDesenho();

    rerender(
      <ChartBar
        categories={periodos}
        formatValue={(valor) => `R$ ${valor.toLocaleString('pt-BR')},00`}
        series={dre}
        title="DRE"
      />,
    );

    expect(larguraDoDesenho()).toBeGreaterThan(estreita as number);
  });

  it('esconde o eixo pedido e devolve o espaco ao desenho', () => {
    const { rerender } = render(<ChartBar categories={periodos} series={dre} title="DRE" />);
    expect(rotulosDoEixo()).toContain('08/2026');

    rerender(<ChartBar categories={periodos} series={dre} title="DRE" xAxis="hidden" />);
    expect(rotulosDoEixo()).not.toContain('08/2026');
  });

  it('mantem o eixo dinamico na arvore, porque a calha ja esta reservada', () => {
    render(<ChartBar categories={periodos} series={dre} title="DRE" yAxis="onHover" />);

    expect(document.querySelector('[class*="dynamicAxis"]')).toBeInTheDocument();
  });

  it('mostra o eixo da direita somente quando pedido', () => {
    const { rerender } = render(<ChartBar categories={periodos} series={dre} title="DRE" />);
    const comUmEixo = rotulosDoEixo().length;

    rerender(<ChartBar categories={periodos} series={dre} title="DRE" yAxisRight="visible" />);

    expect(rotulosDoEixo().length).toBeGreaterThan(comUmEixo);
  });

  it('espelha na direita o eixo da esquerda, e nao o de baixo', () => {
    render(
      <ChartBar
        categories={periodos}
        orientation="horizontal"
        series={dre}
        title="DRE"
        yAxisRight="visible"
      />,
    );

    const vezesQueAparece = rotulosDoEixo().filter((texto) => texto === '08/2026').length;

    expect(vezesQueAparece).toBe(2);
  });

  it('realca a faixa sob o ponteiro, sem apagar as demais barras', () => {
    render(<ChartBar categories={periodos} series={dre} title="DRE" />);
    const realce = () => document.querySelector('[class*="cursor"]');

    expect(realce()).not.toBeInTheDocument();

    fireEvent.mouseEnter(barras()[0]);
    expect(realce()).toBeInTheDocument();
    expect(barras().every((barra) => barra.getAttribute('opacity') === null)).toBe(true);

    fireEvent.mouseLeave(barras()[0]);
    expect(realce()).not.toBeInTheDocument();
  });

  it('leva a legenda lateral para baixo nas barras horizontais, que precisam da largura', () => {
    const lateral = () => document.querySelector('[class*="legendSide"]');

    const { rerender } = render(<ChartBar categories={periodos} legend="right" series={dre} title="DRE" />);
    expect(lateral()).toBeInTheDocument();

    rerender(
      <ChartBar categories={periodos} legend="right" orientation="horizontal" series={dre} title="DRE" />,
    );
    expect(lateral()).not.toBeInTheDocument();
  });

  it('dispensa a legenda quando pedido', () => {
    render(<ChartBar categories={periodos} legend="none" series={dre} title="DRE" />);

    expect(screen.queryByText('Deduções')).not.toBeInTheDocument();
  });

  it('assume a altura do contêiner quando o consumidor entrega a decisao a ele', () => {
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 420 });

    const { rerender } = render(<ChartBar categories={periodos} series={dre} title="DRE" />);
    expect(document.querySelector('svg')).toHaveAttribute('height', '260');

    rerender(<ChartBar categories={periodos} height="fill" series={dre} title="DRE" />);
    expect(document.querySelector('svg')).toHaveAttribute('height', '420');

    Reflect.deleteProperty(HTMLElement.prototype, 'clientHeight');
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

    rerender(<ChartBar categories={periodos} series={[dre[0]]} showDataLabels title="DRE" />);
    expect(rotulosDeBarra()).toEqual(['300000', '210000']);
  });
});
