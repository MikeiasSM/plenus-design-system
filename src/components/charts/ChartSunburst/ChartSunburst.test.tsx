import { fireEvent, render, screen } from '@testing-library/react';
import { ChartSunburst, type ChartSunburstNode } from './ChartSunburst';

const despesas: ChartSunburstNode[] = [
  {
    label: 'Operacionais',
    children: [
      { label: 'Pessoal', value: 500 },
      { label: 'Aluguel', value: 300 },
    ],
  },
  {
    label: 'Administrativas',
    children: [{ label: 'Sistemas', value: 200 }],
  },
];

function fixarTamanho(largura = 420, altura = 360) {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: largura });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: altura });
}

function arcos() {
  return [...document.querySelectorAll('path')];
}

describe('ChartSunburst', () => {
  beforeEach(() => fixarTamanho());
  afterEach(() => {
    Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth');
    Reflect.deleteProperty(HTMLElement.prototype, 'clientHeight');
  });

  it('nomeia o grafico pelo titulo, para quem usa leitor de tela', () => {
    render(<ChartSunburst nodes={despesas} title="Estrutura de despesas" />);

    expect(screen.getByRole('img', { name: 'Estrutura de despesas' })).toBeInTheDocument();
  });

  it('desenha um arco por no, em aneis concentricos', () => {
    render(<ChartSunburst nodes={despesas} title="Despesas" />);

    expect(arcos()).toHaveLength(5);
  });

  it('reparte o angulo do pai entre os filhos', () => {
    render(<ChartSunburst nodes={[despesas[0]]} title="Despesas" />);
    const titulos = arcos().map((no) => no.querySelector('title')?.textContent);

    expect(titulos[0]).toContain('Operacionais: 800 (100%)');
    expect(titulos.some((texto) => texto?.includes('Pessoal: 500'))).toBe(true);
  });

  it('o filho nasce da cor do pai, clareando a cada anel', () => {
    render(<ChartSunburst nodes={despesas} title="Despesas" />);
    const cores = arcos().map((no) => no.getAttribute('fill'));

    expect(cores[0]).toBe('var(--pl-chart-series-1)');
    expect(cores.filter((cor) => cor?.startsWith('color-mix')).length).toBeGreaterThan(0);
  });

  it('lista apenas o nivel zero na legenda', () => {
    render(<ChartSunburst nodes={despesas} title="Despesas" />);

    expect(screen.getByRole('button', { name: /Operacionais/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Pessoal/ })).not.toBeInTheDocument();
  });

  it('desliga o ramo pela legenda', () => {
    render(<ChartSunburst nodes={despesas} title="Despesas" />);

    fireEvent.click(screen.getByRole('button', { name: /Administrativas/ }));

    expect(arcos()).toHaveLength(3);
  });

  it('projeta o rotulo do anel externo com um conector de dois segmentos', () => {
    render(<ChartSunburst nodes={despesas} title="Despesas" />);
    const conector = document.querySelector('polyline');

    expect(conector).toBeInTheDocument();
    expect(conector?.getAttribute('points')?.split(' ')).toHaveLength(3);
  });

  it('dispensa os rotulos quando pedido', () => {
    render(<ChartSunburst nodes={despesas} showLabels={false} title="Despesas" />);

    expect(document.querySelector('polyline')).not.toBeInTheDocument();
  });

  it('anuncia a ausencia de dados em vez de desenhar aneis vazios', () => {
    render(<ChartSunburst nodes={[]} title="Despesas" />);

    expect(screen.getByText('Sem dados no período')).toBeInTheDocument();
  });
});
