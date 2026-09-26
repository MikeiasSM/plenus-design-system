import { render } from '@testing-library/react';
import { ChartLine } from './ChartLine';
import { ChartScatter } from './ChartScatter';

function medir() {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 640 });
}

function rotulos() {
  return [...document.querySelectorAll('text')].map((no) => no.textContent ?? '');
}

describe('zero no eixo', () => {
  beforeEach(medir);
  afterEach(() => Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth'));

  it('inclui o zero por padrao', () => {
    render(
      <ChartLine categories={['a', 'b']} series={[{ label: 'Ano', values: [2000, 2020] }]} title="x" />,
    );

    expect(rotulos()).toContain('0');
  });

  it('dispensa o zero quando a medida nao se compara a ele', () => {
    render(
      <ChartLine
        categories={['a', 'b']}
        includeZero={false}
        series={[{ label: 'Ano', values: [2000, 2020] }]}
        title="x"
      />,
    );

    expect(rotulos()).not.toContain('0');
  });

  it('vale tambem para os dois eixos da dispersao', () => {
    render(
      <ChartScatter
        includeZero={false}
        series={[{ label: 'Clientes', points: [{ label: 'a', x: 2000, y: 2010 }, { label: 'b', x: 2020, y: 2015 }] }]}
        title="x"
      />,
    );

    expect(rotulos()).not.toContain('0');
  });
});
