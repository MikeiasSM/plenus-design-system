import { polylabel, signedDistance, type Point, type Ring } from './polylabel';

export interface LabelCandidate {
  /** Caixa da regiao na tela; as maiores rotulam primeiro. */
  bounds: readonly [Point, Point];
  id: string;
  /** Partes da regiao na tela, cada uma com o anel externo e os furos. So e lida quando a caixa comporta o rotulo. */
  parts: readonly (readonly Ring[])[];
  title: string;
  value?: string;
}

export interface LabelPlanOptions {
  /** Leva para a coluna junto ao desenho o rotulo que nao cabe na regiao. */
  callouts: boolean;
  /** Distancia entre dois rotulos seguidos na coluna. */
  calloutStep: number;
  /** Altura do desenho, que limita quantos rotulos a coluna comporta. */
  height: number;
  /** Altura de uma linha de texto do rotulo dentro da regiao. */
  lineHeight: number;
  measure: (text: string) => number;
  /** Borda direita da area de desenho; a coluna nunca passa dela. */
  right: number;
}

export interface InsideLabel {
  id: string;
  title: string;
  value?: string;
  x: number;
  y: number;
}

export interface CalloutLabel extends InsideLabel {
  anchor: Point;
}

export interface LabelPlan {
  callouts: CalloutLabel[];
  inside: InsideLabel[];
}

interface Box {
  height: number;
  width: number;
  x: number;
  y: number;
}

const BOX_PADDING = 2;
export const CALLOUT_GAP = 16;
/** Espaco entre a sigla e o valor na coluna. */
export const CALLOUT_VALUE_GAP = 5;
const EDGE = 8;

/** A maior parte da regiao, pela area do anel externo: ilhas, como Fernando de Noronha, nao deslocam o rotulo. */
export function largestPart(parts: readonly (readonly Ring[])[]): readonly Ring[] {
  const areaOf = (ring: Ring) =>
    Math.abs(ring.reduce((sum, [x, y], index) => {
      const [nx, ny] = ring[(index + 1) % ring.length];
      return sum + x * ny - nx * y;
    }, 0)) / 2;

  return parts.reduce((largest, part) => (areaOf(part[0] ?? []) > areaOf(largest[0] ?? []) ? part : largest), parts[0] ?? []);
}

/** Largura do rotulo na coluna: a sigla e, ao lado, o valor. */
export function calloutWidth(label: Pick<InsideLabel, 'title' | 'value'>, measure: (text: string) => number) {
  return measure(label.title) + (label.value ? CALLOUT_VALUE_GAP + measure(label.value) : 0);
}

/**
 * Centro visual para um rotulo largo: o poligono e achatado na proporcao do rotulo antes da busca, e o maior circulo
 * interno vira a maior elipse daquela proporcao. Numa cunha como o Acre, o circulo deixava os cantos de fora.
 */
function labelCenter(rings: readonly Ring[], aspect: number): Point {
  const [x, y] = polylabel(rings.map((ring) => ring.map(([px, py]): Point => [px, py * aspect])));
  return [x, y / aspect];
}

function overlaps(a: Box, b: Box) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

/**
 * Onde vai cada rotulo. Da maior regiao para a menor, entra quem cabe inteiro dentro da propria regiao, pelos quatro
 * cantos, sem tocar outro rotulo; sem espaco para o valor, fica so a sigla; sem espaco nem para ela, o rotulo vai para
 * uma coluna junto ao desenho, com linha guia, se a regiao esta na metade junto a ela. Quando a coluna nao comporta
 * todos, como nos municipios, nenhum vai.
 */
