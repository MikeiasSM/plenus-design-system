import { useMemo, useState } from 'react';
import {
  BandCursor,
  markShown,
  categoryTooltip,
  CartesianFrame,
  NO_BAR_SLOT,
  barSlots,
  seriesInScale,
  useCartesianLayout,
  chartHeight,
  linePath,
  roundedBarPath,
  useChartMetrics,
  useHoveredBand,
  useSeriesToggle,
  useMarkNavigation,
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
  type ChartMarkClick,
  type MarkVisibility,
  type ChartPoint,
  type ChartRootProps,
} from '../core';
import { resolveSeriesColors, type ChartPalette, type SeriesAppearance } from '../palette';
import { alignZeros, bandScale, domainOf, linearScale, mergeDomains, ticksFor, type NumericRange } from '../scales';
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

/**
 * Eixo de valor a que a serie pertence. A escolha e sempre do produto: o
 * grafico nunca parte a escala por conta propria.
 */
export type ChartComboAxis = 'left' | 'right';

export interface ChartComboSeries extends SeriesAppearance {
  axis?: ChartComboAxis;
  kind: ChartComboKind;
  label: string;
  values: readonly (number | null)[];
}

export interface ChartComboProps extends ChartRootProps {
  accent?: string;
  categories: readonly string[];
  curve?: ChartCurve;
  defaultHiddenSeries?: readonly string[];
  emptyMessage?: string;
  formatRightValue?: (value: number) => string;
  /**
   * Formato no balao das series da esquerda. Sem ele, vale o `formatValue`: o eixo pode sair compacto e o
   * balao, exato. As da direita seguem `formatRightValue`.
   */
  formatTooltipValue?: (value: number) => string;
  formatValue?: (value: number) => string;
  height?: ChartHeight;
  hiddenSeries?: readonly string[];
  labelAngle?: AxisLabelAngle;
  legend?: ChartLegendPosition;
  legendAlign?: ChartLegendAlign;
  onHiddenSeriesChange?: (hidden: readonly string[]) => void;
  /** Clique na barra ou no ponto da linha. Com ele, as marcas viram botoes percorridos pelas setas. */
  onMarkClick?: (mark: ChartMarkClick) => void;
  /** Indice da categoria sob o ponteiro, ou `null` ao sair dela. */
  onHoverCategory?: (index: number | null) => void;
  /** Cores das series sem cor propria: lista em rotacao ou `{ base }`, que gera os tons. Vence o `accent`. */
  palette?: ChartPalette;
  series: readonly ChartComboSeries[];
  /**
   * Valor de cada barra e de cada ponto. Em `onHover`, nas barras os da serie da barra sob o ponteiro; nas
   * linhas, que nao tem alvo proprio, os da categoria sob o ponteiro.
   */
  showDataLabels?: MarkVisibility;
  /** Pontos das linhas. Em `onHover`, os da categoria sob o ponteiro. */
  showDots?: MarkVisibility;
  /** Balao com as series da categoria sob o ponteiro, cada uma no formato do seu eixo. Desligue para montar o proprio `ChartTooltip`. */
  showTooltip?: boolean;
  title: string;
  xAxis?: AxisVisibility;
  yAxis?: AxisVisibility;
  yAxisRight?: AxisVisibility;
}

function eixoDa(serie: ChartComboSeries): ChartComboAxis {
  return serie.axis ?? 'left';
}

/** Dominio de um eixo: as series que pertencem a ele e entram na escala. */
function dominioDoEixo(
  series: readonly ChartComboSeries[],
  axis: ChartComboAxis,
  oculta: (label: string) => boolean,
) {
  return mergeDomains(
    seriesInScale(
      series.filter((serie) => eixoDa(serie) === axis),
      oculta,
    ).map((serie) => domainOf(serie.values.filter((valor) => valor !== null))),
  );
}

