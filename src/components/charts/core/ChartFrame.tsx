import { useId, type ReactNode } from 'react';
import { ChartLegend, type ChartLegendEntry, type ChartLegendPosition, type ChartLegendSwatch } from './ChartLegend';
import styles from './Chart.module.css';

export interface ChartFrameProps {
  /** Marcas do grafico, em coordenadas da area de desenho. */
  children: ReactNode;
  /**
   * Leva a origem das marcas para o centro da area, de modo que o filho
   * raciocine em raio e angulo em vez de converter coordenadas.
   */
  centerOrigin?: boolean;
  containerRef: (node: HTMLElement | null) => void;
  empty: boolean;
  emptyMessage: string;
  fillHeight: boolean;
  height: number;
  legend?: readonly ChartLegendEntry[];
  legendPosition: ChartLegendPosition;
  /** A partir de quantas entradas a legenda aparece. */
  minLegendEntries?: number;
  onToggleSeries?: (label: string) => void;
  swatch?: ChartLegendSwatch;
  title: string;
  width: number;
}

/**
 * Moldura de qualquer grafico: titulo, area de desenho, estado vazio e legenda.
 * O que muda entre as familias e o que se desenha dentro dela — eixos, aneis ou
 * a area inteira —, e nao o cerco, que era o mesmo repetido tres vezes.
 */
export function ChartFrame({
  children,
  centerOrigin = false,
  containerRef,
  empty,
  emptyMessage,
  fillHeight,
  height,
  legend,
  legendPosition,
  minLegendEntries = 1,
  onToggleSeries,
  swatch = 'square',
  title,
  width,
}: ChartFrameProps) {
  const tituloId = useId();
  const lateral = legendPosition === 'left' || legendPosition === 'right';
  const legenda = legendPosition !== 'none' && legend !== undefined && legend.length >= minLegendEntries && (
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
              {centerOrigin ? (
                <g transform={`translate(${width / 2} ${height / 2})`}>{children}</g>
              ) : (
                children
              )}
            </svg>
          )}
        </div>

        {(legendPosition === 'bottom' || legendPosition === 'right') && legenda}
      </div>
    </figure>
  );
}
