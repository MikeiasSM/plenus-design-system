import type { ReactNode } from 'react';
import { Axis, type AxisOrientation, type AxisTick } from './Axis';
import { ChartFrame } from './ChartFrame';
import type { ChartLegendAlign, ChartLegendEntry, ChartLegendPosition } from './ChartLegend';
import type { ChartFrameProps } from './ChartFrame';
import { Grid, type GridOrientation } from './Grid';
import type { AxisLabelRotation, AxisPosition, AxisVisibility, ChartMargins, ChartPlot } from './cartesianLayout';
import type { AxisReveal } from './useCartesianLayout';
import styles from './Chart.module.css';

export interface CartesianAxis {
  hideLine?: boolean;
  labelRotation?: AxisLabelRotation;
  position?: AxisPosition;
  ticks: readonly AxisTick[];
  visibility?: AxisVisibility;
}

export interface CartesianGrid {
  baseline?: number;
  lines: readonly number[];
  orientation: GridOrientation;
}

export interface CartesianFrameProps {
  /** Estado e gatilhos dos eixos `onHover`, vindos de `useCartesianLayout`. */
  axisReveal?: AxisReveal;
  canvasRole?: ChartFrameProps['canvasRole'];
  children: ReactNode;
  containerRef: (node: HTMLElement | null) => void;
  empty: boolean;
  emptyMessage: string;
  fillHeight: boolean;
  grid?: readonly CartesianGrid[];
  height: number;
  legend?: readonly ChartLegendEntry[];
  legendAlign?: ChartLegendAlign;
  legendContent?: ChartFrameProps['legendContent'];
  legendPosition: ChartLegendPosition;
  margins: ChartMargins;
  onToggleSeries?: (label: string) => void;
  plot: ChartPlot;
  root?: ChartFrameProps['root'];
  table?: ChartFrameProps['table'];
  title: string;
  tooltip?: ChartFrameProps['tooltip'];
  tooltipAnchor?: ChartFrameProps['tooltipAnchor'];
  width: number;
  xAxis: CartesianAxis;
  yAxis: CartesianAxis;
  yAxisRight?: CartesianAxis;
}

interface EixoProps {
  axis: CartesianAxis;
  length: number;
  orientation: AxisOrientation;
  revealed: boolean;
}

/** No modo `onHover` o eixo aparece enquanto o desenho encolhe para abrir a calha dele, e some na hora de sair. */
function EixoDinamico({ axis, length, orientation, revealed }: EixoProps) {
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

  return <g className={`${styles.dynamicAxis} ${revealed ? styles.dynamicAxisRevealed : ''}`}>{eixo}</g>;
}

/**
 * Camada cartesiana sobre a moldura comum: grade, os dois eixos e as marcas,
 * todos dentro das margens ja calculadas a partir dos rotulos.
 */
export function CartesianFrame({
  axisReveal,
  canvasRole,
  children,
  containerRef,
  empty,
  emptyMessage,
  fillHeight,
  grid,
  height,
  legend,
  legendAlign,
  legendContent,
  legendPosition,
  margins,
  onToggleSeries,
  plot,
  root,
  table,
  title,
  tooltip,
  tooltipAnchor,
  width,
  xAxis,
  yAxis,
  yAxisRight,
}: CartesianFrameProps) {
  const revealed = axisReveal?.revealed ?? false;

  return (
    <ChartFrame
      canvasRole={canvasRole}
      containerRef={containerRef}
      empty={empty}
      emptyMessage={emptyMessage}
      fillHeight={fillHeight}
      height={height}
      legend={legend}
      legendAlign={legendAlign}
      legendContent={legendContent}
      legendPosition={legendPosition}
      minLegendEntries={2}
      onPointerEnter={axisReveal?.onPointerEnter}
      onPointerLeave={axisReveal?.onPointerLeave}
      onToggleSeries={onToggleSeries}
      root={root}
      table={table}
      title={title}
      tooltip={tooltip}
      tooltipAnchor={tooltipAnchor}
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

        <g transform={`translate(0 ${xAxis.position === 'top' ? 0 : plot.height})`}>
          <EixoDinamico axis={xAxis} length={plot.width} orientation={xAxis.position ?? 'bottom'} revealed={revealed} />
        </g>

        <EixoDinamico axis={yAxis} length={plot.height} orientation="left" revealed={revealed} />

        {yAxisRight && (
          <g transform={`translate(${plot.width} 0)`}>
            <EixoDinamico axis={yAxisRight} length={plot.height} orientation="right" revealed={revealed} />
          </g>
        )}
      </g>
    </ChartFrame>
  );
}
