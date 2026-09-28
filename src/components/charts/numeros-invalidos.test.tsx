import { fireEvent, render, screen } from '@testing-library/react';
import { ChartArea } from './ChartArea';
import { ChartBar } from './ChartBar';
import { ChartDonut } from './ChartDonut';
import { ChartLine } from './ChartLine';
import { ChartPie } from './ChartPie';
import { ChartRadial } from './ChartRadial';
import { ChartScatter } from './ChartScatter';
import { ChartWaterfall } from './ChartWaterfall';
import { groupSmallSlices } from './core/slices';

function medir() {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 640 });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 260 });
}

function caminhos() {
  return [...document.querySelectorAll('path')].map((no) => no.getAttribute('d') ?? '');
}

describe('numero invalido nos dados', () => {
  beforeEach(medir);
  afterEach(() => {
    Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth');
    Reflect.deleteProperty(HTMLElement.prototype, 'clientHeight');
  });

  it('nao vira geometria invalida na barra', () => {
    render(<ChartBar categories={['a', 'b']} series={[{ label: 'A', values: [10, NaN] }]} title="x" />);

    expect(caminhos().some((d) => d.includes('NaN'))).toBe(false);
  });

  it('interrompe a curva em vez de desenhar o invalido no topo do eixo', () => {
    render(
      <ChartLine
        categories={['a', 'b', 'c']}
        series={[{ label: 'A', values: [10, NaN, 30] }]}
        title="x"
      />,
    );

    // Dois trechos: o invalido rompe a curva, como o ausente ja rompia.
    expect(caminhos()[0].match(/M/g)).toHaveLength(2);
  });

  it('interrompe a faixa da area pelo mesmo motivo', () => {
    render(
      <ChartArea categories={['a', 'b', 'c']} series={[{ label: 'A', values: [10, NaN, 30] }]} title="x" />,
    );

    expect(caminhos().some((d) => d.includes('NaN'))).toBe(false);
  });

  it('nao zera o anel inteiro por causa de uma fatia', () => {
    render(
      <ChartDonut
        slices={[{ label: 'Boa', value: 60 }, { label: 'Ruim', value: NaN }]}
        title="x"
      />,
    );

    expect(caminhos().some((d) => d.includes('NaN'))).toBe(false);
    expect(caminhos().some((d) => d.length > 10)).toBe(true);
  });

  it('nao apaga a serie de cima da area empilhada por causa de um invalido na de baixo', () => {
    render(
      <ChartArea
        categories={['a', 'b', 'c']}
        series={[
          { label: 'Baixo', values: [10, NaN, 10] },
          { label: 'Cima', values: [5, 5, 5] },
        ]}
        stacked
        title="x"
      />,
    );

    const marcadorDoMeio = document.querySelector('[aria-label^="Cima, b"]');
    const areaDeCima = marcadorDoMeio?.closest('g')?.querySelector('path')?.getAttribute('d') ?? '';

    // A de cima se partia em dois trechos de largura zero, e o marcador ficava sem posicao.
    expect(marcadorDoMeio).toHaveAttribute('cy', expect.stringMatching(/^\d/));
    expect(areaDeCima.match(/M/g)).toHaveLength(1);
  });

  it('nao desenha o passo invalido da cascata, e o seguinte parte do acumulado anterior', () => {
    render(
      <ChartWaterfall
        steps={[
          { label: 'Abertura', value: 100 },
          { label: 'Estorno', value: NaN },
          { label: 'Vendas', value: 30 },
          { label: 'Fechamento', total: true, value: 130 },
        ]}
        title="x"
      />,
    );

    const rotulos = [...document.querySelectorAll('text')].map((no) => no.textContent);

    expect(caminhos().some((d) => d.includes('NaN'))).toBe(false);
    expect(caminhos()).toHaveLength(3);
    expect(rotulos).not.toContain('+');
    expect([...document.querySelectorAll('text')].some((no) => no.getAttribute('y') === 'NaN')).toBe(false);
  });

  it('nao desenha o ponto invalido da dispersao em cima do eixo', () => {
    render(
      <ChartScatter
        series={[{ label: 'S', points: [{ x: NaN, y: 4 }, { x: 2, y: 3 }] }]}
        title="x"
      />,
    );

    const bolhas = document.querySelectorAll('circle');

    expect(bolhas).toHaveLength(1);
    expect(bolhas[0].getAttribute('aria-label')).not.toMatch(/NaN/);
  });

  it('nao apaga os demais aneis por causa de um invalido', () => {
    render(
      <ChartRadial
        title="x"
        tracks={[
          { label: 'Vendas', value: 72 },
          { label: 'Servicos', value: NaN },
        ]}
      />,
    );

    const preenchidos = [...document.querySelectorAll('path')].filter((no) => no.getAttribute('class')?.includes('fill'));

    expect(preenchidos).toHaveLength(1);
  });

  it('agrupa as fatias pequenas mesmo com uma invalida', () => {
    const reunidas = groupSmallSlices(
      [
        { label: 'Grande', value: 100 },
        { label: 'Pequena', value: 1 },
        { label: 'Miuda', value: 1 },
        { label: 'Invalida', value: NaN },
      ],
      { label: 'Outros', threshold: 0.05 },
    );

    expect(reunidas.map((fatia) => fatia.label)).toEqual(['Grande', 'Outros', 'Invalida']);
  });

  it('anuncia vazio quando todas as fatias sao invalidas', () => {
    render(<ChartPie slices={[{ label: 'A', value: NaN }, { label: 'B', value: NaN }]} title="x" />);

    expect(screen.getByText('Sem dados no período')).toBeInTheDocument();
  });

  it('nao escreve rotulo nem barra para o valor invalido', () => {
    render(
      <ChartBar categories={['jan', 'fev']} series={[{ label: 'Receita', values: [10, NaN] }]} showDataLabels title="x" />,
    );

    expect([...document.querySelectorAll('text')].some((no) => no.getAttribute('y') === 'NaN')).toBe(false);
    expect(document.querySelector('[aria-label^="Receita, fev"]')).toBeNull();
  });
});

describe('aneis desligados', () => {
  beforeEach(medir);
  afterEach(() => {
    Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth');
    Reflect.deleteProperty(HTMLElement.prototype, 'clientHeight');
  });

  it('nao mostra no centro um anel desligado quando todos estao', () => {
    render(
      <ChartRadial
        formatValue={(valor) => `${valor}%`}
        title="x"
        tracks={[
          { label: 'Vendas', max: 100, value: 72 },
          { label: 'Servicos', max: 100, value: 45 },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Vendas/ }));
    fireEvent.click(screen.getByRole('button', { name: /Servicos/ }));

    const centro = [...document.querySelectorAll('text')].filter((no) => no.getAttribute('class')?.includes('centerValue'));

    expect(centro).toHaveLength(0);
  });
});
