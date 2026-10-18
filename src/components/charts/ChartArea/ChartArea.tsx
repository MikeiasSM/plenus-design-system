import { useId, useMemo, useState } from 'react';
import {
  CartesianFrame,
  categoryTooltip,
  PointBands,
  PointCursor,
  areaPath,
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
  type ChartBand,
  type ChartCurve,
  type ChartHeight,
  type ChartLegendAlign,
  type ChartLegendPosition,
  type MarkVisibility,
  type ChartPoint,
} from '../core';
import { resolveSeriesColors, type SeriesAppearance } from '../palette';
import { domainOf, linearScale, mergeDomains, pointScale, stackDiverging, ticksFor } from '../scales';
import { formatarNumero } from '../../../utils/formatters';
import styles from './ChartArea.module.css';
/**
 * Faixa sem vizinha desenhada. O contorno entre ela e o nada nao tem tracado, e
 * o marcador so no hover deixaria o dado invisivel.
 */
function isolada(faixas: readonly (ChartBand | null)[], indice: number) {
  return faixas[indice] !== null && !faixas[indice - 1] && !faixas[indice + 1];
}

/** Altura do zero dentro da area da serie, de 0 no topo a 1 na base. O degrade clareia rumo a ele pelos dois lados. */
function alturaDoZero(faixas: readonly (ChartBand | null)[], base: number) {
  const pontas = faixas.flatMap((faixa) => (faixa === null ? [] : [faixa.y1]));
  const topo = Math.min(base, ...pontas);
  const fundo = Math.max(base, ...pontas);

  return fundo > topo ? (base - topo) / (fundo - topo) : 1;
}

export interface ChartAreaSeries extends SeriesAppearance {
  label: string;
  values: readonly (number | null)[];
}

export interface ChartAreaProps {
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
  series: readonly ChartAreaSeries[];
  /** Valor acima de cada ponto: sempre, nunca, ou so os da serie mais proxima do ponteiro. */
  showDataLabels?: MarkVisibility;
  /** Pontos de cada valor: sempre, nunca, ou so os da serie mais proxima do ponteiro. */
  showDots?: MarkVisibility;
  /**
   * Balao com as series da categoria mais proxima do ponteiro. Desligue para montar o proprio
   * `ChartTooltip` pela costura; sem balao nem costura, o ponto volta a ter o `<title>`.
   */
  showTooltip?: boolean;
  stacked?: boolean;
  title: string;
  xAxis?: AxisVisibility;
  yAxis?: AxisVisibility;
  yAxisRight?: AxisVisibility;
}


