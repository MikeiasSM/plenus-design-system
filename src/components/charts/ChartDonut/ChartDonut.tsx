import {
  ChartFrame,
  arcPath,
  chartHeight,
  fitCenterText,
  ringDiameter,
  useChartMetrics,
  sliceTooltip,
  useSliceRing,
  type ChartHeight,
  type ChartLegendAlign,
  type ChartLegendPosition,
  type ChartRootProps,
  type ChartSlice,
} from '../core';
import type { ChartPalette } from '../palette';
import { formatarNumero } from '../../../utils/formatters';
import styles from './ChartDonut.module.css';

export type { ChartSlice as ChartDonutSlice };

export interface ChartDonutProps extends ChartRootProps {
  accent?: string;
  /** Texto sob o valor do centro, trocado pelo rotulo da fatia sob o ponteiro. */
  centerLabel?: string;
  defaultHiddenSlices?: readonly string[];
  emptyMessage?: string;
  formatPercent?: (ratio: number) => string;
  /** Formato dos valores no balao. Sem ele, vale o `formatValue`: o eixo pode sair compacto e o balao, exato. */
  formatTooltipValue?: (value: number) => string;
  formatValue?: (value: number) => string;
  height?: ChartHeight;
  hiddenSlices?: readonly string[];
  legend?: ChartLegendPosition;
  legendAlign?: ChartLegendAlign;
  onHiddenSlicesChange?: (hidden: readonly string[]) => void;
  /** Fatia sob o ponteiro, ja agrupada, ou `null` ao sair dela. */
  onHoverSlice?: (slice: ChartSlice | null) => void;
  /** Rotulo da fatia que reune as pequenas. */
  otherLabel?: string;
  /** Cores das series sem cor propria: lista em rotacao ou `{ base }`, que gera os tons. Vence o `accent`. */
  palette?: ChartPalette;
  /** Raio dos cantos de cada fatia. Sem valor, o token de raio pequeno. */
  sliceRadius?: number;
  showCenter?: boolean;
  showLegendValues?: boolean;
  /** Balao com a fatia sob o ponteiro, o valor e a parte do total. Desligue para montar o proprio `ChartTooltip`. */
  showTooltip?: boolean;
  slices: readonly ChartSlice[];
  /** Fracao do total abaixo da qual a fatia entra no agrupamento. */
  smallSliceThreshold?: number;
  /** Espessura do anel, como fracao do raio. */
  thickness?: number;
  title: string;
}

export function ChartDonut({
  accent,
  centerLabel = 'Total',
  defaultHiddenSlices,
  emptyMessage = 'Sem dados no período',
  formatPercent = (fracao) => `${Math.round(fracao * 100)}%`,
  formatTooltipValue,
  formatValue = formatarNumero,
  height = 260,
  hiddenSlices,
  legend = 'right',
  legendAlign,
  onHiddenSlicesChange,
  onHoverSlice,
  otherLabel = 'Outros',
  palette,
  showCenter = true,
  showLegendValues = true,
  showTooltip = true,
  sliceRadius,
  slices,
  smallSliceThreshold = 0.02,
  thickness = 0.38,
  title,
  ...root
}: ChartDonutProps) {
  const { font, height: alturaMedida, radius: raioDoCanto, ref, width } = useChartMetrics();
  const { fillHeight, value: alturaDoDesenho } = chartHeight(height, alturaMedida);

  const anel = useSliceRing({
    accent,
    palette,
    defaultHiddenSlices,
    hiddenSlices,
    onHiddenSlicesChange,
    onHoverSlice,
    otherLabel,
    slices,
    smallSliceThreshold,
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

  return (
    <ChartFrame
      centerOrigin
      containerRef={ref}
      empty={anel.slices.length === 0 || slices.every((fatia) => !(fatia.value > 0))}
      emptyMessage={emptyMessage}
      fillHeight={fillHeight}
      height={alturaDoDesenho}
      legend={anel.slices.map((fatia, indice) => ({
        color: anel.colors[indice],
        hidden: anel.isHidden(fatia.label),
        label: fatia.label,
        value: showLegendValues ? formatPercent(anel.ratioOf(indice)) : undefined,
      }))}
      legendAlign={legendAlign}
      legendPosition={legend}
      onToggleSeries={anel.toggle}
      root={root}
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
      width={width}
    >
      {anel.slices.map((fatia, indice) => (
        <path
          aria-label={`${fatia.label}: ${formatValue(Math.max(fatia.value, 0))} (${formatPercent(anel.ratioOf(indice))})`}
          className={styles.slice}
          d={arcPath({
            ...anel.angles[indice],
            cornerRadius: canto,
            innerRadius: raioInterno,
            outerRadius: raio,
          })}
          fill={anel.colors[indice]}
          key={indice}
          onMouseEnter={() => anel.focus(indice)}
          onMouseLeave={() => anel.focus(null)}
        />
      ))}

      {showCenter && (
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
