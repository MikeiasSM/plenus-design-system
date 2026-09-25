import { useId, useMemo } from 'react';
import {
  CartesianFrame,
  areaPath,
  cartesianLayout,
  chartHeight,
  linePath,
  useChartMetrics,
  useSeriesToggle,
  useTweenedNumbers,
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
  defaultHiddenSeries?: readonly string[];
  emptyMessage?: string;
  formatValue?: (value: number) => string;
  height?: ChartHeight;
  hiddenSeries?: readonly string[];
  labelAngle?: AxisLabelAngle;
  legend?: ChartLegendPosition;
  legendAlign?: ChartLegendAlign;
  onHiddenSeriesChange?: (hidden: readonly string[]) => void;
  series: readonly ChartAreaSeries[];
  showDataLabels?: boolean;
  showDots?: boolean;
  stacked?: boolean;
  title: string;
  xAxis?: AxisVisibility;
  yAxis?: AxisVisibility;
  yAxisRight?: AxisVisibility;
}


function somaAte(
  series: readonly ChartAreaSeries[],
  ateSerie: number,
  indice: number,
  peso: (serie: number) => number,
) {
  return series
    .slice(0, ateSerie)
    .reduce((total, serie, ordem) => total + (serie.values[indice] ?? 0) * peso(ordem), 0);
}

export function ChartArea({
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
  legendAlign,
  onHiddenSeriesChange,
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
  const { isHidden, toggle } = useSeriesToggle({ defaultHiddenSeries, hiddenSeries, onHiddenSeriesChange });

  // A cor sai da lista inteira, e nao das visiveis: desligar uma serie nao pode
  // repintar as demais.
  const cores = useMemo(() => resolveSeriesColors(series, { accent }), [accent, series]);

  // Presenca de cada serie, entre zero e um. Empilhadas, ela pesa a
  // contribuicao, entao a faixa desligada encolhe e a pilha acompanha.
  const presencas = useTweenedNumbers(series.map((serie) => (isHidden(serie.label) ? 0 : 1)));
  const presenca = (indice: number) => presencas[indice] ?? 0;

  const dominio = useMemo(() => {
    const visivel = (ordem: number) => (isHidden(series[ordem].label) ? 0 : 1);

    if (stacked) {
      return domainOf(categories.map((_, indice) => somaAte(series, series.length, indice, visivel)));
    }

    return mergeDomains(
      series
        .filter((serie) => !isHidden(serie.label))
        .map((serie) => domainOf(serie.values.filter((valor) => valor !== null))),
    );
  }, [categories, isHidden, series, stacked]);

  const rotulosDeValor = valueLabelsFor(dominio, alturaDoDesenho, formatValue);

  const { margins, plot, rotation } = cartesianLayout({
    bottomLabels: categories,
    font,
    height: alturaDoDesenho,
    labelAngle,
    leftLabels: rotulosDeValor,
    rightLabels: rotulosDeValor,
    topRoom: showDataLabels ? valueLabelRoom(font) : 0,
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
  const base = escalaValores(0);

  const faixasPorSerie = series.map((serie, indiceSerie) =>
    categories.map<ChartBand | null>((categoria, indice) => {
      const valor = serie.values[indice];

      if (valor === null || valor === undefined) {
        return null;
      }

      const abaixo = stacked ? somaAte(series, indiceSerie, indice, presenca) : 0;
      const contribuicao = stacked ? valor * presenca(indiceSerie) : valor;

      return {
        x: escalaCategorias(categoria) ?? 0,
        y0: stacked ? escalaValores(abaixo) : base,
        y1: escalaValores(abaixo + contribuicao),
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
      legend={series.map((serie, indice) => ({
        color: cores[indice],
        hidden: isHidden(serie.label),
        label: serie.label,
      }))}
      legendAlign={legendAlign}
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

        const oculta = isHidden(serie.label);

        return (
          <g
            aria-hidden={oculta || undefined}
            className={`${styles.series} ${oculta ? styles.seriesOff : ''}`}
            key={serie.label}
          >
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
                  aria-label={`${serie.label}, ${categoria}: ${formatValue(serie.values[indice] ?? 0)}`}
                  className={showDots ? styles.dotVisible : styles.dot}
                  cx={faixa.x}
                  cy={faixa.y1}
                  fill={cores[indiceSerie]}
                  key={categoria}
                  r={4}
                />
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
