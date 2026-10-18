import { useId, useState } from 'react';
import { ChartTooltip } from '../ChartTooltip';
import {
  ChartLegend,
  arcPath,
  chartHeight,
  useChartMetrics,
  useTweenedNumbers,
  type ChartHeight,
  type ChartLegendPosition,
  type MarkVisibility,
} from '../core';
import { INTENT_TOKENS, resolveSeriesColors, type SeriesAppearance, type SeriesIntent } from '../palette';
import { formatarNumero } from '../../../utils/formatters';
import { layoutGauge, pointAt, type GaugeCenterLayout, type OutsideLabel } from './gaugeLayout';
import {
  gaugeCenter,
  gaugeReading,
  gaugeValueText,
  rangeText,
  segmentName,
  segmentTooltip,
  valueTooltip,
  formatShown,
  type GaugeStatus,
  type GaugeTooltip,
} from './gaugeReading';
import {
  clampToDomain,
  gaugeDomain,
  gaugeOrigin,
  gaugeSegments,
  isNumber,
  majorTicks,
  segmentAt,
  targetBase,
  tickLabelPriority,
} from './gaugeScale';
import styles from './ChartGauge.module.css';

/** Uma faixa da escala. A cor segue a regra da família: `color`, depois `intent`, depois a paleta. */
export interface ChartGaugeSegment extends SeriesAppearance {
  label?: string;
  /** Limite superior, na unidade de `segmentUnit`. Omitido na última faixa, vai até `max`. */
  to?: number;
}

export interface ChartGaugeTarget {
  label?: string;
  value: number;
}

export interface ChartGaugeDelta {
  /** Formato do módulo da variação; o sinal é do componente. */
  format?: (delta: number) => string;
  /** Sem ela, positiva quando sobe e negativa quando desce. */
  intent?: SeriesIntent;
  label?: string;
  value: number;
}

export type ChartGaugeIndicator = 'fill' | 'needle' | 'fillAndNeedle';
export type ChartGaugeSegmentStyle = 'track' | 'rim' | 'hidden';
export type ChartGaugeScaleLabels = 'hidden' | 'minMax' | 'ticks';
export type ChartGaugeSize = 'default' | 'compact';
export type ChartGaugeTicks = 'hidden' | 'major' | 'majorAndMinor';
/** Leitura contra a meta: a mesma palavra na exibição e na unidade das faixas. */
export type ChartGaugeValueDisplay = 'value' | 'percentOfTarget';
export type ChartGaugeSegmentUnit = 'value' | 'percentOfTarget';

export interface ChartGaugeProps {
  accent?: string;
  /** Troca a frase montada do `aria-valuetext`. */
  ariaValueText?: string;
  /** Texto sob o valor. Sem ele, na leitura contra a meta, a outra leitura. */
  centerLabel?: string;
  /** O arco assume a cor da faixa onde o valor está. */
  colorBySegment?: boolean;
  /** Cor do arco fora de `colorBySegment`. Vence `intent`. */
  color?: string;
  delta?: ChartGaugeDelta;
  emptyMessage?: string;
  /** Ângulo final, em graus a partir do topo. */
  endAngle?: number;
  /** Formato exato do balão e, na leitura contra a meta, do `aria-valuetext`. */
  formatTooltipValue?: (value: number) => string;
  /** Formato do centro, da escala e da meta. */
  formatValue?: (value: number) => string;
  height?: ChartHeight;
  indicator?: ChartGaugeIndicator;
  intent?: SeriesIntent;
  legend?: ChartLegendPosition;
  loading?: boolean;
  /** Fim da escala. Omitido com meta, vai a 120% dela. */
  max?: number;
  min?: number;
  /** De onde o arco preenchido parte. Sem ele, o zero quando a escala o cruza; senão, `min`. */
  origin?: number;
  scaleLabels?: ChartGaugeScaleLabels;
  segmentStyle?: ChartGaugeSegmentStyle;
  segmentUnit?: ChartGaugeSegmentUnit;
  segments?: readonly ChartGaugeSegment[];
  showCenter?: boolean;
  showSegmentLabels?: MarkVisibility;
  showTooltip?: boolean;
  size?: ChartGaugeSize;
  /** Ângulo inicial, em graus a partir do topo. */
  startAngle?: number;
  target?: ChartGaugeTarget;
  /** Espessura do arco, em pixels. No compacto, até 10. */
  thickness?: number;
  tickCount?: number;
  ticks?: ChartGaugeTicks;
  title: string;
  /** Raio das pontas, limitado a metade da espessura. Sem valor, o token de raio pequeno. */
  trackRadius?: number;
  /** `null` é sem dado. */
  value: number | null;
  valueDisplay?: ChartGaugeValueDisplay;
}

