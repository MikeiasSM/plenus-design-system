import { useMemo, useState } from 'react';
import {
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
} from '../core';
import { resolveSeriesColors, type ChartPalette, type SeriesAppearance } from '../palette';
import { domainOf, linearScale, mergeDomains, pointScale, ticksFor } from '../scales';
import { formatarNumero } from '../../../utils/formatters';
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

export interface ChartLineProps extends ChartRootProps {
  accent?: string;
  categories: readonly string[];
  curve?: ChartCurve;
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
  hiddenSeries?: readonly string[];
  labelAngle?: AxisLabelAngle;
  legend?: ChartLegendPosition;
  legendAlign?: ChartLegendAlign;
  onHiddenSeriesChange?: (hidden: readonly string[]) => void;
  /** Indice da categoria mais proxima do ponteiro, ou `null` ao sair. */
  onHoverCategory?: (index: number | null) => void;
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
  showTooltip?: boolean;
  title: string;
  xAxis?: AxisVisibility;
  yAxis?: AxisVisibility;
  yAxisRight?: AxisVisibility;
}

export function ChartLine({
  accent,
  categories,
  curve = 'smooth',
  defaultHiddenSeries,
  emptyMessage = 'Sem dados no período',
  formatTooltipValue,
  formatValue = formatarNumero,
  height = 260,
  includeZero = true,
  hiddenSeries,
  labelAngle = 'auto',
  legend = 'bottom',
  legendAlign,
  onHiddenSeriesChange,
  onHoverCategory,
  palette,
  series,
  showDataLabels = 'hidden',
  showDots = 'onHover',
  showTooltip = true,
  title,
  xAxis = 'visible',
  yAxis = 'visible',
  yAxisRight = 'hidden',
  ...root
}: ChartLineProps) {
  const { font, height: alturaMedida, ref, width } = useChartMetrics();
  const { fillHeight, value: alturaDoDesenho } = chartHeight(height, alturaMedida);
  const { isHidden, isOutOfScale, toggle } = useSeriesToggle({
    defaultHiddenSeries,
    hiddenSeries,
    labels: series.map((serie) => serie.label),
    onHiddenSeriesChange,
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

  const rotulosDeValor = valueLabelsFor(dominio, alturaDoDesenho, formatValue);

  const { axisReveal, margins, plot, rotation } = useCartesianLayout({
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

  const { hover: focarCategoria, hovered: categoriaEmFoco } = useHoveredBand(onHoverCategory);
  const [alturaDoPonteiro, setAlturaDoPonteiro] = useState<number | null>(null);
  const comFaixas =
    showTooltip || onHoverCategory !== undefined || showDots === 'onHover' || showDataLabels === 'onHover';

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

  const marcasDeValor = ticksFor(escalaAlvo, plot.height);

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
      axisReveal={axisReveal}
      containerRef={ref}
      empty={series.length === 0 || categories.length === 0}
      emptyMessage={emptyMessage}
      fillHeight={fillHeight}
      grid={[
        {
          baseline: escalaValores(0),
          lines: marcasDeValor.map((valor) => escalaValores(valor)),
          orientation: 'horizontal',
        },
      ]}
      height={alturaDoDesenho}
      legend={series.map((serie, indice) => ({
        color: cores[indice],
        hidden: isHidden(serie.label),
        label: serie.label,
      }))}
      legendAlign={legendAlign}
      legendPosition={legend}
      margins={margins}
      onToggleSeries={toggle}
      plot={plot}
      root={root}
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
      width={width}
      xAxis={{ labelRotation: rotation, ticks: marcasCategoria, visibility: xAxis }}
      yAxis={{ hideLine: true, ticks: marcasValor, visibility: yAxis }}
      yAxisRight={{ hideLine: true, ticks: marcasValor, visibility: yAxisRight }}
    >
      {comFaixas && categoriaEmFoco !== null && (
        <PointCursor plot={plot} position={posicoesCategoria[categoriaEmFoco]} />
      )}

      {series.map((serie, indiceSerie) => {
        const oculta = isHidden(serie.label);

        return (
          <g
            aria-hidden={oculta || undefined}
            className={`${styles.series} ${oculta ? styles.seriesOff : ''}`}
            key={indiceSerie}
          >
            <path
              className={styles.line}
              d={linePath(pontosPorSerie[indiceSerie], curve)}
              fill="none"
              stroke={cores[indiceSerie]}
            />

            {pontosPorSerie[indiceSerie].map((ponto, indice) => {
              if (ponto === null) {
                return null;
              }

              const descricao = `${serie.label}, ${categories[indice]}: ${formatValue(serie.values[indice] ?? 0)}`;

              return (
                <circle
                  aria-label={descricao}
                  className={
                    markShown(showDots, indiceSerie === serieEmFoco) || isolado(pontosPorSerie[indiceSerie], indice)
                      ? styles.dotVisible
                      : styles.dot
                  }
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

            {showDataLabels !== 'hidden' &&
              pontosPorSerie[indiceSerie].map((ponto, indice) => {
                if (ponto === null) {
                  return null;
                }

                const { below, dx, textAnchor } = pointLabelPlacement(pontosPorSerie, indiceSerie, indice, font.lineHeight, (outra) =>
                  isHidden(series[outra].label),
                );

                return (
                  <text
                    className={`${styles.valueLabel} ${markShown(showDataLabels, indiceSerie === serieEmFoco) ? '' : styles.valueLabelHidden}`}
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

      {comFaixas && (
        <PointBands
          onHover={focarCategoria}
          onPointerY={setAlturaDoPonteiro}
          plot={plot}
          positions={posicoesCategoria}
        />
      )}
    </CartesianFrame>
  );
}
