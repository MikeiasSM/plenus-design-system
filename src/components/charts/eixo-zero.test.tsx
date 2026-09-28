import { render } from '@testing-library/react';
import { ChartArea } from './ChartArea';
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

  it('separa o zero por eixo na dispersao, para o ano ficar sem ele e o valor com ele', () => {
    render(
      <ChartScatter
        formatX={String}
        includeZero="y"
        series={[{ label: 'Clientes', points: [{ label: 'a', x: 2000, y: 40 }, { label: 'b', x: 2020, y: 80 }] }]}
        title="x"
      />,
    );

    expect(rotulos()).toContain('2010');
    expect(rotulos()).toContain('0');
  });

  it('desce a area ate o limite do eixo, e nao ate um zero fora do desenho', () => {
    render(
      <ChartArea
        categories={['a', 'b', 'c']}
        includeZero={false}
        series={[{ label: 'Temperatura', values: [20, 25, 22] }]}
        title="x"
      />,
    );

    const alturas = (d: string) => (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number).filter((_, indice) => indice % 2 === 1);
    const area = alturas(document.querySelector('path')?.getAttribute('d') ?? '');
    const fundo = Math.max(...[...document.querySelectorAll('line')].map((linha) => Number(linha.getAttribute('y1'))));

    // Com a base no zero, o caminho descia a y=1119 num desenho de 224.
    expect(Math.max(...area)).toBeLessThanOrEqual(fundo + 0.5);
  });
});
