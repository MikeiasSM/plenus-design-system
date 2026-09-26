import { useMemo } from 'react';
import {
  ChartFrame,
  VOLTA,
  arcPath,
  chartHeight,
  fitCenterText,
  ringDiameter,
  useChartMetrics,
  useSeriesToggle,
  useTweenedNumbers,
  type ChartHeight,
  type ChartLegendAlign,
  type ChartLegendPosition,
} from '../core';
import { resolveSeriesColors, type SeriesAppearance } from '../palette';
import { formatarNumero } from '../../../utils/formatters';
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
  legendAlign?: ChartLegendAlign;
  onHiddenTracksChange?: (hidden: readonly string[]) => void;
  showCenter?: boolean;
  startAngle?: number;
  /** Raio das pontas do arco. Sem valor, o token de raio pequeno. */
  trackRadius?: number;
  /** Espessura de cada anel, em pixels. */
  thickness?: number;
  title: string;
  tracks: readonly ChartRadialTrack[];
}

/** Folga entre dois aneis vizinhos. */
const ESPACO_ENTRE_ANEIS = 6;

/** Raio minimo do vazio central, para o texto ainda caber. */
const PISO_DO_RAIO = 8;

function emRadianos(graus: number) {
  return (graus * Math.PI) / 180;
}

export function ChartRadial({
  accent,
  centerLabel,
  defaultHiddenTracks,
  emptyMessage = 'Sem dados no período',
  endAngle = 360,
  formatValue = formatarNumero,
  height = 260,
  hiddenTracks,
  legend = 'bottom',
  legendAlign,
  onHiddenTracksChange,
  showCenter = true,
  startAngle = 0,
  thickness = 16,
  trackRadius,
  title,
  tracks,
}: ChartRadialProps) {
  const { font, height: alturaMedida, radius: raioDoCanto, ref, width } = useChartMetrics();
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
  // Com muitos aneis a conta passava do centro e devolvia raio negativo, que o
  // SVG nao desenha. A espessura cede antes disso.
  const espessuraCabivel = Math.min(
    thickness,
    Math.max((raioExterno - PISO_DO_RAIO) / Math.max(tracks.length, 1) - ESPACO_ENTRE_ANEIS, 1),
  );
  const raioDe = (indice: number) => raioExterno - indice * (espessuraCabivel + ESPACO_ENTRE_ANEIS);
  const raioInterno = Math.max(raioDe(Math.max(tracks.length - 1, 0)) - espessuraCabivel, PISO_DO_RAIO);

  const canto = trackRadius ?? raioDoCanto;
  const destaque = tracks.find((anel) => !isHidden(anel.label)) ?? tracks[0];
  const centro = destaque
    ? fitCenterText(formatValue(destaque.value), centerLabel ?? destaque.label, font, raioInterno * 2)
    : undefined;

  return (
    <ChartFrame
      centerOrigin
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
      legendAlign={legendAlign}
      legendPosition={tracks.length > 1 ? legend : 'none'}
      onToggleSeries={toggle}
      swatch="dot"
      title={title}
      width={width}
    >
      {tracks.map((anel, indice) => {
        const externo = raioDe(indice);
        const interno = externo - espessuraCabivel;
        const fracao = animadas[indice] ?? 0;
        const preenchido = comeco + volta * fracao;

        return (
          <g key={anel.label}>
            <path
                aria-label={`${anel.label}: ${formatValue(anel.value)}`}
              className={styles.track}
              d={arcPath({
                cornerRadius: canto,
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
                  cornerRadius: canto,
                  endAngle: preenchido,
                  innerRadius: interno,
                  outerRadius: externo,
                  startAngle: comeco,
                })}
                fill={cores[indice]}
              />
            )}
          </g>
        );
      })}

      {showCenter && centro && (
        <g className={styles.center}>
          <text
            className={styles.centerValue}
            dy={centro.size * 0.1}
            style={{ fontFamily: centro.family, fontSize: centro.size }}
            textAnchor="middle"
          >
            {centro.value}
          </text>
          <text className={styles.centerLabel} dy={centro.lineHeight * 0.62} textAnchor="middle">
            {centro.label}
          </text>
        </g>
      )}
    </ChartFrame>
  );
}
