import { act, renderHook } from '@testing-library/react';
import { useColorScheme } from './useColorScheme';

type Ouvinte = (evento: { matches: boolean }) => void;

function simularSistema(escuro: boolean) {
  const ouvintes = new Set<Ouvinte>();
  const estado = { escuro };

  vi.stubGlobal('matchMedia', (consulta: string) => ({
    get matches() {
      return consulta.includes('dark') && estado.escuro;
    },
    media: consulta,
    addEventListener: (_tipo: string, ouvinte: Ouvinte) => ouvintes.add(ouvinte),
    removeEventListener: (_tipo: string, ouvinte: Ouvinte) => ouvintes.delete(ouvinte),
  }));

  return {
    mudar(proximo: boolean) {
      estado.escuro = proximo;
      act(() => ouvintes.forEach((ouvinte) => ouvinte({ matches: proximo })));
    },
    ouvintes,
  };
}

const tema = () => document.documentElement.getAttribute('data-theme');

describe('useColorScheme', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('começa em system, resolve pelo sistema e deixa o documento sem data-theme', () => {
    simularSistema(true);
    const { result } = renderHook(() => useColorScheme());

    expect(result.current).toMatchObject({ colorScheme: 'system', resolvedColorScheme: 'dark' });
    expect(tema()).toBeNull();
  });

  it('light e dark fixam o tema no documento e valem sobre o sistema', () => {
    simularSistema(true);
    const { result } = renderHook(() => useColorScheme());

    act(() => result.current.setColorScheme('light'));

    expect(result.current).toMatchObject({ colorScheme: 'light', resolvedColorScheme: 'light' });
    expect(tema()).toBe('light');

    act(() => result.current.setColorScheme('dark'));

    expect(result.current).toMatchObject({ colorScheme: 'dark', resolvedColorScheme: 'dark' });
    expect(tema()).toBe('dark');

    act(() => result.current.setColorScheme('system'));

    expect(result.current.colorScheme).toBe('system');
    expect(tema()).toBeNull();
  });

  it('no modo sistema, acompanha o sistema quando ele muda, e só nele', () => {
    const sistema = simularSistema(false);
    const { result } = renderHook(() => useColorScheme());

    expect(result.current.resolvedColorScheme).toBe('light');

    sistema.mudar(true);

    expect(result.current.resolvedColorScheme).toBe('dark');

    act(() => result.current.setColorScheme('light'));
    sistema.mudar(false);
    sistema.mudar(true);

    expect(result.current.resolvedColorScheme).toBe('light');
  });

  it('guarda a escolha no localStorage, na chave configurável, e a lê na montagem seguinte', () => {
    simularSistema(false);
    const { result, unmount } = renderHook(() => useColorScheme({ storageKey: 'meu-tema' }));

    act(() => result.current.setColorScheme('dark'));

    expect(window.localStorage.getItem('meu-tema')).toBe('dark');
    expect(window.localStorage.getItem('pl-color-scheme')).toBeNull();

    unmount();
    document.documentElement.removeAttribute('data-theme');
    const segunda = renderHook(() => useColorScheme({ storageKey: 'meu-tema' }));

    expect(segunda.result.current.colorScheme).toBe('dark');
    expect(tema()).toBe('dark');
  });

  it('usa a chave pl-color-scheme e o defaultColorScheme quando nada foi guardado ou o valor não vale', () => {
    simularSistema(false);
    const { result } = renderHook(() => useColorScheme({ defaultColorScheme: 'dark' }));

    expect(result.current.colorScheme).toBe('dark');

    act(() => result.current.setColorScheme('light'));

    expect(window.localStorage.getItem('pl-color-scheme')).toBe('light');

    window.localStorage.setItem('pl-color-scheme', 'sepia');
    const outra = renderHook(() => useColorScheme({ defaultColorScheme: 'dark' }));

    expect(outra.result.current.colorScheme).toBe('dark');
  });

  it('duas instâncias na mesma aba ficam juntas', () => {
    simularSistema(false);
    const a = renderHook(() => useColorScheme());
    const b = renderHook(() => useColorScheme());

    act(() => a.result.current.setColorScheme('dark'));

    expect(b.result.current.colorScheme).toBe('dark');
  });

  it('com o localStorage indisponível, a escolha vale até a página fechar e nada quebra', () => {
    simularSistema(false);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    const { result } = renderHook(() => useColorScheme({ storageKey: 'sem-armazenamento' }));

    expect(result.current.colorScheme).toBe('system');

    act(() => result.current.setColorScheme('dark'));

    expect(result.current).toMatchObject({ colorScheme: 'dark', resolvedColorScheme: 'dark' });
    expect(tema()).toBe('dark');
  });

  it('segue a escolha feita em outra aba pelo evento storage, e só a da própria chave', () => {
    simularSistema(false);
    const { result } = renderHook(() => useColorScheme({ storageKey: 'entre-abas' }));

    act(() => {
      window.localStorage.setItem('entre-abas', 'dark');
      window.dispatchEvent(new StorageEvent('storage', { key: 'entre-abas', newValue: 'dark' }));
    });

    expect(result.current.colorScheme).toBe('dark');
    expect(tema()).toBe('dark');

    act(() => {
      window.localStorage.setItem('entre-abas', 'light');
      window.dispatchEvent(new StorageEvent('storage', { key: 'outra-chave', newValue: 'light' }));
    });

    expect(result.current.colorScheme).toBe('dark');

    act(() => {
      window.localStorage.clear();
      window.dispatchEvent(new StorageEvent('storage', { key: null }));
    });

    expect(result.current.colorScheme).toBe('system');
    expect(tema()).toBeNull();
  });

  it('para de ouvir o sistema ao desmontar', () => {
    const sistema = simularSistema(false);
    const { unmount } = renderHook(() => useColorScheme());

    expect(sistema.ouvintes.size).toBe(1);

    unmount();

    expect(sistema.ouvintes.size).toBe(0);
  });

  it('sem matchMedia, o sistema conta como claro', () => {
    vi.stubGlobal('matchMedia', undefined);
    const { result } = renderHook(() => useColorScheme());

    expect(result.current.resolvedColorScheme).toBe('light');
  });
});
