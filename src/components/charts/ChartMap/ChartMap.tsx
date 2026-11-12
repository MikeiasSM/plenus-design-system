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
  TABLE_TOGGLE_MIN_WIDTH,
  useFit,
  CHART_MIN_PLOT,
  colorLegendRoom,
  plotRoom,
  useTouchPin,
  useSeriesToggle,
  type ChartHeight,
  type ChartLegendAlign,
  type ChartRootProps,
  type LabelFont,
  type MarkVisibility,
  type NoDataStyle,
} from '../core';
import { resolveSeriesColors, type ChartPalette, type SeriesAppearance } from '../palette';
import { formatNumber, formatPercent } from '../../../utils/formatters';
import { blockRepeatedPress } from '../../../utils/press/press';
import { ChartMapLegend } from './ChartMapLegend';
import { ChartMapTable, type MapTableMarkerRow, type MapTableRegionRow } from './ChartMapTable';
import {
  MAP_PADDING,
  MAX_FOCUS_ZOOM,
  MAX_MARKER_ZOOM,
  cornersOf,
  fitProjection,
  naturalHeight,
  outlinesOf,
  projectedBounds,
  projectedParts,
  regionsOf,
  zoomCeiling,
  type ChartMapFeature,
  type ChartMapFeatureCollection,
  type MapCorners,
  type MapRegion,
} from './mapGeometry';
import { CALLOUT_GAP, calloutWidth, planLabels, type LabelCandidate, type LabelPlan } from './mapLabels';
import { ChartMapZoomControls, zoomAnnouncement, zoomHint } from './ChartMapZoomControls';
import { centerView, clampView, initialView, isInitialView, projectionOf, sameView, viewFrame, ZOOM_STEP, zoomView, type ChartMapView } from './mapView';
import { useMapGestures } from './useMapGestures';
import { buildColorScale, type ChartColorScale, type ColorScale } from '../scales/colorScale';
import type { Point, Ring } from './polylabel';
import chartStyles from '../core/Chart.module.css';
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

/** Regiao sob o ponteiro ou clicada. */
export interface ChartMapRegion {
  category: string | null;
  feature: ChartMapFeature;
  id: string;
  name: string;
  value: number | null;
}

/** Marcador sob o ponteiro ou clicado. */
export interface ChartMapMarkerEvent {
  id: string;
  /** `id` da serie. */
  series: string;
  value: number;
}

/** Marca do mapa, discriminada por `kind`: a regiao ou o marcador. */
export type ChartMapMark = ({ kind: 'region' } & ChartMapRegion) | ({ kind: 'marker' } & ChartMapMarkerEvent);

export type ChartMapLegendPosition = 'top' | 'bottom' | 'right' | 'none';

export type { ChartMapView };

