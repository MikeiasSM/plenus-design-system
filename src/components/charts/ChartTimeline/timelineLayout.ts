import type {
  ChartTimelineGroup,
  ChartTimelineOverlap,
  ChartTimelineRow,
  ChartTimelineScale,
  ChartTimelineSegment,
  ChartTimelineState,
  ChartTimelineTime,
} from './ChartTimeline';
import { group as groupBy } from 'd3-array';
import { toPosition } from './timelineTime';

const HOURS_IN_DAY = 24;

export interface TimelineRange {
  end: number;
  start: number;
}

/** Intervalo com as pontas em posicao do eixo. `source` e o que o consumidor recebe de volta. */
export interface TimelineSegment extends TimelineRange {
  id: number;
  label?: string;
  progress?: number;
  row: string;
  series: string;
  source: ChartTimelineSegment;
}

export interface PlacedSegment extends TimelineSegment {
  lane: number;
}

export type TimelineItem =
  | {
      child: boolean;
      height: number;
      kind: 'row';
      laneCount: number;
      row: ChartTimelineRow;
      segments: readonly PlacedSegment[];
      y: number;
    }
  | {
      collapsed: boolean;
      group: ChartTimelineGroup;
      height: number;
      kind: 'group';
      rows: readonly ChartTimelineRow[];
      segments: readonly TimelineSegment[];
      y: number;
    };

/**
 * Pontas em posicao do eixo. Em `dayHours`, o fim antes do inicio e o intervalo que cruza a meia-noite: ele termina
 * no dia seguinte, e o desenho o corta no fim do eixo. Instante invalido, ou fim antes do inicio em datas, nao vira
 * geometria.
 */
export function toRange(start: ChartTimelineTime, end: ChartTimelineTime, scale: ChartTimelineScale) {
  const from = toPosition(start, scale);
  const to = toPosition(end, scale);

  if (!Number.isFinite(from) || !Number.isFinite(to) || (to < from && scale === 'calendar')) {
    return undefined;
  }

  return { end: to < from ? to + HOURS_IN_DAY : to, start: from };
}

export function toTimelineSegments(segments: readonly ChartTimelineSegment[], scale: ChartTimelineScale) {
  return segments.flatMap((source, id): TimelineSegment[] => {
    const range = toRange(source.start, source.end, scale);
    const progress = source.progress;

    if (!range) {
      return [];
    }

    return [
      {
        ...range,
        id,
        label: source.label,
        progress: progress !== undefined && Number.isFinite(progress) ? Math.min(Math.max(progress, 0), 1) : undefined,
        row: source.row,
        series: source.series,
        source,
      },
    ];
  });
}

/** Cada estado vale ate o seguinte da linha, e o ultimo ate `end`. Com `merge`, iguais seguidos viram uma regiao. */
export function statesToSegments(
  states: readonly ChartTimelineState[],
  end: ChartTimelineTime,
  merge: boolean,
  scale: ChartTimelineScale,
) {
  const readings = states
    .map((state) => ({ position: toPosition(state.time, scale), state }))
    .filter(({ position }) => Number.isFinite(position));
  const readingsByRow = groupBy(readings, ({ state }) => state.row);
  const segments: ChartTimelineSegment[] = [];

  for (const [row, rowReadings] of readingsByRow) {
    rowReadings.sort((a, b) => a.position - b.position);

    rowReadings.forEach(({ state }, index) => {
      const next = rowReadings[index + 1]?.state.time ?? end;
      const previous = segments.at(-1);

      if (merge && previous?.row === row && previous.series === state.state) {
        previous.end = next;
        return;
      }

      segments.push({ end: next, row, series: state.state, start: state.time });
    });
  }

  return segments;
}

/** Sub-faixas: cada intervalo entra na primeira cujo ultimo intervalo ja terminou. Em `overlay`, todos na mesma. */
export function placeInLanes(segments: readonly TimelineSegment[], overlap: ChartTimelineOverlap) {
  const ordered = [...segments].sort((a, b) => a.start - b.start || a.end - b.end);

  if (overlap === 'overlay') {
    return { laneCount: 1, segments: ordered.map((segment): PlacedSegment => ({ ...segment, lane: 0 })) };
  }

  const laneEnds: number[] = [];
  const placed = ordered.map((segment): PlacedSegment => {
    let lane = laneEnds.findIndex((laneEnd) => laneEnd <= segment.start);

    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(segment.end);
    } else {
      laneEnds[lane] = segment.end;
    }

    return { ...segment, lane };
  });

  return { laneCount: Math.max(laneEnds.length, 1), segments: placed };
}

/** As linhas sem grupo, ou de grupo desconhecido, vem primeiro; depois as de cada grupo, na ordem dos grupos. */
export function rowsInDisplayOrder(rows: readonly ChartTimelineRow[], groups: readonly ChartTimelineGroup[]) {
  const known = new Set(groups.map((group) => group.key));

  return [
    ...rows.filter((row) => row.group === undefined || !known.has(row.group)),
    ...groups.flatMap((group) => rows.filter((row) => row.group === group.key)),
  ];
}

export interface TimelineLayoutOptions {
  groupHeight: number;
  groups: readonly ChartTimelineGroup[];
  isCollapsed: (groupKey: string) => boolean;
  laneStep: number;
  overlap: ChartTimelineOverlap;
  rowGap: number;
  rowHeight: number;
  rows: readonly ChartTimelineRow[];
  /** So os visiveis: a serie desligada nao ocupa sub-faixa. */
  segments: readonly TimelineSegment[];
}

/** Ordem e altura de cada linha e cabecalho de grupo. A linha cresce uma sub-faixa por intervalo sobreposto. */
export function layoutTimeline({
  groupHeight,
  groups,
  isCollapsed,
  laneStep,
  overlap,
  rowGap,
  rowHeight,
  rows,
  segments,
}: TimelineLayoutOptions) {
  const byRow = groupBy(segments, (segment) => segment.row);
  const groupsByKey = new Map(groups.map((candidate) => [candidate.key, candidate]));
  const items: TimelineItem[] = [];
  let currentGroup: string | undefined;

  for (const row of rowsInDisplayOrder(rows, groups)) {
    const group = row.group === undefined ? undefined : groupsByKey.get(row.group);

    if (group && group.key !== currentGroup) {
      const groupRows = rows.filter((candidate) => candidate.group === group.key);

      currentGroup = group.key;
      items.push({
        collapsed: isCollapsed(group.key),
        group,
        height: groupHeight,
        kind: 'group',
        rows: groupRows,
        segments: groupRows.flatMap((candidate) => byRow.get(candidate.key) ?? []),
        y: 0,
      });
    }

    if (group && isCollapsed(group.key)) {
      continue;
    }

    const lanes = placeInLanes(byRow.get(row.key) ?? [], overlap);

    items.push({
      child: group !== undefined,
      height: rowHeight + (lanes.laneCount - 1) * laneStep,
      kind: 'row',
      laneCount: lanes.laneCount,
      row,
      segments: lanes.segments,
      y: 0,
    });
  }

  let y = 0;

  items.forEach((item, index) => {
    item.y = y;
    y += item.height + (index < items.length - 1 ? rowGap : 0);
  });

  return { height: y, items };
}
