import { useId, useMemo } from 'react';
import {
  CartesianFrame,
  areaPath,
  cartesianLayout,
  chartHeight,
  linePath,
  useChartMetrics,
  valueLabelsFor,
  type AxisLabelAngle,
  type AxisTick,
  type AxisVisibility,
  type ChartBand,
  type ChartCurve,
  type ChartHeight,
  type ChartLegendPosition,
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
  height?: ChartHeight;
  labelAngle?: AxisLabelAngle;
  legend?: ChartLegendPosition;
  series: readonly ChartAreaSeries[];
  showDataLabels?: boolean;
  showDots?: boolean;
  stacked?: boolean;
  title: string;
  xAxis?: AxisVisibility;
  yAxis?: AxisVisibility;
  yAxisRight?: AxisVisibility;
}

const ALTURA_DO_ROTULO = 18;

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
  labelAngle = 'auto',
  legend = 'bottom',
  series,
  showDataLabels = false,
  showDots = false,
  stacked = false,
  title,
  xAxis = 'visible',
  yAxis = 'visible',
  yAxisRight = 'hidden',
}: ChartAreaProps) {
  const gradienteId = useId();
  const { font, height: alturaMedida, ref, width } = useChartMetrics();
  const { fillHeight, value: alturaDoDesenho } = chartHeight(height, alturaMedida);

  const cores = useMemo(() => resolveSeriesColors(series, { accent }), [accent, series]);

  const dominio = useMemo(() => {
    if (stacked) {
      return domainOf(categories.map((_, indice) => somaAte(series, series.length, indice)));
    }

    return mergeDomains(series.map((serie) => domainOf(serie.values.filter((valor) => valor !== null))));
  }, [categories, series, stacked]);

  const rotulosDeValor = valueLabelsFor(dominio, alturaDoDesenho, formatValue);

  const { margins, plot, rotation } = cartesianLayout({
    bottomLabels: categories,
    font,
    height: alturaDoDesenho,
    labelAngle,
    leftLabels: rotulosDeValor,
    rightLabels: rotulosDeValor,
    topRoom: showDataLabels ? ALTURA_DO_ROTULO : 0,
    width,
    xAxis,
    yAxis,
    yAxisRight,
  });

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
      fillHeight={fillHeight}
      height={alturaDoDesenho}
      legend={series.map((serie, indice) => ({ color: cores[indice], label: serie.label }))}
      legendPosition={legend}
      margins={margins}
      plot={plot}
      title={title}
      width={width}
      xAxis={{ labelRotation: rotation, ticks: marcasCategoria, visibility: xAxis }}
      yAxis={{ hideLine: true, ticks: marcasValor, visibility: yAxis }}
      yAxisRight={{ hideLine: true, ticks: marcasValor, visibility: yAxisRight }}
    >
      {/* Sem empilhamento as areas se sobrepoem, e um topo opaco esconderia a de
          baixo. O contorno em cor cheia e que marca o limite de cada faixa. */}
      {!stacked && (
        <defs>
          {series.map((serie, indice) => (
            <linearGradient id={`${gradienteId}-${indice}`} key={serie.label} x1="0" x2="0" y1="0" y2="1">
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
                <circle
                  className={showDots ? styles.dotVisible : styles.dot}
                  cx={faixa.x}
                  cy={faixa.y1}
                  fill={cores[indiceSerie]}
                  key={categoria}
                  r={4}
                >
                  <title>{`${serie.label}, ${categoria}: ${formatValue(serie.values[indice] ?? 0)}`}</title>
                </circle>
              );
            })}

            {showDataLabels &&
              categories.map((categoria, indice) => {
                const faixa = faixas[indice];

                if (faixa === null) {
                  return null;
                }

                return (
                  <text
                    className={styles.valueLabel}
                    key={categoria}
                    textAnchor="middle"
                    x={faixa.x}
                    y={faixa.y1 - 10}
                  >
                    {formatValue(serie.values[indice] ?? 0)}
                  </text>
                );
              })}
          </g>
        );
      })}
    </CartesianFrame>
  );
}
