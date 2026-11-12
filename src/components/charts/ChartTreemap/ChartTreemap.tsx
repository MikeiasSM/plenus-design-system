import { useMemo, useState } from 'react';
import { hierarchy, treemap } from 'd3-hierarchy';
import {
  ChartTable,
  treeTable,
  CHART_LABEL_OFFSET,
  ChartFrame,
  assignNodeValues,
  chartHeight,
  hoverPath,
  pathTooltip,
  truncateToWidth,
  useChartMetrics,
  useFit,
  CHART_MIN_PLOT,
  legendRoom,
  plotRoom,
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
import { formatNumber, formatPercent } from '../../../utils/formatters';
import styles from './ChartTreemap.module.css';

export interface ChartTreemapNode extends SeriesAppearance {
  children?: readonly ChartTreemapNode[];
  label: string;
  value?: number;
}

export interface ChartTreemapProps extends Omit<ChartRootProps, 'hidden'> {
  accent?: string;
  /** Grupos ocultos de inicio, enquanto o produto nao controla `hidden`. */
  defaultHidden?: readonly string[];
  /** @deprecated Use `defaultHidden`. Aceito ate a 0.7.0; com os dois, vale o novo. */
  defaultHiddenGroups?: readonly string[];
  emptyMessage?: string;
  /** Formato dos valores no balao. Sem ele, vale o `formatValue`: o eixo pode sair compacto e o balao, exato. */
  formatTooltipValue?: (value: number) => string;
  formatValue?: (value: number) => string;
  /** Folga entre dois retangulos vizinhos. */
  gap?: number;
  height?: ChartHeight;
  /** Rotulos dos grupos desligados pela legenda (controlado). Substitui o `hidden` nativo da figure. */
  hidden?: readonly string[];
  /** @deprecated Use `hidden`. Aceito ate a 0.7.0; com os dois, vale o novo. */
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
  /** @deprecated Use `onHiddenChange`. Aceito ate a 0.7.0. */
  onHiddenGroupsChange?: (hidden: readonly string[]) => void;
  /** Rotulos ocultos, a cada alternancia da legenda. */
  onHiddenChange?: (hidden: readonly string[]) => void;
  /** Caminho ate o no sob o ponteiro, do grupo ao no, cada nivel com o maior entre o valor proprio e a soma dos filhos, ou `null` ao sair. */
  onHover?: (path: readonly ChartHoveredNode[] | null) => void;
  /** @deprecated Use `onHover`. Aceito ate a 0.7.0. */
  onHoverNode?: (path: readonly ChartHoveredNode[] | null) => void;
  /** Clique no no, com o caminho do grupo ate ele. Com ele, os retangulos viram botoes percorridos pelas setas. */
  onMarkClick?: (path: readonly ChartHoveredNode[]) => void;
  /** @deprecated Use `onMarkClick`. Aceito ate a 0.7.0. */
  onNodeClick?: (path: readonly ChartHoveredNode[]) => void;
  /** Cores das series sem cor propria: lista em rotacao ou `{ base }`, que gera os tons. Vence o `accent`. */
  palette?: ChartPalette;
  showDataLabels?: boolean;
  /** Botao "Ver como tabela". Ligado por padrao. */
  showTableToggle?: boolean;
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
  defaultHidden,
  defaultHiddenGroups,
  emptyMessage = 'Sem dados no período',
  formatTooltipValue,
  formatValue = formatNumber,
  gap = 5,
  height = 280,
  hidden,
  hiddenGroups,
  intentLabels,
  legend = 'bottom',
  legendAlign,
  nodes,
  onHiddenChange,
  onHiddenGroupsChange,
  onHover,
  onHoverNode,
  onMarkClick,
  onNodeClick,
  palette,
  showDataLabels = true,
  showTableToggle = true,
  showTooltip = true,
  title,
  ...root
}: ChartTreemapProps) {
  const { font, height: alturaMedida, ref, width } = useChartMetrics();
  const { fillHeight, value: alturaDoDesenho } = chartHeight(height, alturaMedida);
  const avisarHover: ChartTreemapProps['onHover'] =
    onHover || onHoverNode
      ? (...aviso) => {
          onHover?.(...aviso);
          onHoverNode?.(...aviso);
        }
      : undefined;
  const aoClicarNoNo =
    onMarkClick || onNodeClick
      ? (caminho: readonly ChartHoveredNode[]) => {
          onMarkClick?.(caminho);
          onNodeClick?.(caminho);
        }
      : undefined;
  const { isHidden, toggle } = useSeriesToggle({
    defaultHidden: defaultHidden ?? defaultHiddenGroups,
    hidden: hidden ?? hiddenGroups,
    onHiddenChange: (ocultos) => {
      onHiddenChange?.(ocultos);
      onHiddenGroupsChange?.(ocultos);
    },
  });

  // A cor sai da lista inteira, e nao das visiveis: desligar um grupo nao pode
  // repintar os demais.
  const coresDeGrupo = useMemo(() => resolveSeriesColors(nodes, { accent, palette }), [accent, palette, nodes]);

  // Sem valor positivo nao ha area a repartir: anuncia vazio. Desligar todos os grupos, nao: a legenda e a volta.
  const arvoreCompleta = useMemo(() => assignNodeValues(hierarchy<ChartTreemapNode>({ children: nodes, label: '' }), ocupacao), [nodes]);
  const semValor = !((arvoreCompleta.value ?? 0) > 0);

  const retangulos = useMemo(() => {
    const visiveis = nodes.filter((grupo) => !isHidden(grupo.label));

    if (width === 0 || alturaDoDesenho === 0 || visiveis.length === 0) {
      return [];
    }

    const arvore = assignNodeValues(hierarchy<ChartTreemapNode>({ children: visiveis, label: '' }), ocupacao).sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

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
    avisarHover?.(folha && hoverPath(folha));
  }

  const marcas = useMarkNavigation({
    onActivate: aoClicarNoNo && (({ column }) => aoClicarNoNo(hoverPath(retangulos[column]))),
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

  const medido = width > 0 && alturaDoDesenho > 0;
  const espacoDaLegenda = legendRoom(entradasDaLegenda, legend, font, width, fillHeight);
  const removed = useFit(
    medido ? ['legend'] as const : [],
    (partes, legendaEstava) => plotRoom({ height: alturaDoDesenho, width }, espacoDaLegenda, legendaEstava, !partes.has('legend')),
    CHART_MIN_PLOT,
  );

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
      legendPosition={removed.has('legend') ? 'none' : legend}
      onToggleSeries={intentLabels ? undefined : toggle}
      root={root}
      showTableToggle={showTableToggle}
      table={
        <ChartTable {...treeTable(arvoreCompleta, formatValue, (fracao) => formatPercent(fracao))} title={title} />
      }
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
                {!showTooltip && !avisarHover && <title>{descricao}</title>}
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
