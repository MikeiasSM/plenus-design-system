import { useEffect, useMemo, useState } from 'react';
import {
  ChartTable,
  categoryTable,
  BandCursor,
  categoryTooltip,
  markShown,
  CartesianFrame,
  NO_BAR_SLOT,
  barSlots,
  axisOf,
  rightAxisVisibility,
  isDevelopment,
  stackByAxis,
  useCartesianLayout,
  chartHeight,
  roundedBarPath,
  useChartMetrics,
  useHoveredBand,
  useMarkNavigation,
  useSeriesToggle,
  useTweenedNumbers,
  useValueScales,
  valueAxisDomains,
  valueLabelRoom,
  valueLabelsFor,
  truncateToWidth,
  widestLabel,
  CHART_LABEL_BAND,
  CHART_LABEL_OFFSET,
  type AxisLabelAngle,
  type AxisTick,
  type AxisVisibility,
  type ChartHeight,
  type ChartLegendAlign,
  type ChartLegendPosition,
  type MarkVisibility,
  type CornerRadii,
  type ChartCategoryHover,
  type ChartMarkClick,
  type ChartRootProps,
  type ChartValueAxis,
} from '../core';
import { resolveSeriesColors, type ChartPalette, type SeriesAppearance } from '../palette';
import { bandScale, domainOf, mergeDomains, stackDiverging, ticksFor } from '../scales';
import { formatNumber } from '../../../utils/formatters';
import chartStyles from '../core/Chart.module.css';
import styles from './ChartBar.module.css';

/** Distancia entre a ponta da barra e o rotulo de dado. */
const AFASTAMENTO_DO_ROTULO = 6;

/** Piso do teto da coluna de nomes na horizontal: em grafico estreito, o teto proporcional cortaria nomes curtos, como os das UFs. */
const PISO_DA_COLUNA = 128;

export type ChartBarOrientation = 'vertical' | 'horizontal';

export interface ChartBarSeries extends SeriesAppearance {
  /** Eixo de valor da serie, so na vertical. Com alguma a direita, o eixo da direita ganha escala propria. */
  axis?: ChartValueAxis;
  label: string;
  values: readonly number[];
}

export interface ChartBarProps extends Omit<ChartRootProps, 'hidden'> {
  accent?: string;
  categories: readonly string[];
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
  /** @deprecated Use `onMarkClick`. Aceito ate a 0.7.0. */
  onBarClick?: (bar: ChartMarkClick) => void;
  /** @deprecated Use `onHiddenChange`. Aceito ate a 0.7.0. */
  onHiddenSeriesChange?: (hidden: readonly string[]) => void;
  /** Rotulos ocultos, a cada alternancia da legenda. */
  onHiddenChange?: (hidden: readonly string[]) => void;
  /** Categoria sob o ponteiro, ou `null` ao sair dela. */
  onHover?: (category: ChartCategoryHover | null) => void;
  /** @deprecated Use `onHover`, que traz a categoria e o indice. Aceito ate a 0.7.0. */
  onHoverCategory?: (index: number | null) => void;
  /** Torna as barras botoes, percorridos pelas setas. */
  onMarkClick?: (mark: ChartMarkClick) => void;
  orientation?: ChartBarOrientation;
  /** Cores das series sem cor propria: lista em rotacao ou `{ base }`, que gera os tons. Vence o `accent`. */
  palette?: ChartPalette;
  series: readonly ChartBarSeries[];
  /**
   * Valor alem da ponta de cada barra; empilhada, o total da categoria alem da ponta da pilha. Em `onHover`,
   * so os da serie da barra sob o ponteiro, ou o total da pilha sob ele.
   */
  showDataLabels?: MarkVisibility;
  /** Botao "Ver como tabela". Sem a prop, vale o do `ChartsProvider`, ligado por padrao. */
  showTableToggle?: boolean;
  /** Balao com o detalhe do que esta sob o ponteiro. Desligue para montar o proprio `ChartTooltip` pela costura. */
  showTooltip?: boolean;
  /** Empilha so as series do mesmo eixo: cada eixo tem a sua pilha, lado a lado na faixa. */
  stacked?: boolean;
  title: string;
  xAxis?: AxisVisibility;
  /** Titulo do eixo de baixo, como o `xAxis`: as categorias na vertical, o valor na horizontal. */
  xAxisTitle?: string;
  yAxis?: AxisVisibility;
  /** Titulo do eixo da esquerda, como o `yAxis`: o valor na vertical, as categorias na horizontal. */
  yAxisTitle?: string;
  /** Padrao: escondido; visivel quando alguma serie esta a direita. */
  yAxisRight?: AxisVisibility;
  /** Titulo do eixo de valor da direita, so na vertical. */
  yAxisRightTitle?: string;
}

