import { sum } from 'd3-array';
import { geoPath, type GeoProjection } from 'd3-geo';
import { scaleSqrt } from 'd3-scale';
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type SyntheticEvent } from 'react';
import { Button } from '../../actions/Button';
import { EmptyState } from '../../feedback/EmptyState';
import { IconChartBar } from '../../icons';
import { ChartTooltip, type ChartTooltipProps, type ChartTooltipRow } from '../ChartTooltip';
import {
  chartRoot,
  isDevelopment,
  measureLabel,
  NO_DATA_FILL,
  NO_DATA_HATCH,
  NoDataHatch,
  useChartMetrics,
  useSeriesToggle,
  type ChartHeight,
  type ChartLegendAlign,
  type ChartRootProps,
  type LabelFont,
  type MarkVisibility,
  type NoDataStyle,
} from '../core';
import { resolveSeriesColors, type ChartPalette, type SeriesAppearance } from '../palette';
import { formatarNumero, formatarPercentual } from '../../../utils/formatters';
import { ChartMapLegend } from './ChartMapLegend';
import { ChartMapTable, type MapTableMarkerRow, type MapTableRegionRow } from './ChartMapTable';
import {
  fitProjection,
  naturalHeight,
  projectedBounds,
  projectedParts,
  regionsOf,
  type ChartMapFeature,
  type ChartMapFeatureCollection,
  type MapRegion,
} from './mapGeometry';
import { CALLOUT_GAP, calloutWidth, planLabels, type LabelCandidate, type LabelPlan } from './mapLabels';
import { buildColorScale, type ChartColorScale, type ColorScale } from '../scales/colorScale';
import type { Point, Ring } from './polylabel';
import styles from './ChartMap.module.css';

export interface ChartMapRegionDatum {
  /** `id` da categoria, na escala categorica. */
  category?: string;
  /** Casa com o identificador da feicao, lido por `featureIdKey`. */
  id: string;
  value?: number | null;
}

export interface ChartMapMarker {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  value: number;
}

export interface ChartMapMarkerSeries extends SeriesAppearance {
  id: string;
  label: string;
  points: readonly ChartMapMarker[];
}

/** Argumento de `onRegionClick`. */
export interface ChartMapRegion {
  category: string | null;
  feature: ChartMapFeature;
  id: string;
  name: string;
  value: number | null;
}

/** Argumento de `onMarkerClick`. */
export interface ChartMapMarkerEvent {
  id: string;
  /** `id` da serie. */
  series: string;
  value: number;
}

export type ChartMapLegendPosition = 'top' | 'bottom' | 'right' | 'none';

export interface ChartMapProps extends ChartRootProps {
  /** Cor de tema que abre a paleta das categorias e dos marcadores, como nos demais gráficos. */
  accent?: string;
  colorScale?: ChartColorScale;
  data?: readonly ChartMapRegionDatum[];
  /** Series ocultas de inicio, no modo nao controlado: categorias e series de marcadores, pelo `id`. */
  defaultHiddenSeries?: readonly string[];
  emptyMessage?: string;
  /** Caminho do identificador na feicao, como `properties.sigla`. E por ele que o dado casa. */
  featureIdKey?: string;
  /** Caminho do texto curto do rotulo no desenho. Sem ele, o identificador, como a sigla da UF. */
  featureLabelKey?: string;
  /** Caminho do nome exibido no balao, na tabela e na descricao. */
  featureNameKey?: string;
  /** Ids que o enquadramento abraca. As demais regioes ficam em cinza, como contexto, sem interacao. */
  focus?: readonly string[];
  formatPercent?: (ratio: number) => string;
  formatTooltipValue?: (value: number) => string;
  formatValue?: (value: number) => string;
  /** Fronteiras em GeoJSON, fornecidas pelo produto, que responde pela licenca delas. */
  geometry: ChartMapFeatureCollection;
  /** Altura maxima em px, ou `fill`. Na largura estreita, a altura encolhe ate a proporcao da geometria. */
  height?: ChartHeight;
  /** Faixas ocultas pelo indice, na escala por classes (controlado). */
  hiddenClasses?: readonly number[];
  /** Categorias e series de marcadores desligadas, pelo `id` (controlado). */
  hiddenSeries?: readonly string[];
  /** Abaixo de 640 px de largura, `right` cai para `bottom`. */
  legend?: ChartMapLegendPosition;
  legendAlign?: ChartLegendAlign;
  /** Raio maximo do marcador, em px. O raio cresce pela raiz do valor, entao a area e proporcional. */
  markerMaxSize?: number;
  markerMinSize?: number;
  markers?: readonly ChartMapMarkerSeries[];
  markerValueLabel?: string;
  noDataLabel?: string;
  noDataStyle?: NoDataStyle;
  onHiddenClassesChange?: (hidden: readonly number[]) => void;
  onHiddenSeriesChange?: (hidden: readonly string[]) => void;
  /** Regiao sob o ponteiro ou o foco, para paineis vizinhos. */
  onHoverRegion?: (id: string | null) => void;
  /** Com ele, os marcadores viram botoes e entram no teclado. */
  onMarkerClick?: (marker: ChartMapMarkerEvent) => void;
  /** Com ele, as regioes viram botoes e entram no teclado. */
  onRegionClick?: (region: ChartMapRegion) => void;
  /** Cores das series sem cor propria: lista em rotacao ou `{ base }`, que gera os tons. Vence o `accent`. */
  palette?: ChartPalette;
  regionLabels?: MarkVisibility;
  selectedRegion?: string | null;
  showDataLabels?: MarkVisibility;
  /** Parte do total no balao e na tabela. So faz sentido em grandeza somavel. */
  showShare?: boolean;
  showTableToggle?: boolean;
  showTooltip?: boolean;
  /** O rotulo que nao cabe na regiao vai para uma coluna junto ao desenho, com linha guia, ou some. */
  smallRegionLabels?: 'callout' | 'hidden';
  /** Linha sob o titulo, como o total do nivel. */
  subtitle?: string;
  title: string;
  valueLabel?: string;
}

