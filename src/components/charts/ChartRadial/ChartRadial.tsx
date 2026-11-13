import { useMemo, useRef, useState } from 'react';
import {
  ChartTable,
  ChartFrame,
  VOLTA,
  arcPath,
  chartHeight,
  centerTextRadius,
  fitCenterText,
  ringDiameter,
  useChartMetrics,
  useRingFit,
  useMarkNavigation,
  useSeriesToggle,
  useTweenedNumbers,
  type ChartAnchorPoint,
  type ChartHeight,
  type ChartHoverDetails,
  type ChartLegendAlign,
  type ChartLegendPosition,
  type ChartRootProps,
} from '../core';
import { resolveSeriesColors, type ChartPalette, type SeriesAppearance } from '../palette';
import { formatNumber, formatPercent } from '../../../utils/formatters';
import styles from './ChartRadial.module.css';

export interface ChartRadialTrack extends SeriesAppearance {
  label: string;
  /** Meta da medida. Sem ela, a meta e o maior valor entre os aneis. */
  max?: number;
  value: number;
}

export interface ChartRadialProps extends Omit<ChartRootProps, 'hidden'> {
  accent?: string;
  /** Texto sob o valor do centro. Sem ele, o rotulo do primeiro anel. O anel em foco troca esse texto pelo proprio rotulo. */
  centerLabel?: string;
  /** Aneis ocultos de inicio, enquanto o produto nao controla `hidden`. */
  defaultHidden?: readonly string[];
  /** @deprecated Use `defaultHidden`. Aceito ate a 0.7.0; com os dois, vale o novo. */
  defaultHiddenTracks?: readonly string[];
  emptyMessage?: string;
  /** Angulo final da volta, em graus a partir do topo. Meia-lua usa 180. */
  endAngle?: number;
  /** Formato dos valores no balao. Sem ele, vale o `formatValue`. */
  formatTooltipValue?: (value: number) => string;
  formatValue?: (value: number) => string;
  height?: ChartHeight;
  /** Rotulos dos aneis desligados pela legenda (controlado). Substitui o `hidden` nativo da figure. */
  hidden?: readonly string[];
  /** @deprecated Use `hidden`. Aceito ate a 0.7.0; com os dois, vale o novo. */
  hiddenTracks?: readonly string[];
  legend?: ChartLegendPosition;
  legendAlign?: ChartLegendAlign;
  /** @deprecated Use `onHiddenChange`. Aceito ate a 0.7.0. */
  onHiddenTracksChange?: (hidden: readonly string[]) => void;
  /** Rotulos ocultos, a cada alternancia da legenda. */
  onHiddenChange?: (hidden: readonly string[]) => void;
  /**
   * Anel sob o ponteiro, o foco ou a entrada da legenda, ou `null` ao sair. Da legenda, que nao tem ponteiro, vem
   * o segundo argumento: a cor desenhada e o ponto onde ancorar o `ChartTooltip`.
   */
  onHover?: (track: ChartRadialTrack | null, details?: ChartHoverDetails) => void;
  /** Clique no anel. Com ele, os aneis viram botoes percorridos pelas setas. */
  onMarkClick?: (track: ChartRadialTrack) => void;
  /** @deprecated Use `onMarkClick`. Aceito ate a 0.7.0. */
  onTrackClick?: (track: ChartRadialTrack) => void;
  /** Cores das series sem cor propria: lista em rotacao ou `{ base }`, que gera os tons. Vence o `accent`. */
  palette?: ChartPalette;
  /** Valor no centro. Ele reserva o proprio espaco, ate metade do raio: com muitos aneis, quem cede e a espessura deles. */
  showCenter?: boolean;
  /** Botao "Ver como tabela". Sem a prop, vale o do `ChartsProvider`, ligado por padrao. */
  showTableToggle?: boolean;
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
  defaultHidden,
  defaultHiddenTracks,
  emptyMessage = 'Sem dados no período',
  endAngle = 360,
  formatTooltipValue,
  formatValue = formatNumber,
  height = 260,
  hidden,
  hiddenTracks,
  legend = 'bottom',
  legendAlign,
  onHiddenChange,
  onHiddenTracksChange,
  onHover,
  onMarkClick,
  onTrackClick,
  palette,
  showCenter = true,
  showTableToggle,
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
    defaultHidden: defaultHidden ?? defaultHiddenTracks,
    hidden: hidden ?? hiddenTracks,
    onHiddenChange: (ocultos) => {
      onHiddenChange?.(ocultos);
      onHiddenTracksChange?.(ocultos);
    },
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
  // O ponteiro que salta do anel para a legenda entra nela antes de sair do anel: a saida so solta o que ainda e dele.
  const realcado = useRef<number | null>(null);

  function focarAnel(indice: number | null, details?: ChartHoverDetails) {
    const anel = indice === null ? null : tracks[indice];
    realcado.current = indice;
    setEmFoco(indice);

    if (anel && details) {
      onHover?.(anel, details);
    } else {
      onHover?.(anel);
    }
  }

  const aoClicarNoAnel =
    onMarkClick || onTrackClick
      ? (anel: ChartRadialTrack) => {
          onMarkClick?.(anel);
          onTrackClick?.(anel);
        }
      : undefined;
  const marcas = useMarkNavigation({
    onActivate: aoClicarNoAnel && (({ column }) => aoClicarNoAnel(tracks[column])),
    onFocusMark: (posicao) => focarAnel(posicao?.column ?? null),
    present: tracks.flatMap((anel, column) => (isHidden(anel.label) || !valido(anel) ? [] : [{ column, row: 0 }])),
  });

