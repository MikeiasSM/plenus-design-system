import {
  ChartTable,
  shareTable,
  ChartFrame,
  arcPath,
  chartHeight,
  fitCenterText,
  ringDiameter,
  useChartMetrics,
  useRingFit,
  sliceTooltip,
  useSliceRing,
  type ChartHeight,
  type ChartHoverDetails,
  type ChartLegendAlign,
  type ChartLegendPosition,
  type ChartRootProps,
  type ChartSlice,
} from '../core';
import type { ChartPalette } from '../palette';
import { formatNumber } from '../../../utils/formatters';
import styles from './ChartDonut.module.css';

export type { ChartSlice as ChartDonutSlice };

export interface ChartDonutProps extends Omit<ChartRootProps, 'hidden'> {
  accent?: string;
  /** Texto sob o valor do centro, trocado pelo rotulo da fatia sob o ponteiro. */
  centerLabel?: string;
  /** Fatias ocultas de inicio, enquanto o produto nao controla `hidden`. */
  defaultHidden?: readonly string[];
  /** @deprecated Use `defaultHidden`. Aceito ate a 0.7.0; com os dois, vale o novo. */
  defaultHiddenSlices?: readonly string[];
  emptyMessage?: string;
  formatPercent?: (ratio: number) => string;
  /** Formato dos valores no balao. Sem ele, vale o `formatValue`: o eixo pode sair compacto e o balao, exato. */
  formatTooltipValue?: (value: number) => string;
  formatValue?: (value: number) => string;
  height?: ChartHeight;
  /** Rotulos das fatias desligadas pela legenda (controlado). Substitui o `hidden` nativo da figure. */
  hidden?: readonly string[];
  /** @deprecated Use `hidden`. Aceito ate a 0.7.0; com os dois, vale o novo. */
  hiddenSlices?: readonly string[];
  legend?: ChartLegendPosition;
  legendAlign?: ChartLegendAlign;
  /** @deprecated Use `onHiddenChange`. Aceito ate a 0.7.0. */
  onHiddenSlicesChange?: (hidden: readonly string[]) => void;
  /** Rotulos ocultos, a cada alternancia da legenda. */
  onHiddenChange?: (hidden: readonly string[]) => void;
  /**
   * Fatia sob o ponteiro, o foco ou a entrada da legenda, ja agrupada, ou `null` ao sair. Da legenda, que nao
   * tem ponteiro, vem o segundo argumento: a cor desenhada e o ponto onde ancorar o `ChartTooltip`.
   */
  onHover?: (slice: ChartSlice | null, details?: ChartHoverDetails) => void;
  /** @deprecated Use `onHover`. Aceito ate a 0.7.0. */
  onHoverSlice?: (slice: ChartSlice | null, details?: ChartHoverDetails) => void;
  /** Torna as fatias botoes, percorridas pelas setas. Recebe a fatia ja agrupada. */
  onMarkClick?: (slice: ChartSlice) => void;
  /** @deprecated Use `onMarkClick`. Aceito ate a 0.7.0. */
  onSliceClick?: (slice: ChartSlice) => void;
  /** Rotulo da fatia que reune as pequenas. `Outros` por padrao. */
  otherLabel?: string;
  /** Cores das series sem cor propria: lista em rotacao ou `{ base }`, que gera os tons. Vence o `accent`. */
  palette?: ChartPalette;
  /** Raio dos cantos de cada fatia. Sem valor, o token de raio pequeno. */
  sliceRadius?: number;
  showCenter?: boolean;
  showLegendValues?: boolean;
  /** Botao "Ver como tabela". Sem a prop, vale o do `ChartsProvider`, ligado por padrao. */
  showTableToggle?: boolean;
  /** Balao com a fatia sob o ponteiro, o valor e a parte do total. Desligue para montar o proprio `ChartTooltip`. */
  showTooltip?: boolean;
  slices: readonly ChartSlice[];
  /** Fracao do total abaixo da qual a fatia entra no agrupamento, 0,02 por padrao. A regra e o `groupSmallSlices`. */
  smallSliceThreshold?: number;
  /** Espessura do anel, como fracao do raio. */
  thickness?: number;
  title: string;
}

