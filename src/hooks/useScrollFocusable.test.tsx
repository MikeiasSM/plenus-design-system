import { render, screen } from '@testing-library/react';
import { useScrollFocusable } from './useScrollFocusable';

class Observador {
  constructor(private aviso: () => void) {}
  observe() {
    this.aviso();
  }
  disconnect() {}
}

function Rolavel({ children }: { children?: React.ReactNode }) {
  const { focusable, ref } = useScrollFocusable();

  return (
    <div data-testid="rolavel" ref={ref} tabIndex={focusable ? 0 : undefined}>
      {children ?? 'texto'}
    </div>
  );
}

function medir(transborda: boolean) {
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, value: transborda ? 400 : 100 });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 100 });
}

beforeEach(() => vi.stubGlobal('ResizeObserver', Observador));

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(HTMLElement.prototype, 'scrollHeight');
  Reflect.deleteProperty(HTMLElement.prototype, 'clientHeight');
});

describe('useScrollFocusable', () => {
  it('fica focável quando transborda e não tem nada focável dentro', () => {
    medir(true);
    render(<Rolavel />);

    expect(screen.getByTestId('rolavel')).toHaveAttribute('tabindex', '0');
  });

  it('não ganha tabindex quando o conteúdo cabe', () => {
    medir(false);
    render(<Rolavel />);

    expect(screen.getByTestId('rolavel')).not.toHaveAttribute('tabindex');
  });

  it('não ganha tabindex quando há algo focável dentro', () => {
    medir(true);
    render(
      <Rolavel>
        <button type="button">Ação</button>
      </Rolavel>,
    );

    expect(screen.getByTestId('rolavel')).not.toHaveAttribute('tabindex');
  });

  it('nasce sem tabindex quando não há ResizeObserver', () => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(globalThis, 'ResizeObserver');
    medir(true);
    render(<Rolavel />);

    expect(screen.getByTestId('rolavel')).not.toHaveAttribute('tabindex');
  });
});
