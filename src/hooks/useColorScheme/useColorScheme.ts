import { useCallback, useEffect, useSyncExternalStore } from 'react';

export type ColorScheme = 'light' | 'dark' | 'system';
export type ResolvedColorScheme = 'light' | 'dark';

export interface UseColorSchemeOptions {
  /** Escolha de quem nunca escolheu, ou cuja escolha guardada não vale mais. */
  defaultColorScheme?: ColorScheme;
  /** Chave do `localStorage` onde a escolha fica guardada. */
  storageKey?: string;
}

export interface UseColorSchemeResult {
  /** O que a pessoa escolheu: `'light'`, `'dark'` ou `'system'`, que segue o sistema. */
  colorScheme: ColorScheme;
  /** O esquema que vale na tela: a escolha, ou o do sistema quando a escolha é `'system'`. */
  resolvedColorScheme: ResolvedColorScheme;
  setColorScheme: (colorScheme: ColorScheme) => void;
}

const DEFAULT_STORAGE_KEY = 'pl-color-scheme';

const DARK_QUERY = '(prefers-color-scheme: dark)';
const listeners = new Set<() => void>();
const memory = new Map<string, ColorScheme>();

function isColorScheme(value: unknown): value is ColorScheme {
  return value === 'light' || value === 'dark' || value === 'system';
}

function readChoice(key: string, fallback: ColorScheme): ColorScheme {
  try {
    const stored = window.localStorage.getItem(key);

    if (isColorScheme(stored)) {
      return stored;
    }
  } catch {
    return memory.get(key) ?? fallback;
  }

  return memory.get(key) ?? fallback;
}

function writeChoice(key: string, value: ColorScheme) {
  try {
    window.localStorage.setItem(key, value);
    memory.delete(key);
  } catch {
    memory.set(key, value);
  }

  listeners.forEach((notify) => notify());
}

function subscribeToChoice(key: string, notify: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key === null || event.key === key) {
      notify();
    }
  }

  listeners.add(notify);
  window.addEventListener('storage', onStorage);

  return () => {
    listeners.delete(notify);
    window.removeEventListener('storage', onStorage);
  };
}

function subscribeToSystem(notify: () => void) {
  if (typeof window.matchMedia !== 'function') {
    return () => {};
  }

  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener('change', notify);

  return () => query.removeEventListener('change', notify);
}

function systemIsDark() {
  return typeof window.matchMedia === 'function' && window.matchMedia(DARK_QUERY).matches;
}

/** Escolha do esquema de cor, guardada no `localStorage`: põe `data-theme` no `<html>` e tira o atributo em `'system'`. */
export function useColorScheme({
  defaultColorScheme = 'system',
  storageKey = DEFAULT_STORAGE_KEY,
}: UseColorSchemeOptions = {}): UseColorSchemeResult {
  const colorScheme = useSyncExternalStore(
    useCallback((notify: () => void) => subscribeToChoice(storageKey, notify), [storageKey]),
    () => readChoice(storageKey, defaultColorScheme),
    () => defaultColorScheme,
  );
  const systemDark = useSyncExternalStore(subscribeToSystem, systemIsDark, () => false);
  const resolvedColorScheme: ResolvedColorScheme = colorScheme === 'system' ? (systemDark ? 'dark' : 'light') : colorScheme;

  useEffect(() => {
    const root = document.documentElement;

    if (colorScheme === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', colorScheme);
    }
  }, [colorScheme]);

  const setColorScheme = useCallback((next: ColorScheme) => writeChoice(storageKey, next), [storageKey]);

  return { colorScheme, resolvedColorScheme, setColorScheme };
}
