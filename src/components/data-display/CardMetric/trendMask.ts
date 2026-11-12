/**
 * Mascara das comparações do `CardMetric.Trend`: quais partes aparecem, em que ordem e com que texto entre elas.
 * Cada linha do texto e uma linha da comparação; `{parte}` e uma parte; `[ ]` e um trecho que aparece inteiro ou não
 * aparece. Aqui só se le e se resolve a mascara; desenhar as partes e do componente.
 */

export type CardMetricTrendPart = 'change' | 'description' | 'icon' | 'label' | 'magnitude' | 'value';

export type TrendMaskItem =
  | { kind: 'part'; part: string }
  | { kind: 'text'; text: string }
  | { kind: 'optional'; items: readonly TrendMaskItem[] };

export type TrendMaskLine = readonly TrendMaskItem[];

export type TrendSegment = { kind: 'part'; part: CardMetricTrendPart } | { kind: 'text'; text: string };

const PARTS: readonly string[] = ['change', 'description', 'icon', 'label', 'magnitude', 'value'];

export const isTrendPart = (part: string): part is CardMetricTrendPart => PARTS.includes(part);

function parseItems(text: string): TrendMaskItem[] {
  const items: TrendMaskItem[] = [];
  let literal = '';
  let index = 0;

  const closeLiteral = () => {
    if (literal) {
      items.push({ kind: 'text', text: literal });
      literal = '';
    }
  };

  while (index < text.length) {
    const char = text[index];
    const end = char === '{' ? text.indexOf('}', index) : char === '[' ? text.indexOf(']', index) : -1;

    if (end < 0) {
      literal += char;
      index += 1;
      continue;
    }

    closeLiteral();
    const inner = text.slice(index + 1, end);
    items.push(char === '{' ? { kind: 'part', part: inner.trim() } : { kind: 'optional', items: parseItems(inner) });
    index = end + 1;
  }

  closeLiteral();

  return items;
}

/** Linhas da mascara, sem as vazias. */
export function parseTrendMask(mask: string): TrendMaskLine[] {
  return mask
    .split('\n')
    .map(parseItems)
    .filter((line) => line.length > 0);
}

/** Partes que a mascara cita e a lib não conhece, para o aviso em desenvolvimento. */
export function unknownTrendParts(lines: readonly TrendMaskLine[]): string[] {
  const unknown = new Set<string>();
  const visit = (items: readonly TrendMaskItem[]) =>
    items.forEach((item) => {
      if (item.kind === 'part' && !isTrendPart(item.part)) unknown.add(item.part);
      if (item.kind === 'optional') visit(item.items);
    });

  lines.forEach(visit);

  return [...unknown];
}

/** A parte ausente some; o texto entre partes só fica com uma presente de cada lado, e o trecho opcional, com todas. */
export function resolveTrendLine(line: TrendMaskLine, present: (part: CardMetricTrendPart) => boolean): TrendSegment[] {
  const has = (part: string) => isTrendPart(part) && present(part);
  const complete = (items: readonly TrendMaskItem[]): boolean =>
    items.every((item) => (item.kind === 'part' ? has(item.part) : item.kind === 'optional' ? complete(item.items) : true));

  const pieces = line.map((item) => {
    if (item.kind === 'text') {
      return { kind: 'text' as const, text: item.text };
    }

    const segments: TrendSegment[] =
      item.kind === 'part'
        ? has(item.part)
          ? [{ kind: 'part', part: item.part as CardMetricTrendPart }]
          : []
        : complete(item.items)
          ? resolveTrendLine(item.items, present)
          : [];

    return { kind: 'group' as const, segments };
  });

  return pieces.flatMap((piece, index) => {
    if (piece.kind === 'group') {
      return piece.segments;
    }

    const before = pieces.slice(0, index).filter((other) => other.kind === 'group');
    const after = pieces.slice(index + 1).filter((other) => other.kind === 'group');
    const anyPresent = (groups: typeof before) => groups.some((group) => group.kind === 'group' && group.segments.length > 0);
    const kept = before.length > 0 && after.length > 0 ? anyPresent(before) && anyPresent(after) : anyPresent(before) || anyPresent(after);

    return kept ? [{ kind: 'text' as const, text: piece.text }] : [];
  });
}

/** Na tabela, a primeira linha se reparte em células nos espacos; partes coladas dividem a célula. */
export function trendCells(line: TrendMaskLine): TrendMaskLine[] {
  const cells: TrendMaskItem[][] = [[]];

  line.forEach((item) => {
    if (item.kind === 'text' && item.text.trim() === '') {
      if (cells[cells.length - 1].length > 0) cells.push([]);
      return;
    }

    cells[cells.length - 1].push(item);
  });

  return cells.filter((cell) => cell.length > 0);
}

/** A célula que leva rótulo ou explicação e de texto: ocupa a sobra e quebra; as demais são números. */
export function isTextCell(cell: TrendMaskLine): boolean {
  return cell.some(
    (item) =>
      (item.kind === 'part' && (item.part === 'label' || item.part === 'description')) ||
      (item.kind === 'optional' && isTextCell(item.items)),
  );
}
