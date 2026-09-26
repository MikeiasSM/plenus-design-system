import { render } from '@testing-library/react';
import { ChartArea } from './ChartArea';
import { ChartBar } from './ChartBar';
import { ChartDonut } from './ChartDonut';
import { ChartLine } from './ChartLine';

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
});
