import { useMemo, useState } from 'react';
import {
  ChartTable,
  categoryTable,
  BandCursor,
  markShown,
  categoryTooltip,
  CartesianFrame,
  NO_BAR_SLOT,
  barSlots,
  axisOf,
  rightAxisVisibility,
  useCartesianLayout,
  chartHeight,
  linePath,
  roundedBarPath,
  useChartMetrics,
  useHoveredBand,
  useSeriesToggle,
  useMarkNavigation,
  useTweenedNumbers,
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
  type ChartCategoryHover,
  type ChartMarkClick,
  type MarkVisibility,
  type ChartPoint,
  type ChartRootProps,
  type ChartValueAxis,
} from '../core';
import { resolveSeriesColors, type ChartPalette, type SeriesAppearance } from '../palette';
import { bandScale, domainOf, mergeDomains, ticksFor } from '../scales';
import { formatNumber } from '../../../utils/formatters';
import chartStyles from '../core/Chart.module.css';
import styles from './ChartCombo.module.css';
/**
 * Ponto sem vizinho desenhado. A curva entre ele e o nada nao tem tracado, e o
 * marcador so no hover deixaria o dado invisivel — entao ele aparece sempre.
 */
function isolado(pontos: readonly (ChartPoint | null)[], indice: number) {
  return pontos[indice] !== null && !pontos[indice - 1] && !pontos[indice + 1];
}


export type ChartComboKind = 'bar' | 'line';

export type ChartComboAxis = ChartValueAxis;

export interface ChartComboSeries extends SeriesAppearance {
  axis?: ChartComboAxis;
  /** Curva desta serie de linha. Vence a `curve` do grafico. */
  curve?: ChartCurve;
  kind: ChartComboKind;
  label: string;
  /** Visibilidade do rotulo de valor desta serie. Vence a `showDataLabels` do grafico. */
  showDataLabels?: MarkVisibility;
  values: readonly (number | null)[];
}

export interface ChartComboProps extends Omit<ChartRootProps, 'hidden'> {
  accent?: string;
  categories: readonly string[];
  curve?: ChartCurve;
  /** Series ocultas de inicio, enquanto o produto nao controla `hidden`. */
  defaultHidden?: readonly string[];
  emptyMessage?: string;
  formatRightValue?: (value: number) => string;
  /**
   * Formato no balao das series da esquerda. Sem ele, vale o `formatValue`: o eixo pode sair compacto e o
   * balao, exato. As da direita seguem `formatRightValue`.
   */
  formatTooltipValue?: (value: number) => string;
  formatValue?: (value: number) => string;
  height?: ChartHeight;
  /** Rotulos das series desligadas pela legenda (controlado). Substitui o `hidden` nativo da figure. */
  hidden?: readonly string[];
  labelAngle?: AxisLabelAngle;
  legend?: ChartLegendPosition;
  legendAlign?: ChartLegendAlign;
  /** Passo minimo entre as marcas do eixo da esquerda, na unidade do dado: 1 impede marcas fracionarias em contagens. */
  minTickStep?: number;
  /** O mesmo para o eixo da direita. */
  minRightTickStep?: number;
  /** Rotulos ocultos, a cada alternancia da legenda. */
  onHiddenChange?: (hidden: readonly string[]) => void;
  /** Categoria sob o ponteiro, ou `null` ao sair dela. */
  onHover?: (category: ChartCategoryHover | null) => void;
  /** Clique na barra ou no ponto da linha. Com ele, as marcas viram botoes percorridos pelas setas. */
  onMarkClick?: (mark: ChartMarkClick) => void;
  /** Cores das series sem cor propria: lista em rotacao ou `{ base }`, que gera os tons. Vence o `accent`. */
  palette?: ChartPalette;
  series: readonly ChartComboSeries[];
  /**
   * Valor de cada barra e de cada ponto; cada serie pode declarar o seu em `showDataLabels`. Em `onHover`, nas barras os da serie da barra sob o ponteiro; nas
   * linhas, que nao tem alvo proprio, os da categoria sob o ponteiro.
   */
  showDataLabels?: MarkVisibility;
  /** Pontos das linhas. Em `onHover`, os da categoria sob o ponteiro. */
  showDots?: MarkVisibility;
  /** Botao "Ver como tabela". Sem a prop, vale o do `ChartsProvider`, ligado por padrao. */
  showTableToggle?: boolean;
  /** Balao com as series da categoria sob o ponteiro, cada uma no formato do seu eixo. Desligue para montar o proprio `ChartTooltip`. */
  showTooltip?: boolean;
  title: string;
  xAxis?: AxisVisibility;
  /** Titulo do eixo das categorias, embaixo do desenho. */
  xAxisTitle?: string;
  yAxis?: AxisVisibility;
  yAxisRight?: AxisVisibility;
  /** Titulo do eixo de valor da direita. */
  yAxisRightTitle?: string;
  /** Titulo do eixo de valor da esquerda. */
  yAxisTitle?: string;
}

