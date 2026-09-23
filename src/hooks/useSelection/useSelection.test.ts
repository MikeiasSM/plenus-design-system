import { act, renderHook } from '@testing-library/react';
import { useSelection } from './useSelection';
import type { SelectionItem } from './selection';

const items: SelectionItem[] = [
  { key: 'pix', textValue: 'Pix' },
  { key: 'boleto', textValue: 'Boleto', disabled: true },
  { key: 'cartao', textValue: 'Cartao' },
  { key: 'credito', textValue: 'Credito' },
];

describe('useSelection', () => {
  it('navega pela colecao pulando desabilitados e para nas extremidades', () => {
    const { result } = renderHook(() => useSelection({ items }));

    act(() => result.current.focusFirst());
    expect(result.current.focusedKey).toBe('pix');

    act(() => result.current.focusNext());
    expect(result.current.focusedKey).toBe('cartao');

    act(() => result.current.focusLast());
    act(() => result.current.focusNext());
    expect(result.current.focusedKey).toBe('credito');
  });

  it('mantem a escolha quando nao e controlado', () => {
    const { result } = renderHook(() => useSelection({ items, defaultSelectedKeys: ['pix'] }));

    expect([...result.current.selectedKeys]).toEqual(['pix']);

    act(() => result.current.select('cartao'));
    expect([...result.current.selectedKeys]).toEqual(['cartao']);
  });

  it('respeita o valor externo quando e controlado', () => {
    const onSelectionChange = vi.fn();
    const { result } = renderHook(() =>
      useSelection({ items, selectedKeys: ['pix'], onSelectionChange }),
    );

    act(() => result.current.select('cartao'));

    expect([...result.current.selectedKeys]).toEqual(['pix']);
    expect(onSelectionChange).toHaveBeenCalledWith(new Set(['cartao']));
  });

  it('acumula no modo multiplo', () => {
    const { result } = renderHook(() => useSelection({ items, mode: 'multiple' }));

    act(() => result.current.select('pix'));
    act(() => result.current.select('cartao'));

    expect([...result.current.selectedKeys].sort()).toEqual(['cartao', 'pix']);
  });

  it('busca por digitacao e acumula caracteres sem perder a correspondencia', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useSelection({ items }));

    act(() => result.current.search('c'));
    expect(result.current.focusedKey).toBe('cartao');

    act(() => result.current.search('a'));
    expect(result.current.focusedKey).toBe('cartao');

    act(() => vi.advanceTimersByTime(600));
    act(() => result.current.search('c'));
    expect(result.current.focusedKey).toBe('credito');

    vi.useRealTimers();
  });
});
