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

  it('acende a ligacao sob o ponteiro e apaga as demais', () => {
    render(<ChartSankey flows={caixa} title="Fluxo" />);
    const com = (classe: string) =>
      ligacoes().filter((no) => no.getAttribute('class')?.includes(classe)).length;

    expect(com('linkOn')).toBe(0);
    expect(com('linkDim')).toBe(0);

    fireEvent.mouseEnter(ligacoes()[0]);

    // Apagar as outras sozinho nao destaca: a de foco tambem sobe de tom.
    expect(com('linkOn')).toBe(1);
    expect(com('linkDim')).toBe(2);

    fireEvent.mouseLeave(ligacoes()[0]);
    expect(com('linkOn')).toBe(0);
  });

  it('ancora o rotulo pelo papel do no: entrada a esquerda, saida a direita', () => {
    render(<ChartSankey flows={caixa} title="Fluxo" />);
    const rotulo = (texto: string) =>
      [...document.querySelectorAll('text')].find((no) => no.textContent === texto)!;

    // Nada desemboca em Receita, e nada parte de CMV.
    expect(rotulo('Receita')).toHaveAttribute('text-anchor', 'end');
    expect(rotulo('CMV')).toHaveAttribute('text-anchor', 'start');
  });

  it('da halo ao rotulo do no do meio, que cai sobre o fluxo', () => {
    render(<ChartSankey flows={caixa} title="Fluxo" />);
    const comHalo = [...document.querySelectorAll('text')].filter((no) =>
      no.getAttribute('class')?.includes('labelSobreFluxo'),
    );

    // Custos e o unico no que recebe e entrega ao mesmo tempo.
    expect(comHalo.map((no) => no.textContent)).toEqual(['Custos']);
  });

  it('reserva a banda do rotulo antes do fluxo, em cada lado', () => {
    const inicioDoFluxo = () => Number(nos()[0].getAttribute('x'));

    const { rerender } = render(<ChartSankey flows={caixa} showLabels={false} title="Fluxo" />);
    const semRotulo = inicioDoFluxo();

    rerender(<ChartSankey flows={caixa} title="Fluxo" />);

    expect(inicioDoFluxo()).toBeGreaterThan(semRotulo);
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