/** A serie decide a visibilidade do proprio rotulo; sem ela, vale a do grafico. */
function rotuloDaSerie(serie: ChartComboSeries, doGrafico: MarkVisibility) {
  return serie.showDataLabels ?? doGrafico;
}

/**
 * Barras e linhas sobre o mesmo eixo de categorias. Uma serie declara a que
 * eixo de valor pertence; sem nenhuma a direita, o dominio e unico e o eixo
 * direito espelha o esquerdo.
 */
export function ChartCombo({
  accent,
  categories,
  curve = 'smooth',
  defaultHidden,
  emptyMessage = 'Sem dados no período',
  formatRightValue,
  formatTooltipValue,
  formatValue = formatNumber,
  height = 260,
  hidden,
  labelAngle = 'auto',
  legend = 'bottom',
  legendAlign,
  minRightTickStep,
  minTickStep,
  onHiddenChange,
  onHover,
  onMarkClick,
  palette,
  series,
  showDataLabels = 'hidden',
  showTableToggle,
  showTooltip = true,
  showDots = 'onHover',
  title,
  xAxis = 'visible',
  xAxisTitle,
  yAxis = 'visible',
  yAxisRight,
  yAxisRightTitle,
  yAxisTitle,
  ...root
}: ChartComboProps) {
  const { font, height: alturaMedida, radius: raioDoCanto, ref, width } = useChartMetrics();
  const { fillHeight, value: alturaDoDesenho } = chartHeight(height, alturaMedida);
  const { isHidden, isOutOfScale, toggle } = useSeriesToggle({
    defaultHidden,
    hidden,
    labels: series.map((serie) => serie.label),
    onHiddenChange,
  });
  const hoverDaCategoria =
    onHover
      ? (index: number | null) => onHover(index === null ? null : { category: categories[index], index })
      : undefined;
  const { hover: focarFaixa, hovered: faixaEmFoco } = useHoveredBand(hoverDaCategoria);
  const [serieEmFoco, setSerieEmFoco] = useState<number | null>(null);
  const marcas = useMarkNavigation({
    onActivate: onMarkClick && (({ column, row }) =>
      onMarkClick({ category: categories[column], index: column, series: series[row].label, value: series[row].values[column] ?? 0 })),
    onFocusMark: (posicao) => {
      focarFaixa(posicao?.column ?? null);
      setSerieEmFoco(posicao?.row ?? null);
    },
    present: series.flatMap((serie, row) =>
      isHidden(serie.label)
        ? []
        : categories.flatMap((_, column) => (Number.isFinite(serie.values[column] ?? Number.NaN) ? [{ column, row }] : [])),
    ),
  });

  const formatarDireita = formatRightValue ?? formatValue;
  const eixos = useMemo(() => series.map(axisOf), [series]);
  const temEixoDireito = eixos.includes('right');

  // A cor sai da lista inteira, e nao das visiveis: desligar uma serie nao pode
  // repintar as demais.
  const cores = useMemo(() => resolveSeriesColors(series, { accent, palette }), [accent, palette, series]);

  // Presenca de cada serie, entre zero e um. E ela que reparte a faixa, entao a
  // barra desligada encolhe enquanto as demais ocupam o lugar dela.
  const presencas = useTweenedNumbers(series.map((serie) => (isHidden(serie.label) ? 0 : 1)));

  // Com serie a direita, o zero fica na mesma altura nos dois eixos: as barras crescem da mesma base.
  const dominios = useMemo(
    () =>
      valueAxisDomains({
        axes: eixos,
        domainOfSeries: (grupo) => mergeDomains(grupo.map((serie) => domainOf(serie.values.filter((valor) => valor !== null)))),
        isOutOfScale,
        series,
      }),
    [eixos, isOutOfScale, series],
  );
  const [dominioEsquerda, dominioDireita] = dominios;

  // Uma segunda escala sem eixo para le-la e o duplo eixo que engana. Havendo
  // serie a direita, o eixo aparece sem ninguem pedir.
  const visibilidadeDireita = rightAxisVisibility(yAxisRight, temEixoDireito, yAxis);

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
    rightLabels: valueLabelsFor(dominioDireita, alturaDoDesenho, formatarDireita, minRightTickStep),
    topRoom: series.every((serie) => rotuloDaSerie(serie, showDataLabels) === 'hidden') ? 0 : valueLabelRoom(font),
    width,
    xAxis,
    yAxis,
    yAxisRight: visibilidadeDireita,
  });

  // Barras e linhas compartilham a escala de faixas: a linha passa pelo centro
  // da faixa, que e onde a marca do eixo de categoria tambem fica.
  const escalaCategorias = useMemo(
    () => bandScale({ domain: categories, range: [0, plot.width] }),
    [categories, plot.width],
  );

  const {
    left: escalaEsquerda,
    right: escalaDireita,
    targetLeft: alvoEsquerda,
    targetRight: alvoDireita,
  } = useValueScales(dominios, plot.height, 0);

  const escalaDa = (serie: ChartComboSeries) =>
    axisOf(serie) === 'right' ? escalaDireita : escalaEsquerda;
  const formatoDa = (serie: ChartComboSeries) =>
    axisOf(serie) === 'right' ? formatarDireita : formatValue;

  const marcasEsquerda = ticksFor(alvoEsquerda, plot.height, undefined, minTickStep);
  const marcasDireita = ticksFor(alvoDireita, plot.height, undefined, minRightTickStep);

  const vao = escalaCategorias.bandwidth();

  // So as barras repartem a faixa: a linha passa pelo centro dela, e por isso
  // entra na conta com presenca zero.
  const faixas = barSlots(
    vao,
    series.map((serie, indice) => (serie.kind === 'bar' ? presencas[indice] ?? 0 : 0)),
  );
  const faixaDa = (indice: number) => faixas[indice] ?? NO_BAR_SLOT;

  const marcasCategoria: AxisTick[] = categories.map((categoria) => ({
    label: categoria,
    position: (escalaCategorias(categoria) ?? 0) + vao / 2,
  }));

  const marcasDeValor = (
    valores: readonly number[],
    escala: (valor: number) => number,
    formatar: (valor: number) => string,
  ): AxisTick[] => valores.map((valor) => ({ label: formatar(valor), position: escala(valor) }));

  return (
    <CartesianFrame
      axisReveal={axisReveal}
      canvasRole={marcas.interactive ? 'group' : 'img'}
      containerRef={ref}
      empty={series.length === 0 || categories.length === 0}
      emptyMessage={emptyMessage}
      fillHeight={fillHeight}
      font={font}
      grid={[
        {
          baseline: escalaEsquerda(0),
          lines: marcasEsquerda.map((valor) => escalaEsquerda(valor)),
          orientation: 'horizontal',
        },
      ]}
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
        <ChartTable {...categoryTable(categories, series, (valor, indice) => formatoDa(series[indice])(valor))} title={title} />
      }
      title={title}
      tooltip={
        showTooltip
          ? categoryTooltip({
              categories,
              colors: cores,
              format: formatTooltipValue ?? formatValue,
              index: faixaEmFoco,
              isHidden,
              series: series.map((serie) => ({ ...serie, format: axisOf(serie) === 'right' ? formatarDireita : undefined })),
            })
          : undefined
      }
      tooltipAnchor={marcas.tooltipAnchor}
      width={width}
      xAxis={{ labelRotation: rotation, ticks: marcasCategoria, title: xAxisTitle, visibility: xAxis }}
      yAxis={{
        hideLine: true,
        ticks: marcasDeValor(marcasEsquerda, escalaEsquerda, formatValue),
        title: yAxisTitle,
        visibility: yAxis,
      }}
      yAxisRight={{
        hideLine: true,
        ticks: marcasDeValor(marcasDireita, escalaDireita, formatarDireita),
        title: yAxisRightTitle,
        visibility: visibilidadeDireita,
      }}
    >
      {faixaEmFoco !== null && (
        <BandCursor offset={escalaCategorias(categories[faixaEmFoco]) ?? 0} plot={plot} size={vao} />
      )}

      <g {...marcas.groupProps}>
        {series.map((serie, indiceSerie) => {
          if (serie.kind !== 'bar') {
            return null;
          }

          const oculta = isHidden(serie.label);
          const escala = escalaDa(serie);
          const formatar = formatoDa(serie);
          const rotulos = removed.has('detail') ? 'hidden' : rotuloDaSerie(serie, showDataLabels);
          const base = escala(0);

          return (
            <g
              aria-hidden={oculta || undefined}
              className={`${chartStyles.series} ${oculta ? chartStyles.seriesOff : ''}`}
              key={indiceSerie}
            >
              {categories.map((categoria, indiceCategoria) => {
                const valor = serie.values[indiceCategoria];

                if (valor === null || valor === undefined || !Number.isFinite(valor)) {
                  return null;
                }

                const ponta = escala(valor);

                return (
                  <path
                    aria-label={`${serie.label}, ${categoria}: ${formatar(valor)}`}
                    {...marcas.markProps({ column: indiceCategoria, row: indiceSerie }, styles.bar)}
                    d={roundedBarPath(
                      (escalaCategorias(categoria) ?? 0) + faixaDa(indiceSerie).offset,
                      Math.min(base, ponta),
                      faixaDa(indiceSerie).thickness,
                      Math.abs(ponta - base),
                      [raioDoCanto, raioDoCanto, raioDoCanto, raioDoCanto],
                    )}
                    fill={cores[indiceSerie]}
                    key={indiceCategoria}
                    onMouseEnter={() => {
                      focarFaixa(indiceCategoria);
                      setSerieEmFoco(indiceSerie);
                    }}
                    onMouseLeave={() => {
                      focarFaixa(null);
                      setSerieEmFoco(null);
                    }}
                  />
                );
              })}

              {rotulos !== 'hidden' &&
                categories.map((categoria, indiceCategoria) => {
                  const valor = serie.values[indiceCategoria];

                  if (valor === null || valor === undefined || !Number.isFinite(valor)) {
                    return null;
                  }

                  return (
                    <text
                      className={`${chartStyles.valueLabel} ${markShown(rotulos, indiceSerie === serieEmFoco) ? '' : chartStyles.valueLabelHidden}`}
                      key={indiceCategoria}
                      textAnchor="middle"
                      x={
                        (escalaCategorias(categoria) ?? 0) +
                        faixaDa(indiceSerie).offset +
                        faixaDa(indiceSerie).thickness / 2
                      }
                      y={escala(valor) - 6}
                    >
                      {formatar(valor)}
                    </text>
                  );
                })}
            </g>
          );
        })}

        {series.map((serie, indiceSerie) => {
          if (serie.kind !== 'line') {
            return null;
          }

          const oculta = isHidden(serie.label);
          const escala = escalaDa(serie);
          const formatar = formatoDa(serie);
          const rotulos = removed.has('detail') ? 'hidden' : rotuloDaSerie(serie, showDataLabels);
          const pontos = categories.map<ChartPoint | null>((categoria, indice) => {
            const valor = serie.values[indice];

            if (valor === null || valor === undefined || !Number.isFinite(valor)) {
              return null;
            }

            return { x: (escalaCategorias(categoria) ?? 0) + vao / 2, y: escala(valor) };
          });

          return (
            <g
              aria-hidden={oculta || undefined}
              className={`${chartStyles.series} ${oculta ? chartStyles.seriesOff : ''}`}
              key={indiceSerie}
            >
              <path
                className={chartStyles.line}
                d={linePath(pontos, serie.curve ?? curve)}
                fill="none"
                stroke={cores[indiceSerie]}
              />

              {pontos.map((ponto, indice) =>
                ponto === null ? null : (
                  <circle
                    aria-label={`${serie.label}, ${categories[indice]}: ${formatar(serie.values[indice] ?? 0)}`}
                    {...marcas.markProps(
                      { column: indice, row: indiceSerie },
                      markShown(removed.has('detail') ? 'hidden' : showDots, indice === faixaEmFoco) || isolado(pontos, indice) ? chartStyles.dotVisible : chartStyles.dot,
                    )}
                    cx={ponto.x}
                    cy={ponto.y}
                    stroke={cores[indiceSerie]}
                    key={indice}
                    r={4}
                  />
                ),
              )}

              {rotulos !== 'hidden' &&
                pontos.map((ponto, indice) =>
                  ponto === null ? null : (
                    <text
                      className={`${chartStyles.valueLabel} ${markShown(rotulos, indice === faixaEmFoco) ? '' : chartStyles.valueLabelHidden}`}
                      key={indice}
                      textAnchor="middle"
                      x={ponto.x}
                      y={ponto.y - 10}
                    >
                      {formatar(serie.values[indice] ?? 0)}
                    </text>
                  ),
                )}
            </g>
          );
        })}
      </g>
    </CartesianFrame>
  );
}
