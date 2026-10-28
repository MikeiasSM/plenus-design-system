import { max, min, sum } from 'd3-array';
import type { ChartTooltipProps, ChartTooltipRow } from '../ChartTooltip';
import { formatPercent } from '../../../utils/formatters';
import type { ChartTimelineGroup, ChartTimelineMarker, ChartTimelineRow } from './ChartTimeline';
import type { TimelineRange, TimelineSegment } from './timelineLayout';

export interface TimelineMarker extends ChartTimelineMarker {
  position: number;
}

export interface TimelineRowBand extends TimelineRange {
  row: string;
  series: string;
}

/** O que esta sob o ponteiro. Cada caso carrega o que o balao dele precisa. */
export type TimelineTarget =
  | { clip: string | undefined; kind: 'segment'; row: ChartTimelineRow; segment: TimelineSegment }
  | { kind: 'marker'; marker: TimelineMarker; row: ChartTimelineRow }
  | {
      collapsed: boolean;
      group: ChartTimelineGroup;
      kind: 'group';
      rowCount: number;
      segments: readonly TimelineSegment[];
    }
  | {
      /** A linha nao tem intervalo algum, de nenhuma serie. */
      empty: boolean;
      kind: 'row';
      row: ChartTimelineRow;
      rowBands: readonly TimelineRowBand[];
      segments: readonly TimelineSegment[];
    };

export interface TimelineTooltipOptions {
  colorOf: (series: string) => string | undefined;
  duration: (range: TimelineRange) => number;
  emptyRowLabel: string;
  formatDuration: (durationMs: number) => string;
  formatInstant: (position: number) => string;
  seriesOrder: readonly string[];
  showProgress: boolean;
}

export type TimelineTooltip = Omit<ChartTooltipProps, 'children'>;

function joined(parts: readonly (string | undefined)[]) {
  return parts.filter(Boolean).join(' · ') || undefined;
}

export function timelineTooltip(target: TimelineTarget | null, options: TimelineTooltipOptions): TimelineTooltip {
  if (target === null) {
    return { rows: [] };
  }

  const { colorOf, duration, formatDuration, formatInstant } = options;
  const interval = (range: TimelineRange) => `${formatInstant(range.start)}–${formatInstant(range.end)}`;

  if (target.kind === 'segment') {
    const { row, segment } = target;
    const rows: ChartTooltipRow[] = [
      { color: colorOf(segment.series), emphasis: true, label: segment.series, values: [duration(segment)] },
    ];

    if (options.showProgress && segment.progress !== undefined) {
      rows.push({ format: (value) => formatPercent(value), label: 'Concluído', values: [segment.progress] });
    }

    return {
      columns: [{ format: formatDuration }],
      computed: 'none',
      rows,
      subtitle: joined([
        interval(segment),
        segment.label !== segment.series ? segment.label : undefined,
        row.description,
        target.clip,
      ]),
      title: row.label,
    };
  }

  if (target.kind === 'marker') {
    const { marker, row } = target;

    return {
      computed: 'none',
      rows: [
        {
          color: colorOf(marker.series),
          emphasis: true,
          format: formatInstant,
          label: marker.series,
          values: [marker.position],
        },
      ],
      subtitle: marker.label,
      title: row.label,
    };
  }

  if (target.kind === 'group') {
    const { segments } = target;
    const start = min(segments, (segment) => segment.start);
    const end = max(segments, (segment) => segment.end);
    const period = start === undefined || end === undefined ? undefined : interval({ end, start });

    return {
      computed: 'none',
      rows: [{ format: String, label: 'Linhas', values: [target.rowCount] }],
      subtitle: joined([period, target.collapsed ? 'Grupo recolhido' : undefined]),
      title: target.group.label,
    };
  }

  const { row, segments } = target;
  const scheduled = options.seriesOrder.flatMap((series) => {
    const bands = target.rowBands.filter((band) => band.series === series);
    return bands.length ? [`${series} ${bands.map(interval).join(' · ')}`] : [];
  });
  const subtitle = joined([row.description, ...scheduled]);
  const totals = options.seriesOrder.flatMap((series): ChartTooltipRow[] => {
    const ofSeries = segments.filter((segment) => segment.series === series);
    return ofSeries.length ? [{ color: colorOf(series), label: series, values: [sum(ofSeries, duration)] }] : [];
  });

  // Sem coluna declarada o balao nao inventa um valor para a linha que so tem rotulo.
  if (totals.length === 0) {
    return {
      computed: 'none',
      rows: [{ label: target.empty ? options.emptyRowLabel : 'Séries desligadas', values: [] }],
      subtitle,
      title: row.label,
    };
  }

  return {
    columns: [{ format: formatDuration }],
    computed: 'none',
    rows: totals,
    showTotal: totals.length > 1,
    subtitle,
    title: row.label,
  };
}
