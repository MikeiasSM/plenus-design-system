import { act, fireEvent, render, screen } from '@testing-library/react';
import chartStyles from '../core/Chart.module.css';
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

    expect(barras()[0].getAttribute('aria-label')).toBe('Receita, 08/2026: R$ 300.000');
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

  it('com o eixo dinamico, encolhe o desenho para o eixo entrar depois de um instante de ponteiro, e devolve ao sair', () => {
    vi.useFakeTimers();
    render(<ChartBar categories={periodos} series={dre} title="DRE" yAxis="onHover" />);
    const area = document.querySelector('figure svg')!.parentElement!;
    const eixo = () => document.querySelector(`.${chartStyles.dynamicAxis}`)!;
    // O desenho comeca na margem esquerda: ela cresce quando o eixo da esquerda abre a calha.
    const margemEsquerda = () => Number(document.querySelector('figure svg g')!.getAttribute('transform')!.match(/translate\(([\d.]+)/)![1]);
    const recolhida = margemEsquerda();

    fireEvent.pointerEnter(area);
    act(() => vi.advanceTimersByTime(300));
    expect(eixo()).not.toHaveClass(chartStyles.dynamicAxisRevealed!);

    act(() => vi.advanceTimersByTime(300));
    expect(eixo()).toHaveClass(chartStyles.dynamicAxisRevealed!);
    expect(margemEsquerda()).toBeGreaterThan(recolhida);

    fireEvent.pointerLeave(area);
    expect(eixo()).not.toHaveClass(chartStyles.dynamicAxisRevealed!);
    expect(margemEsquerda()).toBe(recolhida);
    vi.useRealTimers();
  });

  it('com todas as series desligadas, a escala nao desaba: vale a de todas, e a ultima sai encolhendo em vez de esticar para fora', () => {
    const { rerender } = render(<ChartBar categories={periodos} series={dre} title="DRE" />);
    const escala = rotulosDoEixo().filter((rotulo) => /\d/.test(rotulo ?? '') && !rotulo?.includes('/'));

    rerender(<ChartBar categories={periodos} hiddenSeries={dre.map((serie) => serie.label)} series={dre} title="DRE" />);

    expect(rotulosDoEixo()).toEqual(expect.arrayContaining(escala));
  });

  it('mostra no balao as series da categoria sob o ponteiro, e nada com ele desligado', () => {
    const { rerender } = render(<ChartBar categories={periodos} series={dre} title="DRE" />);
    const barra = document.querySelector('figure svg path[aria-label^="Receita, 08/2026"]')!;

    fireEvent.pointerMove(barra, { clientX: 10, clientY: 10 });
    fireEvent.mouseEnter(barra);

    const balao = document.querySelector('[class*="tooltip"]')!;
    expect(balao).toHaveTextContent('08/2026');
    expect(balao).toHaveTextContent('Receita');
    expect(balao).toHaveTextContent('Despesas');

    rerender(<ChartBar categories={periodos} series={dre} showTooltip={false} title="DRE" />);
    expect(document.querySelector('[class*="tooltip"]')).toBeNull();
  });

  it('formata o balao a parte quando pedido: eixo compacto, balao exato', () => {
    render(
      <ChartBar
        categories={periodos}
        formatTooltipValue={(valor) => `R$ ${valor}`}
        formatValue={(valor) => `${valor / 1000} k`}
        series={dre}
        title="DRE"
      />,
    );
    const barra = document.querySelector('figure svg path[aria-label^="Receita, 08/2026"]')!;

    fireEvent.pointerMove(barra, { clientX: 10, clientY: 10 });
    fireEvent.mouseEnter(barra);

    expect(document.querySelector('[class*="tooltip"]')).toHaveTextContent('R$ 300000');
    expect(rotulosDoEixo()).toContain('300 k');
  });

  it('desligando a ultima serie pela legenda, a escala fica a da serie que saiu', () => {
    render(<ChartBar categories={periodos} series={dre} title="DRE" />);
    const legenda = (rotulo: string) => screen.getByRole('button', { name: rotulo });
    const escala = () => rotulosDoEixo().filter((rotulo) => /\d/.test(rotulo ?? '') && !rotulo?.includes('/'));

    fireEvent.click(legenda('Receita'));
    fireEvent.click(legenda('Deduções'));
    const daUltima = escala();

    fireEvent.click(legenda('Despesas'));

    expect(escala()).toEqual(daUltima);
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

  it('aceita uma serie nova sem quebrar, enquanto o movimento ainda nao a conhece', () => {
    const { rerender } = render(<ChartBar categories={periodos} series={[dre[0]]} title="DRE" />);

    // O tween devolve o array anterior por um render: a serie que entra nao tem
    // presenca, e o indice dela ainda nao existe na reparticao da faixa.
    rerender(<ChartBar categories={periodos} series={[dre[0], dre[1]]} title="DRE" />);

    expect(barras()).toHaveLength(4);
  });

  it('empilha sinais mistos dentro da area, e nao por cima do titulo', () => {
    render(
      <ChartBar
        categories={['jan']}
        series={[{ label: 'Entrada', values: [10] }, { label: 'Saida', values: [-5] }]}
        stacked
        title="Caixa"
      />,
    );

    // Somar +10 e -5 dava dominio 0..5, e o segmento positivo subia a -263.
    const ys = barras().flatMap((barra) =>
      ((barra.getAttribute('d') ?? '').match(/-?\d+(\.\d+)?/g) ?? [])
        .map(Number)
        .filter((_, indice) => indice % 2 === 1),
    );

    expect(Math.min(...ys)).toBeGreaterThanOrEqual(0);
  });

  it('desce o negativo da pilha abaixo do zero, sem cobrir o positivo', () => {
    const series = [
      { label: 'Entrada', values: [10] },
      { label: 'Saida', values: [-5] },
    ];
    const { rerender } = render(<ChartBar categories={['jan']} series={series} stacked title="Caixa" />);

    let entrada = caixaDe(document.querySelector('[aria-label^="Entrada"]')!);
    let saida = caixaDe(document.querySelector('[aria-label^="Saida"]')!);

    // Na soma corrida, a saida era pintada de 10 a 5, por cima da entrada.
    expect(saida.y).toBeCloseTo(entrada.y + entrada.altura);
    expect(saida.altura).toBeCloseTo(entrada.altura / 2);

    rerender(<ChartBar categories={['jan']} orientation="horizontal" series={series} stacked title="Caixa" />);

    entrada = caixaDe(document.querySelector('[aria-label^="Entrada"]')!);
    saida = caixaDe(document.querySelector('[aria-label^="Saida"]')!);

    expect(saida.x + saida.largura).toBeCloseTo(entrada.x);
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

    rerender(<ChartBar categories={periodos} series={[dre[0]]} showDataLabels="visible" title="DRE" />);
    expect(rotulosDeBarra()).toEqual(['300.000', '210.000']);
  });

  it('rotula a pilha pelo total da categoria, alem da ponta dela', () => {
    render(
      <ChartBar
        categories={['jan']}
        series={[
          { label: 'Entrada', values: [10] },
          { label: 'Saida', values: [-4] },
          { label: 'Ajuste', values: [5] },
        ]}
        showDataLabels="visible"
        stacked
        title="Caixa"
      />,
    );

    const rotulos = [...document.querySelectorAll('text')].filter((no) => no.getAttribute('class')?.includes('value'));
    const topoDaPilha = Math.min(...barras().map((barra) => caixaDe(barra).y));

    expect(rotulos.map((no) => no.textContent)).toEqual(['11']);
    expect(Number(rotulos[0].getAttribute('y'))).toBeLessThan(topoDaPilha);
  });

  it('escreve o rotulo do negativo alem da ponta, e nao dentro da barra', () => {
    render(
      <ChartBar categories={['jan']} series={[{ label: 'Saldo', values: [-50] }]} showDataLabels="visible" title="Caixa" />,
    );

    const barra = caixaDe(document.querySelector('[aria-label^="Saldo"]')!);
    const rotulo = [...document.querySelectorAll('text')].find((no) => no.getAttribute('dominant-baseline') === 'hanging');

    expect(Number(rotulo?.getAttribute('y'))).toBeGreaterThan(barra.y + barra.altura);
  });

  it('sem clique na barra, o desenho e imagem e as barras nao sao botoes', () => {
    render(<ChartBar categories={periodos} series={dre} title="DRE" />);

    expect(screen.getByRole('img', { name: 'DRE' })).toBeInTheDocument();
    expect(screen.queryAllByRole('button', { name: /Receita,/ })).toHaveLength(0);
  });

  it('com clique na barra, cada barra e botao, com uma parada de tabulacao so', () => {
    const aoClicar = vi.fn();
    render(<ChartBar categories={periodos} onBarClick={aoClicar} series={dre} title="DRE" />);
    const botoes = screen.getAllByRole('button', { name: /, \d{2}\/2026:/ });

    expect(screen.getByRole('group', { name: 'DRE' })).toBeInTheDocument();
    expect(botoes).toHaveLength(6);
    expect(botoes.filter((botao) => botao.getAttribute('tabindex') === '0')).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: /Despesas, 09\/2026/ }));

    expect(aoClicar).toHaveBeenCalledWith({ category: '09/2026', index: 1, series: 'Despesas', value: 8000 });
  });

  it('as setas andam entre categorias e series, e Enter ativa a barra em foco', () => {
    const aoClicar = vi.fn();
    render(<ChartBar categories={periodos} onBarClick={aoClicar} series={dre} title="DRE" />);
    const primeira = screen.getByRole('button', { name: /Receita, 08\/2026/ });

    act(() => primeira.focus());
    fireEvent.keyDown(primeira, { key: 'ArrowRight' });
    expect(screen.getByRole('button', { name: /Receita, 09\/2026/ })).toHaveFocus();

    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
    expect(screen.getByRole('button', { name: /Deduções, 09\/2026/ })).toHaveFocus();

    fireEvent.keyDown(document.activeElement!, { key: 'Home' });
    expect(screen.getByRole('button', { name: /Deduções, 08\/2026/ })).toHaveFocus();

    fireEvent.keyDown(document.activeElement!, { key: 'Enter' });
    expect(aoClicar).toHaveBeenCalledWith({ category: '08/2026', index: 0, series: 'Deduções', value: 179000 });
  });
});