interface RegionEntry {
  category: string | null;
  /** Nome, valor e posicao, para o leitor de tela. */
  description: string;
  /** Cor da escala; `undefined` sem dado. */
  fill: string | undefined;
  hidden: boolean;
  key: string | undefined;
  rank: number | undefined;
  region: MapRegion;
  value: number | null;
  /** Valor formatado, ou a categoria; `undefined` sem dado. */
  valueText: string | undefined;
}

interface PlacedMarker {
  color: string;
  key: string;
  point: ChartMapMarker;
  radius: number;
  series: ChartMapMarkerSeries;
  x: number;
  y: number;
}

type Target = { kind: 'region'; entry: RegionEntry } | { kind: 'marker'; marker: PlacedMarker };

const DEFAULT_SCALE: ChartColorScale = { type: 'sequential' };
const NARROW = 640;
const MIN_HEIGHT = 160;
const SIDE_LEGEND_MAX = 240;
const HIDDEN_FILL = 'var(--pl-color-surface-subtle)';

const defaultPercent = (ratio: number) => formatarPercentual(ratio, { casasDecimais: 1 });
const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** Traco mais fino quanto mais regioes: nos municipios, a borda inteira escurecia o mapa. */
function strokeWidthFor(count: number) {
  return count > 1000 ? 0.25 : count > 100 ? 0.5 : 0.8;
}

interface MapLayout {
  height: number;
  plan: LabelPlan;
  projection: GeoProjection;
}

interface LayoutInput {
  all: readonly MapRegion[];
  callouts: boolean;
  /** Em `fill`, a altura e a do conteiner, e nao a que a geometria pede. */
  fixedHeight: boolean;
  font: LabelFont;
  labels: boolean;
  maxHeight: number;
  target: readonly MapRegion[];
  valueOf: (region: MapRegion) => string | undefined;
  width: number;
}

/**
 * Enquadra e rotula. A altura e a que a geometria pede na largura, ate a maxima, sem faixa vazia. Quando algum rotulo
 * vai para a coluna, o desenho cede a largura dela e e enquadrado e rotulado de novo.
 */
function layoutMap({ all, callouts, fixedHeight, font, labels, maxHeight, target, valueOf, width }: LayoutInput): MapLayout {
  const measure = (text: string) => measureLabel(text, font);
  const lineHeight = font.size + 1;

  const pass = (drawingWidth: number): MapLayout => {
    const height = fixedHeight
      ? maxHeight
      : Math.round(Math.min(maxHeight, Math.max(MIN_HEIGHT, naturalHeight(target, drawingWidth))));
    const projection = fitProjection(target, all, drawingWidth, height);

    if (!labels) {
      return { height, plan: { callouts: [], inside: [] }, projection };
    }

    const candidates = target.map((region): LabelCandidate => {
      let parts: Ring[][] | undefined;

      return {
        bounds: projectedBounds(region, projection),
        id: region.id,
        get parts() {
          parts ??= projectedParts(region, projection);
          return parts;
        },
        title: region.label,
        value: valueOf(region),
      };
    });

    return {
      height,
      plan: planLabels(candidates, {
        callouts,
        calloutStep: font.lineHeight,
        height,
        lineHeight,
        measure,
        right: drawingWidth,
      }),
      projection,
    };
  };

  const first = pass(width);

  if (first.plan.callouts.length === 0) {
    return first;
  }

  const gutter = Math.ceil(Math.max(...first.plan.callouts.map((label) => calloutWidth(label, measure))) + CALLOUT_GAP + 4);

  return pass(Math.max(width - gutter, width / 2));
}

