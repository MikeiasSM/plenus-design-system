import { createContext, useContext, useLayoutEffect, useRef, type RefObject } from 'react';

export type SidebarNestedMode = 'expand' | 'stack';
export type SidebarAccountMode = 'inline' | 'cover';

/** Quem recebe o foco quando o caminho chegar a `path`: o voltar do ramo `id` ao entrar, o item dele ao sair. */
interface SidebarStackFocus {
  id: string;
  path: readonly string[];
  target: 'back' | 'item';
}

/**
 * O caminho da pilha: os ids dos ramos em que se entrou, do mais alto ao mais fundo. O submenu tem um, e a conta, outro.
 * Fora da pilha (`nestedMode="expand"`), o caminho fica vazio.
 */
export interface SidebarStack {
  /** Pede a cadeia de um ramo com `defaultExpanded`; vale a mais funda, uma vez por ramo, com o caminho vazio. */
  offerDefault: (chain: string[]) => void;
  /** Leva o caminho ao pai do item atual, quando o submenu segue o atual (`followCurrent`). */
  follow: (chain: string[]) => void;
  focus: RefObject<SidebarStackFocus | null>;
  navigate: (next: string[], focus?: Omit<SidebarStackFocus, 'path'>) => void;
  path: readonly string[];
}

/** O nível em que o item está: os ramos de cima (`ancestors`, a profundidade é o tamanho) e o rótulo do nível, que é o voltar dos filhos. */
export interface SidebarLevel {
  ancestors: readonly string[];
  label: string;
  stack: SidebarStack;
}

export interface SidebarPanelContextValue {
  accountMode: SidebarAccountMode;
  label: string;
  nestedMode: SidebarNestedMode;
  visible: boolean;
}

export const SidebarPanelContext = createContext<SidebarPanelContextValue | null>(null);
export const SidebarLevelContext = createContext<SidebarLevel | null>(null);

export function useSidebarPanel() {
  const context = useContext(SidebarPanelContext);

  if (!context) {
    throw new Error('Os itens do submenu só funcionam dentro de <Sidebar.Panel>.');
  }

  return context;
}

export function useSidebarLevel() {
  const level = useContext(SidebarLevelContext);

  if (!level) {
    throw new Error('Os itens do submenu só funcionam dentro de <Sidebar.Panel>.');
  }

  return level;
}

export function samePath(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

interface StackOptions {
  /** Aplica os `defaultExpanded` dos ramos; desligado quando o caminho é controlado. */
  acceptDefaults: boolean;
  /** Muda o caminho e avisa quem ouve. */
  change: (next: string[]) => void;
  followCurrent: boolean;
  path: readonly string[];
  /** A lista a que os padrões pertencem, como o rótulo do módulo: outra lista, outros padrões. */
  scope: string;
  /** Muda o caminho sem avisar: o estado inicial dos `defaultExpanded`. */
  start: (next: string[]) => void;
}

/**
 * A mecânica da pilha, comum ao submenu e à conta. Os ramos com `defaultExpanded` se oferecem no efeito de montagem, que roda
 * antes do efeito de quem monta a pilha: este escolhe a cadeia mais funda de uma vez, sem a corrida de cada ramo mudar o caminho.
 */
export function useSidebarStack({ acceptDefaults, change, followCurrent, path, scope, start }: StackOptions): SidebarStack {
  const focus = useRef<SidebarStackFocus | null>(null);
  const offered = useRef<string[][]>([]);
  const seen = useRef(new Set<string>());

  useLayoutEffect(() => {
    if (offered.current.length === 0) {
      return;
    }

    const deepest = offered.current.reduce((chosen, chain) => (chain.length > chosen.length ? chain : chosen));
    offered.current = [];

    if (acceptDefaults && path.length === 0) {
      start(deepest);
    }
  });

  const stack: SidebarStack = {
    focus,
    follow(chain) {
      if (followCurrent && !samePath(chain, path)) {
        change(chain);
      }
    },
    navigate(next, nextFocus) {
      focus.current = nextFocus ? { ...nextFocus, path: next } : null;
      change(next);
    },
    offerDefault(chain) {
      // O ramo que volta a montar não reabre: o padrão vale uma vez por ramo em cada lista.
      const key = JSON.stringify([scope, ...chain]);

      if (chain.length > 0 && !seen.current.has(key)) {
        seen.current.add(key);
        offered.current.push(chain);
      }
    },
    path,
  };

  return stack;
}