  // Anel desligado nao tem arco: a legenda nao o realca.
  function realcarAnel(label: string | null, anchor?: ChartAnchorPoint) {
    const indice = label === null ? -1 : tracks.findIndex((anel) => anel.label === label);
    const alvo = indice >= 0 && !isHidden(label!) && valido(tracks[indice]) ? indice : null;

    marcas.anchorTooltip(alvo === null ? undefined : anchor);

    if (alvo !== null && anchor) {
      focarAnel(alvo, { anchor, color: cores[alvo] });
    } else if (alvo !== null || realcado.current !== null) {
      focarAnel(alvo);
    }
  }

  function alternarAnel(label: string) {
    if (emFoco !== null && tracks[emFoco]?.label === label && !isHidden(label)) {
      realcarAnel(null);
    }

    toggle(label);
  }

  function linhasDoBalao() {
    const anel = emFoco === null ? undefined : tracks[emFoco];

    if (!anel || !valido(anel) || emFoco === null) {
      return [];
    }

    const meta = anel.max ?? maiorValor;
    const linhas = [{ color: cores[emFoco], label: 'Valor', values: [anel.value] }, { label: 'Meta', values: [meta] }];

    return meta > 0
      ? [...linhas, { format: (fracao: number) => formatPercent(fracao), label: 'Atingido', values: [anel.value / meta] }]
      : linhas;
  }

  const comeco = emRadianos(startAngle);
  const volta = Math.min(emRadianos(endAngle) - comeco, VOLTA);

  const raioExterno = ringDiameter(width, alturaDoDesenho) / 2;
  const primeiroVisivel = tracks.find((anel) => !isHidden(anel.label));
  const anelEmFoco = emFoco === null ? undefined : tracks[emFoco];
  const emFocoLegivel = anelEmFoco && !isHidden(anelEmFoco.label) && valido(anelEmFoco) ? anelEmFoco : undefined;
  const destaque = emFocoLegivel ?? primeiroVisivel;
  const textoDoCentro = emFocoLegivel ? emFocoLegivel.label : (centerLabel ?? destaque?.label);
  const valorDoCentroPedido = showCenter && primeiroVisivel ? formatValue(primeiroVisivel.value) : undefined;
  const entradasDaLegenda = tracks.map((anel, indice) => ({
    active: emFocoLegivel === anel,
    color: cores[indice],
    hidden: isHidden(anel.label),
    label: anel.label,
    value: valido(anel) ? formatValue(anel.value) : undefined,
  }));
  const posicaoDaLegenda = tracks.length > 1 ? legend : 'none';
  const removed = useRingFit({
    center: valorDoCentroPedido === undefined ? undefined : { innerShare: 0.5, value: valorDoCentroPedido },
    fillHeight,
    font,
    height: alturaDoDesenho,
    legend: entradasDaLegenda,
    legendPosition: posicaoDaLegenda,
    width,
  });
  const valorDoCentro = removed.has('centerText') ? undefined : valorDoCentroPedido;
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
    destaque && textoDoCentro !== undefined && valorDoCentro !== undefined
      ? fitCenterText(formatValue(destaque.value), textoDoCentro, font, raioInterno * 2)
      : undefined;

  return (
    <ChartFrame
      canvasRole={marcas.interactive ? 'group' : 'img'}
      centerOrigin
      containerRef={ref}
      empty={tracks.length === 0}
      emptyMessage={emptyMessage}
      fillHeight={fillHeight}
      height={alturaDoDesenho}
      legend={entradasDaLegenda}
      legendAlign={legendAlign}
      legendPosition={removed.has('legend') ? 'none' : posicaoDaLegenda}
      onHighlightSeries={realcarAnel}
      onToggleSeries={alternarAnel}
      root={root}
      showTableToggle={showTableToggle}
      table={
        <ChartTable
          columns={['Valor', 'Meta', 'Atingido']}
          rows={tracks.map((anel, indice) => {
            const meta = anel.max ?? maiorValor;

            return {
              cells: valido(anel) ? [formatValue(anel.value), formatValue(meta), meta > 0 ? formatPercent(anel.value / meta) : ''] : ['', '', ''],
              header: anel.label,
              key: `${indice}:${anel.label}`,
            };
          })}
          title={title}
        />
      }
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
      tooltipAnchor={marcas.tooltipAnchor}
      width={width}
    >
      <g {...marcas.groupProps}>
        {tracks.map((anel, indice) => {
          const externo = raioDe(indice);
          const interno = externo - espessuraCabivel;
          const fracao = animadas[indice] ?? 0;
          const preenchido = comeco + volta * fracao;
          const descricao = valido(anel) ? `${anel.label}: ${formatValue(anel.value)}` : anel.label;

          return (
            <g
              aria-label={descricao}
              key={indice}
              onMouseEnter={() => focarAnel(indice)}
              onMouseLeave={() => realcado.current === indice && focarAnel(null)}
              {...marcas.markProps({ column: indice, row: 0 })}
            >
              <path
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
                  className={emFoco === null || emFoco === indice ? styles.fill : `${styles.fill} ${styles.fillDim}`}
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
      </g>

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
