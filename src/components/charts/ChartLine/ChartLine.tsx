import { useMemo } from 'react';
import {
  CartesianFrame,
  cartesianLayout,
  chartHeight,
  linePath,
  useChartMetrics,
  useSeriesToggle,
  useTweenedNumbers,
  valueLabelsFor,
  type AxisLabelAngle,
  type AxisTick,
  type AxisVisibility,
  type ChartCurve,
  type ChartHeight,
  type ChartLegendPosition,
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
  defaultHiddenSeries?: readonly string[];
  emptyMessage?: string;
  formatValue?: (value: number) => string;
  height?: ChartHeight;
  hiddenSeries?: readonly string[];
  labelAngle?: AxisLabelAngle;
  legend?: ChartLegendPosition;
  onHiddenSeriesChange?: (hidden: readonly string[]) => void;
  series: readonly ChartLineSeries[];
  showDataLabels?: boolean;
  showDots?: boolean;
  title: string;
  xAxis?: AxisVisibility;
  yAxis?: AxisVisibility;
  yAxisRight?: AxisVisibility;
}

const ALTURA_DO_ROTULO = 18;

export function ChartLine({
  accent,
  categories,
  curve = 'smooth',
  defaultHiddenSeries,
  emptyMessage = 'Sem dados no período',
  formatValue = (valor) => String(valor),
  height = 260,
  hiddenSeries,
  labelAngle = 'auto',
  legend = 'bottom',
  onHiddenSeriesChange,
  series,
  showDataLabels = false,
  showDots = false,
  title,
  xAxis = 'visible',
  yAxis = 'visible',
  yAxisRight = 'hidden',
}: ChartLineProps) {
  const { font, height: alturaMedida, ref, width } = useChartMetrics();
  const { fillHeight, value: alturaDoDesenho } = chartHeight(height, alturaMedida);
  const { isHidden, toggle } = useSeriesToggle({ defaultHiddenSeries, hiddenSeries, onHiddenSeriesChange });

  // A cor sai da lista inteira, e nao das visiveis: desligar uma serie nao pode
  // repintar as demais.
  const cores = useMemo(() => resolveSeriesColors(series, { accent }), [accent, series]);

  const dominio = useMemo(
    () =>
      mergeDomains(
        series
          .filter((serie) => !isHidden(serie.label))
          .map((serie) => domainOf(serie.values.filter((valor) => valor !== null))),
      ),
    [isHidden, series],
  );

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

  // A escala alvo fixa as marcas; a animada posiciona o desenho. Sem separar as
  // duas, as marcas exibiriam valores quebrados durante a transicao.
  const escalaAlvo = useMemo(
    () => linearScale({ domain: dominio, range: [plot.height, 0] }),
    [dominio, plot.height],
  );

  const [minimo, maximo] = useTweenedNumbers(escalaAlvo.domain());

  const escalaValores = useMemo(
    () => linearScale({ domain: { min: minimo, max: maximo }, nice: false, range: [plot.height, 0] }),
    [maximo, minimo, plot.height],
  );

  const marcasDeValor = ticksFor(escalaAlvo, plot.height);

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
      fillHeight={fillHeight}
      grid={[
        {
          baseline: escalaValores(0),
          lines: marcasDeValor.map((valor) => escalaValores(valor)),
          orientation: 'horizontal',
        },
      ]}
      height={alturaDoDesenho}
      legend={series.map((serie, indice) => ({
        color: cores[indice],
        hidden: isHidden(serie.label),
        label: serie.label,
      }))}
      legendPosition={legend}
      margins={margins}
      onToggleSeries={toggle}
      plot={plot}
      title={title}
      width={width}
      xAxis={{ labelRotation: rotation, ticks: marcasCategoria, visibility: xAxis }}
      yAxis={{ hideLine: true, ticks: marcasValor, visibility: yAxis }}
      yAxisRight={{ hideLine: true, ticks: marcasValor, visibility: yAxisRight }}
    >
      {series.map((serie, indiceSerie) => {
        const oculta = isHidden(serie.label);

        return (
          <g
            aria-hidden={oculta || undefined}
            className={`${styles.series} ${oculta ? styles.seriesOff : ''}`}
            key={serie.label}
          >
            <path
              className={styles.line}
              d={linePath(pontosPorSerie[indiceSerie], curve)}
              fill="none"
              stroke={cores[indiceSerie]}
            />

            {pontosPorSerie[indiceSerie].map((ponto, indice) =>
              ponto === null ? null : (
                <circle
                  className={showDots ? styles.dotVisible : styles.dot}
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

            {showDataLabels &&
              pontosPorSerie[indiceSerie].map((ponto, indice) =>
                ponto === null ? null : (
                  <text
                    className={styles.valueLabel}
                    key={categories[indice]}
                    textAnchor="middle"
                    x={ponto.x}
                    y={ponto.y - 10}
                  >
                    {formatValue(serie.values[indice] ?? 0)}
                  </text>
                ),
              )}
          </g>
        );
      })}
    </CartesianFrame>
  );
}
