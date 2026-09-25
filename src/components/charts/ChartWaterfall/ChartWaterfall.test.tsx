import { render, screen } from '@testing-library/react';
import { ChartWaterfall, type ChartWaterfallStep } from './ChartWaterfall';

const dre: ChartWaterfallStep[] = [
  { label: 'Receita', value: 300000 },
  { label: 'Deduções', value: -80000 },
  { label: 'Despesas', value: -50000 },
  { label: 'Resultado', value: 170000, total: true },
];

function fixarLargura(largura = 640) {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: largura });
}

function barras() {
  return [...document.querySelectorAll('rect')];
}

function topoEBase(indice: number) {
  const barra = barras()[indice];
  const topo = Number(barra.getAttribute('y'));

  return { base: topo + Number(barra.getAttribute('height')), topo };
}

function rotulos() {
  return [...document.querySelectorAll('text')]
    .filter((no) => no.getAttribute('class')?.includes('valueLabel'))
    .map((no) => no.textContent);
}

describe('ChartWaterfall', () => {
  beforeEach(() => fixarLargura());
  afterEach(() => Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth'));

  it('nomeia o grafico pelo titulo, para quem usa leitor de tela', () => {
    render(<ChartWaterfall steps={dre} title="Formação do resultado" />);

    expect(screen.getByRole('img', { name: 'Formação do resultado' })).toBeInTheDocument();
  });

  it('desenha uma barra por passo', () => {
    render(<ChartWaterfall steps={dre} title="DRE" />);

    expect(barras()).toHaveLength(4);
  });

  it('faz a barra flutuar: cada passo parte de onde o anterior parou', () => {
    render(<ChartWaterfall steps={dre} title="DRE" />);

    expect(topoEBase(1).topo).toBeCloseTo(topoEBase(0).topo, 5);
  });

  it('faz o total partir do zero, em vez de acrescentar ao acumulado', () => {
    render(<ChartWaterfall steps={dre} title="DRE" />);
    const linhaDaBase = topoEBase(0).base;

    expect(topoEBase(3).base).toBeCloseTo(linhaDaBase, 5);
  });

  it('colore o passo pelo sinal, e o total como fechamento', () => {
    render(<ChartWaterfall steps={dre} title="DRE" />);
    const cores = barras().map((barra) => barra.getAttribute('fill'));

    expect(cores).toEqual([
      'var(--pl-chart-positive)',
      'var(--pl-chart-negative)',
      'var(--pl-chart-negative)',
      'var(--pl-chart-neutral)',
    ]);
  });

  it('respeita a intencao declarada pelo consumidor sobre a deduzida do sinal', () => {
    render(<ChartWaterfall steps={[{ label: 'Deduções', value: -80000, intent: 'warning' }]} title="DRE" />);

    expect(barras()[0]).toHaveAttribute('fill', 'var(--pl-chart-warning)');
  });

  it('liga os passos por uma linha tracejada, uma a menos que as barras', () => {
    render(<ChartWaterfall steps={dre} title="DRE" />);

    const conectores = [...document.querySelectorAll('line')].filter((no) =>
      no.getAttribute('class')?.includes('connector'),
    );

    expect(conectores).toHaveLength(3);
  });

  it('rotula a variacao com sinal, e o total sem ele', () => {
    render(
      <ChartWaterfall
        formatValue={(valor) => `${Math.round(Math.abs(valor) / 1000)}k`}
        steps={dre}
        title="DRE"
      />,
    );

    expect(rotulos()).toEqual(['+300k', '-80k', '-50k', '170k']);
  });

  it('dispensa o rotulo de variacao quando pedido', () => {
    render(<ChartWaterfall showValues={false} steps={dre} title="DRE" />);

    expect(rotulos()).toHaveLength(0);
  });

  it('mantem passos de mesmo rotulo em faixas proprias, em vez de sobrepor', () => {
    render(
      <ChartWaterfall
        steps={[
          { label: 'Ajustes', value: 10000 },
          { label: 'Ajustes', value: -4000 },
        ]}
        title="Caixa"
      />,
    );

    const [primeira, segunda] = barras().map((barra) => Number(barra.getAttribute('x')));

    expect(segunda).toBeGreaterThan(primeira);
  });

  it('anuncia a ausencia de dados em vez de desenhar eixos vazios', () => {
    render(<ChartWaterfall steps={[]} title="DRE" />);

    expect(screen.getByText('Sem dados no período')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
