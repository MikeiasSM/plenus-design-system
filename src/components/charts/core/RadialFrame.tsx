import { useId, type ReactNode } from 'react';
import {
  ChartLegend,
  type ChartLegendEntry,
  type ChartLegendPosition,
  type ChartLegendSwatch,
} from './CartesianFrame';
import { CHART_LABEL_OFFSET } from './spacing';
import styles from './Chart.module.css';

export interface RadialFrameProps {
  /** Marcas do grafico, em coordenadas com a origem no centro do anel. */
  children: ReactNode;
  containerRef: (node: HTMLElement | null) => void;
  empty: boolean;
  emptyMessage: string;
  fillHeight: boolean;
  height: number;
  legend?: readonly ChartLegendEntry[];
  legendPosition: ChartLegendPosition;
  onToggleSeries?: (label: string) => void;
  swatch?: ChartLegendSwatch;
  title: string;
  width: number;
}

/** Diametro do anel: o lado menor da area disponivel, menos a folga. */
export function ringDiameter(width: number, height: number) {
  return Math.max(Math.min(width, height) - CHART_LABEL_OFFSET * 2, 0);
}

/**
 * Moldura de um grafico radial: titulo, area de desenho quadrada e centrada, e
 * a legenda. A origem das marcas e o centro, de modo que o filho raciocine em
 * raio e angulo em vez de converter coordenadas.
 */
export function RadialFrame({
  children,
  containerRef,
  empty,
  emptyMessage,
  fillHeight,
  height,
  legend,
  legendPosition,
  onToggleSeries,
  swatch = 'dot',
  title,
  width,
}: RadialFrameProps) {
  const tituloId = useId();
  const comLegenda = legendPosition !== 'none' && legend !== undefined && legend.length > 0;
  const lateral = legendPosition === 'left' || legendPosition === 'right';

  return (
    <figure className={styles.figure}>
      <figcaption className={styles.title} id={tituloId}>
        {title}
      </figcaption>

      <div className={`${styles.body} ${lateral ? styles.bodyRow : styles.bodyColumn}`}>
        {comLegenda && (legendPosition === 'top' || legendPosition === 'left') && (
          <ChartLegend
            entries={legend}
            onToggle={onToggleSeries}
            position={legendPosition}
            swatch={swatch}
          />
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
              <g transform={`translate(${width / 2} ${height / 2})`}>{children}</g>
            </svg>
          )}
        </div>

        {comLegenda && (legendPosition === 'bottom' || legendPosition === 'right') && (
          <ChartLegend
            entries={legend}
            onToggle={onToggleSeries}
            position={legendPosition}
            swatch={swatch}
          />
        )}
      </div>
    </figure>
  );
}
