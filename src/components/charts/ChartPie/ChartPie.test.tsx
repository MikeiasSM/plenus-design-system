import { fireEvent, render, screen } from '@testing-library/react';
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
});
