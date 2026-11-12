import { useMemo, useState } from 'react';
import {
  ChartTable,
  categoryTable,
  CartesianFrame,
  categoryTooltip,
  PointBands,
  PointCursor,
  axisOf,
  rightAxisVisibility,
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
  useValueScales,
  valueAxisDomains,
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
  type ChartValueAxis,
  type ChartCategoryHover,
  type ChartMarkClick,
  type MarkPosition,
} from '../core';
import { resolveSeriesColors, type ChartPalette, type SeriesAppearance } from '../palette';
import { domainOf, mergeDomains, pointScale, ticksFor } from '../scales';
import { formatNumber } from '../../../utils/formatters';
import chartStyles from '../core/Chart.module.css';
import styles from './ChartLine.module.css';
/**
 * Ponto sem vizinho desenhado. A curva entre ele e o nada não tem tracado, e o
 * marcador só no hover deixaria o dado invisível — então ele aparece sempre.
 */
function isolado(pontos: readonly (ChartPoint | null)[], indice: number) {
  return pontos[indice] !== null && !pontos[indice - 1] && !pontos[indice + 1];
}


export interface ChartLineSeries extends SeriesAppearance {
  /** Eixo de valor da serie. Com alguma a direita, o eixo da direita ganha escala própria. */
  axis?: ChartValueAxis;
  label: string;
  values: readonly (number | null)[];
}

export interface ChartLineProps extends Omit<ChartRootProps, 'hidden'> {
  accent?: string;
  categories: readonly string[];
  curve?: ChartCurve;
  /** Séries ocultas de inicio, enquanto o produto não controla `hidden`. */
  defaultHidden?: readonly string[];
  /** @deprecated Use `defaultHidden`. Aceito até a 0.7.0; com os dois, vale o novo. */
  defaultHiddenSeries?: readonly string[];
  emptyMessage?: string;
  /** Formato do eixo da direita, dos rótulos e do balão das series dele. Sem ele, vale o `formatValue`. */
  formatRightValue?: (value: number) => string;
  /** Formato dos valores no balão das series da esquerda. Sem ele, vale o `formatValue`: o eixo pode sair compacto e o balão, exato. */
  formatTooltipValue?: (value: number) => string;
  formatValue?: (value: number) => string;
  /**
   * Inclui o zero no dominio do eixo de valor. Ligado por padrão, porque marca
   * que não parte do zero exagera a diferença; para medidas que não se comparam
   * a ele — um ano, uma temperatura — desligue; um ano pede também um formato sem separador de milhar em `formatValue`.
   */
  includeZero?: boolean;
  /** Altura do desenho, em px ou `'fill'`; o cabeçalho e a legenda ficam fora dela. */
  height?: ChartHeight;
  /** Rótulos das series desligadas pela legenda (controlado). Substitui o `hidden` nativo da figure. */
  hidden?: readonly string[];
  /** @deprecated Use `hidden`. Aceito até a 0.7.0; com os dois, vale o novo. */
  hiddenSeries?: readonly string[];
  labelAngle?: AxisLabelAngle;
  legend?: ChartLegendPosition;
  legendAlign?: ChartLegendAlign;
  /** Passo mínimo entre as marcas do eixo de valor, na unidade do dado: 1 impede marcas fracionarias em contagens. */
  minTickStep?: number;
  /** O mesmo para o eixo da direita. */
  minRightTickStep?: number;
  /** @deprecated Use `onHiddenChange`. Aceito até a 0.7.0. */
  onHiddenSeriesChange?: (hidden: readonly string[]) => void;
  /** Rótulos ocultos, a cada alternância da legenda. */
  onHiddenChange?: (hidden: readonly string[]) => void;
  /** Categoria mais próxima do ponteiro, ou `null` ao sair. */
  onHover?: (category: ChartCategoryHover | null) => void;
  /** @deprecated Use `onHover`, que traz a categoria e o indice. Aceito até a 0.7.0. */
  onHoverCategory?: (index: number | null) => void;
  /** Torna os pontos botões, percorridos pelas setas; o clique na faixa vale pelo ponto mais próximo. */
  onMarkClick?: (mark: ChartMarkClick) => void;
  /** @deprecated Use `onMarkClick`. Aceito até a 0.7.0. */
  onPointClick?: (point: ChartMarkClick) => void;
  /** Cores das series sem cor própria: lista em rotação ou `{ base }`, que gera os tons. Vence o `accent`. */
  palette?: ChartPalette;
  series: readonly ChartLineSeries[];
  /** Valor acima de cada ponto: sempre, nunca, ou só os da serie mais próxima do ponteiro. */
  showDataLabels?: MarkVisibility;
  /** Pontos de cada valor: sempre, nunca, ou só os da serie mais próxima do ponteiro. */
  showDots?: MarkVisibility;
  /** Botão "Ver como tabela". Ligado por padrão. */
  showTableToggle?: boolean;
  /**
   * Balão com as series da categoria mais próxima do ponteiro. Desligue para montar o próprio
   * `ChartTooltip` pela costura; sem balão nem costura, o ponto volta a ter o `<title>`.
   */
  showTooltip?: boolean;
  title: string;
  xAxis?: AxisVisibility;
  /** Título do eixo das categorias, embaixo do desenho. */
  xAxisTitle?: string;
  /** Linhas horizontais de referência e a linha do zero. */
  showGrid?: boolean;
  yAxis?: AxisVisibility;
  /** Padrão: escondido; visível quando alguma serie esta a direita. */
  yAxisRight?: AxisVisibility;
  /** Título do eixo de valor da direita. */
  yAxisRightTitle?: string;
  /** Título do eixo de valor, a esquerda do desenho. */
  yAxisTitle?: string;
}

