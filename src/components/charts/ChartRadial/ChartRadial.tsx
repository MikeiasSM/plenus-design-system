import { useMemo, useState } from 'react';
import {
  ChartFrame,
  VOLTA,
  arcPath,
  chartHeight,
  centerTextRadius,
  fitCenterText,
  ringDiameter,
  useChartMetrics,
  useSeriesToggle,
  useTweenedNumbers,
  type ChartHeight,
  type ChartLegendAlign,
  type ChartLegendPosition,
  type ChartRootProps,
} from '../core';
import { resolveSeriesColors, type ChartPalette, type SeriesAppearance } from '../palette';
import { formatarNumero, formatarPercentual } from '../../../utils/formatters';
import styles from './ChartRadial.module.css';

export interface ChartRadialTrack extends SeriesAppearance {
  label: string;
  /** Meta da medida. Sem ela, a meta e o maior valor entre os aneis. */
  max?: number;
  value: number;
}

export interface ChartRadialProps extends ChartRootProps {
  accent?: string;
  /** Texto sob o valor do centro. Sem ele, o rotulo do primeiro anel. */
  centerLabel?: string;
  defaultHiddenTracks?: readonly string[];
  emptyMessage?: string;
  /** Angulo final da volta, em graus a partir do topo. Meia-lua usa 180. */
  endAngle?: number;
  /** Formato dos valores no balao. Sem ele, vale o `formatValue`. */
  formatTooltipValue?: (value: number) => string;
  formatValue?: (value: number) => string;
  height?: ChartHeight;
  hiddenTracks?: readonly string[];
  legend?: ChartLegendPosition;
  legendAlign?: ChartLegendAlign;
  onHiddenTracksChange?: (hidden: readonly string[]) => void;
  /** Cores das series sem cor propria: lista em rotacao ou `{ base }`, que gera os tons. Vence o `accent`. */
  palette?: ChartPalette;
  /** Valor no centro. Ele reserva o proprio espaco, ate metade do raio: com muitos aneis, quem cede e a espessura deles. */
  showCenter?: boolean;
  /** Balao com o detalhe do que esta sob o ponteiro. Desligue para nao mostrar nada alem do `<title>` nativo. */
  showTooltip?: boolean;
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

/** Raio minimo do vazio central, com ou sem texto nele. */
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
  formatTooltipValue,
  formatValue = formatarNumero,
  height = 260,
  hiddenTracks,
  legend = 'bottom',
  legendAlign,
  onHiddenTracksChange,
  palette,
  showCenter = true,
  showTooltip = true,
  startAngle = 0,
  thickness = 16,
  trackRadius,
  title,
  tracks,
  ...root
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
  const cores = useMemo(() => resolveSeriesColors(tracks, { accent, palette }), [accent, palette, tracks]);

  // Valor invalido tem o destino do ausente: nao entra no maximo nem preenche o anel.
  const valido = (anel: ChartRadialTrack) => Number.isFinite(anel.value);
  const maiorValor = tracks.reduce((maior, anel) => (valido(anel) ? Math.max(maior, anel.value) : maior), 0);
  const fracoes = tracks.map((anel) => {
    const meta = anel.max ?? maiorValor;

    return isHidden(anel.label) || !valido(anel) || !(meta > 0) ? 0 : Math.min(Math.max(anel.value, 0) / meta, 1);
  });

  // As fracoes caminham ate o alvo, entao o arco cresce ao aparecer e recolhe
  // quando o anel e desligado.
  const animadas = useTweenedNumbers(fracoes, { from: fracoes.map(() => 0) });

  const [emFoco, setEmFoco] = useState<number | null>(null);

  function linhasDoBalao() {
    const anel = emFoco === null ? undefined : tracks[emFoco];

    if (!anel || !valido(anel) || emFoco === null) {
      return [];
    }

    const meta = anel.max ?? maiorValor;
    const linhas = [{ color: cores[emFoco], label: 'Valor', values: [anel.value] }, { label: 'Meta', values: [meta] }];

    return meta > 0
      ? [...linhas, { format: (fracao: number) => formatarPercentual(fracao), label: 'Atingido', values: [anel.value / meta] }]
      : linhas;
  }

  const comeco = emRadianos(startAngle);
  const volta = Math.min(emRadianos(endAngle) - comeco, VOLTA);

  const raioExterno = ringDiameter(width, alturaDoDesenho) / 2;
  const destaque = tracks.find((anel) => !isHidden(anel.label));
  const valorDoCentro = showCenter && destaque ? formatValue(destaque.value) : undefined;
  // O centro reserva o que o valor pede no menor degrau da escala, ate metade do raio; quem cede e a espessura dos aneis.
  const piso =
    valorDoCentro === undefined
      ? PISO_DO_RAIO
      : Math.max(PISO_DO_RAIO, Math.min(centerTextRadius(valorDoCentro, font), raioExterno / 2));
  // Com muitos aneis, espessura e folga cedem na mesma proporcao ate caber; so a espessura cedia, e os ultimos
  // aneis passavam do centro.
  const cabe = Math.min(1, Math.max(raioExterno - piso, 0) / (Math.max(tracks.length, 1) * (thickness + ESPACO_ENTRE_ANEIS)));
  const espessuraCabivel = Math.max(thickness * cabe, 1);
  const folga = ESPACO_ENTRE_ANEIS * cabe;
  const raioDe = (indice: number) => raioExterno - indice * (espessuraCabivel + folga);
  const raioInterno = Math.max(raioDe(Math.max(tracks.length - 1, 0)) - espessuraCabivel, piso);

  const canto = trackRadius ?? raioDoCanto;
  const centro =
    destaque && valorDoCentro !== undefined
      ? fitCenterText(valorDoCentro, centerLabel ?? destaque.label, font, raioInterno * 2)
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
        value: valido(anel) ? formatValue(anel.value) : undefined,
      }))}
      legendAlign={legendAlign}
      legendPosition={tracks.length > 1 ? legend : 'none'}
      onToggleSeries={toggle}
      root={root}
      swatch="dot"
      title={title}
      tooltip={
        showTooltip
          ? {
              columns: [{ format: formatTooltipValue ?? formatValue }],
              computed: 'none',
              rows: linhasDoBalao(),
              title: emFoco === null ? undefined : tracks[emFoco]?.label,
            }
          : undefined
      }
      width={width}
    >
      {tracks.map((anel, indice) => {
        const externo = raioDe(indice);
        const interno = externo - espessuraCabivel;
        const fracao = animadas[indice] ?? 0;
        const preenchido = comeco + volta * fracao;
        const descricao = valido(anel) ? `${anel.label}: ${formatValue(anel.value)}` : anel.label;

        return (
          <g key={indice} onMouseEnter={() => setEmFoco(indice)} onMouseLeave={() => setEmFoco(null)}>
            <path
              aria-label={descricao}
              className={styles.track}
              d={arcPath({
                cornerRadius: canto,
                endAngle: comeco + volta,
                innerRadius: interno,
                outerRadius: externo,
                startAngle: comeco,
              })}
            >
              {!showTooltip && <title>{descricao}</title>}
            </path>
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

      {centro && (
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
