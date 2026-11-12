import { useId, useState, type ComponentPropsWithRef, type ReactNode } from 'react';
import { Button } from '../../actions/Button';
import {
  ChartLegend,
  type ChartLegendAlign,
  type ChartLegendEntry,
  type ChartLegendPosition,
  type ChartLegendProps,
  type ChartLegendSwatch,
} from './ChartLegend';
import { EmptyState } from '../../feedback/EmptyState';
import { ChartTooltip, type ChartTooltipProps } from '../ChartTooltip/ChartTooltip';
import { IconChartBar } from '../../icons';
import { TABLE_TOGGLE_MIN_WIDTH } from './decomposition';
import { useChartMetrics } from './useChartMetrics';
import { useTouchPin } from './useTouchPin';
import type { ChartAnchorPoint } from './useMarkNavigation';
import styles from './Chart.module.css';

export interface ChartRootProps extends Omit<ComponentPropsWithRef<'figure'>, 'children' | 'title'> {
  /** Titulo so para o leitor de tela, quando o conteiner ja o mostra. */
  hideTitle?: boolean;
}

export function chartRoot(
  { className, hideTitle = false, ...props }: ChartRootProps,
  classNames: { figure: string; title: string },
) {
  return {
    figureProps: { ...props, className: [classNames.figure, className].filter(Boolean).join(' ') },
    titleClassName: hideTitle ? styles.titleHidden : classNames.title,
  };
}

export interface ChartFrameProps {
  /** `group` quando as marcas sao controles, percorridos pelo teclado; `img` quando o desenho e uma leitura so. */
  canvasRole?: 'img' | 'group';
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
  /** Legenda propria do grafico, no lugar da lista de series, como a de uma escala de cor. */
  legendContent?: ReactNode;
  legendPosition: ChartLegendPosition;
  /** A partir de quantas entradas a legenda aparece. */
  minLegendEntries?: number;
  /** Entrada da legenda sob o ponteiro ou o foco, com onde ancorar o balao; `null` ao sair. */
  onHighlightSeries?: ChartLegendProps['onHighlight'];
  /** Ponteiro entrando e saindo da area de desenho, para quem revela os eixos `onHover`. */
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
  onToggleSeries?: (label: string) => void;
  root?: ChartRootProps;
  swatch?: ChartLegendSwatch;
  /** Leitura medida a medida, no lugar do desenho, pelo botao "Ver como tabela". */
  table?: ReactNode;
  /** `false` tira o botao "Ver como tabela" e deixa so o desenho. */
  showTableToggle?: boolean;
  title: string;
  /** O balao do que esta sob o ponteiro, montado pelo grafico. Sem linhas, nao aparece. */
  tooltip?: Omit<ChartTooltipProps, 'children'>;
  /** Centro da marca em foco pelo teclado, onde o balao se fixa. */
  tooltipAnchor?: ChartTooltipProps['anchor'];
  width: number;
}

/**
 * Moldura de qualquer grafico: titulo, area de desenho, estado vazio e legenda.
 * O que muda entre as familias e o que se desenha dentro dela — eixos, aneis ou
 * a area inteira —, e nao o cerco, que era o mesmo repetido tres vezes.
 */
export function ChartFrame({
  canvasRole = 'img',
  children,
  centerOrigin = false,
  containerRef,
  empty,
  emptyMessage,
  fillHeight,
  height,
  legend,
  legendAlign,
  legendContent,
  legendPosition,
  minLegendEntries = 1,
  onHighlightSeries,
  onPointerEnter,
  onPointerLeave,
  onToggleSeries,
  root = {},
  showTableToggle = true,
  swatch = 'square',
  table,
  title,
  tooltip,
  tooltipAnchor,
  width,
}: ChartFrameProps) {
  const tituloId = useId();
  const [emTabela, setEmTabela] = useState(false);
  const toque = useTouchPin();
  // Sobre a legenda, o balao segue o ponteiro, como sobre o desenho; a ancora da marca fica para o teclado.
  const [ponteiroNaLegenda, setPonteiroNaLegenda] = useState<ChartAnchorPoint | null>(null);
  // O botao divide a linha com o titulo: vale a largura do corpo, que a legenda ao lado nao estreita como a do desenho.
  const corpo = useChartMetrics();
  const alternavel = table !== undefined && showTableToggle && !empty && (corpo.width === 0 || corpo.width >= TABLE_TOGGLE_MIN_WIDTH);
  const { figureProps, titleClassName } = chartRoot(root, {
    figure: fillHeight ? `${styles.figure} ${styles.figureFill}` : styles.figure,
    title: styles.title,
  });
  const lateral = legendPosition === 'left' || legendPosition === 'right';
  const plotDaForma = centerOrigin && lateral;
  const mostraTabela = alternavel && emTabela;
  // A tabela mostra o dado inteiro: a legenda, que filtra so o desenho, sai com ele.
  const legenda = !mostraTabela && legendPosition !== 'none' && (legendContent ?? (legend !== undefined && legend.length >= minLegendEntries && (
    <ChartLegend
      align={legendAlign}
      entries={legend}
      onHighlight={onHighlightSeries}
      onPointerAt={onHighlightSeries && setPonteiroNaLegenda}
      onToggle={onToggleSeries}
      position={legendPosition}
      swatch={swatch}
    />
  )));

  const desenho = (
    <svg
      aria-labelledby={tituloId}
      className={styles.canvas}
      height={height}
      role={canvasRole}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
    >
      {centerOrigin ? <g transform={`translate(${width / 2} ${height / 2})`}>{children}</g> : children}
    </svg>
  );

  return (
    <figure {...figureProps}>
      {alternavel ? (
        <figcaption className={styles.header}>
          <span className={titleClassName} id={tituloId}>
            {title}
          </span>
          <Button
            aria-pressed={emTabela}
            className={styles.tableToggle}
            onClick={() => setEmTabela((atual) => !atual)}
            size="sm"
            variant="secondary"
          >
            Ver como tabela
          </Button>
        </figcaption>
      ) : (
        <figcaption className={titleClassName} id={tituloId}>
          {title}
        </figcaption>
      )}

      <div className={`${styles.body} ${lateral ? styles.bodyRow : styles.bodyColumn}`} ref={corpo.ref}>
        {(legendPosition === 'top' || legendPosition === 'left') && legenda}

        <div
          className={[styles.plot, fillHeight && styles.plotFill, plotDaForma && styles.plotShape].filter(Boolean).join(' ')}
          {...toque.props}
          onPointerEnter={onPointerEnter}
          onPointerLeave={onPointerLeave}
          ref={containerRef}
          style={fillHeight ? undefined : { minHeight: height, flexBasis: plotDaForma ? height : undefined }}
        >
          {/* Sem medida ainda — SSR, aba escondida, contêiner recolhido — o
              desenho espera. Anunciar ausencia de dados ali seria mentira: eles
              estao la, e o que falta e largura. */}
          {empty ? (
            <div className={styles.empty}>
              <EmptyState icon={<IconChartBar />} size="sm" title={emptyMessage} />
            </div>
          ) : mostraTabela ? (
            table
          ) : width === 0 || height === 0 ? null : tooltip ? (
            <ChartTooltip anchor={ponteiroNaLegenda ?? tooltipAnchor} {...tooltip}>{desenho}</ChartTooltip>
          ) : (
            desenho
          )}
        </div>

        {(legendPosition === 'bottom' || legendPosition === 'right') && legenda}
      </div>
    </figure>
  );
}