export interface ChartMapProps extends Omit<ChartRootProps, 'hidden'> {
  /** Cor de tema que abre a paleta das categorias e dos marcadores, como nos demais gráficos. */
  accent?: string;
  /** Espécies de marca que viram botão e avisam `onMarkClick`. Por padrão, todas; as demais ficam só como desenho. */
  clickableMarks?: readonly ChartMapMark['kind'][];
  colorScale?: ChartColorScale;
  data?: readonly ChartMapRegionDatum[];
  /** Faixas ocultas de inicio, no modo nao controlado, pelo indice. */
  defaultHiddenClasses?: readonly number[];
  /** Vista de inicio, no modo nao controlado. Sem ela, o enquadramento inicial. */
  defaultView?: ChartMapView;
  /** Categorias e series de marcadores ocultas de inicio, pelo `id`, no modo nao controlado. */
  defaultHidden?: readonly string[];
  /** @deprecated Use `defaultHidden`. Aceito ate a 0.7.0; com os dois, vale o novo. */
  defaultHiddenSeries?: readonly string[];
  /** Regiao escolhida de inicio, no modo nao controlado. Com ele, as regioes viram botoes. */
  defaultSelectedRegion?: string | null;
  emptyMessage?: string;
  /** Caminho do identificador na feicao, como `properties.sigla`. E por ele que o dado casa. */
  featureIdKey?: string;
  /** Caminho do texto curto do rotulo no desenho. Sem ele, o identificador, como a sigla da UF. */
  featureLabelKey?: string;
  /** Caminho do nome exibido no balao, na tabela e na descricao. */
  featureNameKey?: string;
  /** Ids que o enquadramento abraca. As demais regioes ficam em cinza, como contexto, sem interacao. */
  focus?: readonly string[];
  /**
   * Ids de marcador que o enquadramento abraca, de qualquer serie, com margem do raio do maior e teto de 100 vezes a aproximacao do mapa inteiro.
   * As regioes seguem desenhadas e interativas, sem cinza. Com `focus`, o enquadramento abraca as regioes e esses marcadores.
   */
  focusMarkers?: readonly string[];
  formatPercent?: (ratio: number) => string;
  formatTooltipValue?: (value: number) => string;
  formatValue?: (value: number) => string;
  /** Fronteiras em GeoJSON, fornecidas pelo produto, que responde pela licenca delas. */
  geometry: ChartMapFeatureCollection;
  /** Altura maxima em px, ou `fill`. Na largura estreita, a altura encolhe ate a proporcao da geometria. */
  height?: ChartHeight;
  /** Faixas ocultas pelo indice, na escala por classes (controlado). */
  hiddenClasses?: readonly number[];
  /** Categorias e series de marcadores desligadas, pelo `id` (controlado). As faixas da escala ficam em `hiddenClasses`. Substitui o `hidden` nativo da figure. */
  hidden?: readonly string[];
  /** @deprecated Use `hidden`. Aceito ate a 0.7.0; com os dois, vale o novo. */
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
  /** Ids das categorias e das series de marcadores ocultas, a cada alternancia da legenda. */
  onHiddenChange?: (hidden: readonly string[]) => void;
  /** @deprecated Use `onHiddenChange`. Aceito ate a 0.7.0. */
  onHiddenSeriesChange?: (hidden: readonly string[]) => void;
  /** Regiao ou marcador sob o ponteiro ou o foco, para paineis vizinhos, ou `null` ao sair. */
  onHover?: (mark: ChartMapMark | null) => void;
  /** @deprecated Use `onHover`, que traz a regiao inteira. Aceito ate a 0.7.0. */
  onHoverRegion?: (id: string | null) => void;
  /** Com ele, as regioes e os marcadores viram botoes e entram no teclado; `mark.kind` os distingue. */
  onMarkClick?: (mark: ChartMapMark) => void;
  /** @deprecated Use `onMarkClick` e `mark.kind === 'marker'`. Aceito ate a 0.7.0. */
  onMarkerClick?: (marker: ChartMapMarkerEvent) => void;
  /** @deprecated Use `onMarkClick` e `mark.kind === 'region'`. Aceito ate a 0.7.0. */
  onRegionClick?: (region: ChartMapRegion) => void;
  /** Com ele, as regioes viram botoes, e o clique escolhe a regiao ou, na escolhida, a desfaz. */
  onSelectedRegionChange?: (id: string | null) => void;
  /** A vista nova, a cada aproximação, afastamento ou arraste. */
  onViewChange?: (view: ChartMapView) => void;
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
  /**
   * Contorno por dentro das regioes, como as divisas dos estados numa visao por macrorregiao. Mesma projecao da `geometry`;
   * desenhado em traco fino, sem preenchimento, rotulo nem interacao, fora da tabela e da legenda.
   */
  subdivisions?: ChartMapFeatureCollection;
  title: string;
  valueLabel?: string;
  /** Vista controlada: o centro e a escala, com 1 no enquadramento inicial. A escala vai de 1 a 100 vezes o mapa inteiro. */
  view?: ChartMapView;
  /** Liga zoom e arraste: botões, Ctrl ou ⌘ com a rolagem, dois dedos, e `+`, `-`, `0` e Shift com as setas no teclado. */
  zoomable?: boolean;
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
/** Espessura da divisa em relacao a borda da regiao. */
const SUBDIVISION_RATIO = 0.6;
const HIDDEN_FILL = 'var(--pl-color-surface-subtle)';
const ALL_MARK_KINDS: readonly ChartMapMark['kind'][] = ['region', 'marker'];
/** Folga alem da area, em px, em que o desenho ainda e recortado: a borda da regiao no limite nao aparece como linha. */
const CLIP_MARGIN = 16;

const defaultPercent = (ratio: number) => formatPercent(ratio, { decimals: 1 });
const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** Traco mais fino quanto mais regioes: nos municipios, a borda inteira escurecia o mapa. */
function strokeWidthFor(count: number) {
  return count > 1000 ? 0.25 : count > 100 ? 0.5 : 0.8;
}

interface MapLayout {
  /** Largura da area onde o mapa e enquadrado: a do desenho menos a coluna dos rotulos fora da regiao. */
  drawingWidth: number;
  height: number;
  plan: LabelPlan;
  projection: GeoProjection;
}

interface MapFrame {
  corners: MapCorners;
  padding: number;
}

interface LayoutInput {
  all: readonly MapRegion[];
  callouts: boolean;
  /** Em `fill`, a altura e a do conteiner, e nao a que a geometria pede. */
  fixedHeight: boolean;
  font: LabelFont;
  labels: boolean;
  /** Enquadramento pelos marcadores: o retangulo e a margem, e as regioes de `target` seguem desenhadas. */
  frame?: MapFrame;
  maxHeight: number;
  target: readonly MapRegion[];
  valueOf: (region: MapRegion) => string | undefined;
  width: number;
}

interface LabelInput {
  callouts: boolean;
  /** So as regioes que cabem inteiras na area recebem rotulo: a que passa dela nao tem onde pousar o seu. */
  cropped: boolean;
  drawingWidth: number;
  font: LabelFont;
  height: number;
  projection: GeoProjection;
  target: readonly MapRegion[];
  valueOf: (region: MapRegion) => string | undefined;
}

const NO_LABELS: LabelPlan = { callouts: [], inside: [] };

function planRegionLabels({ callouts, cropped, drawingWidth, font, height, projection, target, valueOf }: LabelInput): LabelPlan {
  const visible = cropped
    ? target.filter((region) => {
        const [[left, top], [right, bottom]] = projectedBounds(region, projection);
        return left >= 0 && top >= 0 && right <= drawingWidth && bottom <= height;
      })
    : target;
  const candidates = visible.map((region): LabelCandidate => {
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

  return planLabels(candidates, {
    callouts,
    calloutStep: font.lineHeight,
    height,
    lineHeight: font.size + 1,
    measure: (text) => measureLabel(text, font),
    right: drawingWidth,
  });
}

/**
 * Enquadra e rotula. A altura e a que a geometria pede na largura, ate a maxima, sem faixa vazia. Quando algum rotulo
 * vai para a coluna, o desenho cede a largura dela e e enquadrado e rotulado de novo.
 */
function layoutMap({ all, callouts, fixedHeight, font, frame, labels, maxHeight, target, valueOf, width }: LayoutInput): MapLayout {
  const corners = frame?.corners ?? cornersOf(target);
  const padding = frame?.padding ?? MAP_PADDING;
  const maxZoom = frame ? MAX_MARKER_ZOOM : target.length === all.length ? undefined : MAX_FOCUS_ZOOM;

  const pass = (drawingWidth: number, withCallouts = callouts): MapLayout => {
    const height = fixedHeight
      ? maxHeight
      : Math.round(Math.min(maxHeight, Math.max(MIN_HEIGHT, naturalHeight(corners, drawingWidth, padding))));
    const projection = fitProjection(corners, all, drawingWidth, height, { maxZoom, padding });
    const plan = labels
      ? planRegionLabels({ callouts: withCallouts, cropped: frame !== undefined, drawingWidth, font, height, projection, target, valueOf })
      : NO_LABELS;

    return { drawingWidth, height, plan, projection };
  };

  const first = pass(width);

  if (first.plan.callouts.length === 0) {
    return first;
  }

  const measure = (text: string) => measureLabel(text, font);
  const gutter = Math.ceil(Math.max(...first.plan.callouts.map((label) => calloutWidth(label, measure))) + CALLOUT_GAP + 4);

  // A coluna so fica enquanto o mapa ainda cabe ao lado dela: sem isso, o mapa fica por conta do rotulo.
  return width - gutter < CHART_MIN_PLOT.width ? pass(width, false) : pass(Math.max(width - gutter, width / 2));
}

function isKeyboardFocus(element: Element) {
  try {
    return element.matches(':focus-visible');
  } catch {
    return true;
  }
}

function isDimmed(key: string | undefined, highlightedKey: string | null) {
  return highlightedKey !== null && key !== highlightedKey;
}

/**
 * Regioes pintadas pelo valor e marcadores por coordenada, sobre a geometria GeoJSON que o produto fornece. O desenho
 * e imagem nomeada pelo titulo; com `onMarkClick`, ou a selecao de regiao, um grupo cujas marcas sao botoes de tabulacao
 * movel. A leitura completa, com busca, esta na visao em tabela.
 */
export function ChartMap({
  accent,
  clickableMarks = ALL_MARK_KINDS,
  colorScale = DEFAULT_SCALE,
  data = [],
  defaultHidden,
  defaultHiddenClasses,
  defaultHiddenSeries,
  defaultSelectedRegion,
  defaultView,
  emptyMessage = 'Sem dados',
  featureIdKey = 'id',
  featureLabelKey,
  featureNameKey = 'properties.name',
  focus,
  focusMarkers,
  formatPercent = defaultPercent,
  formatTooltipValue,
  formatValue = formatNumber,
  geometry,
  height = 440,
  hidden,
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
  onHiddenChange,
  onHiddenClassesChange,
  onHiddenSeriesChange,
  onHover,
  onHoverRegion,
  onMarkClick,
  onMarkerClick,
  onRegionClick,
  onSelectedRegionChange,
  onViewChange,
  palette,
  regionLabels = 'visible',
  selectedRegion,
  showDataLabels = 'hidden',
  showShare = false,
  showTableToggle = true,
  showTooltip = true,
  smallRegionLabels = 'callout',
  subtitle,
  subdivisions,
  title,
  valueLabel = 'Valor',
  view,
  zoomable = false,
  ...root
}: ChartMapProps) {
  const titleId = useId();
  const summaryId = useId();
  const hatchId = `${useId().replace(/[^\w-]/g, '')}-hatch`;
  const clipId = `${useId().replace(/[^\w-]/g, '')}-clip`;
  const outer = useChartMetrics();
  const plot = useChartMetrics();
  const touch = useTouchPin();
  const svgRef = useRef<SVGSVGElement>(null);
  const seriesToggle = useSeriesToggle({
    defaultHidden: defaultHidden ?? defaultHiddenSeries,
    hidden: hidden ?? hiddenSeries,
    onHiddenChange: (ocultas) => {
      onHiddenChange?.(ocultas);
      onHiddenSeriesChange?.(ocultas);
    },
  });
  // As faixas sao indices; a legenda liga e desliga por texto.
  const hiddenClassKeys = useMemo(() => hiddenClasses?.map(String), [hiddenClasses]);
  const classToggle = useSeriesToggle({
    defaultHidden: defaultHiddenClasses?.map(String),
    hidden: hiddenClassKeys,
    onHiddenChange: onHiddenClassesChange && ((hidden) => onHiddenClassesChange(hidden.map(Number))),
  });
  const [target, setTarget] = useState<Target | null>(null);
  const [focusedMark, setFocusedMark] = useState<string | null>(null);
  const [tabStopMark, setTabStopMark] = useState<string | null>(null);
  const [highlightedKey, setHighlightedKey] = useState<string | null>(null);
  const [tableView, setTableView] = useState(false);
  const regionSelectable =
    selectedRegion !== undefined || defaultSelectedRegion !== undefined || onSelectedRegionChange !== undefined;
  const [internalSelectedRegion, setInternalSelectedRegion] = useState(defaultSelectedRegion ?? null);
  const currentSelectedRegion = selectedRegion === undefined ? internalSelectedRegion : selectedRegion;

  const regions = useMemo(
    () => regionsOf(geometry, { idKey: featureIdKey, labelKey: featureLabelKey, nameKey: featureNameKey }),
    [featureIdKey, featureLabelKey, featureNameKey, geometry],
  );
  // A chave textual mantem o recorte memorizado enquanto os ids nao mudam, mesmo com outra lista a cada desenho.
  const focusKey = (focus ?? []).join('\u0000');
  const { context, focusedByRegion, inPlay } = useMemo(() => {
    const ids = new Set(focusKey ? focusKey.split('\u0000') : []);
    const focused = regions.filter((region) => ids.has(region.id));

    return focused.length > 0
      ? { context: regions.filter((region) => !ids.has(region.id)), focusedByRegion: true, inPlay: focused }
      : { context: [], focusedByRegion: false, inPlay: regions };
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
  const validPoints = useMemo(
    () =>
      new Set(
        (markers ?? []).flatMap((series) =>
          series.points.filter((point) => [point.latitude, point.longitude, point.value].every(Number.isFinite) && point.value >= 0),
        ),
      ),
    [markers],
  );
  const radius = useMemo(
    () =>
      scaleSqrt()
        .domain([0, Math.max(...[...validPoints].map((point) => point.value), 1)])
        .range([0, markerMaxSize]),
    [markerMaxSize, validPoints],
  );
  const markerFocusKey = (focusMarkers ?? []).join('\u0000');
  const markerFrame = useMemo((): MapFrame | undefined => {
    const ids = new Set(markerFocusKey ? markerFocusKey.split('\u0000') : []);
    const framed = [...validPoints].filter((point) => ids.has(point.id));

    if (framed.length === 0) {
      return undefined;
    }

    return {
      corners: cornersOf(
        focusedByRegion ? inPlay : [],
        framed.map((point): Point => [point.longitude, point.latitude]),
      ),
      padding: MAP_PADDING + Math.max(...framed.map((point) => Math.max(markerMinSize, radius(point.value)))),
    };
  }, [focusedByRegion, inPlay, markerFocusKey, markerMinSize, radius, validPoints]);
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
  const maxHeight = fillHeight ? plot.height : height;

  const removed = useFit(
    width > 0 && maxHeight > 0 ? ['legend'] as const : [],
    (partes, legendaEstava) =>
      plotRoom({ height: maxHeight, width }, colorLegendRoom(legendPosition, fillHeight), legendaEstava, !partes.has('legend')),
    CHART_MIN_PLOT,
  );
  const shownLegend = removed.has('legend') ? 'none' : legendPosition;

  const labelsOn = regionLabels !== 'hidden';
  const valuesOn = showDataLabels !== 'hidden' && scale.numeric;
  const valueOf = useMemo(() => {
    const valueTexts = new Map(entries.map((entry) => [entry.region.id, entry.valueText]));
    return (region: MapRegion) => (valuesOn ? valueTexts.get(region.id) : undefined);
  }, [entries, valuesOn]);
  const baseLayout = useMemo(() => {
    if (width === 0 || empty || maxHeight === 0) {
      return undefined;
    }

    return layoutMap({
      all: regions,
      callouts: smallRegionLabels === 'callout',
      fixedHeight: fillHeight,
      font: plot.font,
      labels: labelsOn,
      frame: markerFrame,
      maxHeight,
      target: inPlay,
      valueOf,
      width,
    });
  }, [empty, fillHeight, inPlay, labelsOn, markerFrame, maxHeight, plot.font, regions, smallRegionLabels, valueOf, width]);

  const markerPositions = useMemo(
    () => [...validPoints].map((point): Point => [point.longitude, point.latitude]),
    [validPoints],
  );
  const viewport = useMemo(
    () =>
      zoomable && baseLayout
        ? viewFrame({
            base: baseLayout.projection,
            ceiling: zoomCeiling(regions, baseLayout.drawingWidth, baseLayout.height, markerFrame?.padding),
            content: cornersOf(regions, markerPositions),
            height: baseLayout.height,
            width: baseLayout.drawingWidth,
          })
        : undefined,
    [baseLayout, markerFrame, markerPositions, regions, zoomable],
  );
  const [internalView, setInternalView] = useState(defaultView ?? null);
  const [viewChanged, setViewChanged] = useState(false);
  const requestedView = view ?? internalView;
  const [requestedLongitude, requestedLatitude] = requestedView?.center ?? [0, 0];
  const requestedScale = requestedView?.scale;
  const activeView = useMemo(
    () =>
      viewport &&
      (requestedScale === undefined
        ? initialView(viewport)
        : clampView(viewport, { center: [requestedLongitude, requestedLatitude], scale: requestedScale })),
    [requestedLatitude, requestedLongitude, requestedScale, viewport],
  );
  const moved = viewport !== undefined && activeView !== undefined && !isInitialView(viewport, activeView);

  function commitView(next: ChartMapView) {
    if (!viewport || !activeView || sameView(viewport, next, activeView)) {
      return;
    }

    if (view === undefined) {
      setInternalView(next);
    }
    setViewChanged(true);
    onViewChange?.(next);
  }

  const gestures = useMapGestures({ frame: viewport, onChange: commitView, svgRef, view: activeView, visible: !tableView });

  // Com a vista deslocada, o mapa e reenquadrado e rotulado so com o que cabe: a coluna de rotulos fica de fora.
  const layout = useMemo(() => {
    if (!baseLayout || !viewport || !activeView || !moved) {
      return baseLayout;
    }

    const projection = projectionOf(viewport, activeView);
    const plan =
      labelsOn && !gestures.dragging
        ? planRegionLabels({
            callouts: false,
            cropped: true,
            drawingWidth: baseLayout.drawingWidth,
            font: plot.font,
            height: baseLayout.height,
            projection,
            target: inPlay,
            valueOf,
          })
        : NO_LABELS;

    return { ...baseLayout, plan, projection };
  }, [activeView, baseLayout, gestures.dragging, inPlay, labelsOn, moved, plot.font, valueOf, viewport]);
  const projection = layout?.projection;
  const plotHeight = layout?.height ?? 0;
  const drawingWidth = layout?.drawingWidth ?? 0;
  // O caminho recorta na area e pula a regiao que ficou toda fora dela: com a vista aproximada, as coordenadas iriam longe.
  const pathProjection = useMemo(
    () =>
      moved && viewport && projection
        ? projectionOf(viewport, activeView).clipExtent([[-CLIP_MARGIN, -CLIP_MARGIN], [drawingWidth + CLIP_MARGIN, plotHeight + CLIP_MARGIN]])
        : projection,
    [activeView, drawingWidth, moved, plotHeight, projection, viewport],
  );
  const paths = useMemo(() => {
    if (!projection || !pathProjection) {
      return new Map<string, string>();
    }

    const path = geoPath(pathProjection);
    const isOutside = (region: MapRegion) => {
      const [[left, top], [right, bottom]] = projectedBounds(region, projection);
      return right < -CLIP_MARGIN || left > drawingWidth + CLIP_MARGIN || bottom < -CLIP_MARGIN || top > plotHeight + CLIP_MARGIN;
    };

    return new Map(regions.map((region) => [region.id, moved && isOutside(region) ? '' : (path(region.shape) ?? '')]));
  }, [drawingWidth, moved, pathProjection, plotHeight, projection, regions]);

  // Um caminho so para a malha toda: com milhares de feicoes, um elemento por feicao pesaria.
  const subdivisionOutlines = useMemo(() => (subdivisions ? outlinesOf(subdivisions) : []), [subdivisions]);
  const subdivisionPath = useMemo(
    () =>
      pathProjection && subdivisionOutlines.length > 0
        ? geoPath(pathProjection)({ type: 'FeatureCollection', features: subdivisionOutlines })
        : null,
    [pathProjection, subdivisionOutlines],
  );

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

  const clickRegion =
    clickableMarks.includes('region') && (onMarkClick || onRegionClick)
      ? (region: ChartMapRegion) => {
          onMarkClick?.({ kind: 'region', ...region });
          onRegionClick?.(region);
        }
      : undefined;
  const clickMarker =
    clickableMarks.includes('marker') && (onMarkClick || onMarkerClick)
      ? (marker: ChartMapMarkerEvent) => {
          onMarkClick?.({ kind: 'marker', ...marker });
          onMarkerClick?.(marker);
        }
      : undefined;
  const regionsInteractive =
    clickRegion !== undefined || onSelectedRegionChange !== undefined || defaultSelectedRegion !== undefined;
  const markersInteractive = clickMarker !== undefined;
  const interactive = regionsInteractive || markersInteractive;
  const regionMark = (index: number) => `region:${index}`;
  const marks = [
    ...(regionsInteractive ? entries.map((_, index) => regionMark(index)) : []),
    ...(markersInteractive ? placedMarkers.map((marker) => marker.key) : []),
  ];
  const selectedIndex = entries.findIndex((entry) => entry.region.id === currentSelectedRegion);
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
    announceHover(mark);
  }

  function announceHover(mark: string | null) {
    const entry = entryOfMark(mark);
    const marker = markerOfMark(mark);

    onHover?.(entry ? { kind: 'region', ...regionEvent(entry) } : marker ? { kind: 'marker', ...markerEvent(marker) } : null);
    onHoverRegion?.(entry?.region.id ?? null);
  }

  function activate(mark: string | null) {
    const entry = entryOfMark(mark);
    const marker = markerOfMark(mark);

    if (entry && regionsInteractive) {
      setTabStopMark(mark);
      clickRegion?.(regionEvent(entry));
      if (regionSelectable) {
        selectRegion(entry.region.id === currentSelectedRegion ? null : entry.region.id);
      }
    } else if (marker && clickMarker) {
      setTabStopMark(mark);
      clickMarker(markerEvent(marker));
    }
  }

  function selectRegion(id: string | null) {
    if (selectedRegion === undefined) {
      setInternalSelectedRegion(id);
    }
    onSelectedRegionChange?.(id);
  }

  /** O centro da marca na area de desenho, mesmo fora da vista. */
  function anchorOf(mark: string): Point {
    const entry = entryOfMark(mark);
    const marker = markerOfMark(mark);

    return entry && projection ? geoPath(projection).centroid(entry.region.shape) : marker ? [marker.x, marker.y] : [0, 0];
  }

  /** A marca focada pelo teclado fora da vista leva a vista ate ela. */
  function revealMark(mark: string | null, target: Element) {
    if (!viewport || !activeView || !mark || !isKeyboardFocus(target)) {
      return;
    }

    const [x, y] = anchorOf(mark);

    if (Number.isFinite(x) && Number.isFinite(y) && (x < 0 || x > viewport.width || y < 0 || y > viewport.height)) {
      commitView(centerView(viewport, activeView, [x, y]));
    }
  }

  /** A marca vizinha na direcao da seta, pelo centro de cada uma. */
  function neighbor(from: string, [dx, dy]: readonly [number, number]) {
    if (!projection) {
      return undefined;
    }

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

    // Com o mapa aproximado, Shift com a seta arrasta a vista em vez de percorrer as marcas.
    if (!mark || !marks.includes(mark) || (zoomable && event.shiftKey)) {
      return;
    }

    if (blockRepeatedPress(event)) {
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
      announceHover(null);
    },
    onClick: (event: SyntheticEvent) => activate(markFrom(event)),
    onFocus: (event: SyntheticEvent) => {
      const mark = markFrom(event);
      setFocusedMark(mark);
      setTabStopMark(mark);
      announceHover(mark);
      revealMark(mark, event.target as Element);
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
        const dimmed = isDimmed(entry.key, highlightedKey);

        return (
          <path
            aria-label={entry.description}
            aria-pressed={regionsInteractive && regionSelectable ? entry.region.id === currentSelectedRegion : undefined}
            className={`${styles.region} ${regionsInteractive ? styles.clickable : ''} ${dimmed ? styles.dimmed : ''}`}
            d={paths.get(entry.region.id)}
            data-mark={mark}
            fill={entry.hidden ? HIDDEN_FILL : (entry.fill ?? noDataFill)}
            key={index}
            role={regionsInteractive ? 'button' : 'graphics-symbol'}
            strokeWidth={strokeWidth}
            tabIndex={regionsInteractive ? (mark === tabStop ? 0 : -1) : undefined}
          />
        );
      }),
    [currentSelectedRegion, entries, highlightedKey, noDataFill, paths, regionSelectable, regionsInteractive, strokeWidth, tabStop],
  );
  // A divisa passa por cima do preenchimento e da borda da regiao; a borda volta por cima para continuar mandando.
  const regionBorders = useMemo(
    () =>
      subdivisionPath &&
      [
        ...context.map((region, index) => <path className={styles.border} d={paths.get(region.id)} key={`c${index}`} strokeWidth={strokeWidth} />),
        ...entries.map((entry, index) => (
          <path
            className={`${styles.border} ${isDimmed(entry.key, highlightedKey) ? styles.dimmed : ''}`}
            d={paths.get(entry.region.id)}
            key={index}
            strokeWidth={strokeWidth}
          />
        )),
      ],
    [context, entries, highlightedKey, paths, strokeWidth, subdivisionPath],
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
    const hint = [
      interactive ? ' Use as setas para percorrer as marcas.' : '',
      zoomable ? ' Use + e - para aproximar e afastar, 0 para voltar ao enquadramento e Shift com as setas para arrastar.' : '',
    ].join('');

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

  const clip = moved ? `url(#${clipId})` : undefined;
  const zoomClass = zoomable ? `${styles.zoomable} ${gestures.dragging ? styles.dragging : ''}` : '';

  const svg = projection && (
    <svg
      aria-describedby={summaryId}
      aria-labelledby={titleId}
      className={`${styles.canvas} ${fillHeight ? styles.canvasFill : ''} ${zoomClass}`}
      height={plotHeight}
      ref={svgRef}
      role={interactive ? 'group' : 'img'}
      tabIndex={zoomable && !interactive ? 0 : undefined}
      viewBox={`0 0 ${width} ${plotHeight}`}
      width={width}
      {...(viewport ? gestures.props : undefined)}
    >
      <defs>
        <NoDataHatch id={hatchId} />
        {zoomable && (
          <clipPath id={clipId}>
            <rect height={plotHeight} width={drawingWidth} />
          </clipPath>
        )}
      </defs>

      <g aria-hidden="true" className={styles.passThrough} clipPath={clip}>
        {contextShapes}
      </g>

      <g clipPath={clip} {...markHandlers}>
        {regionShapes}
      </g>

      {subdivisionPath && (
        <g aria-hidden="true" className={styles.passThrough} clipPath={clip}>
          <path className={styles.subdivision} d={subdivisionPath} strokeWidth={Math.min(strokeWidth, strokeWidthFor(subdivisionOutlines.length)) * SUBDIVISION_RATIO} />
          {regionBorders}
        </g>
      )}

      <g aria-hidden="true" className={styles.passThrough} clipPath={clip}>
        {selectedIndex >= 0 && (
          <path className={styles.selectedOutline} d={paths.get(entries[selectedIndex].region.id)} />
        )}
        {hoveredEntry && <path className={styles.hoverOutline} d={paths.get(hoveredEntry.region.id)} />}
        {focusedEntry && <path className={styles.focusOutline} d={paths.get(focusedEntry.region.id)} />}
      </g>

      <g clipPath={clip} {...markHandlers}>
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

      <g aria-hidden="true" className={styles.passThrough} clipPath={clip}>
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

  const legendView = shownLegend !== 'none' && (
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
      position={shownLegend}
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
      selected: entry.region.id === currentSelectedRegion,
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
  const { figureProps, titleClassName } = chartRoot(root, {
    figure: fillHeight ? `${styles.figure} ${chartStyles.figure} ${styles.figureFill}` : `${styles.figure} ${chartStyles.figure}`,
    title: chartStyles.title,
  });

  return (
    <figure {...figureProps}>
      <figcaption className={styles.header}>
        <span className={styles.heading}>
          <span className={titleClassName} id={titleId}>
            {title}
          </span>
          {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        </span>
        {showTableToggle && !empty && (outer.width === 0 || outer.width >= TABLE_TOGGLE_MIN_WIDTH) && (
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
        {shownLegend === 'top' && !tableView && !empty && legendView}

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
          <div className={`${styles.plot} ${fillHeight ? styles.plotFill : ''} ${zoomable ? styles.plotZoomable : ''}`} ref={plot.ref} {...touch.props}>
            {svg && (showTooltip ? <ChartTooltip {...tooltip}>{svg}</ChartTooltip> : svg)}
            {viewport && activeView && (
              <>
                {(outer.width === 0 || outer.width >= TABLE_TOGGLE_MIN_WIDTH) && (
                  <ChartMapZoomControls
                    canReset={moved}
                    canZoomIn={activeView.scale < viewport.maxScale}
                    canZoomOut={activeView.scale > 1}
                    onReset={() => commitView(initialView(viewport))}
                    onZoomIn={() => commitView(zoomView(viewport, activeView, ZOOM_STEP, [viewport.width / 2, viewport.height / 2]))}
                    onZoomOut={() => commitView(zoomView(viewport, activeView, 1 / ZOOM_STEP, [viewport.width / 2, viewport.height / 2]))}
                  />
                )}
                <span className={styles.visuallyHidden} role="status">
                  {zoomAnnouncement(activeView.scale, viewChanged && !moved)}
                </span>
                {gestures.hint && (
                  <span aria-hidden="true" className={styles.zoomHint}>
                    {zoomHint()}
                  </span>
                )}
              </>
            )}
          </div>
        )}

        {(shownLegend === 'bottom' || shownLegend === 'right') && !tableView && !empty && legendView}
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
