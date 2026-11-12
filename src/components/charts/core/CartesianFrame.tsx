import type { ReactNode } from 'react';
import { AxisTitle } from './AxisTitle';
import { Axis, type AxisOrientation, type AxisTick } from './Axis';
import { ChartFrame } from './ChartFrame';
import type { ChartLegendAlign, ChartLegendEntry, ChartLegendPosition } from './ChartLegend';
import type { ChartFrameProps } from './ChartFrame';
import { Grid, type GridOrientation } from './Grid';
import type { LabelFont } from './measureText';
import type { AxisLabelRotation, AxisPosition, AxisVisibility, ChartMargins, ChartPlot } from './cartesianLayout';
import type { AxisReveal, CartesianAxisSide, CartesianPart } from './useCartesianLayout';
import styles from './Chart.module.css';

export interface CartesianAxis {
  hideLine?: boolean;
  labelRotation?: AxisLabelRotation;
  position?: AxisPosition;
  ticks: readonly AxisTick[];
  /** Titulo do eixo, fora da area de desenho. Exige `font` na moldura. */
  title?: string;
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
  /** Fonte dos rotulos, para medir e cortar os titulos dos eixos. */
  font?: LabelFont;
  grid?: readonly CartesianGrid[];
  height: number;
  legend?: readonly ChartLegendEntry[];
  legendAlign?: ChartLegendAlign;
  legendContent?: ChartFrameProps['legendContent'];
  legendPosition: ChartLegendPosition;
  margins: ChartMargins;
  onToggleSeries?: (label: string) => void;
  plot: ChartPlot;
  /** Partes que a decomposicao por encaixe ja retirou, vindas de `useCartesianLayout`. */
  removed?: ReadonlySet<CartesianPart>;
  root?: ChartFrameProps['root'];
  showTableToggle?: ChartFrameProps['showTableToggle'];
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

  return <Revelavel revealed={revealed}>{eixo}</Revelavel>;
}

/** O que aparece com o eixo `onHover` enquanto o desenho encolhe para abrir a calha, e some na hora de sair. */
function Revelavel({ children, revealed }: { children: ReactNode; revealed: boolean }) {
  return <g className={`${styles.dynamicAxis} ${revealed ? styles.dynamicAxisRevealed : ''}`}>{children}</g>;
}

/** O titulo do eixo `onHover` aparece e some junto com ele; nos outros modos, fica sempre. */
function TituloDoEixo({ axis, children, revealed }: { axis: CartesianAxis; children: ReactNode; revealed: boolean }) {
  return axis.visibility === 'onHover' ? <Revelavel revealed={revealed}>{children}</Revelavel> : children;
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
  font,
  grid,
  height,
  legend,
  legendAlign,
  legendContent,
  legendPosition,
  margins,
  onToggleSeries,
  plot,
  removed,
  root,
  showTableToggle,
  table,
  title,
  tooltip,
  tooltipAnchor,
  width,
  xAxis: xAxisProp,
  yAxis: yAxisProp,
  yAxisRight: yAxisRightProp,
}: CartesianFrameProps) {
  const revealed = axisReveal?.revealed ?? false;
  const without = (part: CartesianPart) => removed?.has(part) ?? false;
  const decomposed = (axis: CartesianAxis, side: CartesianAxisSide): CartesianAxis => ({
    ...axis,
    title: without('titles') ? undefined : axis.title,
    visibility: without('axes') || without(`labels:${side}`) ? 'hidden' : axis.visibility,
  });
  const xAxis = decomposed(xAxisProp, 'x');
  const yAxis = decomposed(yAxisProp, 'y');
  const yAxisRight = yAxisRightProp && decomposed(yAxisRightProp, 'yRight');

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
      legendPosition={without('legend') ? 'none' : legendPosition}
      minLegendEntries={2}
      onPointerEnter={axisReveal?.onPointerEnter}
      onPointerLeave={axisReveal?.onPointerLeave}
      onToggleSeries={onToggleSeries}
      root={root}
      showTableToggle={showTableToggle}
      table={table}
      title={title}
      tooltip={tooltip}
      tooltipAnchor={tooltipAnchor}
      width={width}
    >
      <g transform={`translate(${margins.left} ${margins.top})`}>
        {!without('detail') && grid?.map((linhas) => (
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

        {font && xAxis.title && (
          <TituloDoEixo axis={xAxis} revealed={revealed}>
            <AxisTitle
              font={font}
              length={plot.width}
              rotation={0}
              text={xAxis.title}
              x={plot.width / 2}
              y={xAxis.position === 'top' ? font.lineHeight / 2 - margins.top : plot.height + margins.bottom - font.lineHeight / 2}
            />
          </TituloDoEixo>
        )}

        {font && yAxis.title && (
          <TituloDoEixo axis={yAxis} revealed={revealed}>
            <AxisTitle font={font} length={plot.height} rotation={-90} text={yAxis.title} x={font.lineHeight / 2 - margins.left} y={plot.height / 2} />
          </TituloDoEixo>
        )}

        {font && yAxisRight?.title && (
          <TituloDoEixo axis={yAxisRight} revealed={revealed}>
            <AxisTitle
              font={font}
              length={plot.height}
              rotation={90}
              text={yAxisRight.title}
              x={plot.width + margins.right - font.lineHeight / 2}
              y={plot.height / 2}
            />
          </TituloDoEixo>
        )}
      </g>
    </ChartFrame>
  );
}
