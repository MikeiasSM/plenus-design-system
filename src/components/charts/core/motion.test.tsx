import { act, render, screen } from '@testing-library/react';
import { useSeriesToggle } from './useSeriesToggle';
import { useTweenedNumbers } from './useTweenedNumbers';

function Animado({ alvo }: { alvo: readonly number[] }) {
  return <span data-testid="valor">{useTweenedNumbers(alvo).join('|')}</span>;
}

function Alternavel({
  hiddenSeries,
  onHiddenSeriesChange,
}: {
  hiddenSeries?: readonly string[];
  onHiddenSeriesChange?: (hidden: readonly string[]) => void;
}) {
  const { isHidden, toggle } = useSeriesToggle({ hiddenSeries, onHiddenSeriesChange });

  return (
    <button onClick={() => toggle('Receita')} type="button">
      {isHidden('Receita') ? 'oculta' : 'visivel'}
    </button>
  );
}

describe('useTweenedNumbers', () => {
  afterEach(() => Reflect.deleteProperty(globalThis, 'matchMedia'));

  it('assume o alvo de imediato onde nao ha quadro a quadro para animar', () => {
    const { rerender } = render(<Animado alvo={[0, 100]} />);

    rerender(<Animado alvo={[0, 200]} />);

    expect(screen.getByTestId('valor')).toHaveTextContent('0|200');
  });

  it('caminha ate o alvo quando ha navegador e o usuario aceita movimento', () => {
    const quadros: FrameRequestCallback[] = [];
    let agora = 0;

    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((passo) => {
      quadros.push(passo);
      return quadros.length;
    });
    vi.spyOn(performance, 'now').mockImplementation(() => agora);

    const { rerender } = render(<Animado alvo={[0]} />);
    rerender(<Animado alvo={[100]} />);

    agora = 160;
    act(() => quadros.at(-1)?.(agora));

    const meio = Number(screen.getByTestId('valor').textContent);
    expect(meio).toBeGreaterThan(0);
    expect(meio).toBeLessThan(100);

    agora = 1000;
    act(() => quadros.at(-1)?.(agora));

    expect(screen.getByTestId('valor')).toHaveTextContent('100');

    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('salta quando a quantidade de numeros muda, porque nao ha par para interpolar', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));

    const { rerender } = render(<Animado alvo={[0, 10]} />);
    rerender(<Animado alvo={[0, 10, 20]} />);

    expect(screen.getByTestId('valor')).toHaveTextContent('0|10|20');

    vi.unstubAllGlobals();
  });

  it('respeita a preferencia por menos movimento', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));

    const { rerender } = render(<Animado alvo={[0]} />);
    rerender(<Animado alvo={[500]} />);

    expect(screen.getByTestId('valor')).toHaveTextContent('500');

    vi.unstubAllGlobals();
  });
});

describe('useSeriesToggle', () => {
  it('guarda a escolha quando o produto nao informa', () => {
    render(<Alternavel />);
    const botao = screen.getByRole('button');

    expect(botao).toHaveTextContent('visivel');

    act(() => botao.click());
    expect(botao).toHaveTextContent('oculta');

    act(() => botao.click());
    expect(botao).toHaveTextContent('visivel');
  });

  it('obedece ao produto quando ele informa, e avisa a mudanca', () => {
    const avisos: string[][] = [];
    render(<Alternavel hiddenSeries={['Receita']} onHiddenSeriesChange={(o) => avisos.push([...o])} />);
    const botao = screen.getByRole('button');

    expect(botao).toHaveTextContent('oculta');

    act(() => botao.click());

    // O estado vem de fora: sem o produto reagir, nada muda na tela.
    expect(botao).toHaveTextContent('oculta');
    expect(avisos).toEqual([[]]);
  });
});