/** Dominio com os limites arredondados que o eixo mostraria sozinho. */
function arredondado(dominio: NumericRange): NumericRange {
  const [min = 0, max = 0] = linearScale({ domain: dominio, range: [0, 1] }).domain();

  return { max, min };
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
  defaultHiddenSeries,
  emptyMessage = 'Sem dados no período',
  formatRightValue,
  formatTooltipValue,
  formatValue = formatNumber,
  height = 260,
  hiddenSeries,
  labelAngle = 'auto',
  legend = 'bottom',
  legendAlign,
  onHiddenSeriesChange,
  onHoverCategory,
  onMarkClick,
  palette,
  series,
  showDataLabels = 'hidden',
  showTooltip = true,
  showDots = 'onHover',
  title,
  xAxis = 'visible',
  yAxis = 'visible',
  yAxisRight,
  ...root
}: ChartComboProps) {
  const { font, height: alturaMedida, radius: raioDoCanto, ref, width } = useChartMetrics();
  const { fillHeight, value: alturaDoDesenho } = chartHeight(height, alturaMedida);
  const { isHidden, isOutOfScale, toggle } = useSeriesToggle({
    defaultHiddenSeries,
    hiddenSeries,
    labels: series.map((serie) => serie.label),
    onHiddenSeriesChange,
  });
  const { hover: focarFaixa, hovered: faixaEmFoco } = useHoveredBand(onHoverCategory);
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
  const temEixoDireito = series.some((serie) => eixoDa(serie) === 'right');

  // A cor sai da lista inteira, e nao das visiveis: desligar uma serie nao pode
  // repintar as demais.
  const cores = useMemo(() => resolveSeriesColors(series, { accent, palette }), [accent, palette, series]);

  // Presenca de cada serie, entre zero e um. E ela que reparte a faixa, entao a
  // barra desligada encolhe enquanto as demais ocupam o lugar dela.
  const presencas = useTweenedNumbers(series.map((serie) => (isHidden(serie.label) ? 0 : 1)));

  // Com serie a direita, o zero fica na mesma altura nos dois eixos: as barras crescem da mesma base.
  const [dominioEsquerda, dominioDireita] = useMemo(() => {
    const esquerda = arredondado(dominioDoEixo(series, 'left', isOutOfScale));

    return temEixoDireito
      ? alignZeros(esquerda, arredondado(dominioDoEixo(series, 'right', isOutOfScale)))
      : [esquerda, esquerda];
  }, [isOutOfScale, series, temEixoDireito]);

  // Uma segunda escala sem eixo para le-la e o duplo eixo que engana. Havendo
  // serie a direita, o eixo aparece sem ninguem pedir.
  const visibilidadeDireita = yAxisRight ?? (temEixoDireito ? 'visible' : 'hidden');

  const { axisReveal, margins, plot, rotation } = useCartesianLayout({
    bottomLabels: categories,
    font,
    height: alturaDoDesenho,
    labelAngle,
    leftLabels: valueLabelsFor(dominioEsquerda, alturaDoDesenho, formatValue),
    rightLabels: valueLabelsFor(dominioDireita, alturaDoDesenho, formatarDireita),
    topRoom: showDataLabels === 'hidden' ? 0 : valueLabelRoom(font),
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

  // A escala alvo fixa as marcas; a animada posiciona o desenho. Sem separar as
  // duas, as marcas exibiriam valores quebrados durante a transicao.
  const alvoEsquerda = useMemo(
    () => linearScale({ domain: dominioEsquerda, nice: false, range: [plot.height, 0] }),
    [dominioEsquerda, plot.height],
  );

  const alvoDireita = useMemo(
    () => linearScale({ domain: dominioDireita, nice: false, range: [plot.height, 0] }),
    [dominioDireita, plot.height],
  );

  // Os dois dominios caminham numa animacao so, e por isso chegam juntos.
  const [minEsquerda, maxEsquerda, minDireita, maxDireita] = useTweenedNumbers([
    ...alvoEsquerda.domain(),
    ...alvoDireita.domain(),
  ]);

  const escalaEsquerda = useMemo(
    () =>
      linearScale({ domain: { min: minEsquerda, max: maxEsquerda }, nice: false, range: [plot.height, 0] }),
    [maxEsquerda, minEsquerda, plot.height],
  );

  const escalaDireita = useMemo(
    () => linearScale({ domain: { min: minDireita, max: maxDireita }, nice: false, range: [plot.height, 0] }),
    [maxDireita, minDireita, plot.height],
  );

  const escalaDa = (serie: ChartComboSeries) =>
    eixoDa(serie) === 'right' ? escalaDireita : escalaEsquerda;
  const formatoDa = (serie: ChartComboSeries) =>
    eixoDa(serie) === 'right' ? formatarDireita : formatValue;

  const marcasEsquerda = ticksFor(alvoEsquerda, plot.height);
  const marcasDireita = ticksFor(alvoDireita, plot.height);

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
      grid={[
        {
          baseline: escalaEsquerda(0),
          lines: marcasEsquerda.map((valor) => escalaEsquerda(valor)),
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
              index: faixaEmFoco,
              isHidden,
              series: series.map((serie) => ({ ...serie, format: eixoDa(serie) === 'right' ? formatarDireita : undefined })),
            })
          : undefined
      }
      tooltipAnchor={marcas.tooltipAnchor}
      width={width}
      xAxis={{ labelRotation: rotation, ticks: marcasCategoria, visibility: xAxis }}
      yAxis={{
        hideLine: true,
        ticks: marcasDeValor(marcasEsquerda, escalaEsquerda, formatValue),
        visibility: yAxis,
      }}
      yAxisRight={{
        hideLine: true,
        ticks: marcasDeValor(marcasDireita, escalaDireita, formatarDireita),
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

              {showDataLabels !== 'hidden' &&
                categories.map((categoria, indiceCategoria) => {
                  const valor = serie.values[indiceCategoria];

                  if (valor === null || valor === undefined || !Number.isFinite(valor)) {
                    return null;
                  }

                  return (
                    <text
                      className={`${chartStyles.valueLabel} ${markShown(showDataLabels, indiceSerie === serieEmFoco) ? '' : chartStyles.valueLabelHidden}`}
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
                d={linePath(pontos, curve)}
                fill="none"
                stroke={cores[indiceSerie]}
              />

              {pontos.map((ponto, indice) =>
                ponto === null ? null : (
                  <circle
                    aria-label={`${serie.label}, ${categories[indice]}: ${formatar(serie.values[indice] ?? 0)}`}
                    {...marcas.markProps(
                      { column: indice, row: indiceSerie },
                      markShown(showDots, indice === faixaEmFoco) || isolado(pontos, indice) ? chartStyles.dotVisible : chartStyles.dot,
                    )}
                    cx={ponto.x}
                    cy={ponto.y}
                    stroke={cores[indiceSerie]}
                    key={indice}
                    r={4}
                  />
                ),
              )}

              {showDataLabels !== 'hidden' &&
                pontos.map((ponto, indice) =>
                  ponto === null ? null : (
                    <text
                      className={`${chartStyles.valueLabel} ${markShown(showDataLabels, indice === faixaEmFoco) ? '' : chartStyles.valueLabelHidden}`}
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
