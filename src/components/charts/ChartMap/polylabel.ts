export type Point = readonly [number, number];
export type Ring = readonly Point[];

interface Cell {
  /** Distancia do centro da celula ate a borda: positiva dentro do poligono, negativa fora. */
  distance: number;
  half: number;
  /** O maior valor que um ponto da celula ainda pode alcancar. */
  potential: number;
  x: number;
  y: number;
}

function segmentDistanceSquared(x: number, y: number, [ax, ay]: Point, [bx, by]: Point) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = dx === 0 && dy === 0 ? 0 : Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
  const px = ax + dx * t;
  const py = ay + dy * t;

  return (x - px) ** 2 + (y - py) ** 2;
}

/** Distancia ate a borda mais proxima, com o sinal de dentro ou fora; furos contam como borda. */
export function signedDistance(x: number, y: number, rings: readonly Ring[]) {
  let inside = false;
  let nearest = Infinity;

  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
      const [ax, ay] = ring[i];
      const [bx, by] = ring[j];

      if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax) {
        inside = !inside;
      }

      nearest = Math.min(nearest, segmentDistanceSquared(x, y, ring[i], ring[j]));
    }
  }

  return (inside ? 1 : -1) * Math.sqrt(nearest);
}

function cellAt(x: number, y: number, half: number, rings: readonly Ring[]): Cell {
  const distance = signedDistance(x, y, rings);
  return { distance, half, potential: distance + half * Math.SQRT2, x, y };
}

/**
 * Centro visual do poligono: o ponto interno mais distante das bordas, achado por subdivisao, como o polylabel do
 * Mapbox. Num "L" ou num litoral recortado, o centroide cai fora ou colado na borda; este ponto, nao.
 */
export function polylabel(rings: readonly Ring[], precision = 1): Point {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];

  for (const [x, y] of rings[0] ?? []) {
    [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)];
  }

  const side = Math.min(x1 - x0, y1 - y0);

  if (!(side > 0)) {
    return Number.isFinite(x0) ? [x0, y0] : [0, 0];
  }

  // Fila em ordem crescente de potencial: a celula mais promissora sai do fim.
  const queue: Cell[] = [];
  const enqueue = (cell: Cell) => {
    let low = 0;
    let high = queue.length;

    while (low < high) {
      const middle = (low + high) >> 1;

      if (queue[middle].potential < cell.potential) {
        low = middle + 1;
      } else {
        high = middle;
      }
    }

    queue.splice(low, 0, cell);
  };

  for (let x = x0; x < x1; x += side) {
    for (let y = y0; y < y1; y += side) {
      enqueue(cellAt(x + side / 2, y + side / 2, side / 2, rings));
    }
  }

  let best = cellAt((x0 + x1) / 2, (y0 + y1) / 2, 0, rings);

  while (queue.length > 0) {
    const cell = queue.pop()!;

    if (cell.distance > best.distance) {
      best = cell;
    }

    if (cell.potential - best.distance <= precision) {
      continue;
    }

    const half = cell.half / 2;
    enqueue(cellAt(cell.x - half, cell.y - half, half, rings));
    enqueue(cellAt(cell.x + half, cell.y - half, half, rings));
    enqueue(cellAt(cell.x - half, cell.y + half, half, rings));
    enqueue(cellAt(cell.x + half, cell.y + half, half, rings));
  }

  return [best.x, best.y];
}