export function ChartBar({
  accent,
  categories,
  defaultHidden,
  defaultHiddenSeries,
  emptyMessage = 'Sem dados no período',
  formatRightValue,
  formatTooltipValue,
  formatValue = formatNumber,
  height = 260,
  hidden,
  hiddenSeries,
  labelAngle = 'auto',
  legend = 'bottom',
  legendAlign,
  minRightTickStep,
  minTickStep,
  onBarClick,
  onHiddenChange,
  onHiddenSeriesChange,
  onHover,
  onHoverCategory,
  onMarkClick,
  orientation = 'vertical',
  palette,
  series,
  showDataLabels = 'hidden',
  showTableToggle,
  showTooltip = true,
  stacked = false,
  title,
  xAxis = 'visible',
  xAxisTitle,
  yAxis = 'visible',
  yAxisTitle,
  yAxisRight,
  yAxisRightTitle,
  ...root
}: ChartBarProps) {
  const { font, height: alturaMedida, radius: raioDoCanto, ref, width } = useChartMetrics();
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
  const hoverDaCategoria =
    onHover || onHoverCategory
      ? (index: number | null) => {
          onHover?.(index === null ? null : { category: categories[index], index });
          onHoverCategory?.(index);
        }
      : undefined;
  const { hover: focarFaixa, hovered: faixaEmFoco } = useHoveredBand(hoverDaCategoria);
  const aoClicarNaBarra =
    onMarkClick || onBarClick
      ? (barra: ChartMarkClick) => {
          onMarkClick?.(barra);
          onBarClick?.(barra);
        }
      : undefined;
  const [serieEmFoco, setSerieEmFoco] = useState<number | null>(null);
  const marcas = useMarkNavigation({
    onActivate: aoClicarNaBarra && (({ column, row }) =>
      aoClicarNaBarra({ category: categories[column], index: column, series: series[row].label, value: series[row].values[column] })),
    onFocusMark: (posicao) => {
      focarFaixa(posicao?.column ?? null);
      setSerieEmFoco(posicao?.row ?? null);
    },
    present: series.flatMap((serie, row) =>
      isHidden(serie.label) ? [] : categories.flatMap((_, column) => (Number.isFinite(serie.values[column]) ? [{ column, row }] : [])),
    ),
  });
  const vertical = orientation === 'vertical';
  const categoryAxisTitle = vertical ? xAxisTitle : yAxisTitle;
  const valueAxisTitle = vertical ? yAxisTitle : xAxisTitle;

  // A cor sai da lista inteira, e nao das visiveis: desligar uma serie nao pode
  // repintar as demais.
  const cores = useMemo(() => resolveSeriesColors(series, { accent, palette }), [accent, palette, series]);

  // Presenca de cada serie, entre zero e um. E ela que reparte a faixa, entao a
  // serie desligada encolhe enquanto as demais ocupam o lugar dela.
  const presencas = useTweenedNumbers(series.map((serie) => (isHidden(serie.label) ? 0 : 1)));
  const presenca = (indice: number) => presencas[indice] ?? 0;

  // Na horizontal o eixo de valor e unico: `axis` nao vale.
  const eixos = useMemo(() => series.map((serie) => (vertical ? axisOf(serie) : 'left')), [series, vertical]);
  const temEixoDireito = eixos.includes('right');
  const formatarDireita = formatRightValue ?? formatValue;
  const passoDireito = temEixoDireito ? minRightTickStep : minTickStep;
  const visibilidadeDireita = rightAxisVisibility(yAxisRight, temEixoDireito, yAxis);
  const ignoraEixo = !vertical && series.some((serie) => serie.axis === 'right');

  useEffect(() => {
    if (ignoraEixo && isDevelopment()) {
      console.warn(`ChartBar "${title}": \`axis\` só vale na orientação vertical; na horizontal as séries dividem um eixo de valor.`);
    }
  }, [ignoraEixo, title]);

  const dominios = useMemo(
    () =>
      valueAxisDomains({
        axes: eixos,
        domainOfSeries: (grupo) =>
          stacked
            ? domainOf(categories.flatMap((_, indice) => stackDiverging(grupo.map((serie) => serie.values[indice] ?? 0)).flat()))
            : mergeDomains(grupo.map((serie) => domainOf([...serie.values]))),
        isOutOfScale,
        series,
      }),
    [categories, eixos, isOutOfScale, series, stacked],
  );
  const [dominioEsquerda, dominioDireita] = dominios;

  // Barras horizontais consomem a largura: a legenda ao lado espremeria o desenho.
  const posicaoDaLegenda = !vertical && (legend === 'left' || legend === 'right') ? 'bottom' : legend;

  const comprimentoDoEixoDeValor = vertical ? alturaDoDesenho : width;
  const rotulosEsquerda = valueLabelsFor(dominioEsquerda, comprimentoDoEixoDeValor, formatValue, minTickStep);
  const rotulosDireita = valueLabelsFor(dominioDireita, comprimentoDoEixoDeValor, formatarDireita, passoDireito);

  // Na horizontal os nomes formam uma coluna a esquerda; sem teto, nomes longos tomariam o desenho.
  const larguraMaximaDaColuna = Math.max(width * CHART_LABEL_BAND, PISO_DA_COLUNA) - CHART_LABEL_OFFSET;
  const nomesDaColuna =
    vertical || width === 0 ? categories : categories.map((nome) => truncateToWidth(nome, font, larguraMaximaDaColuna));

  /** Valores com rotulo a direita da ponta (o total da pilha, se empilhada); os negativos vao para a esquerda. */
  function valoresRotuladosAdireita() {
    const visiveis = series.filter((serie) => !isHidden(serie.label));
    const porCategoria = categories.map((_, indice) =>
      visiveis.map((serie) => serie.values[indice]).filter(Number.isFinite),
    );
    const rotulados = stacked
      ? porCategoria.map((valores) => valores.reduce((soma, valor) => soma + valor, 0))
      : porCategoria.flat();

    return rotulados.filter((valor) => valor >= 0);
  }

  const reservaDireita =
    showDataLabels !== 'hidden' && !vertical
      ? widestLabel(valoresRotuladosAdireita().map(formatValue), font) + AFASTAMENTO_DO_ROTULO
      : 0;

  const entradasDaLegenda = series.map((serie, indice) => ({
    color: cores[indice],
    hidden: isHidden(serie.label),
    label: serie.label,
  }));

  const { axisReveal, margins, plot, removed, rotation } = useCartesianLayout({
    axisTitles: { x: xAxisTitle, y: yAxisTitle, yRight: vertical ? yAxisRightTitle : undefined },
    decomposition: { fillHeight, legend: entradasDaLegenda, legendPosition: posicaoDaLegenda, valueAxes: vertical ? ['yRight', 'y'] : ['x'] },
    bottomLabels: vertical ? categories : rotulosEsquerda,
    font,
    height: alturaDoDesenho,
    labelAngle,
    leftLabels: vertical ? rotulosEsquerda : nomesDaColuna,
    rightLabels: vertical ? rotulosDireita : nomesDaColuna,
    rightRoom: reservaDireita,
    topRoom: showDataLabels !== 'hidden' && vertical ? valueLabelRoom(font) : 0,
    width,
    xAxis,
    yAxis,
    yAxisRight: visibilidadeDireita,
  });

  const rotulosDeDado = removed.has('detail') ? 'hidden' : showDataLabels;
  const comprimentoCategorias = vertical ? plot.width : plot.height;
  const comprimentoValores = vertical ? plot.height : plot.width;
  const inicioDaFaixa = vertical ? comprimentoValores : 0;
  const fimDaFaixa = vertical ? 0 : comprimentoValores;

  const escalaCategorias = useMemo(
    () => bandScale({ domain: categories, range: [0, comprimentoCategorias] }),
    [categories, comprimentoCategorias],
  );

  const {
    left: escalaEsquerda,
    right: escalaDireita,
    targetLeft: alvoEsquerda,
    targetRight: alvoDireita,
  } = useValueScales(dominios, inicioDaFaixa, fimDaFaixa);

  const escalaDa = (indice: number) => (eixos[indice] === 'right' ? escalaDireita : escalaEsquerda);
  const formatoDa = (indice: number) => (eixos[indice] === 'right' ? formatarDireita : formatValue);

  const marcasEsquerda = ticksFor(alvoEsquerda, comprimentoValores, undefined, minTickStep);
  const marcasDireita = ticksFor(alvoDireita, comprimentoValores, undefined, passoDireito);

  const vao = escalaCategorias.bandwidth();
  const faixas = barSlots(vao, presencas);

  // Pilhas de eixos distintos dividem a faixa; com um eixo so, a pilha ocupa a faixa inteira.
  const faixasDasPilhas = barSlots(
    vao,
    (['left', 'right'] as const).map((eixo) => Math.max(0, ...presencas.filter((_, indice) => eixos[indice] === eixo))),
  );

  function posicaoNaFaixa(indiceSerie: number) {
    if (!stacked) {
      return faixas[indiceSerie] ?? NO_BAR_SLOT;
    }

    return temEixoDireito ? (faixasDasPilhas[eixos[indiceSerie] === 'right' ? 1 : 0] ?? NO_BAR_SLOT) : { offset: 0, thickness: vao };
  }

  function espessuraDa(indiceSerie: number) {
    return posicaoNaFaixa(indiceSerie).thickness;
  }

  function deslocamentoDa(indiceSerie: number) {
    return posicaoNaFaixa(indiceSerie).offset;
  }

  /** Valor que a serie empilha, ja pesado pela presenca, para a pilha encolher junto; invalido conta zero. */
  function contribuicao(indiceSerie: number, indiceCategoria: number) {
    const valor = series[indiceSerie].values[indiceCategoria];
    const real = Number.isFinite(valor) ? (valor as number) : 0;

    return real * (stacked ? presenca(indiceSerie) : 1);
  }

  const pilhas = categories.map((_, indiceCategoria) =>
    stacked ? stackByAxis(series.map((_, indiceSerie) => contribuicao(indiceSerie, indiceCategoria)), eixos) : [],
  );

  function segmentoDa(indiceSerie: number, indiceCategoria: number): [number, number] {
    return pilhas[indiceCategoria][indiceSerie] ?? [0, contribuicao(indiceSerie, indiceCategoria)];
  }

  /**
   * Cantos de um segmento. Empilhado, so as pontas de cada pilha, a de cima do zero e a de baixo,
   * sao arredondadas e o meio fica reto, para os segmentos lerem como uma barra so.
   */
  function cantosDa(indiceSerie: number, indiceCategoria: number): CornerRadii {
    const [inicio, fim] = segmentoDa(indiceSerie, indiceCategoria);

    if (!stacked) {
      return [raioDoCanto, raioDoCanto, raioDoCanto, raioDoCanto];
    }

    const pilha = pilhas[indiceCategoria].filter((_, indice) => eixos[indice] === eixos[indiceSerie]);
    const extremo = fim < inicio ? Math.min(...pilha.map(([, ate]) => ate)) : Math.max(...pilha.map(([, ate]) => ate));
    const abre = fim !== inicio && inicio === 0 ? raioDoCanto : 0;
    const fecha = fim !== inicio && fim === extremo ? raioDoCanto : 0;
    // Na tela, o lado de maior valor fica em cima na vertical e a direita na horizontal.
    const [menor, maior] = fim < inicio ? [fecha, abre] : [abre, fecha];

    return vertical ? [maior, maior, menor, menor] : [menor, maior, maior, menor];
  }

  /** Rotulo alem da ponta da barra: no negativo ela esta embaixo, ou a esquerda. */
  function rotuloAlemDaPonta(
    valor: number,
    ponta: number,
    centro: number,
    chave: number | string,
    emFoco: boolean,
    formatar: (valor: number) => string,
  ) {
    const negativo = valor < 0;

    return (
      <text
        className={`${chartStyles.valueLabel} ${markShown(rotulosDeDado, emFoco) ? '' : chartStyles.valueLabelHidden}`}
        dominantBaseline={vertical ? (negativo ? 'hanging' : 'auto') : 'middle'}
        key={chave}
        textAnchor={vertical ? 'middle' : negativo ? 'end' : 'start'}
        x={vertical ? centro : ponta + (negativo ? -AFASTAMENTO_DO_ROTULO : AFASTAMENTO_DO_ROTULO)}
        y={vertical ? ponta + (negativo ? AFASTAMENTO_DO_ROTULO : -AFASTAMENTO_DO_ROTULO) : centro}
      >
        {formatar(valor)}
      </text>
    );
  }

  const marcasCategoria: AxisTick[] = categories.map((categoria, indice) => ({
    label: nomesDaColuna[indice],
    position: (escalaCategorias(categoria) ?? 0) + vao / 2,
  }));

  const marcasDeValor = (valores: readonly number[], escala: (valor: number) => number, formatar: (valor: number) => string): AxisTick[] =>
    valores.map((valor) => ({ label: formatar(valor), position: escala(valor) }));

  const eixoDeCategoria = { labelRotation: rotation, ticks: marcasCategoria, title: categoryAxisTitle };
  const eixoDeValor = { hideLine: true, ticks: marcasDeValor(marcasEsquerda, escalaEsquerda, formatValue), title: valueAxisTitle };
  const eixoDeValorDireito = {
    hideLine: true,
    ticks: marcasDeValor(marcasDireita, escalaDireita, formatarDireita),
    title: yAxisRightTitle,
  };

  return (
    <CartesianFrame
      canvasRole={marcas.interactive ? 'group' : 'img'}
      axisReveal={axisReveal}
      containerRef={ref}
      empty={series.length === 0 || categories.length === 0}
      emptyMessage={emptyMessage}
      fillHeight={fillHeight}
      font={font}
      grid={[
        {
          baseline: escalaEsquerda(0),
          lines: marcasEsquerda.map((valor) => escalaEsquerda(valor)),
          orientation: vertical ? 'horizontal' : 'vertical',
        },
      ]}
      height={alturaDoDesenho}
      legend={entradasDaLegenda}
      legendAlign={legendAlign}
      legendPosition={posicaoDaLegenda}
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
              index: faixaEmFoco,
              isHidden,
              series: series.map((serie, indice) => ({ ...serie, format: eixos[indice] === 'right' ? formatarDireita : undefined })),
              showTotal: stacked && !temEixoDireito,
            })
          : undefined
      }
      tooltipAnchor={marcas.tooltipAnchor}
      width={width}
      xAxis={{ ...(vertical ? eixoDeCategoria : eixoDeValor), visibility: xAxis }}
      yAxis={{ ...(vertical ? eixoDeValor : eixoDeCategoria), visibility: yAxis }}
      yAxisRight={{ ...(vertical ? eixoDeValorDireito : { ...eixoDeCategoria, title: undefined }), hideLine: true, visibility: visibilidadeDireita }}
    >
      {faixaEmFoco !== null && (
        <BandCursor
          offset={escalaCategorias(categories[faixaEmFoco]) ?? 0}
          orientation={orientation}
          plot={plot}
          size={vao}
        />
      )}

      <g {...marcas.groupProps}>
      {series.map((serie, indiceSerie) => {
        const oculta = isHidden(serie.label);

        return (
          <g
            aria-hidden={oculta || undefined}
            className={`${chartStyles.series} ${oculta ? chartStyles.seriesOff : ''}`}
            key={indiceSerie}
          >
            {categories.map((categoria, indiceCategoria) => {
              if (!Number.isFinite(serie.values[indiceCategoria])) {
                return null;
              }

              const inicioCategoria = escalaCategorias(categoria) ?? 0;
              const [de, ate] = segmentoDa(indiceSerie, indiceCategoria);
              const escala = escalaDa(indiceSerie);
              const comeco = escala(de);
              const fim = escala(ate);
              const tamanho = Math.abs(fim - comeco);
              const espessura = espessuraDa(indiceSerie);
              const deslocamento = deslocamentoDa(indiceSerie);

              return (
                <path
                  {...marcas.markProps({ column: indiceCategoria, row: indiceSerie }, styles.bar)}
                  aria-label={`${serie.label}, ${categoria}: ${formatoDa(indiceSerie)(serie.values[indiceCategoria])}`}
                  d={roundedBarPath(
                    vertical ? inicioCategoria + deslocamento : Math.min(comeco, fim),
                    vertical ? Math.min(comeco, fim) : inicioCategoria + deslocamento,
                    vertical ? espessura : tamanho,
                    vertical ? tamanho : espessura,
                    cantosDa(indiceSerie, indiceCategoria),
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

            {rotulosDeDado !== 'hidden' &&
              !stacked &&
              categories.map((categoria, indiceCategoria) => {
                const valor = serie.values[indiceCategoria];

                if (!Number.isFinite(valor)) {
                  return null;
                }

                const centro =
                  (escalaCategorias(categoria) ?? 0) + deslocamentoDa(indiceSerie) + espessuraDa(indiceSerie) / 2;

                return rotuloAlemDaPonta(valor, escalaDa(indiceSerie)(valor), centro, indiceCategoria, indiceSerie === serieEmFoco, formatoDa(indiceSerie));
              })}
          </g>
        );
      })}
      </g>

      {rotulosDeDado !== 'hidden' &&
        stacked &&
        categories.flatMap((categoria, indiceCategoria) =>
          (['left', 'right'] as const).map((eixo) => {
            const indices = series.flatMap((serie, indice) =>
              eixos[indice] === eixo && !isHidden(serie.label) && Number.isFinite(serie.values[indiceCategoria]) ? [indice] : [],
            );

            if (indices.length === 0) {
              return null;
            }

            const total = indices.reduce((soma, indice) => soma + series[indice].values[indiceCategoria], 0);
            const pontas = indices.map((indice) => pilhas[indiceCategoria][indice][1]);
            const extremo = total < 0 ? Math.min(0, ...pontas) : Math.max(0, ...pontas);
            const posicao = posicaoNaFaixa(indices[0]);
            const centro = (escalaCategorias(categoria) ?? 0) + posicao.offset + posicao.thickness / 2;

            return rotuloAlemDaPonta(
              total,
              escalaDa(indices[0])(extremo),
              centro,
              `${indiceCategoria}-${eixo}`,
              indiceCategoria === faixaEmFoco,
              formatoDa(indices[0]),
            );
          }),
        )}
    </CartesianFrame>
  );
}
