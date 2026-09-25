import { useMemo, useState } from 'react';
import { sankey } from 'd3-sankey';
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

export interface ChartSankeyProps {
  accent?: string;
  emptyMessage?: string;
  flows: readonly ChartSankeyFlow[];
  formatValue?: (value: number) => string;
  height?: ChartHeight;
  /** Ordem e aparencia dos nos. Sem ela, os nos saem das proprias ligacoes. */
  nodes?: readonly ChartSankeyNode[];
  /** Folga vertical entre dois nos da mesma coluna. */
  nodePadding?: number;
  nodeWidth?: number;
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

export function ChartSankey({
  accent,
  emptyMessage = 'Sem dados no período',
  flows,
  formatValue = (valor) => String(valor),
  height = 320,
  nodes,
  nodePadding = 12,
  nodeWidth = 12,
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
  // sempre a cor da sua origem.
  const cores = useMemo(() => resolveSeriesColors(declarados, { accent }), [accent, declarados]);

  // O rotulo da primeira e da ultima coluna vive fora dos nos, entao o desenho
  // recua para caber: sem isso o nome do no sai pela borda.
  const margem = showLabels
    ? widestLabel(declarados.map((no) => no.label), font) / 2 + RECUO_DO_ROTULO
    : 0;

  const grafo = useMemo(() => {
    const util = width - margem * 2;

    if (util <= 0 || alturaDoDesenho <= 0 || flows.length === 0) {
      return { links: [] as LigacaoPosicionada[], nodes: [] as NoPosicionado[] };
    }

    const posicionar = sankey<{ label: string }, { value: number }>()
      .nodeId((no) => no.label)
      .nodeWidth(nodeWidth)
      .nodePadding(nodePadding)
      .extent([
        [margem, 2],
        [margem + util, alturaDoDesenho - 2],
      ]);

    const resultado = posicionar({
      links: flows.map((fluxo) => ({ ...fluxo, value: Math.max(fluxo.value, 0) })),
      nodes: declarados.map((no) => ({ label: no.label })),
    });

    return resultado as unknown as { links: LigacaoPosicionada[]; nodes: NoPosicionado[] };
  }, [alturaDoDesenho, declarados, flows, margem, nodePadding, nodeWidth, width]);

  const corDoNo = (indice: number) => cores[indice] ?? 'var(--pl-chart-neutral)';

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
            className={`${styles.link} ${emFoco !== null && emFoco !== indice ? styles.linkDim : ''}`}
            d={caminhoDa(ligacao)}
            key={`${ligacao.source.label}-${ligacao.target.label}`}
            onMouseEnter={() => setEmFoco(indice)}
            onMouseLeave={() => setEmFoco(null)}
            stroke={corDoNo(ligacao.source.index)}
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

      {showLabels &&
        grafo.nodes.map((no) => {
          // O rotulo fica do lado de fora do no: a esquerda quando o no esta na
          // metade direita, a direita quando esta na esquerda.
          const aDireita = no.x0 < width / 2;
          const x = aDireita ? no.x1 + RECUO_DO_ROTULO : no.x0 - RECUO_DO_ROTULO;

          return (
            <text
              className={styles.label}
              dominantBaseline="middle"
              key={`rotulo-${no.label}`}
              textAnchor={aDireita ? 'start' : 'end'}
              x={x}
              y={(no.y0 + no.y1) / 2}
            >
              {truncateToWidth(no.label, font, aDireita ? width - x : x)}
            </text>
          );
        })}
    </PlainFrame>
  );
}
