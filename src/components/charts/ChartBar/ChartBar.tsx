import { useMemo, useState } from 'react';
import {
  CartesianFrame,
  cartesianLayout,
  chartHeight,
  useChartMetrics,
  valueLabelsFor,
  type AxisLabelAngle,
  type AxisTick,
  type AxisVisibility,
  type ChartHeight,
  type ChartLegendPosition,
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
  emptyMessage?: string;
  formatValue?: (value: number) => string;
  height?: ChartHeight;
  labelAngle?: AxisLabelAngle;
  legend?: ChartLegendPosition;
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

function somaEmpilhada(series: readonly ChartBarSeries[], indice: number) {
  return series.reduce((total, serie) => total + (serie.values[indice] ?? 0), 0);
}

export function ChartBar({
  accent,
  categories,
  emptyMessage = 'Sem dados no período',
  formatValue = (valor) => String(valor),
  height = 260,
  labelAngle = 'auto',
  legend = 'bottom',
  orientation = 'vertical',
  series,
  showDataLabels = false,
  stacked = false,
  title,
  xAxis = 'visible',
  yAxis = 'visible',
  yAxisRight = 'hidden',
}: ChartBarProps) {
  const { font, height: alturaMedida, ref, width } = useChartMetrics();
  const { fillHeight, value: alturaDoDesenho } = chartHeight(height, alturaMedida);
  const [faixaEmFoco, setFaixaEmFoco] = useState<number | null>(null);
  const vertical = orientation === 'vertical';

  const cores = useMemo(() => resolveSeriesColors(series, { accent }), [accent, series]);

  const dominio = useMemo(() => {
    if (stacked) {
      return domainOf(categories.map((_, indice) => somaEmpilhada(series, indice)));
    }

    return mergeDomains(series.map((serie) => domainOf([...serie.values])));
  }, [categories, series, stacked]);

  // Barras horizontais consomem a largura: a legenda ao lado espremeria o desenho.
  const posicaoDaLegenda = !vertical && (legend === 'left' || legend === 'right') ? 'bottom' : legend;

  const rotulosDeValor = valueLabelsFor(dominio, vertical ? alturaDoDesenho : width, formatValue);
  const rotulosDeCategoria = categories;

  const layout = cartesianLayout({
    bottomLabels: vertical ? rotulosDeCategoria : rotulosDeValor,
    font,
    height: alturaDoDesenho,
    labelAngle,
    leftLabels: vertical ? rotulosDeValor : rotulosDeCategoria,
    rightLabels: vertical ? rotulosDeValor : rotulosDeCategoria,
    topRoom: showDataLabels && vertical ? ALTURA_DO_ROTULO : 0,
    width,
    xAxis,
    yAxis,
    yAxisRight,
  });

  const { margins, plot, rotation } = layout;
  const comprimentoCategorias = vertical ? plot.width : plot.height;
  const comprimentoValores = vertical ? plot.height : plot.width;

  const escalaCategorias = useMemo(
    () => bandScale({ domain: categories, range: [0, comprimentoCategorias] }),
    [categories, comprimentoCategorias],
  );

  const escalaValores = useMemo(
    () =>
      linearScale({
        domain: dominio,
        range: vertical ? [comprimentoValores, 0] : [0, comprimentoValores],
      }),
    [comprimentoValores, dominio, vertical],
  );

  const marcasDeValor = ticksFor(escalaValores, comprimentoValores);
  const larguraDaBarra = stacked
    ? escalaCategorias.bandwidth()
    : Math.max((escalaCategorias.bandwidth() - ESPACO_ENTRE_BARRAS * (series.length - 1)) / series.length, 1);

  const marcasCategoria: AxisTick[] = categories.map((categoria) => ({
    label: categoria,
    position: (escalaCategorias(categoria) ?? 0) + escalaCategorias.bandwidth() / 2,
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
      grid={[
        {
          baseline: escalaValores(0),
          lines: marcasDeValor.map((valor) => escalaValores(valor)),
          orientation: vertical ? 'horizontal' : 'vertical',
        },
      ]}
      fillHeight={fillHeight}
      height={alturaDoDesenho}
      legend={series.map((serie, indice) => ({ color: cores[indice], label: serie.label }))}
      legendPosition={posicaoDaLegenda}
      margins={margins}
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
          height={vertical ? plot.height : escalaCategorias.bandwidth()}
          width={vertical ? escalaCategorias.bandwidth() : plot.width}
          x={vertical ? escalaCategorias(categories[faixaEmFoco]) ?? 0 : 0}
          y={vertical ? 0 : escalaCategorias(categories[faixaEmFoco]) ?? 0}
        />
      )}

      {series.map((serie, indiceSerie) => (
        <g key={serie.label}>
          {categories.map((categoria, indiceCategoria) => {
            const valor = serie.values[indiceCategoria] ?? 0;
            const inicioCategoria = escalaCategorias(categoria) ?? 0;
            const deslocamento = stacked ? 0 : indiceSerie * (larguraDaBarra + ESPACO_ENTRE_BARRAS);
            const anterior = stacked
              ? series
                  .slice(0, indiceSerie)
                  .reduce((total, outra) => total + (outra.values[indiceCategoria] ?? 0), 0)
              : 0;
            const comeco = escalaValores(anterior);
            const fim = escalaValores(anterior + valor);
            const tamanho = Math.abs(fim - comeco);

            return (
              <rect
                className={styles.bar}
                fill={cores[indiceSerie]}
                height={vertical ? tamanho : larguraDaBarra}
                key={categoria}
                onMouseEnter={() => setFaixaEmFoco(indiceCategoria)}
                onMouseLeave={() => setFaixaEmFoco(null)}
                width={vertical ? larguraDaBarra : tamanho}
                x={vertical ? inicioCategoria + deslocamento : Math.min(comeco, fim)}
                y={vertical ? Math.min(comeco, fim) : inicioCategoria + deslocamento}
              >
                <title>{`${serie.label}, ${categoria}: ${formatValue(valor)}`}</title>
              </rect>
            );
          })}
        </g>
      ))}

      {showDataLabels &&
        !stacked &&
        series.map((serie, indiceSerie) =>
          categories.map((categoria, indiceCategoria) => {
            const valor = serie.values[indiceCategoria] ?? 0;
            const inicioCategoria = escalaCategorias(categoria) ?? 0;
            const deslocamento = indiceSerie * (larguraDaBarra + ESPACO_ENTRE_BARRAS);
            const ponta = escalaValores(valor);

            return (
              <text
                className={styles.valueLabel}
                dominantBaseline={vertical ? 'auto' : 'middle'}
                key={serie.label + categoria}
                textAnchor={vertical ? 'middle' : 'start'}
                x={vertical ? inicioCategoria + deslocamento + larguraDaBarra / 2 : ponta + 6}
                y={vertical ? ponta - 6 : inicioCategoria + deslocamento + larguraDaBarra / 2}
              >
                {formatValue(valor)}
              </text>
            );
          }),
        )}
    </CartesianFrame>
  );
}
