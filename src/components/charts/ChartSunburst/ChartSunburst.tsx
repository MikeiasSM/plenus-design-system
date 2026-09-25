import { useMemo, useState } from 'react';
import { hierarchy, partition } from 'd3-hierarchy';
import {
  RadialFrame,
  VOLTA,
  arcAnchor,
  arcPath,
  chartHeight,
  ringDiameter,
  truncateToWidth,
  useChartMetrics,
  useSeriesToggle,
  type ChartHeight,
  type ChartLegendPosition,
} from '../core';
import { resolveSeriesColors, type SeriesAppearance } from '../palette';
import styles from './ChartSunburst.module.css';

export interface ChartSunburstNode extends SeriesAppearance {
  children?: readonly ChartSunburstNode[];
  label: string;
  value?: number;
}

export interface ChartSunburstProps {
  accent?: string;
  defaultHiddenGroups?: readonly string[];
  emptyMessage?: string;
  formatPercent?: (ratio: number) => string;
  formatValue?: (value: number) => string;
  height?: ChartHeight;
  hiddenGroups?: readonly string[];
  legend?: ChartLegendPosition;
  nodes: readonly ChartSunburstNode[];
  onHiddenGroupsChange?: (hidden: readonly string[]) => void;
  /** Folga entre dois aneis vizinhos. */
  ringGap?: number;
  showLabels?: boolean;
  title: string;
}

/** Arco menor que isso nao comporta rotulo nem conector legivel. */
const ANGULO_MINIMO_DO_ROTULO = 0.18;
const COMPRIMENTO_DO_CONECTOR = 14;
const RECUO_DO_ROTULO = 6;

/**
 * Cada anel clareia sobre o anterior, e o filho nasce da cor do pai. Sem isso a
 * hierarquia sumiria: os aneis externos repetiriam a cor do nivel zero e nada
 * distinguiria um filho do outro.
 */
function tomDoNivel(cor: string, profundidade: number) {
  if (profundidade <= 1) {
    return cor;
  }

  const clareamento = Math.min((profundidade - 1) * 22, 66);

  return `color-mix(in oklab, ${cor} ${100 - clareamento}%, var(--pl-color-surface))`;
}