export function ChartDonut({
  accent,
  centerLabel = 'Total',
  defaultHidden,
  defaultHiddenSlices,
  emptyMessage = 'Sem dados no período',
  formatPercent = (fracao) => `${Math.round(fracao * 100)}%`,
  formatTooltipValue,
  formatValue = formatNumber,
  height = 260,
  hidden,
  hiddenSlices,
  legend = 'right',
  legendAlign,
  onHiddenChange,
  onHiddenSlicesChange,
  onHover,
  onHoverSlice,
  onMarkClick,
  onSliceClick,
  otherLabel,
  palette,
  showCenter = true,
  showLegendValues = true,
  showTableToggle,
  showTooltip = true,
  sliceRadius,
  slices,
  smallSliceThreshold,
  thickness = 0.38,
  title,
  ...root
}: ChartDonutProps) {
  const { font, height: alturaMedida, radius: raioDoCanto, ref, width } = useChartMetrics();
  const { fillHeight, value: alturaDoDesenho } = chartHeight(height, alturaMedida);

  const anel = useSliceRing({
    accent,
    palette,
    defaultHidden: defaultHidden ?? defaultHiddenSlices,
    hidden: hidden ?? hiddenSlices,
    onHiddenChange: (ocultas) => {
      onHiddenChange?.(ocultas);
      onHiddenSlicesChange?.(ocultas);
    },
    onHover:
      onHover || onHoverSlice
        ? (...aviso) => {
            onHover?.(...aviso);
            onHoverSlice?.(...aviso);
          }
        : undefined,
    onMarkClick:
      onMarkClick || onSliceClick
        ? (fatia) => {
            onMarkClick?.(fatia);
            onSliceClick?.(fatia);
          }
        : undefined,
    otherLabel,
    slices,
    smallSliceThreshold,
  });

  const entradasDaLegenda = anel.slices.map((fatia, indice) => ({
    active: anel.focused === indice,
    color: anel.colors[indice],
    hidden: anel.isHidden(fatia.label),
    label: fatia.label,
    value: showLegendValues ? formatPercent(anel.ratioOf(indice)) : undefined,
  }));
  const removed = useRingFit({
    center: showCenter ? { innerShare: 1 - Math.min(Math.max(thickness, 0), 1), value: formatValue(anel.total) } : undefined,
    fillHeight,
    font,
    height: alturaDoDesenho,
    legend: entradasDaLegenda,
    legendPosition: legend,
    width,
  });

  const diametro = ringDiameter(width, alturaDoDesenho);
  const raio = diametro / 2;
  const raioInterno = raio * (1 - Math.min(Math.max(thickness, 0), 1));

  const canto = sliceRadius ?? raioDoCanto;
  const focada = anel.focused === null ? undefined : anel.slices[anel.focused];
  const centro = fitCenterText(
    formatValue(focada ? Math.max(focada.value, 0) : anel.total),
    focada ? focada.label : centerLabel,
    font,
    raioInterno * 2,
  );

  const destaqueDe = (indice: number) =>
    anel.focused === null || anel.focused === indice ? styles.slice : `${styles.slice} ${styles.sliceDim}`;

  return (
    <ChartFrame
      canvasRole={anel.marks.interactive ? 'group' : 'img'}
      centerOrigin
      containerRef={ref}
      empty={anel.slices.length === 0 || slices.every((fatia) => !(fatia.value > 0))}
      emptyMessage={emptyMessage}
      fillHeight={fillHeight}
      height={alturaDoDesenho}
      legend={entradasDaLegenda}
      legendAlign={legendAlign}
      legendPosition={removed.has('legend') ? 'none' : legend}
      onHighlightSeries={anel.highlight}
      onToggleSeries={anel.toggle}
      root={root}
      showTableToggle={showTableToggle}
      table={
        <ChartTable {...shareTable(anel.slices, formatValue, formatPercent)} title={title} />
      }
      swatch="dot"
      title={title}
      tooltip={
        showTooltip
          ? sliceTooltip({
              colors: anel.colors,
              formatPercent,
              formatValue: formatTooltipValue ?? formatValue,
              index: anel.focused,
              slices: anel.slices,
              total: anel.total,
            })
          : undefined
      }
      tooltipAnchor={anel.marks.tooltipAnchor}
      width={width}
    >
      <g {...anel.marks.groupProps}>
      {anel.slices.map((fatia, indice) => (
        <path
          {...anel.marks.markProps({ column: indice, row: 0 }, destaqueDe(indice))}
          aria-label={`${fatia.label}: ${formatValue(Math.max(fatia.value, 0))} (${formatPercent(anel.ratioOf(indice))})`}
          d={arcPath({
            ...anel.angles[indice],
            cornerRadius: canto,
            innerRadius: raioInterno,
            outerRadius: raio,
          })}
          fill={anel.colors[indice]}
          key={indice}
          onMouseEnter={() => anel.focus(indice)}
          onMouseLeave={() => anel.release(indice)}
        />
      ))}
      </g>

      {showCenter && !removed.has('centerText') && (
        <g className={styles.center}>
          <text
            className={styles.centerValue}
            dy={centro.size * 0.1}
            style={{ fontFamily: centro.family, fontSize: centro.size }}
            textAnchor="middle"
          >
            {centro.value}
          </text>
          <text className={styles.centerLabel} dy={centro.lineHeight * 0.62} textAnchor="middle">
            {centro.label}
          </text>
        </g>
      )}
    </ChartFrame>
  );
}
