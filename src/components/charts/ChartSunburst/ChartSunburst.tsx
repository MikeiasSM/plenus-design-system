import { useMemo, useRef, useState } from 'react';
import { hierarchy, partition, type HierarchyRectangularNode } from 'd3-hierarchy';
import {
  CHART_LABEL_BAND,
  CHART_LABEL_OFFSET,
  ChartFrame,
  VOLTA,
  arcAnchor,
  arcPath,
  assignNodeValues,
  hoverPath,
  pathTooltip,
  chartHeight,
  ringDiameter,
  truncateToWidth,
  useChartMetrics,
  useMarkNavigation,
  useSeriesToggle,
  widestLabel,
  type ChartAnchorPoint,
  type ChartHeight,
  type ChartHoveredNode,
  type ChartHoverDetails,
  type ChartLegendAlign,
  type ChartLegendPosition,
  type ChartRootProps,
} from '../core';
import { resolveSeriesColors, type ChartPalette, type SeriesAppearance } from '../palette';
import { formatNumber } from '../../../utils/formatters';
import styles from './ChartSunburst.module.css';

export interface ChartSunburstNode extends SeriesAppearance {
  children?: readonly ChartSunburstNode[];
  label: string;
  value?: number;
}

export interface ChartSunburstProps extends Omit<ChartRootProps, 'hidden'> {
  accent?: string;
  /** Grupos ocultos de inicio, enquanto o produto nao controla `hidden`. */
  defaultHidden?: readonly string[];
  /** @deprecated Use `defaultHidden`. Aceito ate a 0.7.0; com os dois, vale o novo. */
  defaultHiddenGroups?: readonly string[];
  emptyMessage?: string;
  formatPercent?: (ratio: number) => string;
  /** Formato dos valores no balao. Sem ele, vale o `formatValue`: o eixo pode sair compacto e o balao, exato. */
  formatTooltipValue?: (value: number) => string;
  formatValue?: (value: number) => string;
  height?: ChartHeight;
  /** Rotulos dos grupos desligados pela legenda (controlado). Substitui o `hidden` nativo da figure. */
  hidden?: readonly string[];
  /** @deprecated Use `hidden`. Aceito ate a 0.7.0; com os dois, vale o novo. */
  hiddenGroups?: readonly string[];
  legend?: ChartLegendPosition;
  legendAlign?: ChartLegendAlign;
  nodes: readonly ChartSunburstNode[];
  /** @deprecated Use `onHiddenChange`. Aceito ate a 0.7.0. */
  onHiddenGroupsChange?: (hidden: readonly string[]) => void;
  /** Rotulos ocultos, a cada alternancia da legenda. */
  onHiddenChange?: (hidden: readonly string[]) => void;
  /**
   * Caminho ate o no sob o ponteiro, o foco ou a entrada da legenda, do grupo ao no, cada nivel com o maior entre o valor
   * proprio e a soma dos filhos, ou `null` ao sair. Da legenda, que nao tem ponteiro, vem o segundo argumento: a cor desenhada
   * do grupo e o ponto onde ancorar o `ChartTooltip`.
   */
  onHover?: (path: readonly ChartHoveredNode[] | null, details?: ChartHoverDetails) => void;
  /** @deprecated Use `onHover`. Aceito ate a 0.7.0. */
  onHoverNode?: (path: readonly ChartHoveredNode[] | null, details?: ChartHoverDetails) => void;
  /** Clique no arco, com o caminho do grupo ate ele. Com ele, os arcos viram botoes percorridos pelas setas. */
  onMarkClick?: (path: readonly ChartHoveredNode[]) => void;
  /** @deprecated Use `onMarkClick`. Aceito ate a 0.7.0. */
  onNodeClick?: (path: readonly ChartHoveredNode[]) => void;
  /** Cores das series sem cor propria: lista em rotacao ou `{ base }`, que gera os tons. Vence o `accent`. */
  palette?: ChartPalette;
  /** Folga entre dois aneis vizinhos. */
  ringGap?: number;
  /** Raio das pontas de cada arco. Sem valor, o token de raio pequeno. */
  sliceRadius?: number;
  showLabels?: boolean;
  /**
   * Balao com o caminho ate o no sob o ponteiro. Desligue para montar o proprio `ChartTooltip`
   * pela costura; sem balao nem costura, o no volta a ter o `<title>`.
   */
  showTooltip?: boolean;
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
  defaultHidden,
  defaultHiddenGroups,
  emptyMessage = 'Sem dados no período',
  formatPercent = (fracao) => `${Math.round(fracao * 100)}%`,
  formatTooltipValue,
  formatValue = formatNumber,
  height = 320,
  hidden,
  hiddenGroups,
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
  ringGap = 2,
  showLabels = true,
  showTooltip = true,
  sliceRadius,
  title,
  ...root
}: ChartSunburstProps) {
  const { font, height: alturaMedida, radius: raioDoCanto, ref, width } = useChartMetrics();
  const { fillHeight, value: alturaDoDesenho } = chartHeight(height, alturaMedida);
  const avisarHover: ChartSunburstProps['onHover'] =
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
  const [emFoco, setEmFoco] = useState<Arco | null>(null);

  // A cor sai da lista inteira, e nao das visiveis: desligar um grupo nao pode
  // repintar os demais.
  const coresDeNivelZero = useMemo(() => resolveSeriesColors(nodes, { accent, palette }), [accent, palette, nodes]);

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

    const arvore = assignNodeValues(
      hierarchy<ChartSunburstNode>({ children: visiveis, label: '' }),
      (no) => Math.max(no.value ?? 0, 0),
    ).sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const repartir = partition<ChartSunburstNode>().size([VOLTA, raio]);

    return repartir(arvore)
      .descendants()
      .filter((no) => no.depth > 0);
  }, [raio, visiveis]);

  const profundidadeMaxima = arcos.reduce((maior, arco) => Math.max(maior, arco.depth), 0);
  const total = arcos
    .filter((arco) => arco.depth === 1)
    .reduce((soma, arco) => soma + (arco.value ?? 0), 0);

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

  // O ponteiro que salta do arco para a legenda entra nela antes de sair do arco,
  // e a saida chega antes do novo render: quem decide e o ultimo no realcado.
  const realcado = useRef<ChartSunburstNode | null>(null);

  function focar(arco: Arco | null, detalhe?: ChartHoverDetails) {
    realcado.current = arco && arco.data;
    setEmFoco(arco);

    if (arco && detalhe) {
      avisarHover?.(hoverPath(arco), detalhe);
    } else {
      avisarHover?.(arco && hoverPath(arco));
    }
  }

  function soltar(arco: Arco) {
    if (realcado.current === arco.data) {
      focar(null);
    }
  }

  const marcas = useMarkNavigation({
    onActivate: aoClicarNoNo && (({ column }) => aoClicarNoNo(hoverPath(arcos[column]))),
    onFocusMark: (posicao) => focar(posicao && arcos[posicao.column]),
    present: arcos.map((_, column) => ({ column, row: 0 })),
  });

  // A legenda lista os grupos, e o desligado nao tem arco. So ela traz o detalhe:
  // no ponteiro e no teclado o aviso segue com um argumento, que o teste do consumidor compara.
  function realcarGrupo(label: string | null, anchor?: ChartAnchorPoint) {
    const grupo = label === null ? undefined : arcos.find((arco) => arco.depth === 1 && arco.data.label === label);

    if (!grupo || !anchor) {
      marcas.anchorTooltip(undefined);

      if (realcado.current !== null) {
        focar(null);
      }
      return;
    }

    marcas.anchorTooltip(anchor);
    focar(grupo, { anchor, color: corDe(grupo) });
  }

  function alternarGrupo(label: string) {
    if (foco?.depth === 1 && foco.data.label === label) {
      realcarGrupo(null);
    }

    toggle(label);
  }

  function corDe(arco: Arco) {
    const raizDoRamo = arco.ancestors().find((ancestral) => ancestral.depth === 1)?.data;
    const base =
      raizDoRamo?.color ?? coresDeNivelZero[nodes.findIndex((no) => no.label === raizDoRamo?.label)];

    return tomDoNivel(base ?? 'var(--pl-chart-neutral)', arco.depth);
  }

  function descreverArco(arco: Arco) {
    const fracao = total > 0 ? (arco.value ?? 0) / total : 0;

    return `${arco.data.label}: ${formatValue(arco.value ?? 0)} (${formatPercent(fracao)})`;
  }

  return (
    <ChartFrame
      canvasRole={marcas.interactive ? 'group' : 'img'}
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
      onHighlightSeries={realcarGrupo}
      onToggleSeries={alternarGrupo}
      root={root}
      swatch="dot"
      title={title}
      tooltip={
        showTooltip
          ? pathTooltip({
              color: foco ? corDe(foco) : undefined,
              format: formatTooltipValue ?? formatValue,
              formatPercent,
              path: foco && hoverPath(foco),
              total,
            })
          : undefined
      }
      tooltipAnchor={marcas.tooltipAnchor}
      width={width}
    >
      <g {...marcas.groupProps}>
        {arcos.map((arco, indice) => (
          <path
            aria-label={descreverArco(arco)}
            {...marcas.markProps({ column: indice, row: 0 }, `${styles.arc} ${aceso(arco) ? '' : styles.arcDim}`)}
            d={arcPath({
              cornerRadius: sliceRadius ?? raioDoCanto,
              endAngle: arco.x1,
              innerRadius: arco.y0 + (arco.depth > 1 ? ringGap : 0),
              outerRadius: arco.y1,
              startAngle: arco.x0,
            })}
            fill={corDe(arco)}
            key={indice}
            onMouseEnter={() => focar(arco)}
            onMouseLeave={() => soltar(arco)}
          >
            {!showTooltip && !avisarHover && <title>{descreverArco(arco)}</title>}
          </path>
        ))}
      </g>

      {showLabels &&
        arcos
          .filter(
            (arco) => arco.depth === profundidadeMaxima && arco.x1 - arco.x0 >= ANGULO_MINIMO_DO_ROTULO,
          )
          .map((arco, indice) => {
            const angulos = { endAngle: arco.x1, startAngle: arco.x0 };
            const [xBorda, yBorda] = arcAnchor(angulos, arco.y1);
            const [xCotovelo, yCotovelo] = arcAnchor(angulos, arco.y1 + COMPRIMENTO_DO_CONECTOR);
            const paraDireita = xCotovelo >= 0;
            const xFim = xCotovelo + (paraDireita ? COMPRIMENTO_DO_CONECTOR : -COMPRIMENTO_DO_CONECTOR);

            return (
              <g className={styles.leader} key={indice}>
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
