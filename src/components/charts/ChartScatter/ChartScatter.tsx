import { useMemo, useState } from 'react';
import {
  CartesianFrame,
  plotBox,
  useChartSize,
  type AxisTick,
  type ChartMargins,
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
  height?: number;
  series: readonly ChartScatterSeries[];
  title: string;
}

const MARGENS: ChartMargins = { top: 12, right: 20, bottom: 34, left: 52 };
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
  series,
  title,
}: ChartScatterProps) {
  const { ref, width } = useChartSize({ height });
  const [guia, setGuia] = useState<Guia | null>(null);
  const plot = plotBox(width, height, MARGENS);

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
      height={height}
      legend={series.map((serie, indice) => ({ color: cores[indice], label: serie.label }))}
      margins={MARGENS}
      plot={plot}
      title={title}
      width={width}
      xAxis={{ hideLine: true, ticks: ticksX }}
      yAxis={{ hideLine: true, ticks: ticksY }}
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
