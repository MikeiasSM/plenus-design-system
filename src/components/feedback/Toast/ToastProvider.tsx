import { createContext, useContext, useState, type ReactNode } from 'react';
import { createToastStore, globalToastStore, type ToastOptions, type ToastStore } from './toastStore';

const ToastStoreContext = createContext<ToastStore>(globalToastStore);

export interface ToastProviderProps {
  children: ReactNode;
}

/** Da a árvore o próprio estado de avisos. O `ToastRegion` dentro dela mostra só os avisos disparados por `useToast`. */
export function ToastProvider({ children }: ToastProviderProps) {
  const [store] = useState(createToastStore);

  return <ToastStoreContext value={store}>{children}</ToastStoreContext>;
}

export function useToastStore() {
  return useContext(ToastStoreContext);
}

export interface UseToastResult {
  /** Fecha o aviso antes do tempo. */
  dismissToast: (id: string) => void;
  /** Mostra o aviso no `ToastRegion` da árvore e devolve o id. */
  showToast: (options: ToastOptions) => string;
}

/** Dispara avisos no estado da árvore. Fora de um `ToastProvider`, age no estado global, como o `showToast` solto. */
export function useToast(): UseToastResult {
  const { dismiss, show } = useToastStore();

  return { dismissToast: dismiss, showToast: show };
}
