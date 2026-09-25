import { useId, useMemo } from 'react';
import {
  CartesianFrame,
  areaPath,
  linePath,
  plotBox,
  useChartSize,
  type AxisLabelRotation,
  type AxisTick,
  type ChartBand,
  type ChartCurve,
  type ChartMargins,
  type ChartPoint,
} from '../core';
import { resolveSeriesColors, type SeriesAppearance } from '../palette';
import { domainOf, linearScale, mergeDomains, pointScale, ticksFor } from '../scales';
import styles from './ChartArea.module.css';

export interface ChartAreaSeries extends SeriesAppearance {
  label: string;
  values: readonly (number | null)[];
}

export interface ChartAreaProps {
  accent?: string;
  categories: readonly string[];
  curve?: ChartCurve;
  emptyMessage?: string;
  formatValue?: (value: number) => string;
  height?: number;
  labelRotation?: AxisLabelRotation;
  series: readonly ChartAreaSeries[];
  stacked?: boolean;
  title: string;
}

const MARGENS: ChartMargins = { top: 12, right: 16, bottom: 34, left: 52 };

function somaAte(series: readonly ChartAreaSeries[], ateSerie: number, indice: number) {
  return series.slice(0, ateSerie).reduce((total, serie) => total + (serie.values[indice] ?? 0), 0);
}

export function ChartArea({
  accent,
  categories,
  curve = 'smooth',
  emptyMessage = 'Sem dados no período',
  formatValue = (valor) => String(valor),
  height = 260,
  labelRotation = 0,
  series,
  stacked = false,
  title,
}: ChartAreaProps) {
  const gradienteId = useId();
  const { ref, width } = useChartSize({ height });
  const plot = plotBox(width, height, MARGENS);

  const cores = useMemo(() => resolveSeriesColors(series, { accent }), [accent, series]);

  const dominio = useMemo(() => {
    if (stacked) {
      return domainOf(categories.map((_, indice) => somaAte(series, series.length, indice)));
    }

    return mergeDomains(series.map((serie) => domainOf(serie.values.filter((valor) => valor !== null))));
  }, [categories, series, stacked]);

  const escalaCategorias = useMemo(
    () => pointScale({ domain: categories, padding: 0, range: [0, plot.width] }),
    [categories, plot.width],
  );

  const escalaValores = useMemo(
    () => linearScale({ domain: dominio, range: [plot.height, 0] }),
    [dominio, plot.height],
  );

  const marcasDeValor = ticksFor(escalaValores, plot.height);
  const base = escalaValores(0);

  const faixasPorSerie = series.map((serie, indiceSerie) =>
    categories.map<ChartBand | null>((categoria, indice) => {
      const valor = serie.values[indice];

      if (valor === null || valor === undefined) {
        return null;
      }

      const abaixo = stacked ? somaAte(series, indiceSerie, indice) : 0;

      return {
        x: escalaCategorias(categoria) ?? 0,
        y0: stacked ? escalaValores(abaixo) : base,
        y1: escalaValores(abaixo + valor),
      };
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
          baseline: base,
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
      {/* Sem empilhamento as areas se sobrepoem, e um topo opaco esconderia a de
          baixo. O contorno em cor cheia e que marca o limite de cada faixa. */}
      {!stacked && (
        <defs>
          {series.map((serie, indice) => (
            <linearGradient
              id={`${gradienteId}-${indice}`}
              key={serie.label}
              x1="0"
              x2="0"
              y1="0"
              y2="1"
            >
              <stop offset="5%" stopColor={cores[indice]} stopOpacity={0.6} />
              <stop offset="95%" stopColor={cores[indice]} stopOpacity={0.05} />
            </linearGradient>
          ))}
        </defs>
      )}

      {series.map((serie, indiceSerie) => {
        const faixas = faixasPorSerie[indiceSerie];
        const contorno = faixas.map<ChartPoint | null>((faixa) =>
          faixa === null ? null : { x: faixa.x, y: faixa.y1 },
        );

        return (
          <g key={serie.label}>
            <path
              d={areaPath(faixas, curve)}
              fill={stacked ? cores[indiceSerie] : `url(#${gradienteId}-${indiceSerie})`}
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

              return (
                <circle className={styles.marker} cx={faixa.x} cy={faixa.y1} fill={cores[indiceSerie]} key={categoria} r={4}>
                  <title>{`${serie.label}, ${categoria}: ${formatValue(serie.values[indice] ?? 0)}`}</title>
                </circle>
              );
            })}
          </g>
        );
      })}
    </CartesianFrame>
  );
}