export function ChartArea({
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
  series,
  showDataLabels = 'hidden',
  showDots = 'onHover',
  showTooltip = true,
  stacked = false,
  title,
  xAxis = 'visible',
  yAxis = 'visible',
  yAxisRight = 'hidden',
}: ChartAreaProps) {
  const gradienteId = useId();
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
  const cores = useMemo(() => resolveSeriesColors(series, { accent }), [accent, series]);

  // Presenca de cada serie, entre zero e um. Empilhadas, ela pesa a
  // contribuicao, entao a faixa desligada encolhe e a pilha acompanha.
  const presencas = useTweenedNumbers(series.map((serie) => (isHidden(serie.label) ? 0 : 1)));
  const presenca = (indice: number) => presencas[indice] ?? 0;

  const dominio = useMemo(() => {
    const naEscala = seriesInScale(series, isOutOfScale);
    const visivel = (ordem: number) => (naEscala.includes(series[ordem]) ? 1 : 0);

    if (stacked) {
      return domainOf(
        categories.flatMap((_, indice) =>
          stackDiverging(series.map((serie, ordem) => (serie.values[indice] ?? 0) * visivel(ordem))).flat(),
        ),
      );
    }

    return mergeDomains(
      naEscala.map((serie) => domainOf(serie.values.filter((valor) => valor !== null), { includeZero })),
    );
  }, [categories, includeZero, isOutOfScale, series, stacked]);

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
  // Sem o zero no dominio, a area desce ate o limite do eixo, e nao ate um zero fora do desenho.
  const base = escalaValores(Math.min(Math.max(0, minimo), maximo));
  const pilhas = categories.map((_, indice) =>
    stackDiverging(series.map((serie, ordem) => (serie.values[indice] ?? 0) * presenca(ordem))),
  );

  const faixasPorSerie = series.map((serie, indiceSerie) =>
    categories.map<ChartBand | null>((categoria, indice) => {
      const valor = serie.values[indice];

      if (valor === null || valor === undefined || !Number.isFinite(valor)) {
        return null;
      }

      const [de, ate] = pilhas[indice][indiceSerie];

      return {
        x: escalaCategorias(categoria) ?? 0,
        y0: stacked ? escalaValores(de) : base,
        y1: stacked ? escalaValores(ate) : escalaValores(valor),
      };
    }),
  );

  const contornos = faixasPorSerie.map((faixas) => faixas.map((faixa) => faixa && { x: faixa.x, y: faixa.y1 }));
  const serieEmFoco = nearestSeriesAt(
    contornos,
    categoriaEmFoco,
    alturaDoPonteiro,
    (indice) => isHidden(series[indice].label),
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
      grid={[
        {
          baseline: escalaValores(0),
          lines: marcasDeValor.map((valor) => escalaValores(valor)),
          orientation: 'horizontal',
        },
      ]}
      fillHeight={fillHeight}
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
              showTotal: stacked,
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

      {/* Sem empilhamento as areas se sobrepoem, e um topo opaco esconderia a de
          baixo. O contorno em cor cheia e que marca o limite de cada faixa. */}
      {!stacked && (
        <defs>
          {series.map((serie, indice) => {
            const zero = alturaDoZero(faixasPorSerie[indice], base);

            return (
              <linearGradient id={`${gradienteId}-${indice}`} key={indice} x1="0" x2="0" y1="0" y2="1">
                {zero > 0 && <stop offset={zero * 0.05} stopColor={cores[indice]} stopOpacity={0.6} />}
                <stop offset={zero} stopColor={cores[indice]} stopOpacity={0.05} />
                {zero < 1 && <stop offset={zero + (1 - zero) * 0.95} stopColor={cores[indice]} stopOpacity={0.6} />}
              </linearGradient>
            );
          })}
        </defs>
      )}

      {series.map((serie, indiceSerie) => {
        const faixas = faixasPorSerie[indiceSerie];
        const contorno = faixas.map<ChartPoint | null>((faixa) =>
          faixa === null ? null : { x: faixa.x, y: faixa.y1 },
        );

        const oculta = isHidden(serie.label);

        return (
          <g
            aria-hidden={oculta || undefined}
            className={`${styles.series} ${oculta ? styles.seriesOff : ''}`}
            key={indiceSerie}
          >
            <path
              d={areaPath(faixas, curve)}
              fill={stacked ? cores[indiceSerie] : `url(#${gradienteId}-${indiceSerie})`}
              fillOpacity={stacked ? 0.4 : undefined}
            />
            <path
              className={styles.outline}
              d={linePath(contorno, curve)}
              fill="none"
              stroke={cores[indiceSerie]}
            />

            {categories.map((categoria, indice) => {
              const faixa = faixas[indice];

              if (faixa === null) {
                return null;
              }

              const descricao = `${serie.label}, ${categoria}: ${formatValue(serie.values[indice] ?? 0)}`;

              return (
                <circle
                  aria-label={descricao}
                  className={
                    markShown(showDots, indiceSerie === serieEmFoco) || isolada(faixas, indice)
                      ? styles.dotVisible
                      : styles.dot
                  }
                  cx={faixa.x}
                  cy={faixa.y1}
                  stroke={cores[indiceSerie]}
                  key={indice}
                  r={4}
                >
                  {!comFaixas && <title>{descricao}</title>}
                </circle>
              );
            })}

            {showDataLabels !== 'hidden' &&
              categories.map((categoria, indice) => {
                const faixa = faixas[indice];

                if (faixa === null) {
                  return null;
                }

                const { below, dx, textAnchor } = pointLabelPlacement(contornos, indiceSerie, indice, font.lineHeight, (outra) =>
                  isHidden(series[outra].label),
                );

                return (
                  <text
                    className={`${styles.valueLabel} ${markShown(showDataLabels, indiceSerie === serieEmFoco) ? '' : styles.valueLabelHidden}`}
                    key={indice}
                    textAnchor={textAnchor}
                    x={faixa.x + dx}
                    y={below ? faixa.y1 + font.lineHeight + 2 : faixa.y1 - 10}
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