type Hovered = number | 'value' | null;

const COMPACT_MAX_THICKNESS = 10;
const TARGET_MARK = 4;
const NO_TOOLTIP: GaugeTooltip = { rows: [] };

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
const toDegrees = (radians: number) => (radians * 180) / Math.PI;

function radialPath(angle: number, from: number, to: number) {
  const [x1, y1] = pointAt(angle, from);
  const [x2, y2] = pointAt(angle, to);

  return `M${x1},${y1}L${x2},${y2}`;
}

/**
 * Medidor de um valor numa escala com faixas de significado. É `role="meter"`: o leitor de tela ouve o valor, a faixa,
 * a meta e a variação. Carregando ou sem dado, vira `role="img"`.
 */
export function ChartGauge({
  accent,
  ariaValueText,
  centerLabel,
  colorBySegment = false,
  color,
  delta,
  emptyMessage = 'Sem dados no período',
  endAngle = 90,
  formatTooltipValue,
  formatValue = formatarNumero,
  height,
  indicator = 'fill',
  intent,
  legend = 'none',
  loading = false,
  max,
  min,
  origin,
  scaleLabels = 'minMax',
  segmentStyle = 'track',
  segmentUnit = 'value',
  segments = [],
  showCenter = true,
  showSegmentLabels = 'hidden',
  showTooltip = true,
  size = 'default',
  startAngle = -90,
  target,
  thickness = 16,
  tickCount = 5,
  ticks = 'hidden',
  title,
  trackRadius,
  value,
  valueDisplay = 'value',
}: ChartGaugeProps) {
  const compact = size === 'compact';
  const { font, height: measuredHeight, radius: tokenRadius, ref, width } = useChartMetrics();
  const { fillHeight, value: drawingHeight } = chartHeight(height ?? (compact ? 96 : 220), measuredHeight);
  const clipId = useId().replace(/[^\w-]/g, '');
  const [hovered, setHovered] = useState<Hovered>(null);

  const measured = !loading && isNumber(value) ? value : null;
  const status: GaugeStatus = loading ? 'loading' : measured === null ? 'empty' : 'value';
  const domain = gaugeDomain(min, max, target);
  const base = targetBase(target);
  const reading = gaugeReading({ base, formatTooltipValue, formatValue, segmentUnit, valueDisplay });
  const unit = segmentUnit === 'percentOfTarget' && base !== null ? base : 1;
  const bands = gaugeSegments(segments, domain, { accent, unit });
  const start = gaugeOrigin(origin, domain);
  const reached = measured === null ? start : clampToDomain(measured, domain);
  const [tweened = reached] = useTweenedNumbers([reached]);
  const shown = clampToDomain(tweened, domain);
  const current = measured === null ? undefined : segmentAt(bands, reached);
  const arcColor = resolveSeriesColors([{ color, intent }], { accent })[0];

  const startRadians = toRadians(startAngle);
  const endRadians = toRadians(endAngle);
  const angleOf = (at: number) =>
    startRadians + ((clampToDomain(at, domain) - domain.min) / (domain.max - domain.min)) * (endRadians - startRadians);

  const showFill = indicator !== 'needle';
  const needle = indicator !== 'fill' && status === 'value';
  const rim = segmentStyle === 'rim' && bands.length > 0 && status !== 'loading';
  const trackBands = segmentStyle === 'track' && bands.length > 0 && status !== 'loading';
  const rimGap = compact ? 2 : 3;
  const rimWidth = compact ? 3 : 4;
  const shownTarget = target && isNumber(target.value) && status !== 'loading' ? target : undefined;
  const tickMode = compact ? 'hidden' : ticks;
  const scaleMode = compact ? 'hidden' : scaleLabels;
  const segmentLabels = compact ? 'hidden' : showSegmentLabels;
  const majors = majorTicks(domain, tickCount, reading.showsPercent ? base : null);

  const outsideLabels: OutsideLabel[] = [
    ...(segmentLabels === 'hidden' ? [] : bands)
      .filter((band) => band.label)
      .map((band) => ({ angle: angleOf((band.from + band.to) / 2), kind: 'segment' as const, text: band.label! })),
    ...(shownTarget && !compact
      ? [{ angle: angleOf(shownTarget.value), kind: 'target' as const, text: `${shownTarget.label || 'Meta'} ${formatValue(shownTarget.value)}` }]
      : []),
  ];

  const center = gaugeCenter({
    centerLabel,
    compact,
    delta,
    domain,
    emptyMessage,
    reading,
    showCenter,
    status,
    value: measured ?? 0,
  });

  const valueText =
    measured === null
      ? undefined
      : (ariaValueText ?? gaugeValueText({ delta, domain, reading, segment: current, target, value: measured }));
  const accessibleName =
    status === 'loading'
      ? `${title}: carregando`
      : status === 'empty'
        ? `${title}: ${emptyMessage.toLocaleLowerCase('pt-BR')}`
        : title;

  function tooltip(): GaugeTooltip {
    if (measured === null || hovered === null) {
      return NO_TOOLTIP;
    }

    if (hovered === 'value') {
      const tipColor = colorBySegment && current ? current.color : arcColor;
      return valueTooltip({ color: tipColor, delta, domain, reading, segment: current, target, title, value: measured });
    }

    return segmentTooltip({ current, reading, segment: bands[hovered], target, value: measured });
  }

  const outerBand = (rim ? rimGap + rimWidth : 0) + (shownTarget ? TARGET_MARK : 0);

  function drawing() {
    const layout = layoutGauge({
      center,
      compact,
      endAngle: endRadians,
      font,
      height: drawingHeight,
      minMaxLabels: [
        { angle: startRadians, text: formatShown(reading, domain.min) },
        { angle: endRadians, text: formatShown(reading, domain.max) },
      ],
      needle,
      outerBand,
      outsideLabels,
      scaleLabels: scaleMode,
      startAngle: startRadians,
      thickness: compact ? Math.min(thickness, COMPACT_MAX_THICKNESS) : thickness,
      tickLabels: tickLabelPriority(majors, base).map((index) => ({
        angle: angleOf(majors[index]),
        text: formatShown(reading, majors[index]),
      })),
      ticks: tickMode,
      width,
    });
    const { innerRadius, radius } = layout;
    const corner = Math.max(0, Math.min(trackRadius ?? tokenRadius, layout.thickness / 2));
    const ring = (from: number, to: number, inner = innerRadius, outer = radius) =>
      arcPath({ endAngle: to, innerRadius: inner, outerRadius: outer, startAngle: from });
    const trackPath = arcPath({
      cornerRadius: corner,
      endAngle: endRadians,
      innerRadius,
      outerRadius: radius,
      startAngle: startRadians,
    });
    const bandOpacity = status !== 'value' ? 0.5 : showFill ? 0.32 : 1;
    const bandClass = (index: number) =>
      `${styles.segment} ${hovered === index ? styles.segmentHot : typeof hovered === 'number' ? styles.segmentDimmed : ''}`;
    const fillStart = angleOf(start);
    const fillEnd = angleOf(shown);
    const fillColor = colorBySegment ? (segmentAt(bands, shown)?.color ?? arcColor) : arcColor;
    const hitInner = innerRadius - 4;
    const hitOuter = radius + outerBand + 3;
    const describe = (text: string) => (showTooltip ? null : <title>{text}</title>);

    return (
      <svg
        aria-busy={status === 'loading' || undefined}
        aria-label={accessibleName}
        aria-valuemax={measured === null ? undefined : domain.max}
        aria-valuemin={measured === null ? undefined : domain.min}
        aria-valuenow={measured === null ? undefined : reached}
        aria-valuetext={valueText}
        className={styles.canvas}
        height={drawingHeight}
        role={measured === null ? 'img' : 'meter'}
        viewBox={`0 0 ${width} ${drawingHeight}`}
        width={width}
      >
        <defs>
          <clipPath id={clipId}>
            <path d={trackPath} />
          </clipPath>
        </defs>

        <g transform={`translate(${layout.cx} ${layout.cy})`}>
          <g className={status === 'loading' ? styles.loading : undefined}>
            <path className={styles.track} d={trackPath} />
            {trackBands && (
              <g clipPath={`url(#${clipId})`}>
                {bands.map((band, index) => (
                  <path
                    className={bandClass(index)}
                    d={ring(angleOf(band.from), angleOf(band.to))}
                    fill={band.color}
                    key={index}
                    opacity={bandOpacity}
                  />
                ))}
                {bands.slice(1).map((band, index) => (
                  <path className={styles.separator} d={radialPath(angleOf(band.from), innerRadius, radius)} key={index} />
                ))}
              </g>
            )}
          </g>

          {rim && (
            <g>
              {bands.map((band, index) => (
                <path
                  className={bandClass(index)}
                  d={ring(angleOf(band.from), angleOf(band.to), radius + rimGap, radius + rimGap + rimWidth)}
                  fill={band.color}
                  key={index}
                  opacity={status === 'value' ? 1 : 0.5}
                />
              ))}
              {bands.slice(1).map((band, index) => (
                <path
                  className={styles.separator}
                  d={radialPath(angleOf(band.from), radius + rimGap - 1, radius + rimGap + rimWidth + 1)}
                  key={index}
                />
              ))}
            </g>
          )}

          {tickMode !== 'hidden' && (
            <g>
              {tickMode === 'majorAndMinor' &&
                majors.slice(1).flatMap((major, index) =>
                  [1, 2, 3, 4].map((step) => (
                    <path
                      className={styles.tickMinor}
                      d={radialPath(angleOf(majors[index] + (step * (major - majors[index])) / 5), innerRadius - 3, innerRadius - 6)}
                      key={`${index}-${step}`}
                    />
                  )),
                )}
              {majors.map((major, index) => (
                <path className={styles.tickMajor} d={radialPath(angleOf(major), innerRadius - 3, innerRadius - 9)} key={index} />
              ))}
            </g>
          )}

          {layout.scaleLabels.map(({ anchor, label, x, y }) => (
            <text
              className={styles.scaleLabel}
              dominantBaseline={scaleMode === 'ticks' ? 'central' : undefined}
              key={`${label.angle}-${label.text}`}
              textAnchor={anchor}
              x={x}
              y={y}
            >
              {label.text}
            </text>
          ))}

          {status === 'value' && start > domain.min && start < domain.max && (
            <path className={styles.originMark} d={radialPath(fillStart, innerRadius - 2, radius + 2)} />
          )}

          {showFill && status === 'value' && Math.abs(fillEnd - fillStart) > 1e-4 && (
            <path
              className={styles.fill}
              d={arcPath({
                cornerRadius: corner,
                endAngle: Math.max(fillStart, fillEnd),
                innerRadius,
                outerRadius: radius,
                startAngle: Math.min(fillStart, fillEnd),
              })}
              fill={fillColor}
            />
          )}

          {shownTarget && (
            <g>
              <path className={styles.targetOutline} d={radialPath(angleOf(shownTarget.value), innerRadius - 3, radius + outerBand)} />
              <path className={styles.targetLine} d={radialPath(angleOf(shownTarget.value), innerRadius - 3, radius + outerBand)} />
            </g>
          )}

          {layout.outsideLabels.map(({ anchor, label, x, y }) => (
            <text
              className={
                label.kind === 'target'
                  ? styles.targetLabel
                  : `${styles.segmentLabel} ${segmentLabels === 'onHover' ? styles.segmentLabelOnHover : ''}`
              }
              dominantBaseline="central"
              key={`${label.kind}-${label.angle}`}
              textAnchor={anchor}
              x={x}
              y={y}
            >
              {label.text}
            </text>
          ))}

          {needle && (
            <g>
              <path
                className={styles.needle}
                d={needlePath(showFill ? innerRadius - 5 : radius - layout.thickness * 0.3, compact ? 2.2 : 3.6)}
                transform={`rotate(${toDegrees(angleOf(shown))})`}
              />
              <circle className={styles.needle} r={layout.pinRadius} />
              <circle className={styles.pinDot} r={compact ? 1.5 : 2.6} />
            </g>
          )}

          <CenterText center={layout.center} empty={status === 'empty'} />

          {status === 'value' && (
            <g className={styles.hits} onMouseLeave={() => setHovered(null)}>
              {bands.length > 0
                ? bands.map((band, index) => (
                    <path
                      d={ring(angleOf(band.from), angleOf(band.to), hitInner, hitOuter)}
                      key={index}
                      onMouseEnter={() => setHovered(index)}
                    >
                      {describe(`${segmentName(band)}: ${rangeText(reading, band)}`)}
                    </path>
                  ))
                : (
                    <path d={ring(startRadians, endRadians, hitInner, hitOuter)} onMouseEnter={() => setHovered('value')}>
                      {describe(valueText ?? '')}
                    </path>
                  )}
              <circle onMouseEnter={() => setHovered('value')} r={Math.max(hitInner * 0.85, 8)}>
                {describe(valueText ?? '')}
              </circle>
            </g>
          )}
        </g>
      </svg>
    );
  }

  const lateral = legend === 'left' || legend === 'right';
  const legendView = legend !== 'none' && bands.length > 0 && (
    <ChartLegend
      entries={bands.map((band) => ({ color: band.color, label: segmentName(band), value: rangeText(reading, band) }))}
      position={legend}
    />
  );
  const tip = tooltip();

  return (
    <figure className={styles.figure}>
      <figcaption className={styles.title}>{title}</figcaption>

      <div className={`${styles.body} ${lateral ? styles.bodyRow : styles.bodyColumn}`}>
        {(legend === 'top' || legend === 'left') && legendView}

        <div
          className={`${styles.plot} ${fillHeight ? styles.plotFill : ''}`}
          ref={ref}
          style={fillHeight ? undefined : { minHeight: drawingHeight }}
        >
          {width === 0 || drawingHeight === 0 ? null : showTooltip ? (
            <ChartTooltip columns={[{ format: reading.formatExact }]} computed="none" {...tip}>
              {drawing()}
            </ChartTooltip>
          ) : (
            drawing()
          )}
        </div>

        {(legend === 'bottom' || legend === 'right') && legendView}
      </div>
    </figure>
  );
}

