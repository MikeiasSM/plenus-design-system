import { useMemo } from 'react';
import {
  CartesianFrame,
  linePath,
  plotBox,
  useChartSize,
  type AxisLabelRotation,
  type AxisTick,
  type ChartCurve,
  type ChartMargins,
  type ChartPoint,
} from '../core';
import { resolveSeriesColors, type SeriesAppearance } from '../palette';
import { domainOf, linearScale, mergeDomains, pointScale, ticksFor } from '../scales';
import styles from './ChartLine.module.css';

export interface ChartLineSeries extends SeriesAppearance {
  label: string;
  values: readonly (number | null)[];
}

export interface ChartLineProps {
  accent?: string;
  categories: readonly string[];
  curve?: ChartCurve;
  emptyMessage?: string;
  formatValue?: (value: number) => string;
  height?: number;
  labelRotation?: AxisLabelRotation;
  series: readonly ChartLineSeries[];
  showMarkers?: boolean;
  title: string;
}

const MARGENS: ChartMargins = { top: 12, right: 16, bottom: 34, left: 52 };

export function ChartLine({
  accent,
  categories,
  curve = 'smooth',
  emptyMessage = 'Sem dados no período',
  formatValue = (valor) => String(valor),
  height = 260,
  labelRotation = 0,
  series,
  showMarkers = false,
  title,
}: ChartLineProps) {
  const { ref, width } = useChartSize({ height });
  const plot = plotBox(width, height, MARGENS);

  const cores = useMemo(() => resolveSeriesColors(series, { accent }), [accent, series]);

  const dominio = useMemo(
    () => mergeDomains(series.map((serie) => domainOf(serie.values.filter((valor) => valor !== null)))),
    [series],
  );

  const escalaCategorias = useMemo(
    () => pointScale({ domain: categories, padding: 0, range: [0, plot.width] }),
    [categories, plot.width],
  );

  const escalaValores = useMemo(
    () => linearScale({ domain: dominio, range: [plot.height, 0] }),
    [dominio, plot.height],
  );

  const marcasDeValor = ticksFor(escalaValores, plot.height);

  const pontosPorSerie = series.map((serie) =>
    categories.map<ChartPoint | null>((categoria, indice) => {
      const valor = serie.values[indice];

      if (valor === null || valor === undefined) {
        return null;
      }

      return { x: escalaCategorias(categoria) ?? 0, y: escalaValores(valor) };
    }),
  );

  const marcasCategoria: AxisTick[] = categories.map((categoria) => ({
    label: categoria,
    position: escalaCategorias(categoria) ?? 0,
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
          orientation: 'horizontal',
        },
      ]}
      height={height}
      legend={series.map((serie, indice) => ({ color: cores[indice], label: serie.label }))}
      margins={MARGENS}
      plot={plot}
      title={title}
      width={width}
      xAxis={{ labelRotation, ticks: marcasCategoria }}
      yAxis={{ hideLine: true, ticks: marcasValor }}
    >
      {series.map((serie, indiceSerie) => (
        <g key={serie.label}>
          <path
            className={styles.line}
            d={linePath(pontosPorSerie[indiceSerie], curve)}
            fill="none"
            stroke={cores[indiceSerie]}
          />

          {pontosPorSerie[indiceSerie].map((ponto, indice) =>
            ponto === null ? null : (
              <circle
                className={showMarkers ? styles.markerVisible : styles.marker}
                cx={ponto.x}
                cy={ponto.y}
                fill={cores[indiceSerie]}
                key={categories[indice]}
                r={4}
              >
                <title>{`${serie.label}, ${categories[indice]}: ${formatValue(serie.values[indice] ?? 0)}`}</title>
              </circle>
            ),
          )}
        </g>
      ))}
    </CartesianFrame>
  );
}
