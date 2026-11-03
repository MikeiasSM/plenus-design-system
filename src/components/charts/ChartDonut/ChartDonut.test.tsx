import { act, fireEvent, render, screen } from '@testing-library/react';
import { ChartDonut, type ChartDonutSlice } from './ChartDonut';

const custos: ChartDonutSlice[] = [
  { label: 'Devoluções de vendas', value: 400 },
  { label: 'CMV', value: 6300 },
];

function fixarTamanho(largura = 420, altura = 260) {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: largura });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: altura });
}

function fatias() {
  return [...document.querySelectorAll('path')];
}

function textosDoCentro() {
  return [...document.querySelectorAll('text')].map((no) => no.textContent);
}

describe('ChartDonut', () => {
  beforeEach(() => fixarTamanho());
  afterEach(() => {
    Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth');
    Reflect.deleteProperty(HTMLElement.prototype, 'clientHeight');
  });

  it('nomeia o grafico pelo titulo, para quem usa leitor de tela', () => {
    render(<ChartDonut slices={custos} title="Estrutura de custos" />);

    expect(screen.getByRole('img', { name: 'Estrutura de custos' })).toBeInTheDocument();
  });

  it('desenha um arco por fatia', () => {
    render(<ChartDonut slices={custos} title="Custos" />);

    expect(fatias()).toHaveLength(2);
  });

  it('vaza o centro, que e o que separa o anel da pizza', () => {
    render(<ChartDonut slices={custos} title="Custos" />);

    // O arco vazado descreve dois circulos: o de fora e o de dentro.
    expect(fatias()[0].getAttribute('d')?.match(/A/g)?.length).toBeGreaterThan(1);
  });

  it('exibe o total no centro, com o rotulo abaixo', () => {
    render(
      <ChartDonut
        formatValue={(valor) => `${(valor / 1000).toFixed(1)}M`}
        slices={custos}
        title="Custos"
      />,
    );

    expect(textosDoCentro()).toEqual(['6.7M', 'Total']);
  });

  it('troca o centro pelo valor da fatia sob o ponteiro', () => {
    render(<ChartDonut slices={custos} title="Custos" />);

    fireEvent.mouseEnter(fatias()[1]);
    expect(textosDoCentro()).toEqual(['6.300', 'CMV']);

    fireEvent.mouseLeave(fatias()[1]);
    expect(textosDoCentro()).toEqual(['6.700', 'Total']);
  });

  it('dispensa o centro quando pedido', () => {
    render(<ChartDonut showCenter={false} slices={custos} title="Custos" />);

    expect(textosDoCentro()).toHaveLength(0);
  });

  it('lista o percentual de cada fatia na legenda', () => {
    render(<ChartDonut slices={custos} title="Custos" />);

    expect(screen.getByText('6%')).toBeInTheDocument();
    expect(screen.getByText('94%')).toBeInTheDocument();
  });

  it('desliga a fatia pela legenda e reparte o anel entre as demais', () => {
    render(<ChartDonut slices={custos} title="Custos" />);
    const botao = screen.getByRole('button', { name: /CMV/ });

    expect(botao).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(botao);

    expect(botao).toHaveAttribute('aria-pressed', 'false');
    expect(textosDoCentro()[0]).toBe('400');
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('avisa o produto quando o conjunto de ocultas muda', () => {
    const avisado: string[][] = [];
    render(
      <ChartDonut
        onHiddenSlicesChange={(ocultas) => avisado.push([...ocultas])}
        slices={custos}
        title="Custos"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /CMV/ }));

    expect(avisado).toEqual([['CMV']]);
  });

  it('reune as fatias pequenas conforme o limiar', () => {
    render(
      <ChartDonut
        slices={[
          { label: 'CMV', value: 940 },
          { label: 'Frete', value: 20 },
          { label: 'Devoluções', value: 20 },
          { label: 'Comissões', value: 20 },
        ]}
        smallSliceThreshold={0.05}
        title="Custos"
      />,
    );

    expect(fatias()).toHaveLength(2);
    expect(screen.getByRole('button', { name: /Outros/ })).toBeInTheDocument();
  });

  it('avisa a fatia sob o ponteiro ja agrupada, e nao a que o consumidor informou', () => {
    const vistas: (string | null)[] = [];

    render(
      <ChartDonut
        onHoverSlice={(fatia) => vistas.push(fatia?.label ?? null)}
        slices={[
          { label: 'CMV', value: 940 },
          { label: 'Frete', value: 20 },
          { label: 'Devoluções', value: 20 },
          { label: 'Comissões', value: 20 },
        ]}
        smallSliceThreshold={0.05}
        title="Custos"
      />,
    );

    fireEvent.mouseEnter(fatias()[1]);
    fireEvent.mouseLeave(fatias()[1]);

    // As tres pequenas viraram uma so, entao o indice 1 do anel nao e o Frete.
    expect(vistas).toEqual(['Outros', null]);
  });

  it('anuncia a ausencia de dados em vez de desenhar um anel vazio', () => {
    render(<ChartDonut slices={[]} title="Custos" />);

    expect(screen.getByText('Sem dados no período')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});

describe('ChartDonut: legenda e costura', () => {
  beforeEach(() => fixarTamanho());
  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth');
    Reflect.deleteProperty(HTMLElement.prototype, 'clientHeight');
  });

  const entradaDe = (rotulo: RegExp) => screen.getByRole('button', { name: rotulo, pressed: true }).closest('li')!;
  const classesDasFatias = () => fatias().map((fatia) => fatia.getAttribute('class') ?? '');

  function posicionarLegenda() {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      bottom: 70, height: 20, left: 100, right: 160, top: 50, width: 60, x: 100, y: 50, toJSON: () => ({}),
    });
  }

  it('a entrada da legenda realca a fatia, troca o centro e desfaz ao sair', () => {
    render(<ChartDonut slices={custos} title="Custos" />);

    fireEvent.pointerEnter(entradaDe(/CMV/));
    expect(textosDoCentro()).toEqual(['6.300', 'CMV']);
    expect(classesDasFatias()[0]).toMatch(/sliceDim/);
    expect(classesDasFatias()[1]).not.toMatch(/sliceDim/);

    fireEvent.pointerLeave(entradaDe(/CMV/));
    expect(textosDoCentro()).toEqual(['6.700', 'Total']);
    expect(classesDasFatias().join()).not.toMatch(/sliceDim/);
  });

  it('o foco da legenda faz o mesmo que o ponteiro e o blur desfaz', () => {
    render(<ChartDonut slices={custos} title="Custos" />);

    fireEvent.focus(screen.getByRole('button', { name: /CMV/ }));
    expect(textosDoCentro()).toEqual(['6.300', 'CMV']);

    fireEvent.blur(screen.getByRole('button', { name: /CMV/ }));
    expect(textosDoCentro()).toEqual(['6.700', 'Total']);
  });

  it('pela legenda avisa a fatia como foi informada, com a cor desenhada e a ancora, e null uma vez ao sair', () => {
    posicionarLegenda();
    const aoPassar = vi.fn();
    render(<ChartDonut onHoverSlice={aoPassar} palette={{ base: '#00A3A3' }} slices={custos} title="Custos" />);

    fireEvent.pointerEnter(entradaDe(/CMV/));
    expect(aoPassar).toHaveBeenLastCalledWith(custos[1], { anchor: { x: 160, y: 60 }, color: fatias()[1].getAttribute('fill') });

    fireEvent.pointerLeave(entradaDe(/CMV/));
    fireEvent.pointerEnter(screen.getByRole('button', { name: /Devoluções/ }).closest('li')!);
    fireEvent.pointerLeave(screen.getByRole('button', { name: /Devoluções/ }).closest('li')!);
    expect(aoPassar.mock.calls.map(([fatia]) => fatia?.label ?? null)).toEqual(['CMV', null, 'Devoluções de vendas', null]);
  });

  it('no ponteiro, no teclado e no clique o aviso segue com a fatia informada e um argumento so', () => {
    const aoPassar = vi.fn();
    const aoClicar = vi.fn();
    render(<ChartDonut onHoverSlice={aoPassar} onSliceClick={aoClicar} slices={custos} title="Custos" />);
    const cmv = screen.getByRole('button', { name: /^CMV:/ });

    fireEvent.mouseEnter(cmv);
    act(() => cmv.focus());
    fireEvent.keyDown(cmv, { key: 'Enter' });

    expect(aoPassar.mock.calls).toEqual([[custos[1]], [custos[1]]]);
    expect(aoClicar.mock.calls).toEqual([[custos[1]]]);
  });

  it('o salto da fatia para a legenda, que entra antes de sair, mantem o realce da legenda', () => {
    const aoPassar = vi.fn();
    render(<ChartDonut onHoverSlice={aoPassar} slices={custos} title="Custos" />);

    fireEvent.mouseEnter(fatias()[0]);
    fireEvent.pointerEnter(entradaDe(/CMV/));
    fireEvent.mouseLeave(fatias()[0]);

    expect(textosDoCentro()).toEqual(['6.300', 'CMV']);
    expect(aoPassar.mock.calls.map(([fatia]) => fatia?.label ?? null)).toEqual(['Devoluções de vendas', 'CMV']);
  });

  it('abre o balao integrado ao lado da entrada da legenda', () => {
    posicionarLegenda();
    render(<ChartDonut slices={custos} title="Custos" />);

    fireEvent.pointerEnter(entradaDe(/CMV/));

    const balao = document.querySelector<HTMLElement>('[class*="tooltip"]')!;
    expect(balao).toHaveTextContent('CMV');
    expect(balao.style.left).toBe('176px');
    expect(balao.style.top).toBe('76px');

    fireEvent.pointerLeave(entradaDe(/CMV/));
    expect(document.querySelector('[class*="tooltip"]')).toBeNull();
  });

  it('serie escondida nao realca, nao avisa e nao abre balao', () => {
    const aoPassar = vi.fn();
    render(<ChartDonut defaultHiddenSlices={['CMV']} onHoverSlice={aoPassar} slices={custos} title="Custos" />);
    const entrada = screen.getByRole('button', { name: /CMV/, pressed: false }).closest('li')!;

    fireEvent.pointerEnter(entrada);
    fireEvent.pointerLeave(entrada);

    expect(aoPassar).not.toHaveBeenCalled();
    expect(textosDoCentro()).toEqual(['400', 'Total']);
    expect(document.querySelector('[class*="tooltip"]')).toBeNull();
  });

  it('o clique na legenda continua ligando e desligando a fatia, soltando o realce', () => {
    render(<ChartDonut slices={custos} title="Custos" />);

    fireEvent.pointerEnter(entradaDe(/CMV/));
    fireEvent.click(screen.getByRole('button', { name: /CMV/ }));

    expect(screen.getByRole('button', { name: /CMV/ })).toHaveAttribute('aria-pressed', 'false');
    expect(textosDoCentro()).toEqual(['400', 'Total']);
  });
});
