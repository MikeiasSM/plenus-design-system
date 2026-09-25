import { useMemo, useState } from 'react';
import {
  CartesianFrame,
  cartesianLayout,
  chartHeight,
  useChartMetrics,
  useSeriesToggle,
  useTweenedNumbers,
  valueLabelsFor,
  type AxisTick,
  type AxisVisibility,
  type ChartHeight,
  type ChartLegendAlign,
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
  defaultHiddenSeries?: readonly string[];
  emptyMessage?: string;
  formatX?: (value: number) => string;
  formatY?: (value: number) => string;
  formatZ?: (value: number) => string;
  height?: ChartHeight;
  hiddenSeries?: readonly string[];
  legend?: ChartLegendPosition;
  legendAlign?: ChartLegendAlign;
  onHiddenSeriesChange?: (hidden: readonly string[]) => void;
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
  defaultHiddenSeries,
  emptyMessage = 'Sem dados no período',
  formatX = (valor) => String(valor),
  formatY = (valor) => String(valor),
  formatZ = (valor) => String(valor),
  height = 280,
  hiddenSeries,
  legend = 'bottom',
  legendAlign,
  onHiddenSeriesChange,
  series,
  title,
  xAxis = 'visible',
  yAxis = 'visible',
  yAxisRight = 'hidden',
}: ChartScatterProps) {
  const { font, height: alturaMedida, ref, width } = useChartMetrics();
  const { fillHeight, value: alturaDoDesenho } = chartHeight(height, alturaMedida);
  const { isHidden, toggle } = useSeriesToggle({ defaultHiddenSeries, hiddenSeries, onHiddenSeriesChange });
  const [guia, setGuia] = useState<Guia | null>(null);

  // A cor sai da lista inteira, e nao das visiveis: desligar uma serie nao pode
  // repintar as demais.
  const cores = useMemo(() => resolveSeriesColors(series, { accent }), [accent, series]);

  const visiveis = useMemo(() => series.filter((serie) => !isHidden(serie.label)), [isHidden, series]);

  const dominioX = useMemo(
    () => mergeDomains(visiveis.map((serie) => domainOf(serie.points.map((ponto) => ponto.x)))),
    [visiveis],
  );

  const dominioY = useMemo(
    () => mergeDomains(visiveis.map((serie) => domainOf(serie.points.map((ponto) => ponto.y)))),
    [visiveis],
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

  // As escalas alvo fixam as marcas; as animadas posicionam o desenho. Sem
  // separar as duas, as marcas exibiriam valores quebrados durante a transicao.
  const alvoX = useMemo(() => linearScale({ domain: dominioX, range: [0, plot.width] }), [dominioX, plot.width]);
  const alvoY = useMemo(() => linearScale({ domain: dominioY, range: [plot.height, 0] }), [dominioY, plot.height]);

  const [minX, maxX, minY, maxY] = useTweenedNumbers([...alvoX.domain(), ...alvoY.domain()]);

  const escalaX = useMemo(
    () => linearScale({ domain: { min: minX, max: maxX }, nice: false, range: [0, plot.width] }),
    [maxX, minX, plot.width],
  );
  const escalaY = useMemo(
    () => linearScale({ domain: { min: minY, max: maxY }, nice: false, range: [plot.height, 0] }),
    [maxY, minY, plot.height],
  );
  const escalaRaio = useMemo(() => radiusScale(maiorZ, FAIXA_DE_RAIO), [maiorZ]);

  const marcasX = ticksFor(alvoX, plot.width);
  const marcasY = ticksFor(alvoY, plot.height);

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
        <g
          aria-hidden={isHidden(serie.label) || undefined}
          className={`${styles.series} ${isHidden(serie.label) ? styles.seriesOff : ''}`}
          key={serie.label}
        >
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
