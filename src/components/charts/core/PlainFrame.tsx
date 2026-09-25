import { useId, type ReactNode } from 'react';
import {
  ChartLegend,
  type ChartLegendEntry,
  type ChartLegendPosition,
  type ChartLegendSwatch,
} from './CartesianFrame';
import styles from './Chart.module.css';

export interface PlainFrameProps {
  /** Marcas do grafico, em coordenadas da area de desenho. */
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

/**
 * Moldura sem eixos: titulo, area de desenho e legenda. Serve os graficos que
 * ocupam a area inteira e nao tem escala para anunciar, como o mapa de area e o
 * fluxo.
 */
export function PlainFrame({
  children,
  containerRef,
  empty,
  emptyMessage,
  fillHeight,
  height,
  legend,
  legendPosition,
  onToggleSeries,
  swatch = 'square',
  title,
  width,
}: PlainFrameProps) {
  const tituloId = useId();
  const comLegenda = legendPosition !== 'none' && legend !== undefined && legend.length > 0;
  const lateral = legendPosition === 'left' || legendPosition === 'right';

  const legenda = comLegenda && (
    <ChartLegend entries={legend} onToggle={onToggleSeries} position={legendPosition} swatch={swatch} />
  );

  return (
    <figure className={styles.figure}>
      <figcaption className={styles.title} id={tituloId}>
        {title}
      </figcaption>

      <div className={`${styles.body} ${lateral ? styles.bodyRow : styles.bodyColumn}`}>
        {(legendPosition === 'top' || legendPosition === 'left') && legenda}

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
              {children}
            </svg>
          )}
        </div>

        {(legendPosition === 'bottom' || legendPosition === 'right') && legenda}
      </div>
    </figure>
  );
}
