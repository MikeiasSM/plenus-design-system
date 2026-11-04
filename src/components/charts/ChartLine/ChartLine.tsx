import { useMemo, useState } from 'react';
import {
  ChartTable,
  categoryTable,
  CartesianFrame,
  categoryTooltip,
  PointBands,
  PointCursor,
  seriesInScale,
  useCartesianLayout,
  chartHeight,
  linePath,
  markShown,
  nearestSeriesAt,
  pointLabelPlacement,
  useChartMetrics,
  useHoveredBand,
  useMarkNavigation,
  useSeriesToggle,
  useTweenedNumbers,
  valueLabelRoom,
  valueLabelsFor,
  type AxisLabelAngle,
  type AxisTick,
  type AxisVisibility,
  type ChartCurve,
  type ChartHeight,
  type ChartLegendAlign,
  type ChartLegendPosition,
  type ChartPoint,
  type MarkVisibility,
  type ChartRootProps,
  type ChartCategoryHover,
  type ChartMarkClick,
  type MarkPosition,
} from '../core';
import { resolveSeriesColors, type ChartPalette, type SeriesAppearance } from '../palette';
import { domainOf, linearScale, mergeDomains, pointScale, ticksFor } from '../scales';
import { formatNumber } from '../../../utils/formatters';
import chartStyles from '../core/Chart.module.css';
import styles from './ChartLine.module.css';
/**
 * Ponto sem vizinho desenhado. A curva entre ele e o nada nao tem tracado, e o
 * marcador so no hover deixaria o dado invisivel — entao ele aparece sempre.
 */
function isolado(pontos: readonly (ChartPoint | null)[], indice: number) {
  return pontos[indice] !== null && !pontos[indice - 1] && !pontos[indice + 1];
}


export interface ChartLineSeries extends SeriesAppearance {
  label: string;
  values: readonly (number | null)[];
}

export interface ChartLineProps extends Omit<ChartRootProps, 'hidden'> {
  accent?: string;
  categories: readonly string[];
  curve?: ChartCurve;
  /** Series ocultas de inicio, enquanto o produto nao controla `hidden`. */
  defaultHidden?: readonly string[];
  /** @deprecated Use `defaultHidden`. Aceito ate a 0.7.0; com os dois, vale o novo. */
  defaultHiddenSeries?: readonly string[];
  emptyMessage?: string;
  /** Formato dos valores no balao. Sem ele, vale o `formatValue`: o eixo pode sair compacto e o balao, exato. */
  formatTooltipValue?: (value: number) => string;
  formatValue?: (value: number) => string;
  /**
   * Inclui o zero no dominio do eixo de valor. Ligado por padrao, porque marca
   * que nao parte do zero exagera a diferenca; para medidas que nao se comparam
   * a ele — um ano, uma temperatura — desligue; um ano pede tambem um formato sem separador de milhar em `formatValue`.
   */
  includeZero?: boolean;
  height?: ChartHeight;
  /** Rotulos das series desligadas pela legenda (controlado). Substitui o `hidden` nativo da figure. */
  hidden?: readonly string[];
  /** @deprecated Use `hidden`. Aceito ate a 0.7.0; com os dois, vale o novo. */
  hiddenSeries?: readonly string[];
  labelAngle?: AxisLabelAngle;
  legend?: ChartLegendPosition;
  legendAlign?: ChartLegendAlign;
  /** Passo minimo entre as marcas do eixo de valor, na unidade do dado: 1 impede marcas fracionarias em contagens. */
  minTickStep?: number;
  /** @deprecated Use `onHiddenChange`. Aceito ate a 0.7.0. */
  onHiddenSeriesChange?: (hidden: readonly string[]) => void;
  /** Rotulos ocultos, a cada alternancia da legenda. */
  onHiddenChange?: (hidden: readonly string[]) => void;
  /** Categoria mais proxima do ponteiro, ou `null` ao sair. */
  onHover?: (category: ChartCategoryHover | null) => void;
  /** @deprecated Use `onHover`, que traz a categoria e o indice. Aceito ate a 0.7.0. */
  onHoverCategory?: (index: number | null) => void;
  /** Torna os pontos botoes, percorridos pelas setas; o clique na faixa vale pelo ponto mais proximo. */
  onMarkClick?: (mark: ChartMarkClick) => void;
  /** @deprecated Use `onMarkClick`. Aceito ate a 0.7.0. */
  onPointClick?: (point: ChartMarkClick) => void;
  /** Cores das series sem cor propria: lista em rotacao ou `{ base }`, que gera os tons. Vence o `accent`. */
  palette?: ChartPalette;
  series: readonly ChartLineSeries[];
  /** Valor acima de cada ponto: sempre, nunca, ou so os da serie mais proxima do ponteiro. */
  showDataLabels?: MarkVisibility;
  /** Pontos de cada valor: sempre, nunca, ou so os da serie mais proxima do ponteiro. */
  showDots?: MarkVisibility;
  /**
   * Balao com as series da categoria mais proxima do ponteiro. Desligue para montar o proprio
   * `ChartTooltip` pela costura; sem balao nem costura, o ponto volta a ter o `<title>`.
   */
  /** Botao "Ver como tabela". Ligado por padrao. */
  showTableToggle?: boolean;
  showTooltip?: boolean;
  title: string;
  xAxis?: AxisVisibility;
  /** Titulo do eixo das categorias, embaixo do desenho. */
  xAxisTitle?: string;
  /** Linhas horizontais de referência e a linha do zero. */
  showGrid?: boolean;
  yAxis?: AxisVisibility;
  yAxisRight?: AxisVisibility;
  /** Titulo do eixo de valor da direita. */
  yAxisRightTitle?: string;
  /** Titulo do eixo de valor, a esquerda do desenho. */
  yAxisTitle?: string;
}

