import {
  ChartFrame,
  arcCentroid,
  arcPath,
  chartHeight,
  measureLabel,
  ringDiameter,
  sliceTooltip,
  useChartMetrics,
  useSliceRing,
  type ChartHeight,
  type ChartLegendAlign,
  type ChartLegendPosition,
  type ChartRootProps,
  type ChartSlice,
} from '../core';
import { textColorOn, type ChartPalette } from '../palette';
import { formatarNumero } from '../../../utils/formatters';
import styles from './ChartPie.module.css';

export type { ChartSlice as ChartPieSlice };

export interface ChartPieProps extends ChartRootProps {
  accent?: string;
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
  /** Torna as fatias botoes, percorridas pelas setas. Recebe a fatia ja agrupada. */
  onSliceClick?: (slice: ChartSlice) => void;
  /** Fatia sob o ponteiro, ja agrupada, ou `null` ao sair dela. */
  onHoverSlice?: (slice: ChartSlice | null) => void;
  /** Rotulo da fatia que reune as pequenas. */
  otherLabel?: string;
  /** Cores das series sem cor propria: lista em rotacao ou `{ base }`, que gera os tons. Vence o `accent`. */
  palette?: ChartPalette;
  showDataLabels?: boolean;
  showLegendValues?: boolean;
  /** Balao com a fatia sob o ponteiro, o valor e a parte do total. Desligue para montar o proprio `ChartTooltip`. */
  showTooltip?: boolean;
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
  formatTooltipValue,
  formatValue = formatarNumero,
  height = 260,
  hiddenSlices,
  legend = 'bottom',
  legendAlign,
  onHiddenSlicesChange,
  onHoverSlice,
  onSliceClick,
  otherLabel = 'Outros',
  palette,
  showDataLabels = false,
  showLegendValues = false,
  showTooltip = true,
  sliceRadius,
  slices,
  smallSliceThreshold = 0.02,
  title,
  ...root
}: ChartPieProps) {
  const { font, height: alturaMedida, radius: raioDoCanto, ref, width } = useChartMetrics();
  const { fillHeight, value: alturaDoDesenho } = chartHeight(height, alturaMedida);

  const anel = useSliceRing({
    accent,
    palette,
    defaultHiddenSlices,
    hiddenSlices,
    onHiddenSlicesChange,
    onHoverSlice,
    onSliceClick,
    otherLabel,
    slices,
    smallSliceThreshold,
  });

  const raio = ringDiameter(width, alturaDoDesenho) / 2;
  const canto = sliceRadius ?? raioDoCanto;

  return (
    <ChartFrame
      canvasRole={anel.marks.interactive ? 'group' : 'img'}
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
      <g {...anel.marks.groupProps}>
      {anel.slices.map((fatia, indice) => (
        <path
          {...anel.marks.markProps({ column: indice, row: 0 }, styles.slice)}
          aria-label={`${fatia.label}: ${formatValue(Math.max(fatia.value, 0))} (${formatPercent(anel.ratioOf(indice))})`}
          d={arcPath({ ...anel.angles[indice], cornerRadius: canto, innerRadius: 0, outerRadius: raio })}
          fill={anel.colors[indice]}
          key={indice}
          onMouseEnter={() => anel.focus(indice)}
          onMouseLeave={() => anel.focus(null)}
        />
      ))}
      </g>

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
              fill={textColorOn(anel.colors[indice])}
              key={indice}
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
