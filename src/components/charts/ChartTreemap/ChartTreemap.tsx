import { useMemo } from 'react';
import { hierarchy, treemap } from 'd3-hierarchy';
import {
  CHART_LABEL_OFFSET,
  ChartFrame,
  chartHeight,
  truncateToWidth,
  useChartMetrics,
  useSeriesToggle,
  type ChartHeight,
  type ChartLegendAlign,
  type ChartLegendPosition,
} from '../core';
import { INTENT_TOKENS, resolveSeriesColors, type SeriesAppearance, type SeriesIntent } from '../palette';
import styles from './ChartTreemap.module.css';

export interface ChartTreemapNode extends SeriesAppearance {
  children?: readonly ChartTreemapNode[];
  label: string;
  value?: number;
}

export interface ChartTreemapProps {
  accent?: string;
  defaultHiddenGroups?: readonly string[];
  emptyMessage?: string;
  formatValue?: (value: number) => string;
  /** Folga entre dois retangulos vizinhos. */
  gap?: number;
  height?: ChartHeight;
  hiddenGroups?: readonly string[];
  /**
   * Nome de cada intencao na legenda. Informado, a legenda deixa de listar os
   * grupos e passa a nomear as cores: e o caso do mapa colorido por status,
   * onde o que a legenda explica e o significado da cor, nao a categoria.
   */
  intentLabels?: Partial<Record<SeriesIntent, string>>;
  legend?: ChartLegendPosition;
  legendAlign?: ChartLegendAlign;
  nodes: readonly ChartTreemapNode[];
  onHiddenGroupsChange?: (hidden: readonly string[]) => void;
  showDataLabels?: boolean;
  title: string;
}


export function ChartTreemap({
  accent,
  defaultHiddenGroups,
  emptyMessage = 'Sem dados no período',
  formatValue = (valor) => String(valor),
  gap = 5,
  height = 280,
  hiddenGroups,
  intentLabels,
  legend = 'bottom',
  legendAlign,
  nodes,
  onHiddenGroupsChange,
  showDataLabels = true,
  title,
}: ChartTreemapProps) {
  const { font, height: alturaMedida, ref, width } = useChartMetrics();
  const { fillHeight, value: alturaDoDesenho } = chartHeight(height, alturaMedida);
  const { isHidden, toggle } = useSeriesToggle({
    defaultHiddenSeries: defaultHiddenGroups,
    hiddenSeries: hiddenGroups,
    onHiddenSeriesChange: onHiddenGroupsChange,
  });

  // A cor sai da lista inteira, e nao das visiveis: desligar um grupo nao pode
  // repintar os demais.
  const coresDeGrupo = useMemo(() => resolveSeriesColors(nodes, { accent }), [accent, nodes]);

  const visiveis = nodes.filter((grupo) => !isHidden(grupo.label));

  const retangulos = useMemo(() => {
    if (width === 0 || alturaDoDesenho === 0) {
      return [];
    }

    const arvore = hierarchy<ChartTreemapNode>({ children: visiveis, label: '' })
      .sum((no) => Math.max(no.value ?? 0, 0))
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const posicionar = treemap<ChartTreemapNode>()
      .size([width, alturaDoDesenho])
      .paddingInner(gap)
      .round(true);

    return posicionar(arvore).leaves();
  }, [alturaDoDesenho, gap, visiveis, width]);

  /** A folha herda a cor do grupo, e a intencao propria vence a herdada. */
  function corDa(folha: (typeof retangulos)[number]) {
    const proprio = folha.data;

    if (proprio.color) {
      return proprio.color;
    }

    if (proprio.intent) {
      return INTENT_TOKENS[proprio.intent];
    }

    const grupo = folha.ancestors().find((ancestral) => ancestral.depth === 1)?.data;

    return coresDeGrupo[nodes.findIndex((no) => no.label === grupo?.label)] ?? INTENT_TOKENS.neutral;
  }

  const entradasDaLegenda = intentLabels
    ? (Object.entries(intentLabels) as [SeriesIntent, string][]).map(([intencao, rotulo]) => ({
        color: INTENT_TOKENS[intencao],
        label: rotulo,
      }))
    : nodes.map((grupo, indice) => ({
        color: coresDeGrupo[indice],
        hidden: isHidden(grupo.label),
        label: grupo.label,
      }));

  return (
    <ChartFrame
      containerRef={ref}
      empty={nodes.length === 0}
      emptyMessage={emptyMessage}
      fillHeight={fillHeight}
      height={alturaDoDesenho}
      legend={entradasDaLegenda}
      legendAlign={legendAlign}
      legendPosition={legend}
      onToggleSeries={intentLabels ? undefined : toggle}
      title={title}
      width={width}
    >
      {retangulos.map((folha) => {
        const largura = folha.x1 - folha.x0;
        const altura = folha.y1 - folha.y0;
        const disponivel = largura - CHART_LABEL_OFFSET * 2;
        const cabeORotulo = showDataLabels && disponivel > 0 && altura >= font.lineHeight + CHART_LABEL_OFFSET;
        const cabeOValor = cabeORotulo && altura >= font.lineHeight * 2 + CHART_LABEL_OFFSET;

        return (
          <g className={styles.cell} key={`${folha.data.label}-${folha.x0}-${folha.y0}`}>
            <rect
              aria-label={`${folha.data.label}: ${formatValue(folha.value ?? 0)}`}
              className={styles.tile}
              fill={corDa(folha)}
              height={altura}
              width={largura}
              x={folha.x0}
              y={folha.y0}
            />

            {cabeORotulo && (
              <text className={styles.label} x={folha.x0 + CHART_LABEL_OFFSET} y={folha.y0 + CHART_LABEL_OFFSET + font.lineHeight * 0.6}>
                {truncateToWidth(folha.data.label, font, disponivel)}
              </text>
            )}

            {cabeOValor && (
              <text
                className={styles.value}
                x={folha.x0 + CHART_LABEL_OFFSET}
                y={folha.y0 + CHART_LABEL_OFFSET + font.lineHeight * 1.6}
              >
                {truncateToWidth(formatValue(folha.value ?? 0), font, disponivel)}
              </text>
            )}
          </g>
        );
      })}
    </ChartFrame>
  );
}
