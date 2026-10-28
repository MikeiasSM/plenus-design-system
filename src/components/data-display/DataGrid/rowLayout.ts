/** Posições das linhas e dos detalhes para a janela virtual, a partir das alturas de cada um. */

export interface RowLayout {
  /** `offsets[i]` é o topo da linha `i`; o último elemento é a altura total. */
  offsets: readonly number[];
}

export function buildRowLayout(heights: readonly number[]): RowLayout {
  const offsets = new Array<number>(heights.length + 1);
  offsets[0] = 0;

  for (let i = 0; i < heights.length; i += 1) {
    offsets[i + 1] = offsets[i] + heights[i];
  }

  return { offsets };
}

export function totalHeight(layout: RowLayout) {
  return layout.offsets[layout.offsets.length - 1];
}

/** A linha que contém a posição `y`, por busca binária. */
export function rowAt(layout: RowLayout, y: number) {
  const { offsets } = layout;
  let low = 0;
  let high = offsets.length - 2;

  while (low < high) {
    const middle = (low + high + 1) >> 1;

    if (offsets[middle] <= y) {
      low = middle;
    } else {
      high = middle - 1;
    }
  }

  return Math.max(low, 0);
}

export interface RowWindow {
  end: number;
  start: number;
}

/** Linhas desenhadas: as visíveis e uma margem dos dois lados. `end` é exclusivo. */
export function visibleWindow(layout: RowLayout, scrollTop: number, viewportHeight: number, overscan: number): RowWindow {
  const count = layout.offsets.length - 1;

  if (count === 0) {
    return { start: 0, end: 0 };
  }

  const first = rowAt(layout, scrollTop);
  const last = rowAt(layout, scrollTop + viewportHeight);

  return { start: Math.max(first - overscan, 0), end: Math.min(last + overscan + 1, count) };
}
