import { act, fireEvent, render, screen } from '@testing-library/react';
import { ChartPie, type ChartPieSlice } from './ChartPie';

const composicao: ChartPieSlice[] = [
  { label: 'Serviços', value: 60 },
  { label: 'Produtos', value: 40 },
];

function fixarTamanho(largura = 360, altura = 260) {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: largura });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: altura });
}

function fatias() {
  return [...document.querySelectorAll('path')];
}

describe('ChartPie', () => {
  beforeEach(() => fixarTamanho());
  afterEach(() => {
    Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth');
    Reflect.deleteProperty(HTMLElement.prototype, 'clientHeight');
  });

  it('nomeia o grafico pelo titulo, para quem usa leitor de tela', () => {
    render(<ChartPie slices={composicao} title="Composição da receita" />);

    expect(screen.getByRole('img', { name: 'Composição da receita' })).toBeInTheDocument();
  });

  it('desenha uma fatia cheia, sem o vazio do anel', () => {
    render(<ChartPie slices={composicao} title="Receita" />);

    expect(fatias()).toHaveLength(2);
    expect(fatias()[0].getAttribute('d')).toContain('L0,0');
  });

  it('descreve cada fatia pelo valor e pelo percentual', () => {
    render(<ChartPie slices={composicao} title="Receita" />);

    expect(fatias()[0].getAttribute('aria-label')).toBe('Serviços: 60 (60%)');
  });

  it('rotula a fatia quando pedido, e so onde o rotulo cabe', () => {
    const rotulos = () =>
      [...document.querySelectorAll('text')].map((no) => no.textContent);

    const { rerender } = render(<ChartPie slices={composicao} title="Receita" />);
    expect(rotulos()).toHaveLength(0);

    rerender(<ChartPie showDataLabels slices={composicao} title="Receita" />);
    expect(rotulos()).toEqual(['60%', '40%']);

    rerender(
      <ChartPie
        showDataLabels
        slices={[{ label: 'Quase tudo', value: 999 }, { label: 'Resto', value: 1 }]}
        title="Receita"
      />,
    );
    expect(rotulos()).toEqual(['100%']);
  });

  it('escreve o rotulo na cor de texto propria da fatia', () => {
    render(<ChartPie showDataLabels slices={composicao} title="Receita" />);

    expect([...document.querySelectorAll('text')].map((no) => no.getAttribute('fill'))).toEqual([
      'var(--pl-chart-on-series-1)',
      'var(--pl-chart-on-series-2)',
    ]);
  });

  it('pinta as fatias com a paleta do grafico, e a fatia com cor propria a vence', () => {
    render(
      <ChartPie
        palette={['#0E7C6B', '#E0A030']}
        slices={[...composicao, { color: '#123456', label: 'Outros', value: 10 }]}
        title="Receita"
      />,
    );

    expect(fatias().map((fatia) => fatia.getAttribute('fill'))).toEqual(['#0E7C6B', '#E0A030', '#123456']);
  });

  it('com clique na fatia, as fatias sao botoes percorridos pelas setas', () => {
    const aoClicar = vi.fn();
    render(<ChartPie onSliceClick={aoClicar} slices={composicao} title="Receita" />);
    const servicos = screen.getByRole('button', { name: /^Serviços:/ });

    expect(screen.getByRole('group', { name: 'Receita' })).toBeInTheDocument();
    expect(servicos).toHaveAttribute('tabindex', '0');

    act(() => servicos.focus());
    fireEvent.keyDown(servicos, { key: 'ArrowRight' });
    const produtos = screen.getByRole('button', { name: /^Produtos:/ });
    expect(produtos).toHaveFocus();
    expect(document.querySelector('[class*="tooltip"]')).toHaveTextContent('Produtos');

    fireEvent.keyDown(produtos, { key: ' ' });
    expect(aoClicar).toHaveBeenCalledWith({ label: 'Produtos', value: 40 });
  });

  it('o clique em Outros entrega as fatias que ele reune', () => {
    const aoClicar = vi.fn();
    const pequenas = [
      { label: 'Frete', value: 1 },
      { label: 'Taxas', value: 1 },
    ];
    render(<ChartPie onSliceClick={aoClicar} slices={[...composicao, ...pequenas]} smallSliceThreshold={0.05} title="Receita" />);

    fireEvent.click(screen.getByRole('button', { name: /^Outros:/ }));

    expect(aoClicar).toHaveBeenCalledWith(expect.objectContaining({ grouped: pequenas, label: 'Outros', value: 2 }));
  });

  it('desliga a fatia pela legenda', () => {
    render(<ChartPie slices={composicao} title="Receita" />);
    const botao = screen.getByRole('button', { name: /Produtos/ });

    fireEvent.click(botao);

    expect(botao).toHaveAttribute('aria-pressed', 'false');
    expect(fatias()[0].getAttribute('aria-label')).toBe('Serviços: 60 (100%)');
  });

  it('anuncia a ausencia de dados em vez de desenhar uma pizza vazia', () => {
    render(<ChartPie slices={[]} title="Receita" />);

    expect(screen.getByText('Sem dados no período')).toBeInTheDocument();
  });

  it('mostra no balao a fatia sob o ponteiro, com o valor e a parte do total', () => {
    render(<ChartPie slices={composicao} title="Receita" />);

    fireEvent.pointerMove(fatias()[1], { clientX: 10, clientY: 10 });
    fireEvent.mouseEnter(fatias()[1]);

    const balao = document.querySelector('[class*="tooltip"]')!;
    expect(balao).toHaveTextContent('Produtos');
    expect(balao).toHaveTextContent('40%');
  });
});
