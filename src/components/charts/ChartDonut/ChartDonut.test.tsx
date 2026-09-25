import { fireEvent, render, screen } from '@testing-library/react';
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
    expect(textosDoCentro()).toEqual(['6300', 'CMV']);

    fireEvent.mouseLeave(fatias()[1]);
    expect(textosDoCentro()).toEqual(['6700', 'Total']);
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
