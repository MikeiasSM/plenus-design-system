import type { AlertTone } from '../Alert';

/** Quantas ações um aviso mostra; a terceira em diante e descartada, e o aviso não e lugar de menu. */
export const MAX_TOAST_ACTIONS = 2;

export type ToastTone = AlertTone;

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  /** Botão unico de ação, como tentar de novo. Acionar fecha o aviso. Com `actions`, esta e ignorada. */
  action?: ToastAction;
  /** Até dois botões, na ordem dada; os que passam de dois não aparecem. Acionar um fecha o aviso. */
  actions?: readonly ToastAction[];
  description?: string;
  /** Milissegundos até sumir. `null` mantem até a pessoa fechar; o padrão e 6s, e o erro fica. */
  duration?: number | null;
  title: string;
  tone?: ToastTone;
}

export interface ToastEntry extends ToastOptions {
  id: string;
}

export interface ToastStore {
  dismiss: (id: string) => void;
  getServerSnapshot: () => ToastEntry[];
  getSnapshot: () => ToastEntry[];
  show: (options: ToastOptions) => string;
  subscribe: (listener: () => void) => () => void;
}

const EMPTY: ToastEntry[] = [];

/** Estado dos avisos de uma árvore. O global serve ao `showToast`; cada `ToastProvider` cria o seu. */
export function createToastStore(): ToastStore {
  let toasts = EMPTY;
  let nextId = 0;
  const listeners = new Set<() => void>();

  function publish(next: ToastEntry[]) {
    toasts = next;
    listeners.forEach((listener) => listener());
  }

  return {
    dismiss: (id) => publish(toasts.filter((toast) => toast.id !== id)),
    getServerSnapshot: () => EMPTY,
    getSnapshot: () => toasts,
    show: (options) => {
      nextId += 1;
      const id = `toast-${nextId}`;
      publish([...toasts, { ...options, id }]);
      return id;
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export const globalToastStore = createToastStore();

/** Mostra um aviso no `ToastRegion` da página e devolve o id para fecha-lo antes do tempo. */
export function showToast(options: ToastOptions) {
  return globalToastStore.show(options);
}

export function dismissToast(id: string) {
  globalToastStore.dismiss(id);
}
