import type { AlertTone } from '../Alert';

export type ToastTone = AlertTone;

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  /** Botao unico de acao, como tentar de novo. Acionar fecha o aviso. */
  action?: ToastAction;
  description?: string;
  /** Milissegundos ate sumir. `null` mantem ate a pessoa fechar; o padrao e 6s, e o erro fica. */
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

/** Estado dos avisos de uma arvore. O global serve ao `showToast`; cada `ToastProvider` cria o seu. */
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

/** Mostra um aviso no `ToastRegion` da pagina e devolve o id para fecha-lo antes do tempo. */
export function showToast(options: ToastOptions) {
  return globalToastStore.show(options);
}

export function dismissToast(id: string) {
  globalToastStore.dismiss(id);
}
