import { fireEvent, render, screen } from '@testing-library/react';
import { ChartSankey, type ChartSankeyFlow } from './ChartSankey';

const caixa: ChartSankeyFlow[] = [
  { source: 'Receita', target: 'Custos', value: 600 },
  { source: 'Receita', target: 'Resultado', value: 400 },
  { source: 'Custos', target: 'CMV', value: 600 },
];

function fixarTamanho(largura = 520, altura = 320) {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: largura });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: altura });
}

function ligacoes() {
  return [...document.querySelectorAll('path')];
}

function nos() {
  return [...document.querySelectorAll('rect')];
}

describe('ChartSankey', () => {
  beforeEach(() => fixarTamanho());
  afterEach(() => {
    Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth');
    Reflect.deleteProperty(HTMLElement.prototype, 'clientHeight');
  });

  it('nomeia o grafico pelo titulo, para quem usa leitor de tela', () => {
    render(<ChartSankey flows={caixa} title="Fluxo do resultado" />);

    expect(screen.getByRole('img', { name: 'Fluxo do resultado' })).toBeInTheDocument();
  });

  it('deriva os nos das proprias ligacoes quando nao sao declarados', () => {
    render(<ChartSankey flows={caixa} title="Fluxo" />);

    expect(nos()).toHaveLength(4);
  });

  it('da ao no altura proporcional ao volume que passa por ele', () => {
    render(<ChartSankey flows={caixa} title="Fluxo" />);
    const alturas = nos().map((no) => Number(no.getAttribute('height')));
    const [receita, custos] = alturas;

    expect(receita).toBeGreaterThan(custos);
  });

  it('da a ligacao espessura proporcional ao valor', () => {
    render(<ChartSankey flows={caixa} title="Fluxo" />);
    const espessuras = ligacoes().map((no) => Number(no.getAttribute('stroke-width')));

    expect(espessuras[0]).toBeGreaterThan(espessuras[1]);
  });

  it('descreve a ligacao pela origem, pelo destino e pelo valor', () => {
    render(<ChartSankey flows={caixa} formatValue={(valor) => `R$ ${valor}`} title="Fluxo" />);

    expect(ligacoes()[0].querySelector('title')?.textContent).toBe('Receita → Custos: R$ 600');
  });

  it('apaga as demais ligacoes quando o ponteiro entra numa delas', () => {
    render(<ChartSankey flows={caixa} title="Fluxo" />);
    const apagadas = () =>
      ligacoes().filter((no) => no.getAttribute('class')?.includes('linkDim')).length;

    expect(apagadas()).toBe(0);

    fireEvent.mouseEnter(ligacoes()[0]);
    expect(apagadas()).toBe(2);

    fireEvent.mouseLeave(ligacoes()[0]);
    expect(apagadas()).toBe(0);
  });

  it('ancora o rotulo conforme o lado em que o no esta', () => {
    render(<ChartSankey flows={caixa} title="Fluxo" />);
    const ancoras = [...document.querySelectorAll('text')].map((no) =>
      no.getAttribute('text-anchor'),
    );

    expect(ancoras).toContain('start');
    expect(ancoras).toContain('end');
  });

  it('dispensa os rotulos quando pedido', () => {
    render(<ChartSankey flows={caixa} showLabels={false} title="Fluxo" />);

    expect(document.querySelectorAll('text')).toHaveLength(0);
  });

  it('anuncia a ausencia de dados em vez de desenhar um fluxo vazio', () => {
    render(<ChartSankey flows={[]} title="Fluxo" />);

    expect(screen.getByText('Sem dados no período')).toBeInTheDocument();
  });
});
