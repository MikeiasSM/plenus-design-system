import { useMemo } from 'react';
import {
  BandCursor,
  CartesianFrame,
  NO_BAR_SLOT,
  barSlots,
  cartesianLayout,
  chartHeight,
  roundedBarPath,
  useChartMetrics,
  useHoveredBand,
  useSeriesToggle,
  useTweenedNumbers,
  valueLabelRoom,
  valueLabelsFor,
  type AxisLabelAngle,
  type AxisTick,
  type AxisVisibility,
  type ChartHeight,
  type ChartLegendAlign,
  type ChartLegendPosition,
  type CornerRadii,
} from '../core';
import { resolveSeriesColors, type SeriesAppearance } from '../palette';
import { bandScale, domainOf, linearScale, mergeDomains, stackDiverging, ticksFor } from '../scales';
import { formatarNumero } from '../../../utils/formatters';
import styles from './ChartBar.module.css';

export type ChartBarOrientation = 'vertical' | 'horizontal';

export interface ChartBarSeries extends SeriesAppearance {
  label: string;
  values: readonly number[];
}

export interface ChartBarProps {
  accent?: string;
  categories: readonly string[];
  defaultHiddenSeries?: readonly string[];
  emptyMessage?: string;
  formatValue?: (value: number) => string;
  height?: ChartHeight;
  hiddenSeries?: readonly string[];
  labelAngle?: AxisLabelAngle;
  legend?: ChartLegendPosition;
  legendAlign?: ChartLegendAlign;
  onHiddenSeriesChange?: (hidden: readonly string[]) => void;
  /** Indice da categoria sob o ponteiro, ou `null` ao sair dela. */
  onHoverCategory?: (index: number | null) => void;
  orientation?: ChartBarOrientation;
  series: readonly ChartBarSeries[];
  showDataLabels?: boolean;
  stacked?: boolean;
  title: string;
  xAxis?: AxisVisibility;
  yAxis?: AxisVisibility;
  yAxisRight?: AxisVisibility;
}

