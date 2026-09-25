import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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

function valores() {
  return [...document.querySelectorAll('text')]
    .filter((no) => no.getAttribute('class')?.includes('flowValue'))
    .map((no) => no.textContent ?? '');
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
    const [receita, custos] = nos().map((no) => Number(no.getAttribute('height')));

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

  it('poe todo rotulo a direita do no, como na referencia', () => {
    render(<ChartSankey flows={caixa} title="Fluxo" />);
    const rotulos = [...document.querySelectorAll('text')];

    expect(rotulos.every((no) => no.getAttribute('text-anchor') === 'start')).toBe(true);
    expect(rotulos.map((no) => no.textContent)).toContain('Receita');
  });

  it('da halo ao rotulo que cai sobre o fluxo, e dispensa no de saida', () => {
    render(<ChartSankey flows={caixa} title="Fluxo" />);
    const comHalo = [...document.querySelectorAll('text')]
      .filter((no) => no.getAttribute('class')?.includes('sobreFluxo'))
      .map((no) => no.textContent);

    // De CMV e Resultado nada parte: os rotulos deles caem na banda reservada.
    expect(comHalo).toEqual(['Receita', 'Custos']);
  });

  it('reserva a banda do rotulo de saida, que nao tem fluxo para escrever por cima', () => {
    const fimDoFluxo = () => {
      const ultimo = nos().at(-1)!;
      return Number(ultimo.getAttribute('x')) + Number(ultimo.getAttribute('width'));
    };

    const { rerender } = render(<ChartSankey flows={caixa} showLabels={false} title="Fluxo" />);
    const semRotulo = fimDoFluxo();

    rerender(<ChartSankey flows={caixa} title="Fluxo" />);

    expect(fimDoFluxo()).toBeLessThan(semRotulo);
  });

  it('escreve o valor de cada ligacao quando pedido', () => {
    const { rerender } = render(<ChartSankey flows={caixa} title="Fluxo" />);
    expect(valores()).toHaveLength(0);

    rerender(<ChartSankey flows={caixa} showFlowValues title="Fluxo" />);
    expect(valores().sort()).toEqual(['400', '600', '600']);
  });

  it('escreve o valor no comeco, no meio ou no fim da ligacao', () => {
    const posicaoDe = (texto: string) =>
      Number(
        [...document.querySelectorAll('text')]
          .find((no) => no.textContent === texto)
          ?.getAttribute('x'),
      );

    const { rerender } = render(
      <ChartSankey flowValuePosition="start" flows={caixa} showFlowValues title="Fluxo" />,
    );
    const noComeco = posicaoDe('400');

    rerender(<ChartSankey flowValuePosition="end" flows={caixa} showFlowValues title="Fluxo" />);

    expect(posicaoDe('400')).toBeGreaterThan(noComeco);
  });

  it('omite o valor que cruzaria o rotulo de um no, em vez de sobrepor os dois', () => {
    // Com o valor no comeco da ligacao ele disputa a faixa com o rotulo da
    // propria origem, que fica logo a direita do no.
    render(<ChartSankey flowValuePosition="start" flows={caixa} showFlowValues title="Fluxo" />);
    const noComeco = valores().length;

    cleanup();
    render(<ChartSankey flowValuePosition="end" flows={caixa} showFlowValues title="Fluxo" />);

    expect(valores().length).toBeGreaterThan(noComeco);
  });

  it('tira a cor da ligacao da origem, do destino ou de nenhum dos dois', () => {
    const cores = () => ligacoes().map((no) => no.getAttribute('stroke'));

    const { rerender } = render(<ChartSankey flows={caixa} title="Fluxo" />);
    const daOrigem = cores();

    rerender(<ChartSankey flowColor="target" flows={caixa} title="Fluxo" />);
    expect(cores()).not.toEqual(daOrigem);

    rerender(<ChartSankey flowColor="neutral" flows={caixa} title="Fluxo" />);
    expect(new Set(cores())).toEqual(new Set(['var(--pl-chart-neutral)']));
  });

  it('encosta os nos conforme o alinhamento pedido', () => {
    const inicios = () => nos().map((no) => Number(no.getAttribute('x')));

    const { rerender } = render(<ChartSankey flows={caixa} title="Fluxo" />);
    const justificado = inicios();

    rerender(<ChartSankey flows={caixa} nodeAlign="left" title="Fluxo" />);

    expect(inicios()).not.toEqual(justificado);
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
