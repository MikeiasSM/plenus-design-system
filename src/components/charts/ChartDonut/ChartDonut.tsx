import {
  RadialFrame,
  arcPath,
  chartHeight,
  fitCenterText,
  ringDiameter,
  useChartMetrics,
  useSliceRing,
  type ChartHeight,
  type ChartLegendPosition,
  type ChartSlice,
} from '../core';
import styles from './ChartDonut.module.css';

export type { ChartSlice as ChartDonutSlice };

export interface ChartDonutProps {
  accent?: string;
  /** Texto sob o valor do centro, trocado pelo rotulo da fatia sob o ponteiro. */
  centerLabel?: string;
  defaultHiddenSlices?: readonly string[];
  emptyMessage?: string;
  formatPercent?: (ratio: number) => string;
  formatValue?: (value: number) => string;
  height?: ChartHeight;
  hiddenSlices?: readonly string[];
  legend?: ChartLegendPosition;
  onHiddenSlicesChange?: (hidden: readonly string[]) => void;
  /** Rotulo da fatia que reune as pequenas. */
  otherLabel?: string;
  /** Raio dos cantos de cada fatia. Sem valor, o token de raio pequeno. */
  sliceRadius?: number;
  showCenter?: boolean;
  showLegendValues?: boolean;
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
  formatValue = (valor) => String(valor),
  height = 260,
  hiddenSlices,
  legend = 'right',
  onHiddenSlicesChange,
  otherLabel = 'Outros',
  showCenter = true,
  showLegendValues = true,
  sliceRadius,
  slices,
  smallSliceThreshold = 0.02,
  thickness = 0.38,
  title,
}: ChartDonutProps) {
  const { font, height: alturaMedida, radius: raioDoCanto, ref, width } = useChartMetrics();
  const { fillHeight, value: alturaDoDesenho } = chartHeight(height, alturaMedida);

  const anel = useSliceRing({
    accent,
    defaultHiddenSlices,
    hiddenSlices,
    onHiddenSlicesChange,
    otherLabel,
    slices,
    smallSliceThreshold,
  });

  const diametro = ringDiameter(width, alturaDoDesenho);
  const raio = diametro / 2;
  const raioInterno = raio * (1 - thickness);

  const canto = sliceRadius ?? raioDoCanto;
  const focada = anel.focused === null ? undefined : anel.slices[anel.focused];
  const centro = fitCenterText(
    formatValue(focada ? Math.max(focada.value, 0) : anel.total),
    focada ? focada.label : centerLabel,
    font,
    raioInterno * 2,
  );

  return (
    <RadialFrame
      containerRef={ref}
      empty={anel.slices.length === 0 || slices.every((fatia) => Math.max(fatia.value, 0) === 0)}
      emptyMessage={emptyMessage}
      fillHeight={fillHeight}
      height={alturaDoDesenho}
      legend={anel.slices.map((fatia, indice) => ({
        color: anel.colors[indice],
        hidden: anel.isHidden(fatia.label),
        label: fatia.label,
        value: showLegendValues ? formatPercent(anel.ratioOf(indice)) : undefined,
      }))}
      legendPosition={legend}
      onToggleSeries={anel.toggle}
      title={title}
      width={width}
    >
      {anel.slices.map((fatia, indice) => (
        <path
          className={styles.slice}
          d={arcPath({
            ...anel.angles[indice],
            cornerRadius: canto,
            innerRadius: raioInterno,
            outerRadius: raio,
          })}
          fill={anel.colors[indice]}
          key={fatia.label}
          onMouseEnter={() => anel.setFocused(indice)}
          onMouseLeave={() => anel.setFocused(null)}
        >
          <title>{`${fatia.label}: ${formatValue(Math.max(fatia.value, 0))} (${formatPercent(anel.ratioOf(indice))})`}</title>
        </path>
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
    </RadialFrame>
  );
}
