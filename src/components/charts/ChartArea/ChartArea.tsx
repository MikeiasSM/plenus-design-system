import { useId, useMemo, useState } from 'react';
import {
  ChartTable,
  categoryTable,
  CartesianFrame,
  categoryTooltip,
  PointBands,
  PointCursor,
  areaPath,
  axisOf,
  rightAxisVisibility,
  stackByAxis,
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
  useValueScales,
  valueAxisDomains,
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
  type ChartRootProps,
  type ChartValueAxis,
  type ChartCategoryHover,
  type ChartMarkClick,
  type MarkPosition,
} from '../core';
import { resolveSeriesColors, type ChartPalette, type SeriesAppearance } from '../palette';
import { domainOf, mergeDomains, pointScale, stackDiverging, ticksFor } from '../scales';
import { formatNumber } from '../../../utils/formatters';
import chartStyles from '../core/Chart.module.css';
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
  /** Eixo de valor da serie. Com alguma a direita, o eixo da direita ganha escala propria. */
  axis?: ChartValueAxis;
  label: string;
  values: readonly (number | null)[];
}

export interface ChartAreaProps extends Omit<ChartRootProps, 'hidden'> {
  accent?: string;
  categories: readonly string[];
  curve?: ChartCurve;
  /** Series ocultas de inicio, enquanto o produto nao controla `hidden`. */
  defaultHidden?: readonly string[];
  /** @deprecated Use `defaultHidden`. Aceito ate a 0.7.0; com os dois, vale o novo. */
  defaultHiddenSeries?: readonly string[];
  emptyMessage?: string;
  /** Formato do eixo da direita, dos rotulos e do balao das series dele. Sem ele, vale o `formatValue`. */
  formatRightValue?: (value: number) => string;
  /** Formato dos valores no balao das series da esquerda. Sem ele, vale o `formatValue`: o eixo pode sair compacto e o balao, exato. */
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
  /** O mesmo para o eixo da direita. */
  minRightTickStep?: number;
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
  series: readonly ChartAreaSeries[];
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
  /** Empilha so as series do mesmo eixo: cada eixo tem a sua pilha. */
  stacked?: boolean;
  title: string;
  xAxis?: AxisVisibility;
  /** Titulo do eixo das categorias, embaixo do desenho. */
  xAxisTitle?: string;
  /** Linhas horizontais de referência e a linha do zero. */
  showGrid?: boolean;
  yAxis?: AxisVisibility;
  /** Padrao: escondido; visivel quando alguma serie esta a direita. */
  yAxisRight?: AxisVisibility;
  /** Titulo do eixo de valor da direita. */
  yAxisRightTitle?: string;
  /** Titulo do eixo de valor, a esquerda do desenho. */
  yAxisTitle?: string;
}


