import { useId, type ReactNode } from 'react';
import { Axis, type AxisOrientation, type AxisTick } from './Axis';
import { Grid, type GridOrientation } from './Grid';
import type {
  AxisLabelRotation,
  AxisVisibility,
  ChartMargins,
  ChartPlot,
} from './cartesianLayout';
import styles from './Chart.module.css';

export type ChartLegendPosition = 'top' | 'bottom' | 'left' | 'right' | 'none';

export interface ChartLegendEntry {
  color: string;
  hidden?: boolean;
  label: string;
  /** Medida da entrada, alinhada a direita. Serve a legenda em lista do anel. */
  value?: string;
}

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
  legendPosition: ChartLegendPosition;
  onToggleSeries?: (label: string) => void;
  margins: ChartMargins;
  plot: ChartPlot;
  title: string;
  width: number;
  xAxis: CartesianAxis;
  yAxis: CartesianAxis;
  yAxisRight?: CartesianAxis;
}

/** A legenda ao lado poe o corpo em linha; acima ou abaixo, em coluna. */
const DIRECAO_DO_CORPO: Record<ChartLegendPosition, string> = {
  top: styles.bodyColumn,
  bottom: styles.bodyColumn,
  none: styles.bodyColumn,
  left: styles.bodyRow,
  right: styles.bodyRow,
};

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

export type ChartLegendSwatch = 'square' | 'dot';

interface LegendaProps {
  entries: readonly ChartLegendEntry[];
  onToggle?: (label: string) => void;
  position: ChartLegendPosition;
  swatch?: ChartLegendSwatch;
}

/**
 * Legenda do grafico. Quando existe um alvo para o clique, cada entrada vira um
 * botao que liga e desliga a serie, com o estado exposto por `aria-pressed`.
 */
export function ChartLegend({ entries, onToggle, position, swatch = 'square' }: LegendaProps) {
  const lateral = position === 'left' || position === 'right';

  return (
    <ul className={`${styles.legend} ${lateral ? styles.legendSide : ''}`}>
      {entries.map((entrada) => {
        const conteudo = (
          <>
            <span
              aria-hidden="true"
              className={`${styles.swatch} ${swatch === 'dot' ? styles.swatchDot : ''}`}
              style={entrada.hidden ? undefined : { background: entrada.color }}
            />
            <span className={styles.legendLabel}>{entrada.label}</span>
            {entrada.value !== undefined && <span className={styles.legendValue}>{entrada.value}</span>}
          </>
        );

        return (
          <li className={styles.legendItem} key={entrada.label}>
            {onToggle ? (
              <button
                aria-pressed={!entrada.hidden}
                className={`${styles.legendButton} ${entrada.hidden ? styles.legendOff : ''}`}
                onClick={() => onToggle(entrada.label)}
                type="button"
              >
                {conteudo}
              </button>
            ) : (
              conteudo
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Moldura de um grafico cartesiano: titulo, area de desenho, grade, os eixos e
 * a legenda. Recebe as marcas do eixo ja posicionadas, as margens ja calculadas
 * a partir dos rotulos e as marcas do grafico como filhas, em coordenadas da
 * area de desenho.
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
  const tituloId = useId();
  const comLegenda = legendPosition !== 'none' && legend !== undefined && legend.length > 1;

  return (
    <figure className={styles.figure}>
      <figcaption className={styles.title} id={tituloId}>
        {title}
      </figcaption>

      <div className={`${styles.body} ${DIRECAO_DO_CORPO[legendPosition]}`}>
        {comLegenda && (legendPosition === 'top' || legendPosition === 'left') && (
          <ChartLegend entries={legend} onToggle={onToggleSeries} position={legendPosition} />
        )}

        <div
          className={`${styles.plot} ${fillHeight ? styles.plotFill : ''}`}
          ref={containerRef}
          style={fillHeight ? undefined : { minHeight: height }}
        >
          {empty || width === 0 || height === 0 ? (
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
            </svg>
          )}
        </div>

        {comLegenda && (legendPosition === 'bottom' || legendPosition === 'right') && (
          <ChartLegend entries={legend} onToggle={onToggleSeries} position={legendPosition} />
        )}
      </div>
    </figure>
  );
}
