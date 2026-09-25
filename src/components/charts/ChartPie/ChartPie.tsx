import {
  ChartFrame,
  arcCentroid,
  arcPath,
  chartHeight,
  measureLabel,
  ringDiameter,
  useChartMetrics,
  useSliceRing,
  type ChartHeight,
  type ChartLegendAlign,
  type ChartLegendPosition,
  type ChartSlice,
} from '../core';
import styles from './ChartPie.module.css';

export type { ChartSlice as ChartPieSlice };

export interface ChartPieProps {
  accent?: string;
  defaultHiddenSlices?: readonly string[];
  emptyMessage?: string;
  formatPercent?: (ratio: number) => string;
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
  showDataLabels?: boolean;
  showLegendValues?: boolean;
  /** Raio dos cantos de cada fatia. Sem valor, o token de raio pequeno. */
  sliceRadius?: number;
  slices: readonly ChartSlice[];
  /** Fracao do total abaixo da qual a fatia entra no agrupamento. */
  smallSliceThreshold?: number;
  title: string;
}

export function ChartPie({
  accent,
  defaultHiddenSlices,
  emptyMessage = 'Sem dados no período',
  formatPercent = (fracao) => `${Math.round(fracao * 100)}%`,
  formatValue = (valor) => String(valor),
  height = 260,
  hiddenSlices,
  legend = 'bottom',
  legendAlign,
  onHiddenSlicesChange,
  onHoverSlice,
  otherLabel = 'Outros',
  showDataLabels = false,
  showLegendValues = false,
  sliceRadius,
  slices,
  smallSliceThreshold = 0.02,
  title,
}: ChartPieProps) {
  const { font, height: alturaMedida, radius: raioDoCanto, ref, width } = useChartMetrics();
  const { fillHeight, value: alturaDoDesenho } = chartHeight(height, alturaMedida);

  const anel = useSliceRing({
    accent,
    defaultHiddenSlices,
    hiddenSlices,
    onHiddenSlicesChange,
    onHoverSlice,
    otherLabel,
    slices,
    smallSliceThreshold,
  });

  const raio = ringDiameter(width, alturaDoDesenho) / 2;
  const canto = sliceRadius ?? raioDoCanto;

  return (
    <ChartFrame
      centerOrigin
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
      legendAlign={legendAlign}
      legendPosition={legend}
      onToggleSeries={anel.toggle}
      swatch="dot"
      title={title}
      width={width}
    >
      {anel.slices.map((fatia, indice) => (
        <path
          className={styles.slice}
          d={arcPath({ ...anel.angles[indice], cornerRadius: canto, innerRadius: 0, outerRadius: raio })}
          fill={anel.colors[indice]}
          key={fatia.label}
          onMouseEnter={() => anel.focus(indice)}
          onMouseLeave={() => anel.focus(null)}
        >
          <title>{`${fatia.label}: ${formatValue(Math.max(fatia.value, 0))} (${formatPercent(anel.ratioOf(indice))})`}</title>
        </path>
      ))}

      {showDataLabels &&
        anel.slices.map((fatia, indice) => {
          const rotulo = formatPercent(anel.ratioOf(indice));
          const [x, y] = arcCentroid({ ...anel.angles[indice], innerRadius: 0, outerRadius: raio });
          const angulo = anel.angles[indice].endAngle - anel.angles[indice].startAngle;

          // O rotulo so entra quando a fatia o comporta. Ate meia volta a
          // largura disponivel e a corda no centro do arco; dali em diante a
          // corda volta a encolher, e quem manda e o raio.
          const disponivel =
            angulo >= Math.PI ? raio : 2 * (raio / 2) * Math.sin(angulo / 2);

          if (anel.isHidden(fatia.label) || measureLabel(rotulo, font) > disponivel) {
            return null;
          }

          return (
            <text
              className={styles.sliceLabel}
              dominantBaseline="middle"
              key={fatia.label}
              textAnchor="middle"
              x={x}
              y={y}
            >
              {rotulo}
            </text>
          );
        })}
    </ChartFrame>
  );
}