export function planLabels(candidates: readonly LabelCandidate[], options: LabelPlanOptions): LabelPlan {
  const { lineHeight, measure } = options;
  const mainParts = new Map<LabelCandidate, readonly Ring[]>();
  const mainPartOf = (candidate: LabelCandidate) => {
    if (!mainParts.has(candidate)) {
      mainParts.set(candidate, largestPart(candidate.parts));
    }

    return mainParts.get(candidate)!;
  };
  const contains = (candidate: LabelCandidate, x: number, y: number) =>
    candidate.parts.some((part) => signedDistance(x, y, part) >= 0);
  const areaOf = ({ bounds: [[x0, y0], [x1, y1]] }: LabelCandidate) => (x1 - x0) * (y1 - y0);
  const occupied: Box[] = [];
  const inside: InsideLabel[] = [];
  const small: { candidate: LabelCandidate; center?: Point }[] = [];

  const boxAt = ([x, y]: Point, width: number, lines: number): Box => ({
    height: lineHeight * lines + BOX_PADDING,
    width: width + BOX_PADDING * 2,
    x: x - width / 2 - BOX_PADDING,
    y: y - (lineHeight * lines) / 2 - BOX_PADDING / 2,
  });
  // A folga separa um rotulo do outro; dentro da regiao basta o texto.
  const fits = (box: Box, candidate: LabelCandidate) => {
    const [left, top] = [box.x + BOX_PADDING, box.y + BOX_PADDING / 2];
    const [right, bottom] = [box.x + box.width - BOX_PADDING, box.y + box.height - BOX_PADDING / 2];

    return (
      !occupied.some((other) => overlaps(box, other)) &&
      [
        [left, top],
        [right, top],
        [left, bottom],
        [right, bottom],
      ].every(([x, y]) => contains(candidate, x, y))
    );
  };

  for (const candidate of [...candidates].sort((a, b) => areaOf(b) - areaOf(a))) {
    const titleWidth = measure(candidate.title);
    const [[x0, y0], [x1, y1]] = candidate.bounds;

    // A caixa da regiao menor que a do rotulo dispensa a busca do centro.
    if (x1 - x0 < titleWidth + BOX_PADDING * 2 || y1 - y0 < lineHeight + BOX_PADDING) {
      small.push({ candidate });
      continue;
    }

    const center = labelCenter(mainPartOf(candidate), (titleWidth + BOX_PADDING * 2) / (lineHeight + BOX_PADDING));
    const full = candidate.value
      ? boxAt(center, Math.max(titleWidth, measure(candidate.value)), 2)
      : undefined;
    const short = boxAt(center, titleWidth, 1);

    if (full && fits(full, candidate)) {
      occupied.push(full);
      inside.push({ id: candidate.id, title: candidate.title, value: candidate.value, x: center[0], y: center[1] });
    } else if (fits(short, candidate)) {
      occupied.push(short);
      inside.push({ id: candidate.id, title: candidate.title, x: center[0], y: center[1] });
    } else {
      small.push({ candidate, center });
    }
  }

  const step = options.calloutStep;
  const capacity = Math.floor((options.height - EDGE * 2) / step);

  if (!options.callouts || small.length === 0) {
    return { callouts: [], inside };
  }

  // So a metade do desenho junto a coluna vai para ela: do lado oposto, a linha guia cruzaria o mapa inteiro.
  const [left, right] = candidates.reduce(
    ([low, high], { bounds }) => [Math.min(low, bounds[0][0]), Math.max(high, bounds[1][0])],
    [Infinity, -Infinity],
  );
  const nearColumn = small.filter(({ candidate: { bounds } }) => bounds[0][0] + bounds[1][0] >= left + right);

  if (nearColumn.length === 0 || nearColumn.length > capacity) {
    return { callouts: [], inside };
  }

  // A coluna encosta no desenho pela maior parte das regioes, e nao pelas ilhas nem pela borda do conteiner.
  const drawingRight = candidates.reduce(
    (right, candidate) => (mainPartOf(candidate)[0] ?? []).reduce((edge, [x]) => Math.max(edge, x), right),
    -Infinity,
  );
  const columnX = Math.min(options.right, drawingRight) + CALLOUT_GAP;
  const callouts = nearColumn
    .map(({ candidate, center }) => ({
      anchor: center ?? polylabel(mainPartOf(candidate)),
      id: candidate.id,
      title: candidate.title,
      value: candidate.value,
      x: columnX,
      y: 0,
    }))
    .sort((a, b) => a.anchor[1] - b.anchor[1]);

  let previous = -Infinity;
  callouts.forEach((callout) => {
    callout.y = Math.max(callout.anchor[1], previous + step, EDGE + step / 2);
    previous = callout.y;
  });

  const overflow = previous - (options.height - EDGE - step / 2);
  if (overflow > 0) {
    callouts.forEach((callout) => {
      callout.y -= overflow;
    });
  }

  return { callouts, inside };
}
