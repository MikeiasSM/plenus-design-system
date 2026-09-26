import { render } from '@testing-library/react';
import { ChartArea } from './ChartArea';
import { ChartCombo } from './ChartCombo';
import { ChartLine } from './ChartLine';
import { ChartWaterfall } from './ChartWaterfall';

function medir() {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 640 });
}

/** Marcadores que aparecem sem o ponteiro entrar no desenho. */
function visiveis() {
  return [...document.querySelectorAll('circle')].filter((no) =>
    (no.getAttribute('class') ?? '').includes('dotVisible'),
  );
}

beforeEach(medir);
afterEach(() => Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth'));

describe('ponto sem vizinho', () => {
  it('aparece sempre na linha, porque a curva ali nao desenha nada', () => {
    render(
      <ChartLine
        categories={['a', 'b', 'c']}
        series={[{ label: 'Servicos', values: [null, 40, null] }]}
        title="x"
      />,
    );

    expect(visiveis()).toHaveLength(1);
  });

  it('nao aparece quando ha vizinho para ligar', () => {
    render(
      <ChartLine
        categories={['a', 'b', 'c']}
        series={[{ label: 'Servicos', values: [10, 40, 30] }]}
        title="x"
      />,
    );

    expect(visiveis()).toHaveLength(0);
  });

  it('vale tambem para a area e para o combo', () => {
    render(
      <>
        <ChartArea categories={['a', 'b', 'c']} series={[{ label: 'A', values: [null, 40, null] }]} title="x" />
        <ChartCombo
          categories={['a', 'b', 'c']}
          series={[{ kind: 'line', label: 'L', values: [null, 40, null] }]}
          title="y"
        />
      </>,
    );

    expect(visiveis()).toHaveLength(2);
  });
});

describe('cascata', () => {
  it('nao poe sinal no zero, que nao sobe nem desce', () => {
    render(
      <ChartWaterfall
        steps={[{ label: 'Abertura', value: 100 }, { label: 'Parado', value: 0 }]}
        showDataLabels
        title="x"
      />,
    );

    const rotulos = [...document.querySelectorAll('text')].map((no) => no.textContent);

    expect(rotulos).not.toContain('+0');
    expect(rotulos).toContain('0');
  });
});