export function ChartLine({
  accent,
  categories,
  curve = 'smooth',
  defaultHidden,
  defaultHiddenSeries,
  emptyMessage = 'Sem dados no período',
  formatRightValue,
  formatTooltipValue,
  formatValue = formatNumber,
  height = 260,
  includeZero = true,
  hidden,
  hiddenSeries,
  labelAngle = 'auto',
  minRightTickStep,
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
  yAxisRight,
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

  // A cor sai da lista inteira, e não das visíveis: desligar uma serie não pode
  // repintar as demais.
  const cores = useMemo(() => resolveSeriesColors(series, { accent, palette }), [accent, palette, series]);

  const eixos = useMemo(() => series.map(axisOf), [series]);
  const temEixoDireito = eixos.includes('right');
  const formatarDireita = formatRightValue ?? formatValue;
  const passoDireito = temEixoDireito ? minRightTickStep : minTickStep;
  const visibilidadeDireita = rightAxisVisibility(yAxisRight, temEixoDireito, yAxis);

  const dominios = useMemo(
    () =>
      valueAxisDomains({
        alignZero: includeZero,
        axes: eixos,
        domainOfSeries: (grupo) =>
          mergeDomains(grupo.map((serie) => domainOf(serie.values.filter((valor) => valor !== null), { includeZero }))),
        isOutOfScale,
        series,
      }),
    [eixos, includeZero, isOutOfScale, series],
  );
  const [dominioEsquerda, dominioDireita] = dominios;

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
    leftLabels: valueLabelsFor(dominioEsquerda, alturaDoDesenho, formatValue, minTickStep),
    rightLabels: valueLabelsFor(dominioDireita, alturaDoDesenho, formatarDireita, passoDireito),
    topRoom: showDataLabels === 'hidden' ? 0 : valueLabelRoom(font),
    width,
    xAxis,
    yAxis,
    yAxisRight: visibilidadeDireita,
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

  const {
    left: escalaEsquerda,
    right: escalaDireita,
    targetLeft: alvoEsquerda,
    targetRight: alvoDireita,
  } = useValueScales(dominios, plot.height, 0);

  const escalaDa = (indice: number) => (eixos[indice] === 'right' ? escalaDireita : escalaEsquerda);
  const formatoDa = (indice: number) => (eixos[indice] === 'right' ? formatarDireita : formatValue);

  const marcasEsquerda = ticksFor(alvoEsquerda, plot.height, undefined, minTickStep);
  const marcasDireita = ticksFor(alvoDireita, plot.height, undefined, passoDireito);

  const pontosPorSerie = series.map((serie, indiceSerie) =>
    categories.map<ChartPoint | null>((categoria, indice) => {
      const valor = serie.values[indice];

      if (valor === null || valor === undefined || !Number.isFinite(valor)) {
        return null;
      }

      return { x: escalaCategorias(categoria) ?? 0, y: escalaDa(indiceSerie)(valor) };
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

  const marcasDeValor = (valores: readonly number[], escala: (valor: number) => number, formatar: (valor: number) => string): AxisTick[] =>
    valores.map((valor) => ({ label: formatar(valor), position: escala(valor) }));

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
                baseline: escalaEsquerda(0),
                lines: marcasEsquerda.map((valor) => escalaEsquerda(valor)),
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
        <ChartTable {...categoryTable(categories, series, (valor, indice) => formatoDa(indice)(valor))} title={title} />
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
              series: series.map((serie, indice) => ({ ...serie, format: eixos[indice] === 'right' ? formatarDireita : undefined })),
            })
          : undefined
      }
      tooltipAnchor={pontos.tooltipAnchor}
      width={width}
      xAxis={{ labelRotation: rotation, ticks: marcasCategoria, title: xAxisTitle, visibility: xAxis }}
      yAxis={{ hideLine: true, ticks: marcasDeValor(marcasEsquerda, escalaEsquerda, formatValue), title: yAxisTitle, visibility: yAxis }}
      yAxisRight={{
        hideLine: true,
        ticks: marcasDeValor(marcasDireita, escalaDireita, formatarDireita),
        title: yAxisRightTitle,
        visibility: visibilidadeDireita,
      }}
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

              const descricao = `${serie.label}, ${categories[indice]}: ${formatoDa(indiceSerie)(serie.values[indice] ?? 0)}`;

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
                    {formatoDa(indiceSerie)(serie.values[indice] ?? 0)}
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
