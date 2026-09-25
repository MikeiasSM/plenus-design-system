import { useMemo } from 'react';
import {
  CartesianFrame,
  plotBox,
  useChartSize,
  type AxisLabelRotation,
  type AxisTick,
  type ChartMargins,
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
  height?: number;
  labelRotation?: AxisLabelRotation;
  orientation?: ChartBarOrientation;
  series: readonly ChartBarSeries[];
  showValues?: boolean;
  stacked?: boolean;
  title: string;
}

const MARGENS: ChartMargins = { top: 12, right: 16, bottom: 34, left: 52 };
const ESPACO_ENTRE_BARRAS = 2;

function somaEmpilhada(series: readonly ChartBarSeries[], indice: number) {
  return series.reduce((total, serie) => total + (serie.values[indice] ?? 0), 0);
}

export function ChartBar({
  accent,
  categories,
  emptyMessage = 'Sem dados no período',
  formatValue = (valor) => String(valor),
  height = 260,
  labelRotation = 0,
  orientation = 'vertical',
  series,
  showValues = false,
  stacked = false,
  title,
}: ChartBarProps) {
  const { ref, width } = useChartSize({ height });
  const vertical = orientation === 'vertical';
  const plot = plotBox(width, height, MARGENS);

  const cores = useMemo(() => resolveSeriesColors(series, { accent }), [accent, series]);

  const dominio = useMemo(() => {
    if (stacked) {
      return domainOf(categories.map((_, indice) => somaEmpilhada(series, indice)));
    }

    return mergeDomains(series.map((serie) => domainOf([...serie.values])));
  }, [categories, series, stacked]);

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
      height={height}
      legend={series.map((serie, indice) => ({ color: cores[indice], label: serie.label }))}
      margins={MARGENS}
      plot={plot}
      title={title}
      width={width}
      xAxis={vertical ? { labelRotation, ticks: marcasCategoria } : { hideLine: true, ticks: marcasValor }}
      yAxis={vertical ? { hideLine: true, ticks: marcasValor } : { ticks: marcasCategoria }}
    >
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
                rx={2}
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

      {showValues &&
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
