import { useId, type ReactNode } from 'react';
import { Axis, type AxisLabelRotation, type AxisTick } from './Axis';
import { Grid, type GridOrientation } from './Grid';
import styles from './Chart.module.css';

export interface ChartMargins {
  bottom: number;
  left: number;
  right: number;
  top: number;
}

export interface ChartPlot {
  height: number;
  width: number;
}

export interface ChartLegendEntry {
  color: string;
  label: string;
}

export interface CartesianAxis {
  hideLine?: boolean;
  labelRotation?: AxisLabelRotation;
  ticks: readonly AxisTick[];
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
  grid?: readonly CartesianGrid[];
  height: number;
  legend?: readonly ChartLegendEntry[];
  margins: ChartMargins;
  plot: ChartPlot;
  title: string;
  width: number;
  xAxis: CartesianAxis;
  yAxis: CartesianAxis;
}

/** Area de desenho, descontadas as margens que os eixos e os rotulos ocupam. */
export function plotBox(width: number, height: number, margins: ChartMargins): ChartPlot {
  return {
    width: Math.max(width - margins.left - margins.right, 0),
    height: Math.max(height - margins.top - margins.bottom, 0),
  };
}

/**
 * Moldura de um grafico cartesiano: titulo, area de desenho, grade, os dois
 * eixos e a legenda. Recebe as marcas do eixo ja posicionadas e as marcas do
 * grafico como filhas, em coordenadas da area de desenho.
 */
export function CartesianFrame({
  children,
  containerRef,
  empty,
  emptyMessage,
  grid,
  height,
  legend,
  margins,
  plot,
  title,
  width,
  xAxis,
  yAxis,
}: CartesianFrameProps) {
  const tituloId = useId();

  return (
    <figure className={styles.figure} ref={containerRef}>
      <figcaption className={styles.title} id={tituloId}>
        {title}
      </figcaption>

      {empty || width === 0 ? (
        <p className={styles.empty}>{emptyMessage}</p>
      ) : (
        <svg
          aria-labelledby={tituloId}
          className={styles.canvas}
          height={height}
          role="img"
          viewBox={`0 0 ${width} ${height}`}
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
              <Axis
                hideLine={xAxis.hideLine}
                labelRotation={xAxis.labelRotation}
                length={plot.width}
                orientation="bottom"
                ticks={xAxis.ticks}
              />
            </g>

            <Axis hideLine={yAxis.hideLine} length={plot.height} orientation="left" ticks={yAxis.ticks} />
          </g>
        </svg>
      )}

      {legend && legend.length > 1 && (
        <ul className={styles.legend}>
          {legend.map((entrada) => (
            <li className={styles.legendItem} key={entrada.label}>
              <span aria-hidden="true" className={styles.swatch} style={{ background: entrada.color }} />
              {entrada.label}
            </li>
          ))}
        </ul>
      )}
    </figure>
  );
}
