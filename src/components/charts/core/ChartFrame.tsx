import { useId, type ReactNode } from 'react';
import {
  ChartLegend,
  type ChartLegendAlign,
  type ChartLegendEntry,
  type ChartLegendPosition,
  type ChartLegendSwatch,
} from './ChartLegend';
import { EmptyState } from '../../feedback/EmptyState';
import { ChartTooltip, type ChartTooltipProps } from '../ChartTooltip/ChartTooltip';
import { IconChartBar } from '../../icons';
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
  legendAlign?: ChartLegendAlign;
  legendPosition: ChartLegendPosition;
  /** A partir de quantas entradas a legenda aparece. */
  minLegendEntries?: number;
  /** Ponteiro entrando e saindo da area de desenho, para quem revela os eixos `onHover`. */
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
  onToggleSeries?: (label: string) => void;
  swatch?: ChartLegendSwatch;
  title: string;
  /** O balao do que esta sob o ponteiro, montado pelo grafico. Sem linhas, nao aparece. */
  tooltip?: Omit<ChartTooltipProps, 'children'>;
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
  legendAlign,
  legendPosition,
  minLegendEntries = 1,
  onPointerEnter,
  onPointerLeave,
  onToggleSeries,
  swatch = 'square',
  title,
  tooltip,
  width,
}: ChartFrameProps) {
  const tituloId = useId();
  const lateral = legendPosition === 'left' || legendPosition === 'right';
  const legenda = legendPosition !== 'none' && legend !== undefined && legend.length >= minLegendEntries && (
    <ChartLegend
      align={legendAlign}
      entries={legend}
      onToggle={onToggleSeries}
      position={legendPosition}
      swatch={swatch}
    />
  );

  const desenho = (
    <svg
      aria-labelledby={tituloId}
      className={styles.canvas}
      height={height}
      role="img"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
    >
      {centerOrigin ? <g transform={`translate(${width / 2} ${height / 2})`}>{children}</g> : children}
    </svg>
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
          onPointerEnter={onPointerEnter}
          onPointerLeave={onPointerLeave}
          ref={containerRef}
          style={fillHeight ? undefined : { minHeight: height }}
        >
          {/* Sem medida ainda — SSR, aba escondida, contêiner recolhido — o
              desenho espera. Anunciar ausencia de dados ali seria mentira: eles
              estao la, e o que falta e largura. */}
          {empty ? (
            <div className={styles.empty}>
              <EmptyState icon={<IconChartBar />} size="sm" title={emptyMessage} />
            </div>
          ) : width === 0 || height === 0 ? null : tooltip ? (
            <ChartTooltip {...tooltip}>{desenho}</ChartTooltip>
          ) : (
            desenho
          )}
        </div>

        {(legendPosition === 'bottom' || legendPosition === 'right') && legenda}
      </div>
    </figure>
  );
}
