import { createContext, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from 'react';
import { isDevelopment } from '../../../utils/isDevelopment';

/** Como o tour terminou: `completed` no Concluir ou na ação do último passo, `dismissed` no Fechar, no Esc ou por `stop`. */
export type TourEndReason = 'completed' | 'dismissed' | 'target-missing';

export type TourEvent =
  | { type: 'start'; tourId: string; version: number }
  | { type: 'step'; tourId: string; version: number; stepId: string; index: number; total: number }
  | { type: 'skip'; tourId: string; version: number; stepId: string; reason: 'target-missing' }
  | { type: 'end'; tourId: string; version: number; stepId: string; reason: TourEndReason };

/** Onde o produto guarda o "já visto". A biblioteca não guarda nada sozinha. */
export interface TourStorage {
  hasSeen: (id: string, version: number) => boolean | Promise<boolean>;
  markSeen: (id: string, version: number, reason: Exclude<TourEndReason, 'target-missing'>) => void | Promise<void>;
}

export interface TourProviderProps {
  children: ReactNode;
  /** Recebe cada evento de cada tour: início, passo, passo saltado e fim. */
  onEvent?: (event: TourEvent) => void;
  storage?: TourStorage;
}

export interface TourController {
  /** O `id` do tour aberto, ou `null`. */
  activeId: string | null;
  /** Consulta o `storage` do `TourProvider`; sem ele, `false`. Sem `version`, vale a do `Tour` montado com esse `id`. */
  hasSeen: (id: string, version?: number) => Promise<boolean>;
  /** Abre o tour montado com esse `id`. Devolve `false`, sem abrir, se outro tour estiver aberto ou se nenhum tiver o `id`. */
  start: (id: string) => boolean;
  /** Encerra o tour aberto, com `reason: 'dismissed'`. */
  stop: () => void;
}

interface Options {
  onEvent?: (event: TourEvent) => void;
  storage?: TourStorage;
}

/** Garante um tour por vez e leva os eventos e o "já visto" ao produto. Interno. */
export interface TourCoordinator {
  claim: (id: string) => boolean;
  emit: (event: TourEvent) => void;
  getActive: () => string | null;
  hasSeen: (id: string, version?: number) => Promise<boolean>;
  markSeen: (id: string, version: number, reason: TourEndReason) => void;
  register: (id: string, version: number) => () => void;
  release: (id: string) => void;
  start: (id: string) => boolean;
  stop: () => void;
  subscribe: (listener: () => void) => () => void;
}

function reportError(erro: unknown) {
  console.error(erro);
}

function createCoordinator(options: RefObject<Options>): TourCoordinator {
  let active: string | null = null;
  const listeners = new Set<() => void>();
  const mounted = new Map<string, number[]>();

  function notify() {
    listeners.forEach((listener) => listener());
  }

  function claim(id: string) {
    if (active !== null && active !== id) {
      return false;
    }
    if (active !== id) {
      active = id;
      notify();
    }
    return true;
  }

  function versionOf(id: string) {
    return mounted.get(id)?.at(-1);
  }

  return {
    claim,
    emit(event) {
      try {
        options.current.onEvent?.(event);
      } catch (erro) {
        reportError(erro);
      }
    },
    getActive: () => active,
    async hasSeen(id, version) {
      const storage = options.current.storage;
      if (!storage) {
        return false;
      }
      try {
        return Boolean(await storage.hasSeen(id, version ?? versionOf(id) ?? 1));
      } catch (erro) {
        reportError(erro);
        return false;
      }
    },
    markSeen(id, version, reason) {
      if (reason === 'target-missing') {
        return;
      }
      try {
        const result = options.current.storage?.markSeen(id, version, reason);
        if (result && typeof result.then === 'function') {
          result.then(undefined, reportError);
        }
      } catch (erro) {
        reportError(erro);
      }
    },
    register(id, version) {
      const versions = mounted.get(id) ?? [];
      versions.push(version);
      mounted.set(id, versions);
      return () => {
        versions.splice(versions.lastIndexOf(version), 1);
        if (!versions.length) {
          mounted.delete(id);
        }
      };
    },
    release(id) {
      if (active === id) {
        active = null;
        notify();
      }
    },
    start(id) {
      if (!mounted.has(id)) {
        if (isDevelopment()) {
          console.warn(`Tour: nenhum <Tour id="${id}"> está montado; start('${id}') não abriu nada.`);
        }
        return false;
      }
      if (active !== null && active !== id) {
        if (isDevelopment()) {
          console.warn(`Tour: start('${id}') ignorado, porque o tour "${active}" está aberto. Só um tour abre por vez.`);
        }
        return false;
      }
      return claim(id);
    },
    stop() {
      if (active !== null) {
        active = null;
        notify();
      }
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

// Sem `TourProvider`, os tours dividem este coordenador: continua valendo um por vez, sem eventos nem "já visto".
const defaultCoordinator = createCoordinator({ current: {} });
const TourContext = createContext<TourCoordinator>(defaultCoordinator);

/** Na raiz do produto: um tour aberto por vez, o `storage` do "já visto" e os eventos de todos os tours abaixo. */
export function TourProvider({ children, onEvent, storage }: TourProviderProps) {
  const options = useRef<Options>({ onEvent, storage });

  useEffect(() => {
    options.current = { onEvent, storage };
  });

  const [coordinator] = useState(() => createCoordinator(options));

  return <TourContext value={coordinator}>{children}</TourContext>;
}

/** Coordenador do `TourProvider` mais próximo. Interno. */
export function useTourCoordinator() {
  return useContext(TourContext);
}

/** O tour aberto, observado. Interno. */
export function useActiveTour(coordinator: TourCoordinator) {
  return useSyncExternalStore(coordinator.subscribe, coordinator.getActive, () => null);
}

/** Abre, encerra e consulta os tours do `TourProvider` mais próximo, para o botão de ajuda do produto. */
export function useTour(): TourController {
  const coordinator = useTourCoordinator();
  const activeId = useActiveTour(coordinator);

  return useMemo(
    () => ({ activeId, hasSeen: coordinator.hasSeen, start: coordinator.start, stop: coordinator.stop }),
    [activeId, coordinator],
  );
}
