import { act, renderHook } from '@testing-library/react';
import { useVirtualWindow } from './useVirtualWindow';

function medir(medida: (node: HTMLElement | null) => void, altura: number, espaco = 0) {
  const proximo = espaco > 0 ? ({ offsetTop: altura + espaco } as HTMLElement) : null;

  act(() => medida({ offsetHeight: altura, offsetTop: 0, nextElementSibling: proximo } as unknown as HTMLElement));
}

function rolar(anexar: (node: HTMLElement | null) => void, rolagem: () => void, topo: number) {
  act(() => {
    anexar({ scrollTop: topo } as HTMLElement);
    rolagem();
  });
}

describe('useVirtualWindow', () => {
  it('renderiza tudo quando nao ha altura definida', () => {
    const { result } = renderHook(() => useVirtualWindow(10000));

    expect(result.current.active).toBe(false);
    expect(result.current.end).toBe(10000);
    expect(result.current.padding).toEqual({ before: 0, after: 0 });
  });

  it('renderiza tudo enquanto a altura do item nao foi medida', () => {
    const { result } = renderHook(() => useVirtualWindow(10000, 320));

    expect(result.current.active).toBe(false);
    expect(result.current.end).toBe(10000);
  });

  it('limita a janela ao que cabe na altura, com folga', () => {
    const { result } = renderHook(() => useVirtualWindow(10000, 320));

    medir(result.current.measureItem, 32);

    expect(result.current.active).toBe(true);
    expect(result.current.start).toBe(0);
    expect(result.current.end).toBe(22);
    expect(result.current.padding).toEqual({ before: 0, after: (10000 - 22) * 32 });
  });

  it('avanca a janela conforme a rolagem', () => {
    const { result } = renderHook(() => useVirtualWindow(10000, 320));

    medir(result.current.measureItem, 32);
    rolar(result.current.attachScroll, result.current.onScroll, 3200);

    expect(result.current.start).toBe(94);
    expect(result.current.end).toBe(116);
    expect(result.current.padding.before).toBe(94 * 32);
  });

  it('nao virtualiza quando a colecao cabe inteira na altura', () => {
    const { result } = renderHook(() => useVirtualWindow(5, 320));

    medir(result.current.measureItem, 32);

    expect(result.current.active).toBe(false);
    expect(result.current.end).toBe(5);
  });

  it('mede o passo incluindo o espaco entre os itens', () => {
    const { result } = renderHook(() => useVirtualWindow(10000, 320));

    medir(result.current.measureItem, 28, 4);

    expect(result.current.active).toBe(true);
    expect(result.current.padding.after).toBe((10000 - result.current.end) * 32);
  });
});