function needlePath(length: number, halfBase: number) {
  return `M${-halfBase},0L-0.8,${-length}L0.8,${-length}L${halfBase},0Z`;
}

/** Valor e linhas do centro, cada linha na sua altura dentro do bloco medido pelo layout. */
function CenterText({ center, empty }: { center: GaugeCenterLayout; empty: boolean }) {
  const valueHeight = center.value ? center.value.size : 0;

  return (
    <g className={styles.center}>
      {center.value && (
        <text
          className={`${styles.centerValue} ${empty ? styles.centerValueEmpty : ''}`}
          style={{ fontFamily: center.value.family, fontSize: center.value.size }}
          textAnchor="middle"
          y={center.top + center.value.size * 0.84}
        >
          {center.value.text}
        </text>
      )}
      {center.lines.map((line, index) => {
        const y = center.top + valueHeight + (index + 1) * center.lineHeight - 3;

        if (line.kind === 'text') {
          return (
            <text className={styles.centerLine} key={index} textAnchor="middle" y={y}>
              {line.text}
            </text>
          );
        }

        if (line.kind === 'warn') {
          return (
            <text className={styles.centerWarn} key={index} textAnchor="middle" y={y}>
              <tspan className={styles.warnGlyph}>{`${line.glyph} `}</tspan>
              {line.text}
            </text>
          );
        }

        return (
          <text className={styles.centerLine} key={index} textAnchor="middle" y={y}>
            <tspan fill={INTENT_TOKENS[line.intent]}>{`${line.glyph} `}</tspan>
            <tspan className={styles.deltaNumber}>{line.text}</tspan>
            {line.label && <tspan className={styles.deltaLabel}>{` ${line.label}`}</tspan>}
          </text>
        );
      })}
    </g>
  );
}
