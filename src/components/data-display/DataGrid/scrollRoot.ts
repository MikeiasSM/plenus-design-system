import type { DataGridColumnState } from './columnLayout';
import type { DataGridDensity, DataGridState } from './gridState';

/** O que uma grade aninhada guarda ao ser desmontada pela janela virtual, para voltar como estava. */
export interface DataGridMemory extends DataGridState {
  columns: DataGridColumnState;
  density: DataGridDensity;
  expandedIds: readonly string[];
  selectedIds: readonly string[];
}

export type DataGridDetailState = Readonly<Record<string, unknown>>;

interface Anchor {
  element: Element;
  scrollTop: number;
  top: number;
}

/**
 * A rolagem única da grade de fora, compartilhada pelas aninhadas: alturas dos detalhes de todos os níveis, estado
 * guardado pelo caminho e a âncora que impede o salto quando uma altura acima da tela muda.
 */
export class DataGridScrollRoot {
  readonly heights = new Map<string, number>();
  readonly memories = new Map<string, DataGridMemory>();
  readonly detailStates = new Map<string, DataGridDetailState>();
  scroller: HTMLElement | null = null;
  head: HTMLElement | null = null;
  /** A sumarização presa ao rodapé, que também cobre linhas. */
  foot: HTMLElement | null = null;
  private anchor: Anchor | null = null;
  private readonly listeners = new Set<() => void>();
  private readonly onHeightsChange: () => void;

  constructor(onHeightsChange: () => void) {
    this.onHeightsChange = onHeightsChange;
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  notify() {
    this.listeners.forEach((listener) => listener());
  }

  /**
   * A âncora é registrada na primeira altura que muda, antes do redesenho, e vale até a pessoa rolar: num detalhe
   * dentro de outro, a altura sobe nível a nível, em quadros diferentes, e um registro no meio veria linhas deslocadas.
   */
  measure(path: string, height: number, estimate: number) {
    if (Math.abs(height - (this.heights.get(path) ?? estimate)) < 0.5) {
      return;
    }

    this.anchor ??= this.firstVisibleRow();
    this.heights.set(path, height);
    this.onHeightsChange();
  }

  /** Ordem, busca, dados ou expansão mudaram: a linha registrada já não está onde estava por causa de uma altura. */
  releaseAnchor() {
    this.anchor = null;
  }

  /** A correção da própria âncora não conta como rolagem da pessoa. */
  scrolled() {
    if (this.anchor && this.scroller?.scrollTop !== this.anchor.scrollTop) {
      this.anchor = null;
    }
    this.notify();
  }

  restoreAnchor() {
    const { anchor, scroller } = this;

    if (!anchor || !scroller) {
      return;
    }
    if (!anchor.element.isConnected || scroller.scrollTop !== anchor.scrollTop) {
      this.anchor = null;
      return;
    }

    const shift = anchor.element.getBoundingClientRect().top - anchor.top;
    if (Math.abs(shift) >= 0.5) {
      scroller.scrollTop += shift;
      anchor.scrollTop = scroller.scrollTop;
    }
  }

  footHeight() {
    return this.foot?.offsetHeight ?? 0;
  }

  headHeight() {
    return this.head?.offsetHeight ?? 0;
  }

  /** Topo de um elemento no conteúdo rolável da grade de fora. */
  contentTop(element: Element) {
    const scroller = this.scroller;

    if (!scroller) {
      return 0;
    }

    return element.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
  }

  /** Rola o mínimo para a faixa, em coordenadas do conteúdo, ficar entre o cabeçalho e o rodapé fixos. */
  reveal(top: number, bottom: number) {
    const scroller = this.scroller;

    if (!scroller) {
      return;
    }

    const visibleTop = top - this.headHeight();
    if (visibleTop < scroller.scrollTop) {
      scroller.scrollTop = visibleTop;
    } else if (scroller.clientHeight > 0 && bottom > scroller.scrollTop + scroller.clientHeight - this.footHeight()) {
      scroller.scrollTop = bottom - scroller.clientHeight + this.footHeight();
    }
  }

  private firstVisibleRow(): Anchor | null {
    const scroller = this.scroller;

    if (!scroller) {
      return null;
    }

    const edge = scroller.getBoundingClientRect().top + this.headHeight() - 1;
    for (const element of scroller.querySelectorAll('[data-anchor]')) {
      const top = element.getBoundingClientRect().top;

      if (top >= edge) {
        return { element, scrollTop: scroller.scrollTop, top };
      }
    }

    return null;
  }
}
