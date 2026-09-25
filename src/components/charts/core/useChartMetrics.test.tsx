import { act, render, screen } from '@testing-library/react';
import { useChartMetrics } from './useChartMetrics';

function Medido() {
  const { font, ref, width } = useChartMetrics();

  return (
    <div data-testid="caixa" ref={ref}>
      {width}|{font.size}
    </div>
  );
}

function fixarLargura(largura: number) {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    value: largura,
  });
}

describe('useChartMetrics', () => {
  afterEach(() => {
    Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth');
    Reflect.deleteProperty(globalThis, 'ResizeObserver');
  });

  it('mede a largura do elemento em que o grafico sera desenhado', () => {
    fixarLargura(640);
    render(<Medido />);

    expect(screen.getByTestId('caixa')).toHaveTextContent('640|12');
  });

  it('sobrevive a ausencia de ResizeObserver, com a medida do primeiro layout', () => {
    fixarLargura(320);

    expect(() => render(<Medido />)).not.toThrow();
    expect(screen.getByTestId('caixa')).toHaveTextContent('320|12');
  });

  it('acompanha a mudanca de largura quando ha ResizeObserver', () => {
    const observadores: (() => void)[] = [];

    class Observador {
      constructor(private aviso: () => void) {
        observadores.push(() => this.aviso());
      }
      observe() {}
      disconnect() {}
    }

    Object.defineProperty(globalThis, 'ResizeObserver', { configurable: true, value: Observador });

    fixarLargura(500);
    render(<Medido />);
    expect(screen.getByTestId('caixa')).toHaveTextContent('500|12');

    fixarLargura(280);
    act(() => observadores.forEach((avisar) => avisar()));

    expect(screen.getByTestId('caixa')).toHaveTextContent('280|12');
  });
});
