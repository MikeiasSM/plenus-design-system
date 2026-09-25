import { useMemo, useState } from 'react';
import { hierarchy, partition, type HierarchyRectangularNode } from 'd3-hierarchy';
import {
  CHART_LABEL_BAND,
  CHART_LABEL_OFFSET,
  ChartFrame,
  VOLTA,
  arcAnchor,
  arcPath,
  chartHeight,
  ringDiameter,
  truncateToWidth,
  useChartMetrics,
  useSeriesToggle,
  widestLabel,
  type ChartHeight,
  type ChartLegendAlign,
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
  legendAlign?: ChartLegendAlign;
  nodes: readonly ChartSunburstNode[];
  onHiddenGroupsChange?: (hidden: readonly string[]) => void;
  /** Folga entre dois aneis vizinhos. */
  ringGap?: number;
  /** Raio das pontas de cada arco. Sem valor, o token de raio pequeno. */
  sliceRadius?: number;
  showLabels?: boolean;
  title: string;
}

type Arco = HierarchyRectangularNode<ChartSunburstNode>;

/** Arco menor que isso nao comporta rotulo nem conector legivel. */
const ANGULO_MINIMO_DO_ROTULO = 0.18;
const COMPRIMENTO_DO_CONECTOR = 14;
/**
 * Rotulos de cada nivel da arvore declarada. Medir a banda antes de montar o
 * anel exige saber os rotulos antes, e o nivel mais profundo declarado e o
 * mesmo que o anel externo tera.
 */
function rotulosPorNivel(
  nodes: readonly ChartSunburstNode[],
  nivel = 1,
  por = new Map<number, string[]>(),
) {
  nodes.forEach((no) => {
    por.set(nivel, [...(por.get(nivel) ?? []), no.label]);

    if (no.children?.length) {
      rotulosPorNivel(no.children, nivel + 1, por);
    }
  });

  return por;
}

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
  legendAlign,
  nodes,
  onHiddenGroupsChange,
  ringGap = 2,
  showLabels = true,
  sliceRadius,
  title,
}: ChartSunburstProps) {
  const { font, height: alturaMedida, radius: raioDoCanto, ref, width } = useChartMetrics();
  const { fillHeight, value: alturaDoDesenho } = chartHeight(height, alturaMedida);
  const { isHidden, toggle } = useSeriesToggle({
    defaultHiddenSeries: defaultHiddenGroups,
    hiddenSeries: hiddenGroups,
    onHiddenSeriesChange: onHiddenGroupsChange,
  });
  const [emFoco, setEmFoco] = useState<Arco | null>(null);

  // A cor sai da lista inteira, e nao das visiveis: desligar um grupo nao pode
  // repintar os demais.
  const coresDeNivelZero = useMemo(() => resolveSeriesColors(nodes, { accent }), [accent, nodes]);

  const visiveis = useMemo(
    () => nodes.filter((grupo) => !isHidden(grupo.label)),
    [isHidden, nodes],
  );

  // A banda dos rotulos e reservada antes do anel, medida pelo rotulo mais
  // largo do anel externo. Sem reservar, o rotulo era desenhado no que sobrasse
  // — quase nada nas laterais — e acabava cortado ate sumir.
  const rotulosExternos = useMemo(() => {
    const niveis = rotulosPorNivel(visiveis);
    const externo = Math.max(0, ...niveis.keys());

    return niveis.get(externo) ?? [];
  }, [visiveis]);

  const larguraDoRotulo = showLabels
    ? Math.min(widestLabel(rotulosExternos, font), width * CHART_LABEL_BAND)
    : 0;
  const banda = showLabels ? COMPRIMENTO_DO_CONECTOR * 2 + CHART_LABEL_OFFSET + larguraDoRotulo : 0;

  const diametro = ringDiameter(Math.max(width - banda * 2, 0), alturaDoDesenho);
  const raio = diametro / 2;

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

  function caminhoDe(arco: Arco) {
    return arco
      .ancestors()
      .map((ancestral) => ancestral.data.label)
      .join('/');
  }

  // O arco guardado deixa de existir quando a arvore e remontada, num
  // redimensionamento por exemplo. Sem conferir, o foco perdido apagaria tudo.
  const foco = emFoco && arcos.includes(emFoco) ? emFoco : null;

  /**
   * Acende o arco sob o ponteiro e os que o originaram. O caminho ate a raiz e
   * o que explica de onde aquela fatia veio; os filhos dela nao explicam nada
   * sobre ela, entao ficam apagados junto com o resto.
   */
  function aceso(arco: Arco) {
    return foco === null || foco.ancestors().includes(arco);
  }

  function corDe(arco: Arco) {
    const raizDoRamo = arco.ancestors().find((ancestral) => ancestral.depth === 1)?.data;
    const base =
      raizDoRamo?.color ?? coresDeNivelZero[nodes.findIndex((no) => no.label === raizDoRamo?.label)];

    return tomDoNivel(base ?? 'var(--pl-chart-neutral)', arco.depth);
  }

  return (
    <ChartFrame
      centerOrigin
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
      legendAlign={legendAlign}
      legendPosition={legend}
      onToggleSeries={toggle}
      swatch="dot"
      title={title}
      width={width}
    >
      {arcos.map((arco) => (
        <path
          aria-label={`${arco.data.label}: ${formatValue(arco.value ?? 0)} (${formatPercent(total > 0 ? (arco.value ?? 0) / total : 0)})`}
          className={`${styles.arc} ${aceso(arco) ? '' : styles.arcDim}`}
          d={arcPath({
            cornerRadius: sliceRadius ?? raioDoCanto,
            endAngle: arco.x1,
            innerRadius: arco.y0 + (arco.depth > 1 ? ringGap : 0),
            outerRadius: arco.y1,
            startAngle: arco.x0,
          })}
          fill={corDe(arco)}
          key={caminhoDe(arco)}
          onMouseEnter={() => setEmFoco(arco)}
          onMouseLeave={() => setEmFoco(null)}
        />
      ))}

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
                  x={xFim + (paraDireita ? CHART_LABEL_OFFSET : -CHART_LABEL_OFFSET)}
                  y={yCotovelo}
                >
                  {truncateToWidth(arco.data.label, font, larguraDoRotulo)}
                </text>
              </g>
            );
          })}
    </ChartFrame>
  );
}
