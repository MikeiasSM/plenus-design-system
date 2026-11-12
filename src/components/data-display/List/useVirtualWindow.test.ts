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

  it('monta so o suficiente para medir, antes de conhecer o passo', () => {
    const { result } = renderHook(() => useVirtualWindow(10000, 320));

    // Montar dez mil nos para medir um item custava o primeiro render inteiro.
    expect(result.current.active).toBe(false);
    expect(result.current.end).toBe(24);
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

  it('desliga a janela quando a medida e zero, como no jsdom', () => {
    const { result } = renderHook(() => useVirtualWindow(100, 320));

    medir(result.current.measureItem, 0);

    // Presa na janela de medida, a lista mostrava 24 opcoes para sempre.
    expect(result.current.active).toBe(false);
    expect(result.current.end).toBe(100);
  });

  it('mede de novo quando a lista montada escondida aparece', () => {
    let avisar = () => undefined;

    class Observador {
      constructor(aviso: () => undefined) {
        avisar = aviso;
      }

      observe() {}

      disconnect() {}
    }

    Object.defineProperty(globalThis, 'ResizeObserver', { configurable: true, value: Observador });

    const { result } = renderHook(() => useVirtualWindow(10000, 320));
    const item = { offsetHeight: 0, offsetTop: 0, nextElementSibling: null } as unknown as HTMLElement;

    act(() => result.current.attachScroll({} as HTMLElement));
    act(() => result.current.measureItem(item));

    Object.assign(item, { offsetHeight: 32 });
    act(() => avisar());

    expect(result.current.active).toBe(true);
    expect(result.current.end).toBe(22);

    Reflect.deleteProperty(globalThis, 'ResizeObserver');
  });

  it('rola ate o item contando o que vem antes dele, como o grupo de selecionados', () => {
    const { result } = renderHook(() => useVirtualWindow(10000, 320));
    const lista = { scrollTop: 0, clientHeight: 320, getBoundingClientRect: () => ({ top: 100 }) } as unknown as HTMLElement;
    const primeiro = {
      offsetHeight: 32,
      offsetTop: 0,
      nextElementSibling: null,
      getBoundingClientRect: () => ({ top: 100 + 108 }),
    } as unknown as HTMLElement;

    act(() => result.current.attachScroll(lista));
    act(() => result.current.measureItem(primeiro));
    act(() => result.current.scrollToIndex(20));

    // O item 20 comeca em 108 + 20 x 32 e termina 32 depois; a rolagem o deixa encostado embaixo.
    expect(lista.scrollTop).toBe(108 + 21 * 32 - 320);
  });
});
