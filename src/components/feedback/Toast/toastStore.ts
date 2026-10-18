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

const EMPTY: ToastEntry[] = [];
let toasts: ToastEntry[] = EMPTY;
let nextId = 0;
const listeners = new Set<() => void>();

function publish(next: ToastEntry[]) {
  toasts = next;
  listeners.forEach((listener) => listener());
}

/** Mostra um aviso no `ToastRegion` da pagina e devolve o id para fecha-lo antes do tempo. */
export function showToast(options: ToastOptions) {
  nextId += 1;
  const id = `toast-${nextId}`;
  publish([...toasts, { ...options, id }]);
  return id;
}

export function dismissToast(id: string) {
  publish(toasts.filter((toast) => toast.id !== id));
}

export function subscribeToasts(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getToasts() {
  return toasts;
}

export function getServerToasts() {
  return EMPTY;
}
