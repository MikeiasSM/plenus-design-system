import { useMemo, useState } from 'react';
import {
  CartesianFrame,
  cartesianLayout,
  chartHeight,
  roundedBarPath,
  useChartMetrics,
  useSeriesToggle,
  useTweenedNumbers,
  valueLabelsFor,
  type AxisLabelAngle,
  type AxisTick,
  type AxisVisibility,
  type ChartHeight,
  type ChartLegendPosition,
  type CornerRadii,
} from '../core';
import { resolveSeriesColors, type SeriesAppearance } from '../palette';
import { bandScale, domainOf, linearScale, mergeDomains, ticksFor } from '../scales';
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
  onHiddenSeriesChange?: (hidden: readonly string[]) => void;
  orientation?: ChartBarOrientation;
  series: readonly ChartBarSeries[];
  showDataLabels?: boolean;
  stacked?: boolean;
  title: string;
  xAxis?: AxisVisibility;
  yAxis?: AxisVisibility;
  yAxisRight?: AxisVisibility;
}

const ESPACO_ENTRE_BARRAS = 2;
const ALTURA_DO_ROTULO = 18;

export function ChartBar({
  accent,
  categories,
  defaultHiddenSeries,
  emptyMessage = 'Sem dados no período',
  formatValue = (valor) => String(valor),
  height = 260,
  hiddenSeries,
  labelAngle = 'auto',
  legend = 'bottom',
  onHiddenSeriesChange,
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
  const [faixaEmFoco, setFaixaEmFoco] = useState<number | null>(null);
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
        categories.map((_, indice) =>
          visiveis.reduce((total, serie) => total + (serie.values[indice] ?? 0), 0),
        ),
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
    topRoom: showDataLabels && vertical ? ALTURA_DO_ROTULO : 0,
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
  const presencaTotal = presencas.reduce((total, valor) => total + valor, 0);
  const unidade = Math.max(
    (vao - ESPACO_ENTRE_BARRAS * Math.max(presencaTotal - 1, 0)) / Math.max(presencaTotal, 1),
    0,
  );

  function espessuraDa(indiceSerie: number) {
    return stacked ? vao : unidade * presenca(indiceSerie);
  }

  function deslocamentoDa(indiceSerie: number) {
    if (stacked) {
      return 0;
    }

    return presencas
      .slice(0, indiceSerie)
      .reduce((total, valor) => total + (unidade + ESPACO_ENTRE_BARRAS) * valor, 0);
  }

  /** Valor que a serie empilha, ja pesado pela presenca, para a pilha encolher junto. */
  function contribuicao(indiceSerie: number, indiceCategoria: number) {
    return (series[indiceSerie].values[indiceCategoria] ?? 0) * (stacked ? presenca(indiceSerie) : 1);
  }

  /**
   * Cantos de um segmento. Empilhado, so as duas pontas da pilha sao
   * arredondadas e o meio fica reto, para os segmentos lerem como uma barra so.
   */
  function cantosDa(indiceSerie: number, indiceCategoria: number): CornerRadii {
    if (!stacked) {
      return [raioDoCanto, raioDoCanto, raioDoCanto, raioDoCanto];
    }

    const naPilha = series
      .map((_, ordem) => ordem)
      .filter((ordem) => contribuicao(ordem, indiceCategoria) !== 0);
    const abre = naPilha[0] === indiceSerie;
    const fecha = naPilha.at(-1) === indiceSerie;

    if (vertical) {
      // A pilha cresce para cima: quem abre encosta na base, quem fecha e o topo.
      return [
        fecha ? raioDoCanto : 0,
        fecha ? raioDoCanto : 0,
        abre ? raioDoCanto : 0,
        abre ? raioDoCanto : 0,
      ];
    }

    return [
      abre ? raioDoCanto : 0,
      fecha ? raioDoCanto : 0,
      fecha ? raioDoCanto : 0,
      abre ? raioDoCanto : 0,
    ];
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
        <rect
          className={styles.cursor}
          height={vertical ? plot.height : vao}
          width={vertical ? vao : plot.width}
          x={vertical ? escalaCategorias(categories[faixaEmFoco]) ?? 0 : 0}
          y={vertical ? 0 : escalaCategorias(categories[faixaEmFoco]) ?? 0}
        />
      )}

      {series.map((serie, indiceSerie) => {
        const oculta = isHidden(serie.label);

        return (
          <g
            aria-hidden={oculta || undefined}
            className={`${styles.series} ${oculta ? styles.seriesOff : ''}`}
            key={serie.label}
          >
            {categories.map((categoria, indiceCategoria) => {
              const inicioCategoria = escalaCategorias(categoria) ?? 0;
              const anterior = stacked
                ? series
                    .slice(0, indiceSerie)
                    .reduce((total, _, outra) => total + contribuicao(outra, indiceCategoria), 0)
                : 0;
              const comeco = escalaValores(anterior);
              const fim = escalaValores(anterior + contribuicao(indiceSerie, indiceCategoria));
              const tamanho = Math.abs(fim - comeco);
              const espessura = espessuraDa(indiceSerie);
              const deslocamento = deslocamentoDa(indiceSerie);

              return (
                <path
                  className={styles.bar}
                  d={roundedBarPath(
                    vertical ? inicioCategoria + deslocamento : Math.min(comeco, fim),
                    vertical ? Math.min(comeco, fim) : inicioCategoria + deslocamento,
                    vertical ? espessura : tamanho,
                    vertical ? tamanho : espessura,
                    cantosDa(indiceSerie, indiceCategoria),
                  )}
                  fill={cores[indiceSerie]}
                  key={categoria}
                  onMouseEnter={() => setFaixaEmFoco(indiceCategoria)}
                  onMouseLeave={() => setFaixaEmFoco(null)}
                >
                  <title>{`${serie.label}, ${categoria}: ${formatValue(serie.values[indiceCategoria] ?? 0)}`}</title>
                </path>
              );
            })}

            {showDataLabels &&
              !stacked &&
              categories.map((categoria, indiceCategoria) => {
                const valor = serie.values[indiceCategoria] ?? 0;
                const ponta = escalaValores(valor);
                const centro =
                  (escalaCategorias(categoria) ?? 0) + deslocamentoDa(indiceSerie) + espessuraDa(indiceSerie) / 2;

                return (
                  <text
                    className={styles.valueLabel}
                    dominantBaseline={vertical ? 'auto' : 'middle'}
                    key={categoria}
                    textAnchor={vertical ? 'middle' : 'start'}
                    x={vertical ? centro : ponta + 6}
                    y={vertical ? ponta - 6 : centro}
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
