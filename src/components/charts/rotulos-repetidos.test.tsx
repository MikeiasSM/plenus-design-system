import { render } from '@testing-library/react';
import { ChartBar } from './ChartBar';
import { ChartLine } from './ChartLine';
import { ChartPie } from './ChartPie';

function medir() {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 640 });
}

beforeEach(medir);
afterEach(() => {
  Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth');
  vi.restoreAllMocks();
});

/** Para a legenda, rotulo repetido e a mesma serie, por decisao; no desenho, cada uma continua com a sua marca. */
describe('rotulos repetidos', () => {
  it('desenha cada serie e cada categoria sem colidir a chave do React', () => {
    const erro = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const repetidas = [
      { label: 'Receita', values: [1, 2] },
      { label: 'Receita', values: [3, 4] },
    ];

    render(<ChartLine categories={['jan', 'jan']} series={repetidas} title="Linha" />);
    render(<ChartBar categories={['jan', 'jan']} series={repetidas} title="Barra" />);
    render(<ChartPie slices={[{ label: 'A', value: 1 }, { label: 'A', value: 2 }]} title="Pizza" />);

    expect(document.querySelectorAll('circle')).toHaveLength(4);
    expect(erro).not.toHaveBeenCalled();
  });
});