/**
 * Regioes pintadas pelo valor e marcadores por coordenada, sobre a geometria GeoJSON que o produto fornece. O desenho
 * e imagem nomeada pelo titulo; com `onRegionClick` ou `onMarkerClick`, um grupo cujas marcas sao botoes de tabulacao
 * movel. A leitura completa, com busca, esta na visao em tabela.
 */
export function ChartMap({
  accent,
  colorScale = DEFAULT_SCALE,
  data = [],
  defaultHiddenSeries,
  emptyMessage = 'Sem dados',
  featureIdKey = 'id',
  featureLabelKey,
  featureNameKey = 'properties.name',
  focus,
  formatPercent = defaultPercent,
  formatTooltipValue,
  formatValue = formatarNumero,
  geometry,
  height = 440,
  hiddenClasses,
  hiddenSeries,
  legend = 'bottom',
  legendAlign = 'center',
  markerMaxSize = 20,
  markerMinSize = 3,
  markers,
  markerValueLabel = 'Valor',
  noDataLabel = 'Sem dado',
  noDataStyle = 'hatch',
  onHiddenClassesChange,
  onHiddenSeriesChange,
  onHoverRegion,
  onMarkerClick,
  onRegionClick,
  palette,
  regionLabels = 'visible',
  selectedRegion,
  showDataLabels = 'hidden',
  showShare = false,
  showTableToggle = true,
  showTooltip = true,
  smallRegionLabels = 'callout',
  subtitle,
  title,
  valueLabel = 'Valor',
  ...root
}: ChartMapProps) {
  const titleId = useId();
  const summaryId = useId();
  const hatchId = `${useId().replace(/[^\w-]/g, '')}-hatch`;
  const outer = useChartMetrics();
  const plot = useChartMetrics();
  const svgRef = useRef<SVGSVGElement>(null);
  const seriesToggle = useSeriesToggle({ defaultHiddenSeries, hiddenSeries, onHiddenSeriesChange });
  // As faixas sao indices; a legenda liga e desliga por texto.
  const hiddenClassKeys = useMemo(() => hiddenClasses?.map(String), [hiddenClasses]);
  const classToggle = useSeriesToggle({
    hiddenSeries: hiddenClassKeys,
    onHiddenSeriesChange: onHiddenClassesChange && ((hidden) => onHiddenClassesChange(hidden.map(Number))),
  });
  const [target, setTarget] = useState<Target | null>(null);
  const [focusedMark, setFocusedMark] = useState<string | null>(null);
  const [tabStopMark, setTabStopMark] = useState<string | null>(null);
  const [highlightedKey, setHighlightedKey] = useState<string | null>(null);
  const [tableView, setTableView] = useState(false);

  const regions = useMemo(
    () => regionsOf(geometry, { idKey: featureIdKey, labelKey: featureLabelKey, nameKey: featureNameKey }),
    [featureIdKey, featureLabelKey, featureNameKey, geometry],
  );
  // A chave textual mantem o recorte memorizado enquanto os ids nao mudam, mesmo com outra lista a cada desenho.
  const focusKey = (focus ?? []).join('\u0000');
  const { context, inPlay } = useMemo(() => {
    const ids = new Set(focusKey ? focusKey.split('\u0000') : []);
    const focused = regions.filter((region) => ids.has(region.id));

    return focused.length > 0
      ? { context: regions.filter((region) => !ids.has(region.id)), inPlay: focused }
      : { context: [], inPlay: regions };
  }, [focusKey, regions]);

  const legendToggle = colorScale.type === 'categorical' ? seriesToggle : classToggle;
  const isLegendHidden = legendToggle.isHidden;

  // Memorizado contra o ponteiro: com milhares de municipios, refazer escala e descricoes a cada passagem pesaria.
  const { entries, ranked, scale } = useMemo(() => {
    const datumById = new Map<string, ChartMapRegionDatum>();
    data.forEach((datum) => {
      if (!datumById.has(datum.id)) {
        datumById.set(datum.id, datum);
      }
    });

    const read = inPlay.map((region) => {
      const datum = datumById.get(region.id);
      const value = datum?.value;

      return {
        category: datum?.category ?? null,
        region,
        value: typeof value === 'number' && Number.isFinite(value) ? value : null,
      };
    });
    const mapScale = buildColorScale(colorScale, read.flatMap((item) => item.value ?? []), formatValue, accent);
    const withValue = read.filter((item) => item.value !== null).sort((a, b) => b.value! - a.value!);
    const rankOf = new Map(withValue.map((item, index) => [item.region.id, index + 1]));
    const all = read.map((item): RegionEntry => {
      const key = mapScale.keyOf(item);
      const rank = rankOf.get(item.region.id);
      const valueText = mapScale.numeric
        ? item.value === null
          ? undefined
          : formatValue(item.value)
        : mapScale.labelOf(item);
      const description =
        colorScale.type === 'none'
          ? item.region.name
          : [item.region.name, valueText ?? noDataLabel, rank && `${rank}º de ${withValue.length}`]
              .filter(Boolean)
              .join(', ');

      return {
        ...item,
        description,
        fill: mapScale.fillOf(item),
        hidden: key !== undefined && isLegendHidden(key),
        key,
        rank,
        valueText,
      };
    });

    return {
      entries: all,
      ranked: all.filter((entry) => entry.rank !== undefined).sort((a, b) => a.rank! - b.rank!),
      scale: mapScale,
    };
  }, [accent, colorScale, data, formatValue, inPlay, isLegendHidden, noDataLabel]);
  const total = sum(ranked, (entry) => entry.value!);
  const noDataCount = colorScale.type === 'none' ? 0 : entries.filter((entry) => entry.fill === undefined).length;

  // Dado sem regiao some do desenho: em desenvolvimento, o componente avisa em vez de descartar calado.
  const orphanKey = useMemo(() => {
    const ids = new Set(regions.map((region) => region.id));

    return data
      .filter((datum) => !ids.has(datum.id))
      .map((datum) => datum.id)
      .join(', ');
  }, [data, regions]);
  useEffect(() => {
    if (orphanKey && isDevelopment()) {
      console.warn(`ChartMap "${title}": ${orphanKey.split(', ').length} dado(s) sem região na geometria, fora do desenho: ${orphanKey}.`);
    }
  }, [orphanKey, title]);

  const markerSeries = markers ?? [];
  const markerColors = useMemo(() => resolveSeriesColors(markerSeries, { accent, palette }), [accent, palette, markerSeries]);
  const validPoints = new Set(
    markerSeries.flatMap((series) =>
      series.points.filter(
        (point) => [point.latitude, point.longitude, point.value].every(Number.isFinite) && point.value >= 0,
      ),
    ),
  );
  const hasMarkers = validPoints.size > 0;
  const empty =
    regions.length === 0 ||
    (!hasMarkers &&
      (scale.numeric
        ? ranked.length === 0
        : colorScale.type === 'categorical' && entries.every((entry) => entry.fill === undefined)));

  const sideLegend = legend === 'right' && outer.width >= NARROW;
  const legendPosition = legend === 'right' && !sideLegend ? 'bottom' : legend;
  const width = plot.width;
  const fillHeight = height === 'fill';
  const maxHeight = fillHeight ? Math.max(plot.height, MIN_HEIGHT) : height;

  const labelsOn = regionLabels !== 'hidden';
  const valuesOn = showDataLabels !== 'hidden' && scale.numeric;
  const layout = useMemo(() => {
    if (width === 0 || empty) {
      return undefined;
    }

    const valueTexts = new Map(entries.map((entry) => [entry.region.id, entry.valueText]));

    return layoutMap({
      all: regions,
      callouts: smallRegionLabels === 'callout',
      fixedHeight: fillHeight,
      font: plot.font,
      labels: labelsOn,
      maxHeight,
      target: inPlay,
      valueOf: (region) => (valuesOn ? valueTexts.get(region.id) : undefined),
      width,
    });
  }, [empty, entries, fillHeight, inPlay, labelsOn, maxHeight, plot.font, regions, smallRegionLabels, valuesOn, width]);
  const projection = layout?.projection;
  const plotHeight = layout?.height ?? 0;
  const paths = useMemo(() => {
    if (!projection) {
      return new Map<string, string>();
    }

    const path = geoPath(projection);
    return new Map(regions.map((region) => [region.id, path(region.shape) ?? '']));
  }, [projection, regions]);

  const radius = scaleSqrt()
    .domain([0, Math.max(...[...validPoints].map((point) => point.value), 1)])
    .range([0, markerMaxSize]);
  const placedMarkers: PlacedMarker[] = projection
    ? markerSeries
        .flatMap((series, seriesIndex) =>
          seriesToggle.isHidden(series.id)
            ? []
            : series.points.flatMap((point, pointIndex) => {
                const position = validPoints.has(point) ? projection([point.longitude, point.latitude]) : null;

                return position
                  ? [
                      {
                        color: markerColors[seriesIndex],
                        key: `marker:${seriesIndex}:${pointIndex}`,
                        point,
                        radius: Math.max(markerMinSize, radius(point.value)),
                        series,
                        x: position[0],
                        y: position[1],
                      },
                    ]
                  : [];
              }),
        )
        .sort((a, b) => b.radius - a.radius)
    : [];

  const regionsInteractive = onRegionClick !== undefined;
  const markersInteractive = onMarkerClick !== undefined;
  const interactive = regionsInteractive || markersInteractive;
  const regionMark = (index: number) => `region:${index}`;
  const marks = [
    ...(regionsInteractive ? entries.map((_, index) => regionMark(index)) : []),
    ...(markersInteractive ? placedMarkers.map((marker) => marker.key) : []),
  ];
  const selectedIndex = entries.findIndex((entry) => entry.region.id === selectedRegion);
  const tabStop = marks.includes(tabStopMark ?? '')
    ? tabStopMark
    : regionsInteractive && selectedIndex >= 0
      ? regionMark(selectedIndex)
      : marks[0];

  const entryOfMark = (mark: string | null) =>
    mark?.startsWith('region:') ? entries[Number(mark.slice('region:'.length))] : undefined;
  const markerOfMark = (mark: string | null) => placedMarkers.find((marker) => marker.key === mark);
  const focusedEntry = entryOfMark(focusedMark);
  const focusedMarker = markerOfMark(focusedMark);
  const hoveredEntry = target?.kind === 'region' ? target.entry : undefined;
  const activeRegionId = hoveredEntry?.region.id ?? focusedEntry?.region.id;

  const regionEvent = (entry: RegionEntry): ChartMapRegion => ({
    category: entry.category,
    feature: entry.region.feature,
    id: entry.region.id,
    name: entry.region.name,
    value: entry.value,
  });
  const markerEvent = ({ point, series }: PlacedMarker): ChartMapMarkerEvent => ({
    id: point.id,
    series: series.id,
    value: point.value,
  });

  const describeMarker = ({ point, series }: PlacedMarker) =>
    `${point.label}, ${series.label}, ${formatValue(point.value)}`;

  function markFrom(event: SyntheticEvent) {
    return (event.target as Element).getAttribute?.('data-mark') ?? null;
  }

  function hover(mark: string | null) {
    const entry = entryOfMark(mark);
    const marker = markerOfMark(mark);

    setTarget(entry ? { entry, kind: 'region' } : marker ? { kind: 'marker', marker } : null);
    onHoverRegion?.(entry?.region.id ?? null);
  }

  function activate(mark: string | null) {
    const entry = entryOfMark(mark);
    const marker = markerOfMark(mark);

    if (entry && onRegionClick) {
      setTabStopMark(mark);
      onRegionClick(regionEvent(entry));
    } else if (marker && onMarkerClick) {
      setTabStopMark(mark);
      onMarkerClick(markerEvent(marker));
    }
  }

  /** A marca vizinha na direcao da seta, pelo centro de cada uma, como no artefato do componente. */
  function neighbor(from: string, [dx, dy]: readonly [number, number]) {
    if (!projection) {
      return undefined;
    }

    const path = geoPath(projection);
    const anchorOf = (mark: string): Point => {
      const entry = entryOfMark(mark);
      const marker = markerOfMark(mark);
      return entry ? path.centroid(entry.region.shape) : marker ? [marker.x, marker.y] : [0, 0];
    };
    const [x0, y0] = anchorOf(from);
    let best: string | undefined;
    let bestScore = Infinity;

    marks.forEach((mark) => {
      if (mark === from) {
        return;
      }

      const [x, y] = anchorOf(mark);
      const along = (x - x0) * dx + (y - y0) * dy;
      const score = along + 2 * Math.abs((x - x0) * dy - (y - y0) * dx);

      if (along > 1 && score < bestScore) {
        bestScore = score;
        best = mark;
      }
    });

    return best;
  }

  function handleKeyDown(event: KeyboardEvent<SVGGElement>) {
    const mark = markFrom(event);
    const directions: Record<string, readonly [number, number]> = {
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
    };

    if (!mark || !marks.includes(mark)) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activate(mark);
      return;
    }

    if (event.key in directions) {
      event.preventDefault();
      const next = neighbor(mark, directions[event.key]);

      if (next) {
        setTabStopMark(next);
        svgRef.current?.querySelector<SVGElement>(`[data-mark="${next}"]`)?.focus();
      }
    }
  }

  const markHandlers = {
    onBlur: () => {
      setFocusedMark(null);
      onHoverRegion?.(null);
    },
    onClick: (event: SyntheticEvent) => activate(markFrom(event)),
    onFocus: (event: SyntheticEvent) => {
      const mark = markFrom(event);
      setFocusedMark(mark);
      setTabStopMark(mark);
      onHoverRegion?.(entryOfMark(mark)?.region.id ?? null);
    },
    onKeyDown: handleKeyDown,
    onMouseOut: () => hover(null),
    onMouseOver: (event: SyntheticEvent) => hover(markFrom(event)),
  };

  const strokeWidth = strokeWidthFor(regions.length);
  const labelPlan = layout?.plan ?? { callouts: [], inside: [] };
  const lineHeight = plot.font.size + 1;
  const noDataFill = noDataStyle === 'hatch' ? `url(#${hatchId})` : NO_DATA_FILL;

  // As regioes nao dependem do ponteiro: o balao e o contorno passam sem refazer milhares de caminhos.
  const regionShapes = useMemo(
    () =>
      entries.map((entry, index) => {
        const mark = regionMark(index);
        const dimmed = highlightedKey !== null && entry.key !== highlightedKey;

        return (
          <path
            aria-label={entry.description}
            aria-pressed={regionsInteractive && selectedRegion !== undefined ? entry.region.id === selectedRegion : undefined}
            className={`${styles.region} ${regionsInteractive ? styles.clickable : ''} ${dimmed ? styles.dimmed : ''}`}
            d={paths.get(entry.region.id)}
            data-mark={mark}
            fill={entry.hidden ? HIDDEN_FILL : (entry.fill ?? noDataFill)}
            key={index}
            role={regionsInteractive ? 'button' : undefined}
            strokeWidth={strokeWidth}
            tabIndex={regionsInteractive ? (mark === tabStop ? 0 : -1) : undefined}
          />
        );
      }),
    [entries, highlightedKey, noDataFill, paths, regionsInteractive, selectedRegion, strokeWidth, tabStop],
  );
  const contextShapes = useMemo(
    () =>
      context.map((region, index) => (
        <path className={styles.context} d={paths.get(region.id)} key={index} strokeWidth={strokeWidth} />
      )),
    [context, paths, strokeWidth],
  );

  const summary = (() => {
    const count = plural(entries.length, 'região', 'regiões');
    const missing = noDataCount > 0 ? ` ${noDataCount} sem dado.` : '';
    const hint = interactive ? ' Use as setas para percorrer as marcas.' : '';

    if (!scale.numeric || ranked.length === 0) {
      return `Mapa de ${count}.${missing}${hint}`;
    }

    const [top, bottom] = [ranked[0], ranked[ranked.length - 1]];
    return `Mapa de ${count}. Maior valor: ${top.region.name}, ${formatValue(top.value!)}. Menor: ${
      bottom.region.name
    }, ${formatValue(bottom.value!)}.${missing}${hint}`;
  })();

  function labelClass(id: string, onHoverOnly: boolean) {
    return `${styles.label} ${onHoverOnly ? styles.labelOnHover : ''} ${activeRegionId === id ? styles.labelActive : ''}`;
  }

  const svg = projection && (
    <svg
      aria-describedby={summaryId}
      aria-labelledby={titleId}
      className={`${styles.canvas} ${fillHeight ? styles.canvasFill : ''}`}
      height={plotHeight}
      ref={svgRef}
      role={interactive ? 'group' : 'img'}
      viewBox={`0 0 ${width} ${plotHeight}`}
      width={width}
    >
      <defs>
        <NoDataHatch id={hatchId} />
      </defs>

      <g aria-hidden="true" className={styles.passThrough}>
        {contextShapes}
      </g>

      <g {...markHandlers}>{regionShapes}</g>

      <g aria-hidden="true" className={styles.passThrough}>
        {selectedIndex >= 0 && (
          <path className={styles.selectedOutline} d={paths.get(entries[selectedIndex].region.id)} />
        )}
        {hoveredEntry && <path className={styles.hoverOutline} d={paths.get(hoveredEntry.region.id)} />}
        {focusedEntry && <path className={styles.focusOutline} d={paths.get(focusedEntry.region.id)} />}
      </g>

      <g {...markHandlers}>
        {placedMarkers.map((marker) => (
          <circle
            aria-label={describeMarker(marker)}
            className={`${styles.marker} ${markersInteractive ? styles.clickable : ''}`}
            cx={marker.x}
            cy={marker.y}
            data-mark={marker.key}
            fill={marker.color}
            key={marker.key}
            r={marker.radius}
            role={markersInteractive ? 'button' : 'img'}
            tabIndex={markersInteractive ? (marker.key === tabStop ? 0 : -1) : undefined}
          />
        ))}
        {focusedMarker && (
          <circle
            aria-hidden="true"
            className={styles.focusOutline}
            cx={focusedMarker.x}
            cy={focusedMarker.y}
            r={focusedMarker.radius + 3}
          />
        )}
      </g>

      <g aria-hidden="true" className={styles.passThrough}>
        {labelPlan.inside.map((label) => (
          <text className={labelClass(label.id, regionLabels === 'onHover')} key={label.id} x={label.x} y={label.y}>
            <tspan dominantBaseline="central" x={label.x} y={label.value ? label.y - lineHeight / 2 : label.y}>
              {label.title}
            </tspan>
            {label.value && (
              <tspan
                className={`${styles.labelValue} ${showDataLabels === 'onHover' ? styles.valueOnHover : ''}`}
                dominantBaseline="central"
                x={label.x}
                y={label.y + lineHeight / 2}
              >
                {label.value}
              </tspan>
            )}
          </text>
        ))}
        {labelPlan.callouts.map((label) => (
          <g className={labelClass(label.id, regionLabels === 'onHover')} key={label.id}>
            <path
              className={styles.leader}
              d={`M${label.anchor[0]},${label.anchor[1]}L${label.x - 12},${label.y}L${label.x - 4},${label.y}`}
            />
            <circle className={styles.leaderDot} cx={label.anchor[0]} cy={label.anchor[1]} r={1.8} />
            <text className={styles.callout} dominantBaseline="central" x={label.x} y={label.y}>
              {label.title}
              {label.value && (
                <tspan
                  className={`${styles.labelValue} ${showDataLabels === 'onHover' ? styles.valueOnHover : ''}`}
                  dx={5}
                >
                  {label.value}
                </tspan>
              )}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );

  const tooltip = tooltipOf(target, {
    formatPercent,
    formatValue,
    formatTooltipValue: formatTooltipValue ?? formatValue,
    markerValueLabel,
    noDataLabel,
    rankedCount: ranked.length,
    scale,
    showShare,
    total,
    valueLabel,
    colorScale,
  });

  const counts = new Map<string, number>();
  entries.forEach((entry) => entry.key !== undefined && counts.set(entry.key, (counts.get(entry.key) ?? 0) + 1));

  const legendView = legendPosition !== 'none' && (
    <ChartMapLegend
      align={legendAlign}
      entries={scale.entries.map((entry) => ({
        ...entry,
        count: counts.get(entry.key) ?? 0,
        hidden: legendToggle.isHidden(entry.key),
      }))}
      formatValue={formatValue}
      gradient={scale.gradient}
      indicator={hoveredEntry?.value == null ? undefined : scale.gradient?.position(hoveredEntry.value)}
      markerSeries={markerSeries.map((series, index) => ({
        color: markerColors[index],
        hidden: seriesToggle.isHidden(series.id),
        key: series.id,
        label: series.label,
      }))}
      markerSizes={
        hasMarkers ? { maximum: radius.domain()[1], radiusOf: (value) => Math.max(markerMinSize, radius(value)) } : undefined
      }
      markerValueLabel={markerValueLabel}
      noData={
        noDataCount > 0
          ? { color: noDataStyle === 'hatch' ? NO_DATA_HATCH : NO_DATA_FILL, count: noDataCount, label: noDataLabel }
          : undefined
      }
      onHighlight={(key) => setHighlightedKey(key)}
      onToggle={legendToggle.toggle}
      onToggleMarkerSeries={seriesToggle.toggle}
      position={legendPosition}
      style={sideLegend ? { width: Math.min(SIDE_LEGEND_MAX, Math.round(outer.width * 0.3)) } : undefined}
      valueLabel={valueLabel}
    />
  );

  const tableRegions: MapTableRegionRow[] = entries
    .filter((entry) => !entry.hidden)
    .map((entry) => ({
      classLabel: colorScale.type === 'classes' ? scale.labelOf(entry) : undefined,
      id: entry.region.id,
      name: entry.region.name,
      rank: entry.rank,
      selected: entry.region.id === selectedRegion,
      share: entry.value !== null && total > 0 ? entry.value / total : undefined,
      value: entry.value,
      valueText: entry.valueText,
    }));
  const tableMarkers: MapTableMarkerRow[] = markerSeries.flatMap((series) =>
    seriesToggle.isHidden(series.id)
      ? []
      : series.points
          .filter((point) => validPoints.has(point))
          .map((point) => ({ key: `${series.id}:${point.id}`, name: point.label, series: series.label, value: formatValue(point.value) })),
  );
  const { figureProps, titleClassName } = chartRoot(root, { figure: styles.figure, title: styles.title });

  return (
    <figure {...figureProps}>
      <figcaption className={styles.header}>
        <span className={styles.heading}>
          <span className={titleClassName} id={titleId}>
            {title}
          </span>
          {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        </span>
        {showTableToggle && !empty && (
          <Button
            aria-pressed={tableView}
            className={styles.tableToggle}
            onClick={() => setTableView((current) => !current)}
            size="sm"
            variant="secondary"
          >
            Ver como tabela
          </Button>
        )}
      </figcaption>

      <span className={styles.visuallyHidden} id={summaryId}>
        {summary}
      </span>

      <div className={`${styles.body} ${sideLegend && !tableView ? styles.bodyRow : ''}`} ref={outer.ref}>
        {legendPosition === 'top' && !tableView && !empty && legendView}

        {empty ? (
          <div className={styles.empty}>
            <EmptyState icon={<IconChartBar />} size="sm" title={emptyMessage} />
          </div>
        ) : tableView ? (
          <ChartMapTable
            markerRows={tableMarkers}
            markerValueLabel={markerValueLabel}
            maxHeight={typeof height === 'number' ? Math.max(height, MIN_HEIGHT) : undefined}
            noDataLabel={noDataLabel}
            regionRows={tableRegions}
            showClasses={colorScale.type === 'classes'}
            showRank={scale.numeric}
            showShare={showShare && scale.numeric}
            showValue={colorScale.type !== 'none'}
            formatPercent={formatPercent}
            title={title}
            valueLabel={valueLabel}
          />
        ) : (
          <div className={`${styles.plot} ${fillHeight ? styles.plotFill : ''}`} ref={plot.ref}>
            {svg && (showTooltip ? <ChartTooltip {...tooltip}>{svg}</ChartTooltip> : svg)}
          </div>
        )}

        {(legendPosition === 'bottom' || legendPosition === 'right') && !tableView && !empty && legendView}
      </div>
    </figure>
  );
}

interface TooltipOptions {
  colorScale: ChartColorScale;
  formatPercent: (ratio: number) => string;
  formatTooltipValue: (value: number) => string;
  formatValue: (value: number) => string;
  markerValueLabel: string;
  noDataLabel: string;
  rankedCount: number;
  scale: ColorScale;
  showShare: boolean;
  total: number;
  valueLabel: string;
}

/** Balao do que esta sob o ponteiro: a regiao com valor, faixa, parte do total e posicao, ou o marcador. */
function tooltipOf(target: Target | null, options: TooltipOptions): Omit<ChartTooltipProps, 'children'> {
  if (target === null) {
    return { rows: [] };
  }

  if (target.kind === 'marker') {
    const { color, point, series } = target.marker;

    return {
      columns: [{ format: options.formatTooltipValue }],
      computed: 'none',
      rows: [{ color, label: options.markerValueLabel, values: [point.value] }],
      subtitle: series.label,
      title: point.label,
    };
  }

  const { entry } = target;
  const { region } = entry;
  const subtitle = region.label !== region.name ? region.label : undefined;
  const text = (label: string, value: string): ChartTooltipRow => ({ format: () => value, label, values: [0] });
  const rows: ChartTooltipRow[] = [];

  if (options.colorScale.type === 'none') {
    rows.push({ label: subtitle ?? region.name, values: [] });
  } else if (!options.scale.numeric) {
    rows.push(
      entry.valueText
        ? { ...text(options.valueLabel, entry.valueText), color: entry.fill }
        : { label: options.noDataLabel, values: [] },
    );
  } else if (entry.value === null) {
    rows.push({ label: options.noDataLabel, values: [] });
  } else {
    rows.push({ color: entry.fill, label: options.valueLabel, values: [entry.value] });
    const range = options.colorScale.type === 'classes' ? options.scale.labelOf(entry) : undefined;

    if (range) {
      rows.push(text('Faixa', range));
    }

    if (options.showShare && options.total > 0) {
      rows.push({ format: options.formatPercent, label: '% do total', values: [entry.value / options.total] });
    }

    rows.push(text('Posição', `${entry.rank}º de ${options.rankedCount}`));
  }

  if (entry.hidden) {
    rows.push({ label: 'Oculta pela legenda', values: [] });
  }

  return {
    columns: [{ format: options.formatTooltipValue }],
    computed: 'none',
    rows,
    subtitle,
    title: region.name,
  };
}
