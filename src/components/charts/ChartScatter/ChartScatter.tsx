import { useMemo, useState } from 'react';
import {
  CartesianFrame,
  cartesianLayout,
  chartHeight,
  useChartMetrics,
  valueLabelsFor,
  type AxisTick,
  type AxisVisibility,
  type ChartHeight,
  type ChartLegendPosition,
} from '../core';
import { resolveSeriesColors, type SeriesAppearance } from '../palette';
import { domainOf, linearScale, mergeDomains, radiusScale, ticksFor } from '../scales';
import styles from './ChartScatter.module.css';

export interface ChartScatterPoint {
  label?: string;
  x: number;
  y: number;
  z?: number;
}

export interface ChartScatterSeries extends SeriesAppearance {
  label: string;
  points: readonly ChartScatterPoint[];
}

export interface ChartScatterProps {
  accent?: string;
  emptyMessage?: string;
  formatX?: (value: number) => string;
  formatY?: (value: number) => string;
  formatZ?: (value: number) => string;
  height?: ChartHeight;
  legend?: ChartLegendPosition;
  series: readonly ChartScatterSeries[];
  title: string;
  xAxis?: AxisVisibility;
  yAxis?: AxisVisibility;
  yAxisRight?: AxisVisibility;
}

const RAIO_SEM_Z = 5;
const FAIXA_DE_RAIO: [number, number] = [4, 18];

interface Guia {
  x: number;
  y: number;
}

export function ChartScatter({
  accent,
  emptyMessage = 'Sem dados no período',
  formatX = (valor) => String(valor),
  formatY = (valor) => String(valor),
  formatZ = (valor) => String(valor),
  height = 280,
  legend = 'bottom',
  series,
  title,
  xAxis = 'visible',
  yAxis = 'visible',
  yAxisRight = 'hidden',
}: ChartScatterProps) {
  const { font, height: alturaMedida, ref, width } = useChartMetrics();
  const { fillHeight, value: alturaDoDesenho } = chartHeight(height, alturaMedida);
  const [guia, setGuia] = useState<Guia | null>(null);

  const cores = useMemo(() => resolveSeriesColors(series, { accent }), [accent, series]);

  const dominioX = useMemo(
    () => mergeDomains(series.map((serie) => domainOf(serie.points.map((ponto) => ponto.x)))),
    [series],
  );

  const dominioY = useMemo(
    () => mergeDomains(series.map((serie) => domainOf(serie.points.map((ponto) => ponto.y)))),
    [series],
  );

  const maiorZ = useMemo(
    () =>
      series.reduce(
        (maior, serie) => serie.points.reduce((parcial, ponto) => Math.max(parcial, ponto.z ?? 0), maior),
        0,
      ),
    [series],
  );

  const rotulosY = valueLabelsFor(dominioY, alturaDoDesenho, formatY);
  const rotulosX = valueLabelsFor(dominioX, width, formatX);

  const { margins, plot, rotation } = cartesianLayout({
    bottomLabels: rotulosX,
    font,
    height: alturaDoDesenho,
    labelAngle: 'auto',
    leftLabels: rotulosY,
    rightLabels: rotulosY,
    topRoom: 0,
    width,
    xAxis,
    yAxis,
    yAxisRight,
  });

  const escalaX = useMemo(() => linearScale({ domain: dominioX, range: [0, plot.width] }), [dominioX, plot.width]);
  const escalaY = useMemo(() => linearScale({ domain: dominioY, range: [plot.height, 0] }), [dominioY, plot.height]);
  const escalaRaio = useMemo(() => radiusScale(maiorZ, FAIXA_DE_RAIO), [maiorZ]);

  const marcasX = ticksFor(escalaX, plot.width);
  const marcasY = ticksFor(escalaY, plot.height);

  const ticksX: AxisTick[] = marcasX.map((valor) => ({ label: formatX(valor), position: escalaX(valor) }));
  const ticksY: AxisTick[] = marcasY.map((valor) => ({ label: formatY(valor), position: escalaY(valor) }));

  function descrever(serie: ChartScatterSeries, ponto: ChartScatterPoint) {
    const inicio = ponto.label ? `${serie.label}, ${ponto.label}` : serie.label;
    const posicao = `${formatX(ponto.x)} × ${formatY(ponto.y)}`;

    return ponto.z === undefined ? `${inicio}: ${posicao}` : `${inicio}: ${posicao} (${formatZ(ponto.z)})`;
  }

  return (
    <CartesianFrame
      containerRef={ref}
      empty={series.every((serie) => serie.points.length === 0)}
      emptyMessage={emptyMessage}
      grid={[
        { lines: marcasY.map((valor) => escalaY(valor)), orientation: 'horizontal' },
        { lines: marcasX.map((valor) => escalaX(valor)), orientation: 'vertical' },
      ]}
      fillHeight={fillHeight}
      height={alturaDoDesenho}
      legend={series.map((serie, indice) => ({ color: cores[indice], label: serie.label }))}
      legendPosition={legend}
      margins={margins}
      plot={plot}
      title={title}
      width={width}
      xAxis={{ hideLine: true, labelRotation: rotation, ticks: ticksX, visibility: xAxis }}
      yAxis={{ hideLine: true, ticks: ticksY, visibility: yAxis }}
      yAxisRight={{ hideLine: true, ticks: ticksY, visibility: yAxisRight }}
    >
      {guia && (
        <g aria-hidden="true">
          <line className={styles.guide} x1={guia.x} x2={guia.x} y1={guia.y} y2={plot.height} />
          <line className={styles.guide} x1={0} x2={guia.x} y1={guia.y} y2={guia.y} />
        </g>
      )}

      {series.map((serie, indiceSerie) => (
        <g key={serie.label}>
          {serie.points.map((ponto, indice) => {
            const x = escalaX(ponto.x);
            const y = escalaY(ponto.y);

            return (
              <circle
                className={styles.bubble}
                cx={x}
                cy={y}
                fill={cores[indiceSerie]}
                key={indice}
                onMouseEnter={() => setGuia({ x, y })}
                onMouseLeave={() => setGuia(null)}
                r={ponto.z === undefined ? RAIO_SEM_Z : escalaRaio(ponto.z)}
              >
                <title>{descrever(serie, ponto)}</title>
              </circle>
            );
          })}
        </g>
      ))}
    </CartesianFrame>
  );
}
