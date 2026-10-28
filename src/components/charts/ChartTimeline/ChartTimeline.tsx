import { group as groupBy, least, max, min, sum } from 'd3-array';
import { useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { Button } from '../../actions/Button';
import { EmptyState } from '../../feedback/EmptyState';
import { IconChartBar, IconChevronDown } from '../../icons';
import { ChartTooltip } from '../ChartTooltip';
import {
  CHART_LABEL_OFFSET,
  ChartLegend,
  Grid,
  chartRoot,
  measureLabel,
  roundedBarPath,
  truncateToWidth,
  useChartMetrics,
  useSeriesToggle,
  type AxisVisibility,
  type ChartLegendAlign,
  type ChartRootProps,
  type CornerRadii,
  type LabelFont,
} from '../core';
import { INTENT_TOKENS, resolveSeriesColors, textColorOn, type ChartPalette, type SeriesAppearance, type SeriesIntent } from '../palette';
import { linearScale } from '../scales';
import { formatPercent } from '../../../utils/formatters';
import { formatDuration } from '../../../utils/formatters/formatDuration';
import { ChartTimelineTable, type TimelineTableEntry, type TimelineTableRow } from './ChartTimelineTable';
import {
  layoutTimeline,
  rowsInDisplayOrder,
  statesToSegments,
  toRange,
  toTimelineSegments,
  type PlacedSegment,
  type TimelineItem,
  type TimelineRange,
} from './timelineLayout';
import { autoDomain, durationMs, formatPosition, timeTicks, toDate, toPosition } from './timelineTime';
import { timelineTooltip, type TimelineMarker, type TimelineRowBand, type TimelineTarget } from './timelineTooltip';
import chartStyles from '../core/Chart.module.css';
import styles from './ChartTimeline.module.css';

/** Em `calendar`, `Date` ou milissegundos desde a epoca; em `dayHours`, `Date` pela hora do dia ou a hora decimal. */
export type ChartTimelineTime = Date | number;
export type ChartTimelineScale = 'calendar' | 'dayHours';
export type ChartTimelineOverlap = 'stack' | 'overlay';
export type ChartTimelineDensity = 'sm' | 'md';
export type ChartTimelineSegmentLabels = 'auto' | 'visible' | 'hidden';
export type ChartTimelineSegmentLabelContent = 'duration' | 'label';
export type ChartTimelineLabelAlign = 'start' | 'center' | 'end';
export type ChartTimelineMarkerShape = 'line' | 'dot' | 'diamond';

export interface ChartTimelineRow {
  description?: string;
  /** Chave do grupo a que a linha pertence. */
  group?: string;
  /** Identifica a linha; o `label` pode repetir. */
  key: string;
  label: string;
}

export interface ChartTimelineGroup {
  key: string;
  label: string;
}

export interface ChartTimelineSeries extends SeriesAppearance {
  label: string;
}

export interface ChartTimelineSegment {
  end: ChartTimelineTime;
  /** Nome do intervalo, como a reuniao ou o responsavel. */
  label?: string;
  /** De 0 a 1. */
  progress?: number;
  /** `key` da linha. */
  row: string;
  /** `label` da serie. */
  series: string;
  start: ChartTimelineTime;
}

export interface ChartTimelineState {
  row: string;
  /** `label` da serie. */
  state: string;
  time: ChartTimelineTime;
}

export interface ChartTimelineRowBand {
  end: ChartTimelineTime;
  row: string;
  series: string;
  start: ChartTimelineTime;
}

export interface ChartTimelineBand {
  end: ChartTimelineTime;
  label?: string;
  series: string;
  start: ChartTimelineTime;
}

export interface ChartTimelineMarker {
  label?: string;
  row: string;
  series: string;
  shape?: ChartTimelineMarkerShape;
  time: ChartTimelineTime;
}

export interface ChartTimelineReferenceLine {
  intent?: SeriesIntent;
  label: string;
  time: ChartTimelineTime;
}

export interface ChartTimelineSummary {
  subtitle?: string;
  title: string;
}

export interface ChartTimelineProps extends ChartRootProps {
  /** Cor de tema que abre a paleta das séries sem cor nem intenção, como nos demais gráficos. */
  accent?: string;
  axisPosition?: 'top' | 'bottom';
  /** Faixas globais, hachuradas em todas as linhas, como o adicional noturno ou o fim de semana. */
  bands?: readonly ChartTimelineBand[];
  collapsedGroups?: readonly string[];
  collapsibleGroups?: boolean;
  /** Em largura estreita, o resumo vai para baixo do rotulo ou sai. */
  compactSummary?: 'below' | 'hidden';
  defaultCollapsedGroups?: readonly string[];
  defaultHiddenSeries?: readonly string[];
  density?: ChartTimelineDensity;
  /** Faixa fixa do eixo. Sem ela, do primeiro ao ultimo instante, arredondada a hora ou ao dia. */
  domain?: readonly [ChartTimelineTime, ChartTimelineTime];
  emptyMessage?: string;
  emptyRowLabel?: string;
  formatTick?: (time: Date) => string;
  formatTime?: (time: Date) => string;
  formatTooltipValue?: (durationMs: number) => string;
  /** Formato das duracoes no rotulo da barra, na descricao e na tabela. */
  formatValue?: (durationMs: number) => string;
  groups?: readonly ChartTimelineGroup[];
  hiddenSeries?: readonly string[];
  highlightOnHover?: boolean;
  legend?: 'top' | 'bottom' | 'none';
  legendAlign?: ChartLegendAlign;
  markers?: readonly ChartTimelineMarker[];
  mergeConsecutive?: boolean;
  /** Abaixo dessa largura, o desenho rola de lado dentro do conteiner, com rotulos e resumo fixos. */
  minPlotWidth?: number;
  onCollapsedGroupsChange?: (collapsed: readonly string[]) => void;
  onHiddenSeriesChange?: (hidden: readonly string[]) => void;
  /** Com ele, os intervalos viram botoes e entram no teclado. */
  onSegmentClick?: (segment: ChartTimelineSegment, row: ChartTimelineRow) => void;
  overlap?: ChartTimelineOverlap;
  /** Cores das series sem cor propria: lista em rotacao ou `{ base }`, que gera os tons. Vence o `accent`. */
  palette?: ChartPalette;
  referenceLines?: readonly ChartTimelineReferenceLine[];
  rowBands?: readonly ChartTimelineRowBand[];
  rowGap?: number;
  rowLabelWidth?: number | 'auto';
  /** Coluna de resumo, calculada sobre os intervalos visiveis da linha: a legenda filtra a leitura inteira. */
  rowSummary?: (row: ChartTimelineRow, segments: readonly ChartTimelineSegment[]) => ChartTimelineSummary | undefined;
  rows: readonly ChartTimelineRow[];
  segmentLabel?: ChartTimelineSegmentLabelContent;
  segmentLabelAlign?: ChartTimelineLabelAlign;
  segments?: readonly ChartTimelineSegment[];
  series: readonly ChartTimelineSeries[];
  showGrid?: boolean;
  showProgress?: boolean;
  showSegmentLabels?: ChartTimelineSegmentLabels;
  showTooltip?: boolean;
  /** Alternativa a `segments`: cada mudanca de estado vale ate a seguinte. */
  states?: readonly ChartTimelineState[];
  /** Fim do ultimo estado de cada linha, como o instante atual. Sem ele, o fim do eixo. */
  statesEnd?: ChartTimelineTime;
  timeScale?: ChartTimelineScale;
  title: string;
  xAxis?: AxisVisibility;
}

const DENSITY: Record<ChartTimelineDensity, { bar: number; row: number }> = {
  sm: { bar: 14, row: 26 },
  md: { bar: 20, row: 36 },
};

const ROW_WITH_SUMMARY_BELOW = 40;
/** Abaixo dessa altura de linha, titulo e subtitulo do resumo dividem a mesma linha. */
const STACKED_SUMMARY_ROW = 32;
const LANE_GAP = 3;
const GROUP_HEIGHT = 28;
const GROUP_BAR = 6;
const AXIS_HEIGHT = 24;
const TOP_ROOM = 6;
const LABELED_TOP_ROOM = 20;
const BOTTOM_ROOM = 6;
const TRACK_PADDING = 4;
const PLOT_START = 10;
const PLOT_END = 14;
/** O que rotulos e resumo ao lado pedem alem da largura minima do desenho; abaixo disso, o resumo muda de lugar. */
const SIDE_COLUMNS_ROOM = 200;
const LABEL_PADDING = 10;
const MIN_LABELED_BAR = 22;
const MIN_CLIP_MARK_BAR = 12;

interface SegmentShape {
  clippedEnd: boolean;
  clippedStart: boolean;
  height: number;
  row: ChartTimelineRow;
  segment: PlacedSegment;
  width: number;
  x: number;
  y: number;
}

/** O canto da ponta cortada fica reto: arredondado, o intervalo pareceria terminar ali. */
function cornersOf(clippedStart: boolean, clippedEnd: boolean, radius: number, closedEnd = true): CornerRadii {
  const start = clippedStart ? 0 : radius;
  const end = clippedEnd || !closedEnd ? 0 : radius;

  return [start, end, end, start];
}

function clipNote({ clippedEnd, clippedStart }: SegmentShape) {
  if (clippedStart && clippedEnd) {
    return 'começa antes e continua depois do eixo';
  }

  if (clippedStart) {
    return 'começa antes do eixo';
  }

  return clippedEnd ? 'continua depois do eixo' : undefined;
}

/** Seta para fora na ponta cortada. */
function clipMarkPath({ height, width, x, y }: SegmentShape, side: 'start' | 'end') {
  const tip = side === 'end' ? x + width - 3 : x + 3;
  const back = side === 'end' ? tip - 4 : tip + 4;

  return `M${back},${y + 3}L${tip},${y + height / 2}L${back},${y + height - 3}`;
}

/** Rotulo dentro da barra: `auto` so quando cabe inteiro; `visible` corta com reticencias o que nao cabe. */
function fitLabel(text: string, width: number, font: LabelFont, mode: ChartTimelineSegmentLabels) {
  if (mode === 'hidden') {
    return undefined;
  }

  if (measureLabel(text, font) + LABEL_PADDING <= width) {
    return text;
  }

  if (mode === 'auto' || width < MIN_LABELED_BAR) {
    return undefined;
  }

  return truncateToWidth(text, font, width - LABEL_PADDING) || undefined;
}

function hatch(color: string) {
  return `repeating-linear-gradient(45deg, ${color} 0 1.5px, var(--pl-color-surface-muted) 1.5px 4px)`;
}

/**
 * Barras de intervalo em linhas sobre um eixo de tempo continuo: quem fez o que, de quando ate quando. O desenho e
 * imagem nomeada pelo titulo; com `onSegmentClick`, um grupo cujos intervalos sao botoes de tabulacao movel. A leitura
 * medida a medida esta na visao em tabela.
 */
export function ChartTimeline({
  accent,
  axisPosition = 'top',
  bands,
  collapsedGroups,
  collapsibleGroups = true,
  compactSummary = 'below',
  defaultCollapsedGroups,
  defaultHiddenSeries,
  density = 'md',
  domain,
  emptyMessage = 'Sem dados no período',
  emptyRowLabel = 'Sem registro',
  formatTick,
  formatTime,
  formatTooltipValue,
  formatValue = formatDuration,
  groups = [],
  hiddenSeries,
  highlightOnHover = false,
  legend = 'top',
  legendAlign = 'left',
  markers,
  mergeConsecutive = true,
  minPlotWidth = 360,
  onCollapsedGroupsChange,
  onHiddenSeriesChange,
  onSegmentClick,
  overlap = 'stack',
  palette,
  referenceLines = [],
  rowBands,
  rowGap = 4,
  rowLabelWidth = 'auto',
  rowSummary,
  rows,
  segmentLabel = 'duration',
  segmentLabelAlign = 'center',
  segments,
  series,
  showGrid = true,
  showProgress = true,
  showSegmentLabels = 'auto',
  showTooltip = true,
  states,
  statesEnd,
  timeScale = 'calendar',
  title,
  xAxis = 'visible',
  ...root
}: ChartTimelineProps) {
  const titleId = useId();
  const hintId = useId();
  const patternPrefix = useId().replace(/[^\w-]/g, '');
  const outer = useChartMetrics();
  const plot = useChartMetrics();
  const seriesToggle = useSeriesToggle({ defaultHiddenSeries, hiddenSeries, onHiddenSeriesChange });
  // Recolher grupo e o mesmo controle da legenda: estado proprio ou do produto, pela chave.
  const groupToggle = useSeriesToggle({
    defaultHiddenSeries: defaultCollapsedGroups,
    hiddenSeries: collapsedGroups,
    onHiddenSeriesChange: onCollapsedGroupsChange,
  });
  const [target, setTarget] = useState<TimelineTarget | null>(null);
  const [focusedId, setFocusedId] = useState<number | null>(null);
  const [tabStopId, setTabStopId] = useState<number | null>(null);
  const [tableView, setTableView] = useState(false);
  const segmentNodes = useRef(new Map<number, SVGGElement>());
  const interactive = onSegmentClick !== undefined;

  const colors = useMemo(() => resolveSeriesColors(series, { accent, palette }), [accent, palette, series]);
  const colorByLabel = new Map<string, string>();
  series.forEach((entry, index) => {
    // Rotulo repetido e a mesma serie, como na legenda dos demais graficos: vale a primeira cor.
    if (!colorByLabel.has(entry.label)) {
      colorByLabel.set(entry.label, colors[index]);
    }
  });
  const colorOf = (label: string) => colorByLabel.get(label);
  const isVisible = (label: string) => colorByLabel.has(label) && !seriesToggle.isHidden(label);

  const data = useMemo(() => {
    const position = (time: ChartTimelineTime) => toPosition(time, timeScale);
    const allRowBands = (rowBands ?? []).flatMap((band): TimelineRowBand[] => {
      const range = toRange(band.start, band.end, timeScale);
      return range ? [{ ...range, row: band.row, series: band.series }] : [];
    });
    const allMarkers = (markers ?? []).flatMap((marker): TimelineMarker[] => {
      const markerPosition = position(marker.time);
      return Number.isFinite(markerPosition) ? [{ ...marker, position: markerPosition }] : [];
    });
    const given = states ? [] : toTimelineSegments(segments ?? [], timeScale);
    const instants = states
      ? [...states.map((state) => position(state.time)), ...(statesEnd === undefined ? [] : [position(statesEnd)])]
      : given.flatMap((segment) => [segment.start, segment.end]);
    const fixed = domain?.map(position);
    const range: [number, number] =
      fixed && fixed[0] < fixed[1]
        ? [fixed[0], fixed[1]]
        : autoDomain(
            [
              ...instants,
              ...allRowBands.flatMap((band) => [band.start, band.end]),
              ...allMarkers.map((marker) => marker.position),
            ],
            timeScale,
          );
    const allSegments = states
      ? toTimelineSegments(statesToSegments(states, statesEnd ?? range[1], mergeConsecutive, timeScale), timeScale)
      : given;

    return { allMarkers, allRowBands, allSegments, range };
  }, [domain, markers, mergeConsecutive, rowBands, segments, states, statesEnd, timeScale]);

  const { allMarkers, allRowBands, allSegments, range: timeRange } = data;
  const duration = (range: TimelineRange) => durationMs(range.start, range.end, timeScale);
  const formatInstant = (position: number) => {
    // O fim de um intervalo que cruzou a meia-noite e lido no dia seguinte.
    const time = timeScale === 'dayHours' && position > 24 ? position - 24 : position;
    return formatTime ? formatTime(toDate(time, timeScale)) : formatPosition(time, timeScale);
  };

  const visibleSegments = allSegments.filter((segment) => isVisible(segment.series));
  const visibleRowBands = allRowBands.filter((band) => isVisible(band.series));
  const visibleMarkers = allMarkers.filter((marker) => isVisible(marker.series));
  const visibleBands = (bands ?? []).flatMap((band) => {
    const range = toRange(band.start, band.end, timeScale);
    return range && isVisible(band.series) ? [{ ...band, ...range }] : [];
  });
  const segmentsByRow = groupBy(visibleSegments, (segment) => segment.row);
  const rowsWithSegments = new Set(allSegments.map((segment) => segment.row));
  const rowsWithData = new Set([
    ...rowsWithSegments,
    ...allRowBands.map((band) => band.row),
    ...allMarkers.map((marker) => marker.row),
  ]);
  const empty = rows.length === 0 || rowsWithData.size === 0;

  const compact = outer.width > 0 && outer.width < minPlotWidth + SIDE_COLUMNS_ROOM;
  const summaryMode = !rowSummary ? 'none' : compact ? compactSummary : 'right';
  const size = DENSITY[density];
  const rowHeight = summaryMode === 'below' ? Math.max(size.row, ROW_WITH_SUMMARY_BELOW) : size.row;
  const laneStep = size.bar + LANE_GAP;
  const { height: rowsHeight, items } = layoutTimeline({
    groupHeight: GROUP_HEIGHT,
    groups,
    isCollapsed: collapsibleGroups ? groupToggle.isHidden : () => false,
    laneStep,
    overlap,
    rowGap,
    rowHeight,
    rows,
    segments: visibleSegments,
  });

  const rowSegments = (row: ChartTimelineRow) =>
    [...(segmentsByRow.get(row.key) ?? [])].sort((a, b) => a.start - b.start || a.end - b.end);
  const orderedRows = rowsInDisplayOrder(rows, groups);
  const summaries = new Map(
    rowSummary
      ? orderedRows.map((row) => [row.key, rowSummary(row, rowSegments(row).map((segment) => segment.source))])
      : [],
  );

  const axisHeight = xAxis === 'hidden' ? 0 : AXIS_HEIGHT;
  const axisOnTop = axisPosition === 'top';
  const plotTop = axisOnTop ? axisHeight : 0;
  const labeledTop = referenceLines.length > 0 || visibleBands.some((band) => band.label);
  const rowsTop = plotTop + (labeledTop ? LABELED_TOP_ROOM : TOP_ROOM);
  const rowsBottom = rowsTop + rowsHeight;
  const svgHeight = rowsBottom + BOTTOM_ROOM + (axisOnTop ? 0 : axisHeight);
  const svgWidth = Math.max(plot.width, minPlotWidth);
  const x = linearScale({
    domain: { max: timeRange[1], min: timeRange[0] },
    nice: false,
    range: [PLOT_START, svgWidth - PLOT_END],
  });
  const xStart = x(timeRange[0]);
  const xEnd = x(timeRange[1]);
  const ticks = timeTicks(timeRange, timeScale, xEnd - xStart, formatTick);
  const font = outer.font;
  const radius = outer.radius;

  function shapeOf(segment: PlacedSegment, row: ChartTimelineRow, top: number): SegmentShape | undefined {
    const rawStart = x(segment.start);
    const rawEnd = x(segment.end);
    const start = Math.max(rawStart, xStart);
    const end = Math.min(rawEnd, xEnd);

    if (end <= start) {
      return undefined;
    }

    // Um pixel de folga de cada lado separa intervalos encostados.
    const gap = end - start > 4 ? 1 : 0;

    return {
      clippedEnd: rawEnd > xEnd + 0.5,
      clippedStart: rawStart < xStart - 0.5,
      height: size.bar,
      row,
      segment,
      width: Math.max(end - start - gap * 2, 2),
      x: start + gap,
      y: top + (rowHeight - size.bar) / 2 + segment.lane * laneStep,
    };
  }

  const shapesByRow = new Map(
    items.flatMap((item) =>
      item.kind === 'row'
        ? [
            [
              item.row.key,
              item.segments.flatMap((segment) => shapeOf(segment, item.row, rowsTop + item.y) ?? []),
            ] as const,
          ]
        : [],
    ),
  );
  const navigableRows = [...shapesByRow.values()].filter((shapes) => shapes.length > 0);
  const focusable = navigableRows.flat();
  const tabStop = focusable.some((shape) => shape.segment.id === tabStopId) ? tabStopId : focusable[0]?.segment.id;
  const focusedShape = focusable.find((shape) => shape.segment.id === focusedId);
  const emphasizedSeries = !highlightOnHover
    ? undefined
    : target?.kind === 'segment'
      ? target.segment.series
      : focusedShape?.segment.series;

  function focusSegment(shape: SegmentShape | undefined) {
    if (shape) {
      setTabStopId(shape.segment.id);
      segmentNodes.current.get(shape.segment.id)?.focus();
    }
  }

  function handleSegmentKeyDown(event: KeyboardEvent<SVGGElement>, shape: SegmentShape) {
    const rowIndex = navigableRows.findIndex((shapes) => shapes.includes(shape));
    const inRow = navigableRows[rowIndex];
    const index = inRow.indexOf(shape);

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSegmentClick?.(shape.segment.source, shape.row);
      return;
    }

    const nearestIn = (shapes: readonly SegmentShape[] | undefined) =>
      shapes && least(shapes, (candidate) => Math.abs(candidate.segment.start - shape.segment.start));
    const destinations: Record<string, SegmentShape | undefined> = {
      ArrowDown: nearestIn(navigableRows[rowIndex + 1]),
      ArrowLeft: inRow[index - 1],
      ArrowRight: inRow[index + 1],
      ArrowUp: nearestIn(navigableRows[rowIndex - 1]),
      End: inRow.at(-1),
      Home: inRow[0],
    };

    if (event.key in destinations) {
      event.preventDefault();
      focusSegment(destinations[event.key]);
    }
  }

  const describe = (shape: SegmentShape) => {
    const { row, segment } = shape;

    return [
      row.label,
      segment.series,
      segment.label !== segment.series ? segment.label : undefined,
      `${formatInstant(segment.start)} a ${formatInstant(segment.end)}`,
      formatValue(duration(segment)),
      showProgress && segment.progress !== undefined ? `${formatPercent(segment.progress)} concluído` : undefined,
      clipNote(shape),
    ]
      .filter(Boolean)
      .join(', ');
  };

  function renderSegment(shape: SegmentShape) {
    const { segment } = shape;
    const id = segment.id;
    const color = colorOf(segment.series) ?? 'currentColor';
    const onColor = textColorOn(color);
    const progress = showProgress ? segment.progress : undefined;
    const text = fitLabel(
      segmentLabel === 'label' ? (segment.label ?? segment.series) : formatValue(duration(segment)),
      shape.width,
      font,
      showSegmentLabels,
    );
    const anchor = { center: 'middle', end: 'end', start: 'start' } as const;
    const textX =
      segmentLabelAlign === 'start'
        ? shape.x + 5
        : segmentLabelAlign === 'end'
          ? shape.x + shape.width - 5
          : shape.x + shape.width / 2;
    const overFill = progress === undefined || (textX - shape.x) / shape.width <= progress;

    return (
      <g
        aria-label={describe(shape)}
        className={`${styles.segment} ${interactive ? styles.clickable : ''} ${
          emphasizedSeries !== undefined && emphasizedSeries !== segment.series ? styles.dimmed : ''
        }`}
        key={id}
        onBlur={interactive ? () => setFocusedId(null) : undefined}
        onClick={
          onSegmentClick
            ? () => {
                setTabStopId(id);
                onSegmentClick(segment.source, shape.row);
              }
            : undefined
        }
        onFocus={
          interactive
            ? () => {
                setFocusedId(id);
                setTabStopId(id);
              }
            : undefined
        }
        onKeyDown={interactive ? (event) => handleSegmentKeyDown(event, shape) : undefined}
        onMouseEnter={() => setTarget({ clip: clipNote(shape), kind: 'segment', row: shape.row, segment })}
        onMouseLeave={() => setTarget(null)}
        ref={
          interactive
            ? (node) => {
                if (node) {
                  segmentNodes.current.set(id, node);
                } else {
                  segmentNodes.current.delete(id);
                }
              }
            : undefined
        }
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? (id === tabStop ? 0 : -1) : undefined}
      >
        <path
          className={overlap === 'overlay' ? styles.barOverlay : undefined}
          d={roundedBarPath(
            shape.x,
            shape.y,
            shape.width,
            shape.height,
            cornersOf(shape.clippedStart, shape.clippedEnd, radius),
          )}
          fill={color}
          fillOpacity={progress === undefined ? undefined : 0.3}
        />
        {progress !== undefined && progress > 0 && (
          <path
            d={roundedBarPath(
              shape.x,
              shape.y,
              Math.max(shape.width * progress, 2),
              shape.height,
              cornersOf(shape.clippedStart, shape.clippedEnd, radius, progress >= 1),
            )}
            fill={color}
          />
        )}
        {shape.width >= MIN_CLIP_MARK_BAR &&
          (['start', 'end'] as const)
            .filter((side) => (side === 'start' ? shape.clippedStart : shape.clippedEnd))
            .map((side) => (
              <path className={styles.clipMark} d={clipMarkPath(shape, side)} key={side} stroke={onColor} />
            ))}
        {text !== undefined && (
          <text
            className={styles.segmentLabel}
            dominantBaseline="central"
            fill={overFill ? onColor : 'var(--pl-color-text)'}
            textAnchor={anchor[segmentLabelAlign]}
            x={textX}
            y={shape.y + shape.height / 2}
          >
            {text}
          </text>
        )}
      </g>
    );
  }

  function renderRow(item: Extract<TimelineItem, { kind: 'row' }>) {
    const top = rowsTop + item.y;
    const { row } = item;
    const trackY = top + (rowHeight - size.bar) / 2 - TRACK_PADDING;
    const trackHeight = size.bar + (item.laneCount - 1) * laneStep + TRACK_PADDING * 2;

    return (
      <g aria-hidden="true" key={row.key}>
        <rect
          className={styles.track}
          height={trackHeight}
          rx={TRACK_PADDING}
          width={xEnd - xStart}
          x={xStart}
          y={trackY}
        />
        {visibleRowBands
          .filter((band) => band.row === row.key)
          .map((band, index) => {
            const start = Math.max(x(band.start), xStart);
            const end = Math.min(x(band.end), xEnd);

            return end > start ? (
              <rect
                fill={colorOf(band.series)}
                height={trackHeight}
                key={index}
                rx={TRACK_PADDING}
                width={end - start}
                x={start}
                y={trackY}
              />
            ) : null;
          })}
        {!rowsWithData.has(row.key) && (
          <text className={styles.emptyRowText} dominantBaseline="central" x={xStart + 8} y={top + rowHeight / 2}>
            {emptyRowLabel}
          </text>
        )}
        <rect
          className={styles.hoverArea}
          height={item.height}
          onMouseEnter={() =>
            setTarget({
              empty: !rowsWithSegments.has(row.key),
              kind: 'row',
              row,
              rowBands: visibleRowBands.filter((band) => band.row === row.key),
              segments: segmentsByRow.get(row.key) ?? [],
            })
          }
          onMouseLeave={() => setTarget(null)}
          width={svgWidth}
          x={0}
          y={top}
        />
      </g>
    );
  }

  function renderMarker(marker: TimelineMarker, { height, row, y }: Extract<TimelineItem, { kind: 'row' }>) {
    if (marker.position < timeRange[0] || marker.position > timeRange[1]) {
      return null;
    }

    const color = colorOf(marker.series);
    const top = rowsTop + y;
    const cx = x(marker.position);
    const cy = top + rowHeight / 2;
    const shape = marker.shape ?? 'line';

    return (
      <g key={`${row.key}-${allMarkers.indexOf(marker)}`}>
        {shape === 'line' && (
          <rect
            className={styles.marker}
            fill={color}
            height={size.bar + 6}
            rx={1}
            width={2}
            x={cx - 1}
            y={cy - size.bar / 2 - 3}
          />
        )}
        {shape === 'dot' && <circle className={styles.marker} cx={cx} cy={cy} fill={color} r={4} />}
        {shape === 'diamond' && (
          <path
            className={styles.marker}
            d={`M${cx},${cy - 6}L${cx + 6},${cy}L${cx},${cy + 6}L${cx - 6},${cy}Z`}
            fill={color}
          />
        )}
        <rect
          className={styles.hoverArea}
          height={height}
          onMouseEnter={() => setTarget({ kind: 'marker', marker, row })}
          onMouseLeave={() => setTarget(null)}
          width={10}
          x={cx - 5}
          y={top}
        />
      </g>
    );
  }

  function renderGroupBar(item: Extract<TimelineItem, { kind: 'group' }>) {
    const top = rowsTop + item.y;
    const barY = top + item.height / 2 - GROUP_BAR / 2;
    const drawn = item.segments.length > 0;
    const start = drawn ? Math.max(x(min(item.segments, (segment) => segment.start) ?? 0), xStart) : 0;
    const end = drawn ? Math.min(x(max(item.segments, (segment) => segment.end) ?? 0), xEnd) : 0;
    const withProgress = item.segments.filter((segment) => segment.progress !== undefined);
    const total = sum(withProgress, duration);
    const done = sum(withProgress, (segment) => duration(segment) * (segment.progress ?? 0));
    const width = Math.max(end - start, 2);

    return (
      <g aria-hidden="true" key={`group-${item.group.key}`}>
        {drawn && end > start && (
          <g className={styles.passThrough}>
            <rect className={styles.groupBar} height={GROUP_BAR} rx={GROUP_BAR / 2} width={width} x={start} y={barY} />
            {showProgress && done > 0 && total > 0 && (
              <rect
                className={styles.groupProgress}
                height={GROUP_BAR}
                rx={GROUP_BAR / 2}
                width={Math.max((width * done) / total, 2)}
                x={start}
                y={barY}
              />
            )}
          </g>
        )}
        <rect
          className={styles.hoverArea}
          height={item.height}
          onMouseEnter={() =>
            setTarget({
              collapsed: item.collapsed,
              group: item.group,
              kind: 'group',
              rowCount: item.rows.length,
              segments: item.segments,
            })
          }
          onMouseLeave={() => setTarget(null)}
          width={svgWidth}
          x={0}
          y={top}
        />
      </g>
    );
  }

  const tickAnchor = (position: number, label: string) => {
    const half = measureLabel(label, font) / 2;
    return position - half < 0 ? 'start' : position + half > svgWidth ? 'end' : 'middle';
  };
  const axisLineY = axisOnTop ? axisHeight - 0.5 : rowsBottom + BOTTOM_ROOM + 0.5;

  const svg = (
    <svg
      aria-describedby={interactive ? hintId : undefined}
      aria-labelledby={titleId}
      className={styles.canvas}
      height={svgHeight}
      role={interactive ? 'group' : 'img'}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      width={svgWidth}
    >
      <defs>
        {visibleBands.map((band, index) => (
          <pattern
            height={6}
            id={`${patternPrefix}-${index}`}
            key={index}
            patternTransform="rotate(45)"
            patternUnits="userSpaceOnUse"
            width={6}
          >
            <line className={styles.hatchLine} stroke={colorOf(band.series)} x1={0} x2={0} y1={0} y2={6} />
          </pattern>
        ))}
      </defs>

      {items.map((item) => (item.kind === 'row' ? renderRow(item) : null))}

      <g aria-hidden="true" className={styles.passThrough}>
        {visibleBands.map((band, index) => {
          const start = Math.max(x(band.start), xStart);
          const end = Math.min(x(band.end), xEnd);

          if (end <= start) {
            return null;
          }

          return (
            <g key={index}>
              <rect
                fill={`url(#${patternPrefix}-${index})`}
                height={rowsBottom + BOTTOM_ROOM - plotTop}
                width={end - start}
                x={start}
                y={plotTop}
              />
              {band.label && measureLabel(band.label, font) + 8 <= end - start && (
                <text className={styles.bandLabel} x={start + 4} y={rowsTop - 7}>
                  {band.label}
                </text>
              )}
            </g>
          );
        })}
      </g>

      {showGrid && (
        <g className={styles.passThrough} transform={`translate(0 ${plotTop})`}>
          <Grid
            length={rowsBottom + BOTTOM_ROOM - plotTop}
            lines={ticks.map((tick) => Math.round(x(tick.position)) + 0.5)}
            orientation="vertical"
          />
        </g>
      )}

      {items.map((item) => (item.kind === 'group' ? renderGroupBar(item) : null))}

      <g>{[...shapesByRow.values()].flat().map(renderSegment)}</g>

      <g aria-hidden="true">
        {items.flatMap((item) =>
          item.kind === 'row'
            ? visibleMarkers.filter((marker) => marker.row === item.row.key).map((marker) => renderMarker(marker, item))
            : [],
        )}
      </g>

      <g aria-hidden="true" className={styles.passThrough}>
        {referenceLines.map((line, index) => {
          const position = toPosition(line.time, timeScale);

          if (!(position >= timeRange[0] && position <= timeRange[1])) {
            return null;
          }

          const lineX = Math.round(x(position)) + 0.5;
          const toTheRight = lineX + 4 + measureLabel(line.label, font) <= svgWidth - 2;
          const color = line.intent ? INTENT_TOKENS[line.intent] : 'var(--pl-color-text-secondary)';

          return (
            <g key={index}>
              <line
                className={styles.referenceLine}
                stroke={color}
                x1={lineX}
                x2={lineX}
                y1={rowsTop - 16}
                y2={rowsBottom + BOTTOM_ROOM}
              />
              <text
                className={styles.referenceLabel}
                textAnchor={toTheRight ? 'start' : 'end'}
                x={toTheRight ? lineX + 4 : lineX - 4}
                y={rowsTop - 7}
              >
                {line.label}
              </text>
            </g>
          );
        })}
      </g>

      {xAxis !== 'hidden' && (
        <g aria-hidden="true" className={`${styles.passThrough} ${xAxis === 'onHover' ? styles.axisOnHover : ''}`}>
          <line className={chartStyles.axisLine} x1={xStart} x2={xEnd} y1={axisLineY} y2={axisLineY} />
          {ticks.map((tick) => (
            <text
              className={chartStyles.axisLabel}
              dominantBaseline={axisOnTop ? 'auto' : 'hanging'}
              key={tick.position}
              textAnchor={tickAnchor(x(tick.position), tick.label)}
              x={x(tick.position)}
              y={axisOnTop ? axisLineY - CHART_LABEL_OFFSET : axisLineY + CHART_LABEL_OFFSET}
            >
              {tick.label}
            </text>
          ))}
        </g>
      )}

      {focusedShape && (
        <rect
          aria-hidden="true"
          className={styles.focusRing}
          height={focusedShape.height + 6}
          rx={radius}
          width={focusedShape.width + 6}
          x={focusedShape.x - 3}
          y={focusedShape.y - 3}
        />
      )}
    </svg>
  );

  const tooltip = timelineTooltip(target, {
    colorOf,
    duration,
    emptyRowLabel,
    formatDuration: formatTooltipValue ?? formatValue,
    formatInstant,
    seriesOrder: series.map((entry) => entry.label),
    showProgress,
  });

  const scrolls = svgWidth > plot.width + 1;
  const labelsClass =
    rowLabelWidth !== 'auto'
      ? styles.labelsFixed
      : compact
        ? summaryMode === 'below'
          ? styles.labelsCompactWithSummary
          : styles.labelsCompact
        : '';
  const columnStyle = { gap: rowGap, paddingTop: rowsTop };

  const body = (
    <div className={styles.body}>
      <TimelineLabels
        className={labelsClass}
        collapsibleGroups={collapsibleGroups}
        items={items}
        onToggleGroup={groupToggle.toggle}
        style={{ ...columnStyle, width: rowLabelWidth === 'auto' ? undefined : rowLabelWidth }}
        summaries={summaryMode === 'below' ? summaries : undefined}
      />

      <div
        aria-label={scrolls && !interactive ? `${title}, área rolável de lado` : undefined}
        className={styles.scroll}
        ref={plot.ref}
        role={scrolls && !interactive ? 'region' : undefined}
        tabIndex={scrolls && !interactive ? 0 : undefined}
      >
        {plot.width > 0 && (showTooltip ? <ChartTooltip {...tooltip}>{svg}</ChartTooltip> : svg)}
      </div>

      {summaryMode === 'right' && (
        <TimelineSummaries
          inline={rowHeight < STACKED_SUMMARY_ROW}
          items={items}
          style={columnStyle}
          summaries={summaries}
        />
      )}
    </div>
  );

  function tableRows(): TimelineTableRow[] {
    const entry = (seriesLabel: string, name: string, range: TimelineRange, progress?: number): TimelineTableEntry => ({
      color: colorOf(seriesLabel) ?? 'transparent',
      duration: formatValue(duration(range)),
      end: formatInstant(range.end),
      name,
      progress: progress === undefined ? undefined : formatPercent(progress),
      start: formatInstant(range.start),
    });

    return orderedRows.map((row) => ({
      description: row.description,
      entries: [
        ...visibleRowBands
          .filter((band) => band.row === row.key)
          .map((band) => entry(band.series, `${band.series} (referência)`, band)),
        ...rowSegments(row).map((segment) =>
          entry(
            segment.series,
            segment.label && segment.label !== segment.series ? `${segment.series}: ${segment.label}` : segment.series,
            segment,
            segment.progress,
          ),
        ),
        ...visibleMarkers
          .filter((marker) => marker.row === row.key)
          .map((marker) => ({
            color: colorOf(marker.series) ?? 'transparent',
            duration: 'instante',
            end: '—',
            name: marker.label ? `${marker.series}: ${marker.label}` : marker.series,
            start: formatInstant(marker.position),
          })),
      ],
      key: row.key,
      label: row.label,
      summary: summaries.get(row.key),
    }));
  }

  const hatchedSeries = new Set((bands ?? []).map((band) => band.series));
  const legendView = legend !== 'none' && series.length >= 2 && (
    <ChartLegend
      align={legendAlign}
      entries={series.map((entry, index) => ({
        // A faixa global e hachurada no desenho, e a amostra repete a hachura.
        color: hatchedSeries.has(entry.label) ? hatch(colors[index]) : colors[index],
        hidden: seriesToggle.isHidden(entry.label),
        label: entry.label,
      }))}
      onToggle={seriesToggle.toggle}
      position={legend}
    />
  );
  const { figureProps, titleClassName } = chartRoot(root, { figure: `${styles.figure} ${chartStyles.figure}`, title: `${styles.title} ${chartStyles.title}` });

  return (
    <figure {...figureProps}>
      <figcaption className={styles.header}>
        <span className={titleClassName} id={titleId}>
          {title}
        </span>
        {!empty && (
          <Button
            aria-pressed={tableView}
            onClick={() => setTableView((current) => !current)}
            size="sm"
            variant="secondary"
          >
            Ver como tabela
          </Button>
        )}
      </figcaption>

      {interactive && (
        <span className={styles.visuallyHidden} id={hintId}>
          Use as setas para percorrer os intervalos.
        </span>
      )}

      {legend === 'top' && legendView}

      <div className={styles.plot} ref={outer.ref}>
        {empty ? (
          <div className={styles.empty}>
            <EmptyState icon={<IconChartBar />} size="sm" title={emptyMessage} />
          </div>
        ) : outer.width === 0 ? null : tableView ? (
          <ChartTimelineTable
            emptyRowLabel={emptyRowLabel}
            rows={tableRows()}
            showProgress={showProgress && visibleSegments.some((segment) => segment.progress !== undefined)}
            title={title}
          />
        ) : (
          body
        )}
      </div>

      {legend === 'bottom' && legendView}
    </figure>
  );
}

