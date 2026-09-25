import { useMemo } from 'react';
import {
  RadialFrame,
  VOLTA,
  arcPath,
  chartHeight,
  ringDiameter,
  truncateToWidth,
  useChartMetrics,
  useSeriesToggle,
  useTweenedNumbers,
  type ChartHeight,
  type ChartLegendPosition,
} from '../core';
import { resolveSeriesColors, type SeriesAppearance } from '../palette';
import styles from './ChartRadial.module.css';

export interface ChartRadialTrack extends SeriesAppearance {
  label: string;
  /** Meta da medida. Sem ela, a meta e o maior valor entre os aneis. */
  max?: number;
  value: number;
}

export interface ChartRadialProps {
  accent?: string;
  /** Texto sob o valor do centro. Sem ele, o rotulo do primeiro anel. */
  centerLabel?: string;
  defaultHiddenTracks?: readonly string[];
  emptyMessage?: string;
  /** Angulo final da volta, em graus a partir do topo. Meia-lua usa 180. */
  endAngle?: number;
  formatValue?: (value: number) => string;
  height?: ChartHeight;
  hiddenTracks?: readonly string[];
  legend?: ChartLegendPosition;
  onHiddenTracksChange?: (hidden: readonly string[]) => void;
  showCenter?: boolean;
  startAngle?: number;
  /** Espessura de cada anel, em pixels. */
  thickness?: number;
  title: string;
  tracks: readonly ChartRadialTrack[];
}

/** Folga entre dois aneis vizinhos. */
const ESPACO_ENTRE_ANEIS = 6;
const CANTO = 4;

const ESCALA_DO_CENTRO = [
  { family: 'var(--pl-font-heading)', line: 44, size: 36 },
  { family: 'var(--pl-font-heading)', line: 32, size: 24 },
  { family: 'var(--pl-font-body)', line: 24, size: 16 },
];

function emRadianos(graus: number) {
  return (graus * Math.PI) / 180;
}

export function ChartRadial({
  accent,
  centerLabel,
  defaultHiddenTracks,
  emptyMessage = 'Sem dados no período',
  endAngle = 360,
  formatValue = (valor) => String(valor),
  height = 260,
  hiddenTracks,
  legend = 'bottom',
  onHiddenTracksChange,
  showCenter = true,
  startAngle = 0,
  thickness = 16,
  title,
  tracks,
}: ChartRadialProps) {
  const { font, height: alturaMedida, ref, width } = useChartMetrics();
  const { fillHeight, value: alturaDoDesenho } = chartHeight(height, alturaMedida);
  const { isHidden, toggle } = useSeriesToggle({
    defaultHiddenSeries: defaultHiddenTracks,
    hiddenSeries: hiddenTracks,
    onHiddenSeriesChange: onHiddenTracksChange,
  });

  // A cor sai da lista inteira, e nao das visiveis: desligar um anel nao pode
  // repintar os demais.
  const cores = useMemo(() => resolveSeriesColors(tracks, { accent }), [accent, tracks]);

  const maiorValor = tracks.reduce((maior, anel) => Math.max(maior, anel.value), 0);
  const fracoes = tracks.map((anel) => {
    const meta = anel.max ?? maiorValor;

    return isHidden(anel.label) || meta <= 0 ? 0 : Math.min(Math.max(anel.value, 0) / meta, 1);
  });

  // As fracoes caminham ate o alvo, entao o arco cresce ao aparecer e recolhe
  // quando o anel e desligado.
  const animadas = useTweenedNumbers(fracoes, { from: fracoes.map(() => 0) });

  const comeco = emRadianos(startAngle);
  const volta = Math.min(emRadianos(endAngle) - comeco, VOLTA);

  const raioExterno = ringDiameter(width, alturaDoDesenho) / 2;
  const raioDe = (indice: number) => raioExterno - indice * (thickness + ESPACO_ENTRE_ANEIS);
  const raioInterno = raioDe(Math.max(tracks.length - 1, 0)) - thickness;

  const escala = ESCALA_DO_CENTRO.find(({ size }) => size * 3.4 <= raioInterno * 2) ?? ESCALA_DO_CENTRO[2];
  const destaque = tracks[0];

  return (
    <RadialFrame
      containerRef={ref}
      empty={tracks.length === 0}
      emptyMessage={emptyMessage}
      fillHeight={fillHeight}
      height={alturaDoDesenho}
      legend={tracks.map((anel, indice) => ({
        color: cores[indice],
        hidden: isHidden(anel.label),
        label: anel.label,
        value: formatValue(anel.value),
      }))}
      legendPosition={tracks.length > 1 ? legend : 'none'}
      onToggleSeries={toggle}
      title={title}
      width={width}
    >
      {tracks.map((anel, indice) => {
        const externo = raioDe(indice);
        const interno = externo - thickness;
        const fracao = animadas[indice] ?? 0;
        const preenchido = comeco + volta * fracao;

        return (
          <g key={anel.label}>
            <path
              className={styles.track}
              d={arcPath({
                cornerRadius: CANTO,
                endAngle: comeco + volta,
                innerRadius: interno,
                outerRadius: externo,
                startAngle: comeco,
              })}
            />
            {fracao > 0 && (
              <path
                className={styles.fill}
                d={arcPath({
                  cornerRadius: CANTO,
                  endAngle: preenchido,
                  innerRadius: interno,
                  outerRadius: externo,
                  startAngle: comeco,
                })}
                fill={cores[indice]}
              >
                <title>{`${anel.label}: ${formatValue(anel.value)}`}</title>
              </path>
            )}
          </g>
        );
      })}

      {showCenter && destaque && (
        <g className={styles.center}>
          <text
            className={styles.centerValue}
            dy={escala.size * 0.1}
            style={{ fontFamily: escala.family, fontSize: escala.size }}
            textAnchor="middle"
          >
            {formatValue(destaque.value)}
          </text>
          <text className={styles.centerLabel} dy={escala.line * 0.62} textAnchor="middle">
            {truncateToWidth(centerLabel ?? destaque.label, font, raioInterno * 1.7)}
          </text>
        </g>
      )}
    </RadialFrame>
  );
}
