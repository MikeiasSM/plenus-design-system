import type { ReactNode } from 'react';
import { Axis, type AxisOrientation, type AxisTick } from './Axis';
import { ChartFrame } from './ChartFrame';
import type { ChartLegendAlign, ChartLegendEntry, ChartLegendPosition } from './ChartLegend';
import { Grid, type GridOrientation } from './Grid';
import type { AxisLabelRotation, AxisVisibility, ChartMargins, ChartPlot } from './cartesianLayout';
import styles from './Chart.module.css';

export interface CartesianAxis {
  hideLine?: boolean;
  labelRotation?: AxisLabelRotation;
  ticks: readonly AxisTick[];
  visibility?: AxisVisibility;
}

export interface CartesianGrid {
  baseline?: number;
  lines: readonly number[];
  orientation: GridOrientation;
}

export interface CartesianFrameProps {
  children: ReactNode;
  containerRef: (node: HTMLElement | null) => void;
  empty: boolean;
  emptyMessage: string;
  fillHeight: boolean;
  grid?: readonly CartesianGrid[];
  height: number;
  legend?: readonly ChartLegendEntry[];
  legendAlign?: ChartLegendAlign;
  legendPosition: ChartLegendPosition;
  margins: ChartMargins;
  onToggleSeries?: (label: string) => void;
  plot: ChartPlot;
  title: string;
  width: number;
  xAxis: CartesianAxis;
  yAxis: CartesianAxis;
  yAxisRight?: CartesianAxis;
}

const DESLIZE: Record<AxisOrientation, string> = {
  bottom: styles.slideUp,
  left: styles.slideRight,
  right: styles.slideLeft,
};

interface EixoProps {
  axis: CartesianAxis;
  gutter: { height: number; width: number; x: number; y: number };
  length: number;
  orientation: AxisOrientation;
}

/**
 * Um eixo e a sua calha. No modo `onHover` a calha e um alvo transparente: o
 * eixo desliza para dentro dela depois de um instante de ponteiro parado, e sai
 * na hora em que o ponteiro deixa a area.
 */
function EixoComCalha({ axis, gutter, length, orientation }: EixoProps) {
  const visibility = axis.visibility ?? 'visible';

  if (visibility === 'hidden') {
    return null;
  }

  const dinamico = visibility === 'onHover';
  const eixo = (
    <Axis
      hideLine={axis.hideLine}
      labelRotation={axis.labelRotation}
      length={length}
      orientation={orientation}
      ticks={axis.ticks}
    />
  );

  if (!dinamico) {
    return eixo;
  }

  return (
    <g className={`${styles.dynamicAxis} ${DESLIZE[orientation]}`}>
      <rect
        className={styles.gutter}
        height={gutter.height}
        width={gutter.width}
        x={gutter.x}
        y={gutter.y}
      />
      {eixo}
    </g>
  );
}

/**
 * Camada cartesiana sobre a moldura comum: grade, os dois eixos e as marcas,
 * todos dentro das margens ja calculadas a partir dos rotulos.
 */
export function CartesianFrame({
  children,
  containerRef,
  empty,
  emptyMessage,
  fillHeight,
  grid,
  height,
  legend,
  legendAlign,
  legendPosition,
  margins,
  onToggleSeries,
  plot,
  title,
  width,
  xAxis,
  yAxis,
  yAxisRight,
}: CartesianFrameProps) {
  return (
    <ChartFrame
      containerRef={containerRef}
      empty={empty}
      emptyMessage={emptyMessage}
      fillHeight={fillHeight}
      height={height}
      legend={legend}
      legendAlign={legendAlign}
      legendPosition={legendPosition}
      minLegendEntries={2}
      onToggleSeries={onToggleSeries}
      title={title}
      width={width}
    >
      <g transform={`translate(${margins.left} ${margins.top})`}>
        {grid?.map((linhas) => (
          <Grid
            baseline={linhas.baseline}
            key={linhas.orientation}
            length={linhas.orientation === 'horizontal' ? plot.width : plot.height}
            lines={linhas.lines}
            orientation={linhas.orientation}
          />
        ))}

        {children}

        <g transform={`translate(0 ${plot.height})`}>
          <EixoComCalha
            axis={xAxis}
            gutter={{ height: margins.bottom, width: plot.width, x: 0, y: 0 }}
            length={plot.width}
            orientation="bottom"
          />
        </g>

        <EixoComCalha
          axis={yAxis}
          gutter={{ height: plot.height, width: margins.left, x: -margins.left, y: 0 }}
          length={plot.height}
          orientation="left"
        />

        {yAxisRight && (
          <g transform={`translate(${plot.width} 0)`}>
            <EixoComCalha
              axis={yAxisRight}
              gutter={{ height: plot.height, width: margins.right, x: 0, y: 0 }}
              length={plot.height}
              orientation="right"
            />
          </g>
        )}
      </g>
    </ChartFrame>
  );
}
