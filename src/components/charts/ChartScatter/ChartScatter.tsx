import { useMemo, useState } from 'react';
import {
  CartesianFrame,
  seriesInScale,
  useCartesianLayout,
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
import { formatarNumero } from '../../../utils/formatters';
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
  /**
   * Inclui o zero no dominio: `true` nos dois eixos, `'x'` ou `'y'` so naquele, `false` em nenhum.
   * Medida que nao se compara ao zero — um ano, uma temperatura — fica com o eixo dela de fora;
   * um ano pede tambem um formato sem separador de milhar em `formatX` ou `formatY`.
   */
  includeZero?: boolean | 'x' | 'y';
  height?: ChartHeight;
  hiddenSeries?: readonly string[];
  legend?: ChartLegendPosition;
  legendAlign?: ChartLegendAlign;
  onHiddenSeriesChange?: (hidden: readonly string[]) => void;
  series: readonly ChartScatterSeries[];
  /** Balao com o detalhe do que esta sob o ponteiro. Desligue para nao mostrar nada alem do `<title>` nativo. */
  showTooltip?: boolean;
  title: string;
  /** Nome de cada medida no balao. */
  xLabel?: string;
  yLabel?: string;
  zLabel?: string;
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

/** Tamanho invalido tem o destino do ausente: a bolha fica no raio padrao. */
function zValido(ponto: ChartScatterPoint) {
  return ponto.z !== undefined && Number.isFinite(ponto.z) ? ponto.z : undefined;
}

export function ChartScatter({
  accent,
  defaultHiddenSeries,
  emptyMessage = 'Sem dados no período',
  formatX = formatarNumero,
  formatY = formatarNumero,
  formatZ = formatarNumero,
  height = 280,
  includeZero = true,
  hiddenSeries,
  legend = 'bottom',
  legendAlign,
  onHiddenSeriesChange,
  series,
  showTooltip = true,
  title,
  xLabel = 'X',
  yLabel = 'Y',
  zLabel = 'Tamanho',
  xAxis = 'visible',
  yAxis = 'visible',
  yAxisRight = 'hidden',
}: ChartScatterProps) {
  const { font, height: alturaMedida, ref, width } = useChartMetrics();
  const { fillHeight, value: alturaDoDesenho } = chartHeight(height, alturaMedida);
  const { isHidden, isOutOfScale, toggle } = useSeriesToggle({
    defaultHiddenSeries,
    hiddenSeries,
    labels: series.map((serie) => serie.label),
    onHiddenSeriesChange,
  });
  const [guia, setGuia] = useState<Guia | null>(null);
  const [emFoco, setEmFoco] = useState<{ ponto: number; serie: number } | null>(null);

  // A cor sai da lista inteira, e nao das visiveis: desligar uma serie nao pode
  // repintar as demais.
  const cores = useMemo(() => resolveSeriesColors(series, { accent }), [accent, series]);

  const naEscala = useMemo(() => seriesInScale(series, isOutOfScale), [isOutOfScale, series]);

  const zeroEmX = includeZero === true || includeZero === 'x';
  const zeroEmY = includeZero === true || includeZero === 'y';

  const dominioX = useMemo(
    () =>
      mergeDomains(naEscala.map((serie) => domainOf(serie.points.map((p) => p.x), { includeZero: zeroEmX }))),
    [naEscala, zeroEmX],
  );

  const dominioY = useMemo(
    () =>
      mergeDomains(naEscala.map((serie) => domainOf(serie.points.map((p) => p.y), { includeZero: zeroEmY }))),
    [naEscala, zeroEmY],
  );

  const maiorZ = useMemo(
    () =>
      series.reduce(
        (maior, serie) => serie.points.reduce((parcial, ponto) => Math.max(parcial, zValido(ponto) ?? 0), maior),
        0,
      ),
    [series],
  );

  const rotulosY = valueLabelsFor(dominioY, alturaDoDesenho, formatY);
  const rotulosX = valueLabelsFor(dominioX, width, formatX);

  const { axisReveal, margins, plot, rotation } = useCartesianLayout({
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
    const z = zValido(ponto);

    return z === undefined ? `${inicio}: ${posicao}` : `${inicio}: ${posicao} (${formatZ(z)})`;
  }

  const serieEmFoco = emFoco ? series[emFoco.serie] : undefined;
  const pontoEmFoco = emFoco ? serieEmFoco?.points[emFoco.ponto] : undefined;

  function linhasDoBalao() {
    if (!emFoco || !serieEmFoco || !pontoEmFoco) {
      return [];
    }

    const z = zValido(pontoEmFoco);
    const linhas = [
      { color: cores[emFoco.serie], format: formatX, label: xLabel, values: [pontoEmFoco.x] },
      { format: formatY, label: yLabel, values: [pontoEmFoco.y] },
    ];

    return z === undefined ? linhas : [...linhas, { format: formatZ, label: zLabel, values: [z] }];
  }

  return (
    <CartesianFrame
      axisReveal={axisReveal}
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
      tooltip={
        showTooltip
          ? {
              computed: 'none',
              rows: linhasDoBalao(),
              // Com nome no ponto, ele e o titulo e a serie vira subtitulo.
              subtitle: pontoEmFoco?.label ? serieEmFoco?.label : undefined,
              title: pontoEmFoco?.label ?? serieEmFoco?.label,
            }
          : undefined
      }
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
          key={indiceSerie}
        >
          {serie.points.map((ponto, indice) => {
            if (!Number.isFinite(ponto.x) || !Number.isFinite(ponto.y)) {
              return null;
            }

            const x = escalaX(ponto.x);
            const y = escalaY(ponto.y);
            const z = zValido(ponto);

            return (
              <circle
                aria-label={descrever(serie, ponto)}
                className={styles.bubble}
                cx={x}
                cy={y}
                fill={cores[indiceSerie]}
                key={indice}
                onMouseEnter={() => {
                  setGuia({ x, y });
                  setEmFoco({ ponto: indice, serie: indiceSerie });
                }}
                onMouseLeave={() => {
                  setGuia(null);
                  setEmFoco(null);
                }}
                r={z === undefined ? RAIO_SEM_Z : escalaRaio(z)}
              >
                {!showTooltip && <title>{descrever(serie, ponto)}</title>}
              </circle>
            );
          })}
        </g>
      ))}
    </CartesianFrame>
  );
}