export function ChartBar({
  accent,
  categories,
  defaultHiddenSeries,
  emptyMessage = 'Sem dados no período',
  formatValue = formatarNumero,
  height = 260,
  hiddenSeries,
  labelAngle = 'auto',
  legend = 'bottom',
  legendAlign,
  onHiddenSeriesChange,
  onHoverCategory,
  orientation = 'vertical',
  series,
  showDataLabels = false,
  stacked = false,
  title,
  xAxis = 'visible',
  yAxis = 'visible',
  yAxisRight = 'hidden',
}: ChartBarProps) {
  const { font, height: alturaMedida, radius: raioDoCanto, ref, width } = useChartMetrics();
  const { fillHeight, value: alturaDoDesenho } = chartHeight(height, alturaMedida);
  const { isHidden, toggle } = useSeriesToggle({ defaultHiddenSeries, hiddenSeries, onHiddenSeriesChange });
  const { hover: focarFaixa, hovered: faixaEmFoco } = useHoveredBand(onHoverCategory);
  const vertical = orientation === 'vertical';

  // A cor sai da lista inteira, e nao das visiveis: desligar uma serie nao pode
  // repintar as demais.
  const cores = useMemo(() => resolveSeriesColors(series, { accent }), [accent, series]);

  // Presenca de cada serie, entre zero e um. E ela que reparte a faixa, entao a
  // serie desligada encolhe enquanto as demais ocupam o lugar dela.
  const presencas = useTweenedNumbers(series.map((serie) => (isHidden(serie.label) ? 0 : 1)));
  const presenca = (indice: number) => presencas[indice] ?? 0;

  const dominio = useMemo(() => {
    const visiveis = series.filter((serie) => !isHidden(serie.label));

    if (stacked) {
      return domainOf(
        categories.flatMap((_, indice) => stackDiverging(visiveis.map((serie) => serie.values[indice] ?? 0)).flat()),
      );
    }

    return mergeDomains(visiveis.map((serie) => domainOf([...serie.values])));
  }, [categories, isHidden, series, stacked]);

  // Barras horizontais consomem a largura: a legenda ao lado espremeria o desenho.
  const posicaoDaLegenda = !vertical && (legend === 'left' || legend === 'right') ? 'bottom' : legend;

  const rotulosDeValor = valueLabelsFor(dominio, vertical ? alturaDoDesenho : width, formatValue);

  const { margins, plot, rotation } = cartesianLayout({
    bottomLabels: vertical ? categories : rotulosDeValor,
    font,
    height: alturaDoDesenho,
    labelAngle,
    leftLabels: vertical ? rotulosDeValor : categories,
    rightLabels: vertical ? rotulosDeValor : categories,
    topRoom: showDataLabels && vertical ? valueLabelRoom(font) : 0,
    width,
    xAxis,
    yAxis,
    yAxisRight,
  });

  const comprimentoCategorias = vertical ? plot.width : plot.height;
  const comprimentoValores = vertical ? plot.height : plot.width;
  const inicioDaFaixa = vertical ? comprimentoValores : 0;
  const fimDaFaixa = vertical ? 0 : comprimentoValores;

  const escalaCategorias = useMemo(
    () => bandScale({ domain: categories, range: [0, comprimentoCategorias] }),
    [categories, comprimentoCategorias],
  );

  // A escala alvo fixa as marcas; a animada posiciona o desenho. Sem separar as
  // duas, as marcas exibiriam valores quebrados durante a transicao.
  const escalaAlvo = useMemo(
    () => linearScale({ domain: dominio, range: [inicioDaFaixa, fimDaFaixa] }),
    [dominio, fimDaFaixa, inicioDaFaixa],
  );

  const [minimo, maximo] = useTweenedNumbers(escalaAlvo.domain());

  const escalaValores = useMemo(
    () =>
      linearScale({
        domain: { min: minimo, max: maximo },
        nice: false,
        range: [inicioDaFaixa, fimDaFaixa],
      }),
    [fimDaFaixa, inicioDaFaixa, maximo, minimo],
  );

  const marcasDeValor = ticksFor(escalaAlvo, comprimentoValores);

  const vao = escalaCategorias.bandwidth();
  const faixas = barSlots(vao, presencas);

  // Empilhada, a serie ocupa a faixa inteira: quem reparte e a pilha, nao a faixa.
  function faixaDa(indiceSerie: number) {
    return faixas[indiceSerie] ?? NO_BAR_SLOT;
  }

  function espessuraDa(indiceSerie: number) {
    return stacked ? vao : faixaDa(indiceSerie).thickness;
  }

  function deslocamentoDa(indiceSerie: number) {
    return stacked ? 0 : faixaDa(indiceSerie).offset;
  }

  /** Valor que a serie empilha, ja pesado pela presenca, para a pilha encolher junto; invalido conta zero. */
  function contribuicao(indiceSerie: number, indiceCategoria: number) {
    const valor = series[indiceSerie].values[indiceCategoria];
    const real = Number.isFinite(valor) ? (valor as number) : 0;

    return real * (stacked ? presenca(indiceSerie) : 1);
  }

  const pilhas = categories.map((_, indiceCategoria) =>
    stacked ? stackDiverging(series.map((_, indiceSerie) => contribuicao(indiceSerie, indiceCategoria))) : [],
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

    const pilha = pilhas[indiceCategoria];
    const extremo = fim < inicio ? Math.min(...pilha.map(([, ate]) => ate)) : Math.max(...pilha.map(([, ate]) => ate));
    const abre = fim !== inicio && inicio === 0 ? raioDoCanto : 0;
    const fecha = fim !== inicio && fim === extremo ? raioDoCanto : 0;
    // Na tela, o lado de maior valor fica em cima na vertical e a direita na horizontal.
    const [menor, maior] = fim < inicio ? [fecha, abre] : [abre, fecha];

    return vertical ? [maior, maior, menor, menor] : [menor, maior, maior, menor];
  }

  const marcasCategoria: AxisTick[] = categories.map((categoria) => ({
    label: categoria,
    position: (escalaCategorias(categoria) ?? 0) + vao / 2,
  }));

  const marcasValor: AxisTick[] = marcasDeValor.map((valor) => ({
    label: formatValue(valor),
    position: escalaValores(valor),
  }));

  const eixoDeCategoria = { labelRotation: rotation, ticks: marcasCategoria };
  const eixoDeValor = { hideLine: true, ticks: marcasValor };

  return (
    <CartesianFrame
      containerRef={ref}
      empty={series.length === 0 || categories.length === 0}
      emptyMessage={emptyMessage}
      fillHeight={fillHeight}
      grid={[
        {
          baseline: escalaValores(0),
          lines: marcasDeValor.map((valor) => escalaValores(valor)),
          orientation: vertical ? 'horizontal' : 'vertical',
        },
      ]}
      height={alturaDoDesenho}
      legend={series.map((serie, indice) => ({
        color: cores[indice],
        hidden: isHidden(serie.label),
        label: serie.label,
      }))}
      legendAlign={legendAlign}
      legendPosition={posicaoDaLegenda}
      margins={margins}
      onToggleSeries={toggle}
      plot={plot}
      title={title}
      width={width}
      xAxis={{ ...(vertical ? eixoDeCategoria : eixoDeValor), visibility: xAxis }}
      yAxis={{ ...(vertical ? eixoDeValor : eixoDeCategoria), visibility: yAxis }}
      yAxisRight={{ ...(vertical ? eixoDeValor : eixoDeCategoria), hideLine: true, visibility: yAxisRight }}
    >
      {faixaEmFoco !== null && (
        <BandCursor
          offset={escalaCategorias(categories[faixaEmFoco]) ?? 0}
          orientation={orientation}
          plot={plot}
          size={vao}
        />
      )}

      {series.map((serie, indiceSerie) => {
        const oculta = isHidden(serie.label);

        return (
          <g
            aria-hidden={oculta || undefined}
            className={`${styles.series} ${oculta ? styles.seriesOff : ''}`}
            key={indiceSerie}
          >
            {categories.map((categoria, indiceCategoria) => {
              if (!Number.isFinite(serie.values[indiceCategoria])) {
                return null;
              }

              const inicioCategoria = escalaCategorias(categoria) ?? 0;
              const [de, ate] = segmentoDa(indiceSerie, indiceCategoria);
              const comeco = escalaValores(de);
              const fim = escalaValores(ate);
              const tamanho = Math.abs(fim - comeco);
              const espessura = espessuraDa(indiceSerie);
              const deslocamento = deslocamentoDa(indiceSerie);

              return (
                <path
                  aria-label={`${serie.label}, ${categoria}: ${formatValue(serie.values[indiceCategoria])}`}
                  className={styles.bar}
                  d={roundedBarPath(
                    vertical ? inicioCategoria + deslocamento : Math.min(comeco, fim),
                    vertical ? Math.min(comeco, fim) : inicioCategoria + deslocamento,
                    vertical ? espessura : tamanho,
                    vertical ? tamanho : espessura,
                    cantosDa(indiceSerie, indiceCategoria),
                  )}
                  fill={cores[indiceSerie]}
                  key={indiceCategoria}
                  onMouseEnter={() => focarFaixa(indiceCategoria)}
                  onMouseLeave={() => focarFaixa(null)}
                />
              );
            })}

            {showDataLabels &&
              !stacked &&
              categories.map((categoria, indiceCategoria) => {
                const valor = serie.values[indiceCategoria];

                if (!Number.isFinite(valor)) {
                  return null;
                }

                const ponta = escalaValores(valor);
                const centro =
                  (escalaCategorias(categoria) ?? 0) + deslocamentoDa(indiceSerie) + espessuraDa(indiceSerie) / 2;
                // O rotulo fica alem da ponta: no negativo ela esta embaixo, ou a esquerda.
                const negativo = valor < 0;

                return (
                  <text
                    className={styles.valueLabel}
                    dominantBaseline={vertical ? (negativo ? 'hanging' : 'auto') : 'middle'}
                    key={indiceCategoria}
                    textAnchor={vertical ? 'middle' : negativo ? 'end' : 'start'}
                    x={vertical ? centro : ponta + (negativo ? -6 : 6)}
                    y={vertical ? ponta + (negativo ? 6 : -6) : centro}
                  >
                    {formatValue(valor)}
                  </text>
                );
              })}
          </g>
        );
      })}
    </CartesianFrame>
  );
}