export function ChartLine({
  accent,
  categories,
  curve = 'smooth',
  defaultHidden,
  defaultHiddenSeries,
  emptyMessage = 'Sem dados no período',
  formatTooltipValue,
  formatValue = formatNumber,
  height = 260,
  includeZero = true,
  hidden,
  hiddenSeries,
  labelAngle = 'auto',
  minTickStep,
  legend = 'bottom',
  legendAlign,
  onHiddenChange,
  onHiddenSeriesChange,
  onHover,
  onHoverCategory,
  onMarkClick,
  onPointClick,
  palette,
  series,
  showDataLabels = 'hidden',
  showDots = 'onHover',
  showTableToggle = true,
  showTooltip = true,
  title,
  xAxis = 'visible',
  xAxisTitle,
  showGrid = true,
  yAxis = 'visible',
  yAxisRight = 'hidden',
  yAxisRightTitle,
  yAxisTitle,
  ...root
}: ChartLineProps) {
  const { font, height: alturaMedida, ref, width } = useChartMetrics();
  const { fillHeight, value: alturaDoDesenho } = chartHeight(height, alturaMedida);
  const { isHidden, isOutOfScale, toggle } = useSeriesToggle({
    defaultHidden: defaultHidden ?? defaultHiddenSeries,
    hidden: hidden ?? hiddenSeries,
    labels: series.map((serie) => serie.label),
    onHiddenChange: (ocultas) => {
      onHiddenChange?.(ocultas);
      onHiddenSeriesChange?.(ocultas);
    },
  });

  // A cor sai da lista inteira, e nao das visiveis: desligar uma serie nao pode
  // repintar as demais.
  const cores = useMemo(() => resolveSeriesColors(series, { accent, palette }), [accent, palette, series]);

  const dominio = useMemo(
    () =>
      mergeDomains(
        seriesInScale(series, isOutOfScale).map((serie) =>
          domainOf(
            serie.values.filter((valor) => valor !== null),
            { includeZero },
          ),
        ),
      ),
    [includeZero, isOutOfScale, series],
  );

  const rotulosDeValor = valueLabelsFor(dominio, alturaDoDesenho, formatValue, minTickStep);

  const entradasDaLegenda = series.map((serie, indice) => ({
    color: cores[indice],
    hidden: isHidden(serie.label),
    label: serie.label,
  }));

  const { axisReveal, margins, plot, removed, rotation } = useCartesianLayout({
    decomposition: { fillHeight, legend: entradasDaLegenda, legendPosition: legend, valueAxes: ['yRight', 'y'] },
    axisTitles: { x: xAxisTitle, y: yAxisTitle, yRight: yAxisRightTitle },
    bottomLabels: categories,
    font,
    height: alturaDoDesenho,
    labelAngle,
    leftLabels: rotulosDeValor,
    rightLabels: rotulosDeValor,
    topRoom: showDataLabels === 'hidden' ? 0 : valueLabelRoom(font),
    width,
    xAxis,
    yAxis,
    yAxisRight,
  });

  const escalaCategorias = useMemo(
    () => pointScale({ domain: categories, padding: 0, range: [0, plot.width] }),
    [categories, plot.width],
  );

  const hoverDaCategoria =
    onHover || onHoverCategory
      ? (index: number | null) => {
          onHover?.(index === null ? null : { category: categories[index], index });
          onHoverCategory?.(index);
        }
      : undefined;
  const { hover: focarCategoria, hovered: categoriaEmFoco } = useHoveredBand(hoverDaCategoria);
  const aoClicarNoPonto =
    onMarkClick || onPointClick
      ? (ponto: ChartMarkClick) => {
          onMarkClick?.(ponto);
          onPointClick?.(ponto);
        }
      : undefined;
  const visibilidadeDosPontos = removed.has('detail') ? 'hidden' : showDots;
  const rotulosDeDado = removed.has('detail') ? 'hidden' : showDataLabels;
  const [alturaDoPonteiro, setAlturaDoPonteiro] = useState<number | null>(null);
  const comFaixas =
    showTooltip ||
    hoverDaCategoria !== undefined ||
    aoClicarNoPonto !== undefined ||
    showDots === 'onHover' ||
    showDataLabels === 'onHover';

  // A escala alvo fixa as marcas; a animada posiciona o desenho. Sem separar as
  // duas, as marcas exibiriam valores quebrados durante a transicao.
  const escalaAlvo = useMemo(
    () => linearScale({ domain: dominio, range: [plot.height, 0] }),
    [dominio, plot.height],
  );

  const [minimo, maximo] = useTweenedNumbers(escalaAlvo.domain());

  const escalaValores = useMemo(
    () => linearScale({ domain: { min: minimo, max: maximo }, nice: false, range: [plot.height, 0] }),
    [maximo, minimo, plot.height],
  );

  const marcasDeValor = ticksFor(escalaAlvo, plot.height, undefined, minTickStep);

  const pontosPorSerie = series.map((serie) =>
    categories.map<ChartPoint | null>((categoria, indice) => {
      const valor = serie.values[indice];

      if (valor === null || valor === undefined || !Number.isFinite(valor)) {
        return null;
      }

      return { x: escalaCategorias(categoria) ?? 0, y: escalaValores(valor) };
    }),
  );

  const serieEmFoco = nearestSeriesAt(pontosPorSerie, categoriaEmFoco, alturaDoPonteiro, (indice) =>
    isHidden(series[indice].label),
  );

  const clicarNoPonto =
    aoClicarNoPonto &&
    (({ column, row }: MarkPosition) =>
      aoClicarNoPonto({ category: categories[column], index: column, series: series[row].label, value: series[row].values[column] ?? 0 }));
  const pontos = useMarkNavigation({
    onActivate: clicarNoPonto,
    onFocusMark: (posicao) => {
      focarCategoria(posicao?.column ?? null);
      setAlturaDoPonteiro(posicao ? (pontosPorSerie[posicao.row][posicao.column]?.y ?? null) : null);
    },
    present: series.flatMap((serie, row) =>
      isHidden(serie.label) ? [] : pontosPorSerie[row].flatMap((ponto, column) => (ponto ? [{ column, row }] : [])),
    ),
  });

  const marcasCategoria: AxisTick[] = categories.map((categoria) => ({
    label: categoria,
    position: escalaCategorias(categoria) ?? 0,
  }));
  const posicoesCategoria = marcasCategoria.map((marca) => marca.position);

  const marcasValor: AxisTick[] = marcasDeValor.map((valor) => ({
    label: formatValue(valor),
    position: escalaValores(valor),
  }));

  return (
    <CartesianFrame
      canvasRole={pontos.interactive ? 'group' : 'img'}
      axisReveal={axisReveal}
      containerRef={ref}
      empty={series.length === 0 || categories.length === 0}
      emptyMessage={emptyMessage}
      fillHeight={fillHeight}
      font={font}
      grid={
        showGrid
          ? [
              {
                baseline: escalaValores(0),
                lines: marcasDeValor.map((valor) => escalaValores(valor)),
                orientation: 'horizontal',
              },
            ]
          : undefined
      }
      height={alturaDoDesenho}
      legend={entradasDaLegenda}
      legendAlign={legendAlign}
      legendPosition={legend}
      margins={margins}
      onToggleSeries={toggle}
      plot={plot}
      removed={removed}
      root={root}
      showTableToggle={showTableToggle}
      table={
        <ChartTable {...categoryTable(categories, series, (valor) => formatValue(valor))} title={title} />
      }
      title={title}
      tooltip={
        showTooltip
          ? categoryTooltip({
              categories,
              colors: cores,
              format: formatTooltipValue ?? formatValue,
              index: categoriaEmFoco,
              isHidden,
              series,
            })
          : undefined
      }
      tooltipAnchor={pontos.tooltipAnchor}
      width={width}
      xAxis={{ labelRotation: rotation, ticks: marcasCategoria, title: xAxisTitle, visibility: xAxis }}
      yAxis={{ hideLine: true, ticks: marcasValor, title: yAxisTitle, visibility: yAxis }}
      yAxisRight={{ hideLine: true, ticks: marcasValor, title: yAxisRightTitle, visibility: yAxisRight }}
    >
      {comFaixas && categoriaEmFoco !== null && (
        <PointCursor plot={plot} position={posicoesCategoria[categoriaEmFoco]} />
      )}

      <g {...pontos.groupProps}>
      {series.map((serie, indiceSerie) => {
        const oculta = isHidden(serie.label);

        return (
          <g
            aria-hidden={oculta || undefined}
            className={`${chartStyles.series} ${oculta ? chartStyles.seriesOff : ''}`}
            key={indiceSerie}
          >
            <path
              className={chartStyles.line}
              d={linePath(pontosPorSerie[indiceSerie], curve)}
              fill="none"
              stroke={cores[indiceSerie]}
            />

            {pontosPorSerie[indiceSerie].map((ponto, indice) => {
              if (ponto === null) {
                return null;
              }

              const descricao = `${serie.label}, ${categories[indice]}: ${formatValue(serie.values[indice] ?? 0)}`;

              const classeDoPonto = markShown(visibilidadeDosPontos, indiceSerie === serieEmFoco) || isolado(pontosPorSerie[indiceSerie], indice) ? chartStyles.dotVisible : chartStyles.dot;

              return (
                <circle
                  {...pontos.markProps({ column: indice, row: indiceSerie }, classeDoPonto)}
                  aria-label={descricao}
                  cx={ponto.x}
                  cy={ponto.y}
                  stroke={cores[indiceSerie]}
                  key={indice}
                  r={4}
                >
                  {!comFaixas && <title>{descricao}</title>}
                </circle>
              );
            })}

            {rotulosDeDado !== 'hidden' &&
              pontosPorSerie[indiceSerie].map((ponto, indice) => {
                if (ponto === null) {
                  return null;
                }

                const { below, dx, textAnchor } = pointLabelPlacement(pontosPorSerie, indiceSerie, indice, font.lineHeight, (outra) =>
                  isHidden(series[outra].label),
                );

                return (
                  <text
                    className={`${chartStyles.valueLabel} ${markShown(rotulosDeDado, indiceSerie === serieEmFoco) ? '' : chartStyles.valueLabelHidden}`}
                    key={indice}
                    textAnchor={textAnchor}
                    x={ponto.x + dx}
                    y={below ? ponto.y + font.lineHeight + 2 : ponto.y - 10}
                  >
                    {formatValue(serie.values[indice] ?? 0)}
                  </text>
                );
              })}
          </g>
        );
      })}
      </g>

      {comFaixas && (
        <PointBands
          onActivate={
            clicarNoPonto &&
            ((column) => {
              const row = serieEmFoco ?? series.findIndex((serie) => !isHidden(serie.label));
              if (row >= 0 && pontosPorSerie[row][column]) {
                clicarNoPonto({ column, row });
              }
            })
          }
          onHover={focarCategoria}
          onPointerY={setAlturaDoPonteiro}
          plot={plot}
          positions={posicoesCategoria}
        />
      )}
    </CartesianFrame>
  );
}
