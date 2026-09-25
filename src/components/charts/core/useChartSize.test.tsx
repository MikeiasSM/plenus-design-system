import { act, render, screen } from '@testing-library/react';
import { useChartSize } from './useChartSize';

function Medido({ height }: { height?: number } = {}) {
  const { ref, size } = useChartSize({ height });

  return (
    <div data-testid="caixa" ref={ref}>
      {size.width}x{size.height}
    </div>
  );
}

function fixarLargura(largura: number) {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    value: largura,
  });
}

describe('useChartSize', () => {
  afterEach(() => {
    Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth');
    Reflect.deleteProperty(globalThis, 'ResizeObserver');
  });

  it('mede a largura do elemento que contem o grafico', () => {
    fixarLargura(640);
    render(<Medido />);

    expect(screen.getByTestId('caixa')).toHaveTextContent('640x240');
  });

  it('respeita a altura declarada pelo consumidor', () => {
    fixarLargura(400);
    render(<Medido height={180} />);

    expect(screen.getByTestId('caixa')).toHaveTextContent('400x180');
  });

  it('sobrevive a ausencia de ResizeObserver, com a medida do primeiro layout', () => {
    fixarLargura(320);

    expect(() => render(<Medido />)).not.toThrow();
    expect(screen.getByTestId('caixa')).toHaveTextContent('320x240');
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
    expect(screen.getByTestId('caixa')).toHaveTextContent('500x240');

    fixarLargura(280);
    act(() => observadores.forEach((avisar) => avisar()));

    expect(screen.getByTestId('caixa')).toHaveTextContent('280x240');
  });
});
