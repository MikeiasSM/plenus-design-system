import { useMemo, useState } from 'react';
import { sankey, sankeyCenter, sankeyJustify, sankeyLeft, sankeyRight } from 'd3-sankey';
import {
  PlainFrame,
  chartHeight,
  truncateToWidth,
  useChartMetrics,
  widestLabel,
  type ChartHeight,
} from '../core';
import { resolveSeriesColors, type SeriesAppearance } from '../palette';
import styles from './ChartSankey.module.css';

export interface ChartSankeyNode extends SeriesAppearance {
  label: string;
}

export interface ChartSankeyFlow {
  source: string;
  target: string;
  value: number;
}

/** Onde os nos sem saida se encostam, conforme a referencia. */
export type ChartSankeyAlign = 'left' | 'right' | 'center' | 'justify';

/** De onde a ligacao tira a cor: do no de origem, do de destino, ou de nenhum. */
export type ChartSankeyFlowColor = 'source' | 'target' | 'neutral';

export interface ChartSankeyProps {
  accent?: string;
  emptyMessage?: string;
  flowColor?: ChartSankeyFlowColor;
  flows: readonly ChartSankeyFlow[];
  formatValue?: (value: number) => string;
  height?: ChartHeight;
  nodeAlign?: ChartSankeyAlign;
  /** Ordem e aparencia dos nos. Sem ela, os nos saem das proprias ligacoes. */
  nodes?: readonly ChartSankeyNode[];
  /** Folga vertical entre dois nos da mesma coluna. */
  nodePadding?: number;
  nodeWidth?: number;
  showFlowValues?: boolean;
  showLabels?: boolean;
  title: string;
}