interface TimelineLabelsProps {
  className: string;
  collapsibleGroups: boolean;
  items: readonly TimelineItem[];
  onToggleGroup: (groupKey: string) => void;
  style: CSSProperties;
  /** Resumo abaixo do rotulo, na largura estreita. */
  summaries?: ReadonlyMap<string, ChartTimelineSummary | undefined>;
}

/** Coluna dos rotulos, em texto, cada item na altura da sua linha no desenho. O cabecalho do grupo recolhe o grupo. */
function TimelineLabels({ className, collapsibleGroups, items, onToggleGroup, style, summaries }: TimelineLabelsProps) {
  return (
    <div className={`${styles.labels} ${className}`} style={style}>
      {items.map((item) => {
        if (item.kind === 'group') {
          const content = (
            <>
              {collapsibleGroups && (
                <IconChevronDown className={`${styles.chevron} ${item.collapsed ? styles.chevronCollapsed : ''}`} />
              )}
              <span className={styles.groupName}>{item.group.label}</span>
              <span className={styles.groupCount}>({item.rows.length})</span>
            </>
          );

          return (
            <div className={styles.groupLabel} key={`group-${item.group.key}`} style={{ height: item.height }}>
              {collapsibleGroups ? (
                <button
                  aria-expanded={!item.collapsed}
                  className={styles.groupButton}
                  onClick={() => onToggleGroup(item.group.key)}
                  type="button"
                >
                  {content}
                </button>
              ) : (
                <span className={styles.groupText}>{content}</span>
              )}
            </div>
          );
        }

        const summary = summaries?.get(item.row.key);

        return (
          <div
            className={`${styles.rowLabel} ${item.child ? styles.childLabel : ''}`}
            key={item.row.key}
            style={{ height: item.height }}
          >
            <span className={styles.labelLine}>
              <span className={styles.labelText} title={item.row.label}>
                {item.row.label}
              </span>{' '}
              {item.row.description && <span className={styles.labelDescription}>{item.row.description}</span>}
            </span>
            {summary && (
              <span className={styles.labelSummary}>
                {summary.subtitle ? `${summary.title} · ${summary.subtitle}` : summary.title}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface TimelineSummariesProps {
  /** Titulo e subtitulo na mesma linha, quando ela e baixa demais para empilhar os dois. */
  inline: boolean;
  items: readonly TimelineItem[];
  style: CSSProperties;
  summaries: ReadonlyMap<string, ChartTimelineSummary | undefined>;
}

function TimelineSummaries({ inline, items, style, summaries }: TimelineSummariesProps) {
  return (
    <div className={styles.summary} style={style}>
      {items.map((item) => {
        const summary = item.kind === 'row' ? summaries.get(item.row.key) : undefined;

        return (
          <div
            className={`${styles.summaryItem} ${inline ? styles.summaryInline : ''}`}
            key={item.kind === 'row' ? item.row.key : `group-${item.group.key}`}
            style={{ height: item.height }}
          >
            {summary && (
              <>
                <span className={styles.summaryTitle}>{summary.title}</span>
                {summary.subtitle && <span className={styles.summarySubtitle}>{summary.subtitle}</span>}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
