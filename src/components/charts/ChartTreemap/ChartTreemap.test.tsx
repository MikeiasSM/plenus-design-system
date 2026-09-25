import { fireEvent, render, screen } from '@testing-library/react';
import { ChartTreemap, type ChartTreemapNode } from './ChartTreemap';

const produtos: ChartTreemapNode[] = [
  {
    label: 'Margem alta',
    intent: 'positive',
    children: [
      { label: 'Serviço A', value: 400 },
      { label: 'Serviço B', value: 260 },
    ],
  },
  {
    label: 'Margem baixa',
    intent: 'negative',
    children: [{ label: 'Produto C', value: 180 }],
  },
];

function fixarTamanho(largura = 480, altura = 280) {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: largura });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: altura });
}

function retangulos() {
  return [...document.querySelectorAll('rect')];
}

describe('ChartTreemap', () => {
  beforeEach(() => fixarTamanho());
  afterEach(() => {
    Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth');
    Reflect.deleteProperty(HTMLElement.prototype, 'clientHeight');
  });

  it('nomeia o grafico pelo titulo, para quem usa leitor de tela', () => {
    render(<ChartTreemap nodes={produtos} title="Produtos por margem" />);

    expect(screen.getByRole('img', { name: 'Produtos por margem' })).toBeInTheDocument();
  });

  it('desenha um retangulo por folha, nao por grupo', () => {
    render(<ChartTreemap nodes={produtos} title="Produtos" />);

    expect(retangulos()).toHaveLength(3);
  });

  it('dimensiona a area pelo valor da folha', () => {
    render(<ChartTreemap nodes={produtos} title="Produtos" />);
    const area = (no: Element) =>
      Number(no.getAttribute('width')) * Number(no.getAttribute('height'));

    const [maior, meio, menor] = retangulos();

    expect(area(maior)).toBeGreaterThan(area(meio));
    expect(area(meio)).toBeGreaterThan(area(menor));
  });

  it('a folha herda a cor do grupo, que aqui e a intencao', () => {
    render(<ChartTreemap nodes={produtos} title="Produtos" />);
    const cores = retangulos().map((no) => no.getAttribute('fill'));

    expect(cores.filter((cor) => cor === 'var(--pl-chart-positive)')).toHaveLength(2);
    expect(cores.filter((cor) => cor === 'var(--pl-chart-negative)')).toHaveLength(1);
  });

  it('nomeia as cores na legenda quando o mapa e colorido por status', () => {
    render(
      <ChartTreemap
        intentLabels={{ positive: 'Margem alta', negative: 'Margem baixa' }}
        nodes={produtos}
        title="Produtos"
      />,
    );

    expect(screen.getByText('Margem alta')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('lista os grupos na legenda quando as cores nao carregam status', () => {
    render(<ChartTreemap nodes={produtos} title="Produtos" />);

    expect(screen.getByRole('button', { name: /Margem baixa/ })).toBeInTheDocument();
  });

  it('desliga o grupo pela legenda e redistribui a area', () => {
    render(<ChartTreemap nodes={produtos} title="Produtos" />);

    fireEvent.click(screen.getByRole('button', { name: /Margem baixa/ }));

    expect(retangulos()).toHaveLength(2);
  });

  it('descreve cada folha pelo valor, no formato do consumidor', () => {
    render(<ChartTreemap formatValue={(valor) => `R$ ${valor}`} nodes={produtos} title="Produtos" />);

    expect(retangulos()[0].getAttribute('aria-label')).toBe('Serviço A: R$ 400');
  });

  it('anuncia a ausencia de dados em vez de desenhar um mapa vazio', () => {
    render(<ChartTreemap nodes={[]} title="Produtos" />);

    expect(screen.getByText('Sem dados no período')).toBeInTheDocument();
  });
});
