import type { AlertTone } from '../Alert';

/** Quantas acoes um aviso mostra; a terceira em diante e descartada, e o aviso nao e lugar de menu. */
export const MAX_TOAST_ACTIONS = 2;

/** O aviso fala de algo que acabou de acontecer: o tom neutro do `Alert`, de contexto sem urgencia, nao vale aqui. */
export type ToastTone = Exclude<AlertTone, 'neutral'>;

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  /** Botao unico de acao, como tentar de novo. Acionar fecha o aviso. Com `actions`, esta e ignorada. */
  action?: ToastAction;
  /** Ate dois botoes, na ordem dada; os que passam de dois nao aparecem. Acionar um fecha o aviso. */
  actions?: readonly ToastAction[];
  description?: string;
  /** Milissegundos ate sumir. `null` mantem ate a pessoa fechar; o padrao e 6s, e o erro fica. */
  duration?: number | null;
  title: string;
  tone?: ToastTone;
}

export interface ToastEntry extends ToastOptions {
  id: string;
  /** Aviso de `showToast.promise` ainda esperando: sem anuncio, sem tempo e sem acoes. */
  loading?: boolean;
}

/** O texto de um estado do `showToast.promise`: so o titulo, ou o titulo com o resto do aviso. O tom vem do estado. */
export type ToastPromiseMessage = string | Omit<ToastOptions, 'tone'>;

export interface ToastPromiseOptions<T> {
  /** Erro: aviso de perigo, que fica ate a pessoa fechar. A funcao recebe o motivo da rejeicao. */
  error: ToastPromiseMessage | ((reason: unknown) => ToastPromiseMessage);
  /** Enquanto espera. So titulo e descricao: o aviso de carregando nao tem acoes nem some sozinho. */
  loading: string | Pick<ToastOptions, 'description' | 'title'>;
  /** Sucesso: aviso de sucesso, que some no tempo de sempre. A funcao recebe o valor resolvido. */
  success: ToastPromiseMessage | ((value: T) => ToastPromiseMessage);
}

export interface ToastStore {
  dismiss: (id: string) => void;
  getServerSnapshot: () => ToastEntry[];
  getSnapshot: () => ToastEntry[];
  show: (options: Omit<ToastEntry, 'id'>) => string;
  subscribe: (listener: () => void) => () => void;
  /** Troca o conteudo de um aviso aberto, mantendo o id. Sem efeito se ele ja fechou. */
  update: (id: string, entry: Omit<ToastEntry, 'id'>) => void;
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
    update: (id, entry) => {
      if (toasts.some((toast) => toast.id === id)) {
        publish(toasts.map((toast) => (toast.id === id ? { ...entry, id } : toast)));
      }
    },
  };
}

function toOptions(message: ToastPromiseMessage) {
  return typeof message === 'string' ? { title: message } : message;
}

/**
 * Um aviso so para a promessa inteira: carregando, depois sucesso ou erro no mesmo lugar. Devolve a propria promessa,
 * ja com o erro tratado aqui, e quem nao a espera nao deixa rejeicao solta.
 */
export function promiseToast<T>(store: ToastStore, promise: Promise<T> | (() => Promise<T>), options: ToastPromiseOptions<T>) {
  const pending = typeof promise === 'function' ? promise() : promise;
  const loading = toOptions(options.loading);
  const id = store.show({ description: loading.description, duration: null, title: loading.title, loading: true });

  pending.then(
    (value) => {
      const message = typeof options.success === 'function' ? options.success(value) : options.success;
      store.update(id, { ...toOptions(message), tone: 'success' });
    },
    (reason: unknown) => {
      const message = typeof options.error === 'function' ? options.error(reason) : options.error;
      store.update(id, { ...toOptions(message), tone: 'danger' });
    },
  );

  return pending;
}

export const globalToastStore = createToastStore();

/** Mostra um aviso no `ToastRegion` da pagina e devolve o id para fecha-lo antes do tempo. */
export const showToast = Object.assign((options: ToastOptions) => globalToastStore.show(options), {
  /** Acompanha uma promessa num aviso so: carregando, depois sucesso ou erro. Devolve a mesma promessa. */
  promise: <T>(promise: Promise<T> | (() => Promise<T>), options: ToastPromiseOptions<T>) =>
    promiseToast(globalToastStore, promise, options),
});

export function dismissToast(id: string) {
  globalToastStore.dismiss(id);
}