interface NoPosicionado {
  index: number;
  label: string;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

interface LigacaoPosicionada {
  index: number;
  source: NoPosicionado;
  target: NoPosicionado;
  value: number;
  width: number;
  y0: number;
  y1: number;
}

const ALINHAMENTO = {
  center: sankeyCenter,
  justify: sankeyJustify,
  left: sankeyLeft,
  right: sankeyRight,
};

/**
 * Bezier cubica entre a borda de saida e a borda de entrada, com os pontos de
 * controle no meio do vao. E o que da a ligacao a curva que sai e chega na
 * horizontal, sem torcer perto dos nos.
 */
function caminhoDa(ligacao: LigacaoPosicionada) {
  const saida = ligacao.source.x1;
  const chegada = ligacao.target.x0;
  const meio = (saida + chegada) / 2;

  return `M${saida},${ligacao.y0}C${meio},${ligacao.y0} ${meio},${ligacao.y1} ${chegada},${ligacao.y1}`;
}

const RECUO_DO_ROTULO = 8;

/**
 * Teto da banda de rotulos, como fracao da largura. Sem teto, um nome longo
 * espremeria o fluxo, que e o assunto do grafico.
 */
const BANDA_MAXIMA = 0.22;

export function ChartSankey({
  accent,
  emptyMessage = 'Sem dados no período',
  flowColor = 'source',
  flows,
  formatValue = (valor) => String(valor),
  height = 320,
  nodeAlign = 'justify',
  nodes,
  nodePadding = 12,
  nodeWidth = 12,
  showFlowValues = false,
  showLabels = true,
  title,
}: ChartSankeyProps) {
  const { font, height: alturaMedida, ref, width } = useChartMetrics();
  const { fillHeight, value: alturaDoDesenho } = chartHeight(height, alturaMedida);
  const [emFoco, setEmFoco] = useState<number | null>(null);

  /** Os nos saem da ordem declarada, e o que faltar sai das proprias ligacoes. */
  const declarados = useMemo(() => {
    const rotulos = (nodes ?? []).map((no) => no.label);

    flows.forEach(({ source, target }) => {
      [source, target].forEach((rotulo) => {
        if (!rotulos.includes(rotulo)) {
          rotulos.push(rotulo);
        }
      });
    });

    return rotulos.map(
      (rotulo) => nodes?.find((no) => no.label === rotulo) ?? ({ label: rotulo } as ChartSankeyNode),
    );
  }, [flows, nodes]);

  // A cor sai da lista inteira e na ordem dos nos, para uma ligacao herdar
  // sempre a cor do no de que ela depende.
  const cores = useMemo(() => resolveSeriesColors(declarados, { accent }), [accent, declarados]);

  /**
   * O rotulo fica sempre a direita do no, como na referencia. So o de saida
   * precisa de espaco reservado: ele nao tem fluxo a direita para escrever por
   * cima, e sem a reserva o nome sairia pela borda.
   */
  const saidas = useMemo(() => {
    const origens = new Set(flows.map((fluxo) => fluxo.source));

    return declarados.map((no) => no.label).filter((rotulo) => !origens.has(rotulo));
  }, [declarados, flows]);

  const bandaDireita = showLabels
    ? Math.min(widestLabel(saidas, font), width * BANDA_MAXIMA) + RECUO_DO_ROTULO
    : 0;

  const grafo = useMemo(() => {
    const util = width - bandaDireita;

    if (util <= 0 || alturaDoDesenho <= 0 || flows.length === 0) {
      return { links: [] as LigacaoPosicionada[], nodes: [] as NoPosicionado[] };
    }

    const posicionar = sankey<{ label: string }, { value: number }>()
      .nodeId((no) => no.label)
      .nodeAlign(ALINHAMENTO[nodeAlign])
      .nodeWidth(nodeWidth)
      .nodePadding(nodePadding)
      .extent([
        [0, 2],
        [util, alturaDoDesenho - 2],
      ]);

    const resultado = posicionar({
      links: flows.map((fluxo) => ({ ...fluxo, value: Math.max(fluxo.value, 0) })),
      nodes: declarados.map((no) => ({ label: no.label })),
    });

    return resultado as unknown as { links: LigacaoPosicionada[]; nodes: NoPosicionado[] };
  }, [alturaDoDesenho, bandaDireita, declarados, flows, nodeAlign, nodePadding, nodeWidth, width]);

  const corDoNo = (indice: number) => cores[indice] ?? 'var(--pl-chart-neutral)';

  function corDa(ligacao: LigacaoPosicionada) {
    if (flowColor === 'neutral') {
      return 'var(--pl-chart-neutral)';
    }

    return corDoNo(flowColor === 'target' ? ligacao.target.index : ligacao.source.index);
  }

  function classeDa(indice: number) {
    if (emFoco === null) {
      return styles.link;
    }

    return `${styles.link} ${emFoco === indice ? styles.linkOn : styles.linkDim}`;
  }

  /** Vao entre duas colunas, descontados o no e o recuo: e o que o rotulo tem. */
  const larguraDaEtapa = (() => {
    const colunas = [...new Set(grafo.nodes.map((no) => no.x0))].sort((a, b) => a - b);

    if (colunas.length < 2) {
      return width * BANDA_MAXIMA;
    }

    const passo = Math.min(...colunas.slice(1).map((x, indice) => x - colunas[indice]));

    return Math.max(passo - nodeWidth - RECUO_DO_ROTULO, 0);
  })();

  return (
    <PlainFrame
      containerRef={ref}
      empty={flows.length === 0}
      emptyMessage={emptyMessage}
      fillHeight={fillHeight}
      height={alturaDoDesenho}
      legendPosition="none"
      title={title}
      width={width}
    >
      <g className={styles.links}>
        {grafo.links.map((ligacao, indice) => (
          <path
            className={classeDa(indice)}
            d={caminhoDa(ligacao)}
            key={`${ligacao.source.label}-${ligacao.target.label}`}
            onMouseEnter={() => setEmFoco(indice)}
            onMouseLeave={() => setEmFoco(null)}
            stroke={corDa(ligacao)}
            strokeWidth={Math.max(ligacao.width, 1)}
          >
            <title>
              {`${ligacao.source.label} → ${ligacao.target.label}: ${formatValue(ligacao.value)}`}
            </title>
          </path>
        ))}
      </g>

      {grafo.nodes.map((no) => (
        <rect
          className={styles.node}
          fill={corDoNo(no.index)}
          height={Math.max(no.y1 - no.y0, 1)}
          key={no.label}
          width={no.x1 - no.x0}
          x={no.x0}
          y={no.y0}
        >
          <title>{no.label}</title>
        </rect>
      ))}

      {showFlowValues &&
        grafo.links.map((ligacao) => (
          <text
            className={`${styles.flowValue} ${styles.sobreFluxo}`}
            dominantBaseline="middle"
            key={`valor-${ligacao.source.label}-${ligacao.target.label}`}
            textAnchor="middle"
            x={(ligacao.source.x1 + ligacao.target.x0) / 2}
            y={(ligacao.y0 + ligacao.y1) / 2}
          >
            {formatValue(ligacao.value)}
          </text>
        ))}

      {/* O rotulo fica sempre a direita do no. No no de saida ele cai na banda
          reservada; nos demais, sobre o proprio fluxo, e um halo da cor da
          superficie o separa do que passa por baixo. */}
      {showLabels &&
        grafo.nodes.map((no) => {
          const saida = saidas.includes(no.label);

          return (
            <text
              className={`${styles.label} ${saida ? '' : styles.sobreFluxo}`}
              dominantBaseline="middle"
              key={`rotulo-${no.label}`}
              textAnchor="start"
              x={no.x1 + RECUO_DO_ROTULO}
              y={(no.y0 + no.y1) / 2}
            >
              {truncateToWidth(
                no.label,
                font,
                (saida ? bandaDireita : larguraDaEtapa) - RECUO_DO_ROTULO,
              )}
            </text>
          );
        })}
    </PlainFrame>
  );
}
