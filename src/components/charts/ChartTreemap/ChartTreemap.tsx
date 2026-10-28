import { useMemo, useState } from 'react';
import { hierarchy, treemap } from 'd3-hierarchy';
import {
  CHART_LABEL_OFFSET,
  ChartFrame,
  chartHeight,
  hoverPath,
  pathTooltip,
  truncateToWidth,
  useChartMetrics,
  useMarkNavigation,
  useSeriesToggle,
  type ChartHeight,
  type ChartHoveredNode,
  type ChartLegendAlign,
  type ChartLegendPosition,
  type ChartRootProps,
} from '../core';
import {
  INTENT_TOKENS,
  resolveSeriesColors,
  textColorOn,
  type ChartPalette,
  type SeriesAppearance,
  type SeriesIntent,
} from '../palette';
import { formatNumber } from '../../../utils/formatters';
import styles from './ChartTreemap.module.css';

export interface ChartTreemapNode extends SeriesAppearance {
  children?: readonly ChartTreemapNode[];
  label: string;
  value?: number;
}

export interface ChartTreemapProps extends ChartRootProps {
  accent?: string;
  defaultHiddenGroups?: readonly string[];
  emptyMessage?: string;
  /** Formato dos valores no balao. Sem ele, vale o `formatValue`: o eixo pode sair compacto e o balao, exato. */
  formatTooltipValue?: (value: number) => string;
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
  /** Clique no no, com o caminho do grupo ate ele. Com ele, os retangulos viram botoes percorridos pelas setas. */
  onNodeClick?: (path: readonly ChartHoveredNode[]) => void;
  /** Caminho ate o no sob o ponteiro, do grupo ao no, cada nivel com o valor somado, ou `null` ao sair. */
  onHoverNode?: (path: readonly ChartHoveredNode[] | null) => void;
  /** Cores das series sem cor propria: lista em rotacao ou `{ base }`, que gera os tons. Vence o `accent`. */
  palette?: ChartPalette;
  showDataLabels?: boolean;
  /**
   * Balao com o caminho ate o no sob o ponteiro. Desligue para montar o proprio `ChartTooltip`
   * pela costura; sem balao nem costura, o no volta a ter o `<title>`.
   */
  showTooltip?: boolean;
  title: string;
}


/** Area que o no ocupa. Invalido ou negativo nao ocupa nada. */
function ocupacao(no: ChartTreemapNode) {
  return Number.isFinite(no.value) ? Math.max(no.value ?? 0, 0) : 0;
}

export function ChartTreemap({
  accent,
  defaultHiddenGroups,
  emptyMessage = 'Sem dados no período',
  formatTooltipValue,
  formatValue = formatNumber,
  gap = 5,
  height = 280,
  hiddenGroups,
  intentLabels,
  legend = 'bottom',
  legendAlign,
  nodes,
  onHiddenGroupsChange,
  onHoverNode,
  onNodeClick,
  palette,
  showDataLabels = true,
  showTooltip = true,
  title,
  ...root
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
  const coresDeGrupo = useMemo(() => resolveSeriesColors(nodes, { accent, palette }), [accent, palette, nodes]);

  // Sem valor positivo nao ha area a repartir: anuncia vazio. Desligar todos os grupos, nao: a legenda e a volta.
  const semValor = useMemo(
    () => !((hierarchy<ChartTreemapNode>({ children: nodes, label: '' }).sum(ocupacao).value ?? 0) > 0),
    [nodes],
  );

  const retangulos = useMemo(() => {
    const visiveis = nodes.filter((grupo) => !isHidden(grupo.label));

    if (width === 0 || alturaDoDesenho === 0 || visiveis.length === 0) {
      return [];
    }

    const arvore = hierarchy<ChartTreemapNode>({ children: visiveis, label: '' })
      .sum(ocupacao)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const posicionar = treemap<ChartTreemapNode>()
      .size([width, alturaDoDesenho])
      .paddingInner(gap)
      .round(true);

    return posicionar(arvore).leaves();
  }, [alturaDoDesenho, gap, isHidden, nodes, width]);

  const [emFoco, setEmFoco] = useState<(typeof retangulos)[number] | null>(null);
  // A folha guardada deixa de existir quando o mapa e remontado; sem conferir, o balao falaria de um no que saiu.
  const foco = emFoco && retangulos.includes(emFoco) ? emFoco : null;

  function focar(folha: (typeof retangulos)[number] | null) {
    setEmFoco(folha);
    onHoverNode?.(folha && hoverPath(folha));
  }

  const marcas = useMarkNavigation({
    onActivate: onNodeClick && (({ column }) => onNodeClick(hoverPath(retangulos[column]))),
    onFocusMark: (posicao) => focar(posicao && retangulos[posicao.column]),
    present: retangulos.map((_, column) => ({ column, row: 0 })),
  });

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
      canvasRole={marcas.interactive ? 'group' : 'img'}
      containerRef={ref}
      empty={nodes.length === 0 || semValor}
      emptyMessage={emptyMessage}
      fillHeight={fillHeight}
      height={alturaDoDesenho}
      legend={entradasDaLegenda}
      legendAlign={legendAlign}
      legendPosition={legend}
      onToggleSeries={intentLabels ? undefined : toggle}
      root={root}
      title={title}
      tooltip={
        showTooltip
          ? pathTooltip({ color: foco ? corDa(foco) : undefined, format: formatTooltipValue ?? formatValue, path: foco && hoverPath(foco) })
          : undefined
      }
      tooltipAnchor={marcas.tooltipAnchor}
      width={width}
    >
      <g {...marcas.groupProps}>
        {retangulos.map((folha, indice) => {
          const largura = folha.x1 - folha.x0;
          const altura = folha.y1 - folha.y0;
          const disponivel = largura - CHART_LABEL_OFFSET * 2;
          const cabeORotulo = showDataLabels && disponivel > 0 && altura >= font.lineHeight + CHART_LABEL_OFFSET;
          const cabeOValor = cabeORotulo && altura >= font.lineHeight * 2 + CHART_LABEL_OFFSET;
          const descricao = `${folha.data.label}: ${formatValue(folha.value ?? 0)}`;
          const cor = corDa(folha);

          return (
            <g className={styles.cell} key={`${folha.data.label}-${folha.x0}-${folha.y0}`}>
              <rect
                aria-label={descricao}
                {...marcas.markProps({ column: indice, row: 0 }, styles.tile)}
                fill={cor}
                height={altura}
                width={largura}
                onMouseEnter={() => focar(folha)}
                onMouseLeave={() => focar(null)}
                x={folha.x0}
                y={folha.y0}
              >
                {!showTooltip && !onHoverNode && <title>{descricao}</title>}
              </rect>

              {cabeORotulo && (
                <text
                  className={styles.label}
                  fill={textColorOn(cor)}
                  x={folha.x0 + CHART_LABEL_OFFSET}
                  y={folha.y0 + CHART_LABEL_OFFSET + font.lineHeight * 0.6}
                >
                  {truncateToWidth(folha.data.label, font, disponivel)}
                </text>
              )}

              {cabeOValor && (
                <text
                  className={styles.value}
                  fill={textColorOn(cor)}
                  x={folha.x0 + CHART_LABEL_OFFSET}
                  y={folha.y0 + CHART_LABEL_OFFSET + font.lineHeight * 1.6}
                >
                  {truncateToWidth(formatValue(folha.value ?? 0), font, disponivel)}
                </text>
              )}
            </g>
          );
        })}
      </g>
    </ChartFrame>
  );
}