export function ChartSunburst({
  accent,
  defaultHiddenGroups,
  emptyMessage = 'Sem dados no período',
  formatPercent = (fracao) => `${Math.round(fracao * 100)}%`,
  formatValue = (valor) => String(valor),
  height = 320,
  hiddenGroups,
  legend = 'bottom',
  nodes,
  onHiddenGroupsChange,
  ringGap = 2,
  showLabels = true,
  title,
}: ChartSunburstProps) {
  const { font, height: alturaMedida, ref, width } = useChartMetrics();
  const { fillHeight, value: alturaDoDesenho } = chartHeight(height, alturaMedida);
  const { isHidden, toggle } = useSeriesToggle({
    defaultHiddenSeries: defaultHiddenGroups,
    hiddenSeries: hiddenGroups,
    onHiddenSeriesChange: onHiddenGroupsChange,
  });
  const [emFoco, setEmFoco] = useState<string | null>(null);

  // A cor sai da lista inteira, e nao das visiveis: desligar um grupo nao pode
  // repintar os demais.
  const coresDeNivelZero = useMemo(() => resolveSeriesColors(nodes, { accent }), [accent, nodes]);

  const visiveis = nodes.filter((grupo) => !isHidden(grupo.label));

  // O rotulo projetado precisa de margem lateral, entao o raio nao ocupa a area
  // inteira quando os rotulos estao ligados.
  const diametro = ringDiameter(width, alturaDoDesenho);
  const raio = showLabels ? diametro / 2 - COMPRIMENTO_DO_CONECTOR * 2 : diametro / 2;

  const arcos = useMemo(() => {
    if (raio <= 0) {
      return [];
    }

    const arvore = hierarchy<ChartSunburstNode>({ children: visiveis, label: '' })
      .sum((no) => Math.max(no.value ?? 0, 0))
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const repartir = partition<ChartSunburstNode>().size([VOLTA, raio]);

    return repartir(arvore)
      .descendants()
      .filter((no) => no.depth > 0);
  }, [raio, visiveis]);

  const profundidadeMaxima = arcos.reduce((maior, arco) => Math.max(maior, arco.depth), 0);
  const total = arcos
    .filter((arco) => arco.depth === 1)
    .reduce((soma, arco) => soma + (arco.value ?? 0), 0);

  function caminhoDe(arco: (typeof arcos)[number]) {
    return arco
      .ancestors()
      .map((ancestral) => ancestral.data.label)
      .join('/');
  }

  function corDe(arco: (typeof arcos)[number]) {
    const raizDoRamo = arco.ancestors().find((ancestral) => ancestral.depth === 1)?.data;
    const base =
      raizDoRamo?.color ?? coresDeNivelZero[nodes.findIndex((no) => no.label === raizDoRamo?.label)];

    return tomDoNivel(base ?? 'var(--pl-chart-neutral)', arco.depth);
  }

  return (
    <RadialFrame
      containerRef={ref}
      empty={nodes.length === 0}
      emptyMessage={emptyMessage}
      fillHeight={fillHeight}
      height={alturaDoDesenho}
      legend={nodes.map((grupo, indice) => ({
        color: coresDeNivelZero[indice],
        hidden: isHidden(grupo.label),
        label: grupo.label,
      }))}
      legendPosition={legend}
      onToggleSeries={toggle}
      title={title}
      width={width}
    >
      {arcos.map((arco) => {
        const caminho = caminhoDe(arco);
        const apagado = emFoco !== null && !caminho.startsWith(emFoco) && !emFoco.startsWith(caminho);

        return (
          <path
            className={`${styles.arc} ${apagado ? styles.arcDim : ''}`}
            d={arcPath({
              endAngle: arco.x1,
              innerRadius: arco.y0 + (arco.depth > 1 ? ringGap : 0),
              outerRadius: arco.y1,
              startAngle: arco.x0,
            })}
            fill={corDe(arco)}
            key={caminho}
            onMouseEnter={() => setEmFoco(caminho)}
            onMouseLeave={() => setEmFoco(null)}
          >
            <title>
              {`${arco.data.label}: ${formatValue(arco.value ?? 0)} (${formatPercent(total > 0 ? (arco.value ?? 0) / total : 0)})`}
            </title>
          </path>
        );
      })}

      {showLabels &&
        arcos
          .filter(
            (arco) => arco.depth === profundidadeMaxima && arco.x1 - arco.x0 >= ANGULO_MINIMO_DO_ROTULO,
          )
          .map((arco) => {
            const angulos = { endAngle: arco.x1, startAngle: arco.x0 };
            const [xBorda, yBorda] = arcAnchor(angulos, arco.y1);
            const [xCotovelo, yCotovelo] = arcAnchor(angulos, arco.y1 + COMPRIMENTO_DO_CONECTOR);
            const paraDireita = xCotovelo >= 0;
            const xFim = xCotovelo + (paraDireita ? COMPRIMENTO_DO_CONECTOR : -COMPRIMENTO_DO_CONECTOR);
            const espaco = Math.max(diametro / 2 - Math.abs(xFim) - RECUO_DO_ROTULO, 0);

            return (
              <g className={styles.leader} key={`rotulo-${caminhoDe(arco)}`}>
                <polyline
                  className={styles.connector}
                  points={`${xBorda},${yBorda} ${xCotovelo},${yCotovelo} ${xFim},${yCotovelo}`}
                />
                <text
                  className={styles.label}
                  dominantBaseline="middle"
                  textAnchor={paraDireita ? 'start' : 'end'}
                  x={xFim + (paraDireita ? RECUO_DO_ROTULO : -RECUO_DO_ROTULO)}
                  y={yCotovelo}
                >
                  {truncateToWidth(arco.data.label, font, espaco)}
                </text>
              </g>
            );
          })}
    </RadialFrame>
  );
}