export function ChartArea({
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
  stacked = false,
  title,
  xAxis = 'visible',
  xAxisTitle,
  showGrid = true,
  yAxis = 'visible',
  yAxisRight,
  yAxisRightTitle,
  yAxisTitle,
  ...root
}: ChartAreaProps) {
  const gradienteId = useId();
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

  // Presenca de cada serie, entre zero e um. Empilhadas, ela pesa a
  // contribuicao, entao a faixa desligada encolhe e a pilha acompanha.
  const presencas = useTweenedNumbers(series.map((serie) => (isHidden(serie.label) ? 0 : 1)));
  const presenca = (indice: number) => presencas[indice] ?? 0;

  const eixos = useMemo(() => series.map(axisOf), [series]);
  const temEixoDireito = eixos.includes('right');
  const formatarDireita = formatRightValue ?? formatValue;
  const passoDireito = temEixoDireito ? minRightTickStep : minTickStep;
  const visibilidadeDireita = rightAxisVisibility(yAxisRight, temEixoDireito, yAxis);

  const dominios = useMemo(
    () =>
      valueAxisDomains({
        alignZero: stacked || includeZero,
        axes: eixos,
        domainOfSeries: (grupo) =>
          stacked
            ? domainOf(categories.flatMap((_, indice) => stackDiverging(grupo.map((serie) => serie.values[indice] ?? 0)).flat()))
            : mergeDomains(grupo.map((serie) => domainOf(serie.values.filter((valor) => valor !== null), { includeZero }))),
        isOutOfScale,
        series,
      }),
    [categories, eixos, includeZero, isOutOfScale, series, stacked],
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

  // Sem o zero no dominio, a area desce ate o limite do eixo, e nao ate um zero fora do desenho.
  const baseDa = (indice: number) => {
    const escala = escalaDa(indice);
    const [minimo = 0, maximo = 0] = escala.domain();

    return escala(Math.min(Math.max(0, minimo), maximo));
  };
  const pilhas = categories.map((_, indice) =>
    stackByAxis(series.map((serie, ordem) => (serie.values[indice] ?? 0) * presenca(ordem)), eixos),
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
        y0: stacked ? escalaDa(indiceSerie)(de) : baseDa(indiceSerie),
        y1: stacked ? escalaDa(indiceSerie)(ate) : escalaDa(indiceSerie)(valor),
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

  const clicarNoPonto =
    aoClicarNoPonto &&
    (({ column, row }: MarkPosition) =>
      aoClicarNoPonto({ category: categories[column], index: column, series: series[row].label, value: series[row].values[column] ?? 0 }));
  const pontos = useMarkNavigation({
    onActivate: clicarNoPonto,
    onFocusMark: (posicao) => {
      focarCategoria(posicao?.column ?? null);
      setAlturaDoPonteiro(posicao ? (contornos[posicao.row][posicao.column]?.y ?? null) : null);
    },
    present: series.flatMap((serie, row) =>
      isHidden(serie.label) ? [] : contornos[row].flatMap((ponto, column) => (ponto ? [{ column, row }] : [])),
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
      fillHeight={fillHeight}
      font={font}
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
              showTotal: stacked && !temEixoDireito,
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

      {/* Sem empilhamento as areas se sobrepoem, e um topo opaco esconderia a de
          baixo. O contorno em cor cheia e que marca o limite de cada faixa. */}
      {!stacked && (
        <defs>
          {series.map((serie, indice) => {
            const zero = alturaDoZero(faixasPorSerie[indice], baseDa(indice));

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

      <g {...pontos.groupProps}>
      {series.map((serie, indiceSerie) => {
        const faixas = faixasPorSerie[indiceSerie];
        const contorno = faixas.map<ChartPoint | null>((faixa) =>
          faixa === null ? null : { x: faixa.x, y: faixa.y1 },
        );

        const oculta = isHidden(serie.label);

        return (
          <g
            aria-hidden={oculta || undefined}
            className={`${chartStyles.series} ${oculta ? chartStyles.seriesOff : ''}`}
            key={indiceSerie}
          >
            <path
              d={areaPath(faixas, curve)}
              fill={stacked ? cores[indiceSerie] : `url(#${gradienteId}-${indiceSerie})`}
              fillOpacity={stacked ? 0.4 : undefined}
            />
            <path
              className={chartStyles.line}
              d={linePath(contorno, curve)}
              fill="none"
              stroke={cores[indiceSerie]}
            />

            {categories.map((categoria, indice) => {
              const faixa = faixas[indice];

              if (faixa === null) {
                return null;
              }

              const descricao = `${serie.label}, ${categoria}: ${formatoDa(indiceSerie)(serie.values[indice] ?? 0)}`;

              const classeDoPonto = markShown(visibilidadeDosPontos, indiceSerie === serieEmFoco) || isolada(faixas, indice) ? chartStyles.dotVisible : chartStyles.dot;

              return (
                <circle
                  {...pontos.markProps({ column: indice, row: indiceSerie }, classeDoPonto)}
                  aria-label={descricao}
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

            {rotulosDeDado !== 'hidden' &&
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
                    className={`${chartStyles.valueLabel} ${markShown(rotulosDeDado, indiceSerie === serieEmFoco) ? '' : chartStyles.valueLabelHidden}`}
                    key={indice}
                    textAnchor={textAnchor}
                    x={faixa.x + dx}
                    y={below ? faixa.y1 + font.lineHeight + 2 : faixa.y1 - 10}
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
              if (row >= 0 && contornos[row][column]) {
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
