import { act, fireEvent, render, screen } from '@testing-library/react';
import { ChartScatter, type ChartScatterSeries } from './ChartScatter';

const carteira: ChartScatterSeries[] = [
  {
    label: 'Clientes',
    points: [
      { label: 'Aurora', x: 10, y: 40, z: 25 },
      { label: 'Belo', x: 30, y: 80, z: 100 },
    ],
  },
];

function fixarLargura(largura = 640) {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: largura });
}

function bolhas() {
  return [...document.querySelectorAll('circle')];
}

function guias() {
  return [...document.querySelectorAll('line')].filter((no) =>
    no.getAttribute('class')?.includes('guide'),
  );
}

describe('ChartScatter', () => {
  beforeEach(() => fixarLargura());
  afterEach(() => Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth'));

  it('nomeia o grafico pelo titulo, para quem usa leitor de tela', () => {
    render(<ChartScatter series={carteira} title="Faturamento por margem" />);

    expect(screen.getByRole('img', { name: 'Faturamento por margem' })).toBeInTheDocument();
  });

  it('desenha uma bolha por ponto', () => {
    render(<ChartScatter series={carteira} title="Carteira" />);

    expect(bolhas()).toHaveLength(2);
  });

  it('mapeia o tamanho da bolha ao eixo Z pela raiz, nao pelo valor', () => {
    render(<ChartScatter series={carteira} title="Carteira" />);
    const [menor, maior] = bolhas().map((no) => Number(no.getAttribute('r')));

    expect(maior).toBeGreaterThan(menor);
    expect(maior / menor).toBeLessThan(100 / 25);
  });

  it('mantem as bolhas do mesmo tamanho quando nao existe eixo Z', () => {
    render(
      <ChartScatter
        series={[{ label: 'Clientes', points: [{ x: 10, y: 40 }, { x: 30, y: 80 }] }]}
        title="Carteira"
      />,
    );

    const raios = bolhas().map((no) => no.getAttribute('r'));

    expect(new Set(raios).size).toBe(1);
  });

  it('descreve o ponto pelas duas medidas e pelo eixo Z, no formato do consumidor', () => {
    render(
      <ChartScatter
        formatX={(valor) => `${valor}%`}
        formatY={(valor) => `${valor} dias`}
        formatZ={(valor) => `R$ ${valor}`}
        series={carteira}
        title="Carteira"
      />,
    );

    expect(bolhas()[0].getAttribute('aria-label')).toBe(
      'Clientes, Aurora: 10% × 40 dias (R$ 25)',
    );
  });

  it('desenha as guias ate os eixos somente no ponto sob o ponteiro', () => {
    render(<ChartScatter series={carteira} title="Carteira" />);
    expect(guias()).toHaveLength(0);

    fireEvent.mouseEnter(bolhas()[0]);
    expect(guias()).toHaveLength(2);

    fireEvent.mouseLeave(bolhas()[0]);
    expect(guias()).toHaveLength(0);
  });

  it('anuncia a ausencia de dados em vez de desenhar eixos vazios', () => {
    render(<ChartScatter series={[{ label: 'Clientes', points: [] }]} title="Carteira" />);

    expect(screen.getByText('Sem dados no período')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('mostra no balao o ponto sob o ponteiro, com as medidas nomeadas', () => {
    render(<ChartScatter series={carteira} title="Carteira" xLabel="Prazo" yLabel="Margem" zLabel="Receita" />);

    fireEvent.pointerMove(bolhas()[1], { clientX: 10, clientY: 10 });
    fireEvent.mouseEnter(bolhas()[1]);

    const balao = document.querySelector('[class*="tooltip"]')!;
    expect(balao).toHaveTextContent('Belo');
    expect(balao).toHaveTextContent('Clientes');
    expect(balao).toHaveTextContent('Prazo');
    expect(balao).toHaveTextContent('Receita');
    expect(bolhas()[1].querySelector('title')).toBeNull();
  });

  it('com clique no ponto, os pontos sao botoes e o foco pelo teclado abre a guia', () => {
    const aoClicar = vi.fn();
    render(<ChartScatter onPointClick={aoClicar} series={carteira} title="Carteira" />);
    const aurora = screen.getByRole('button', { name: /^Clientes, Aurora/ });

    expect(screen.getByRole('group', { name: 'Carteira' })).toBeInTheDocument();

    act(() => aurora.focus());
    expect(guias()).toHaveLength(2);

    fireEvent.keyDown(aurora, { key: 'ArrowRight' });
    expect(screen.getByRole('button', { name: /^Clientes, Belo/ })).toHaveFocus();

    fireEvent.keyDown(document.activeElement!, { key: 'Enter' });
    expect(aoClicar).toHaveBeenCalledWith({ index: 1, point: carteira[0].points[1], series: 'Clientes' });
  });
});
