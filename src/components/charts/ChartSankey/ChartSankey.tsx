import { useMemo, useState } from 'react';
import { sankey } from 'd3-sankey';
import {
  PlainFrame,
  chartHeight,
  roundedBarPath,
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

/**
 * Teto de cada banda de rotulo, como fracao da largura. Sem teto, um nome longo
 * espremeria o fluxo, que e o assunto do grafico.
 */
const BANDA_MAXIMA = 0.22;

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
  const { font, height: alturaMedida, radius: raioDoCanto, ref, width } = useChartMetrics();
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

  /**
   * Entrada e o no em que nada desemboca; saida, aquele de onde nada parte. E o
   * que decide de que lado o rotulo fica, e sai das ligacoes: saber isso antes
   * do posicionamento e o que permite reservar a banda de cada lado.
   */
  const { entradas, saidas } = useMemo(() => {
    const destinos = new Set(flows.map((fluxo) => fluxo.target));
    const origens = new Set(flows.map((fluxo) => fluxo.source));

    return {
      entradas: new Set(declarados.map((no) => no.label).filter((rotulo) => !destinos.has(rotulo))),
      saidas: new Set(declarados.map((no) => no.label).filter((rotulo) => !origens.has(rotulo))),
    };
  }, [declarados, flows]);

  const bandaDe = (rotulos: Iterable<string>) =>
    showLabels ? Math.min(widestLabel([...rotulos], font), width * BANDA_MAXIMA) + RECUO_DO_ROTULO : 0;

  const bandaEsquerda = bandaDe(entradas);
  const bandaDireita = bandaDe(saidas);

  const grafo = useMemo(() => {
    const util = width - bandaEsquerda - bandaDireita;

    if (util <= 0 || alturaDoDesenho <= 0 || flows.length === 0) {
      return { links: [] as LigacaoPosicionada[], nodes: [] as NoPosicionado[] };
    }

    const posicionar = sankey<{ label: string }, { value: number }>()
      .nodeId((no) => no.label)
      .nodeWidth(nodeWidth)
      .nodePadding(nodePadding)
      .extent([
        [bandaEsquerda, 2],
        [bandaEsquerda + util, alturaDoDesenho - 2],
      ]);

    const resultado = posicionar({
      links: flows.map((fluxo) => ({ ...fluxo, value: Math.max(fluxo.value, 0) })),
      nodes: declarados.map((no) => ({ label: no.label })),
    });

    return resultado as unknown as { links: LigacaoPosicionada[]; nodes: NoPosicionado[] };
  }, [alturaDoDesenho, bandaDireita, bandaEsquerda, declarados, flows, nodePadding, nodeWidth, width]);

  const corDoNo = (indice: number) => cores[indice] ?? 'var(--pl-chart-neutral)';

  function classeDa(indice: number) {
    if (emFoco === null) {
      return styles.link;
    }

    return `${styles.link} ${emFoco === indice ? styles.linkOn : styles.linkDim}`;
  }

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
        <path
          className={styles.node}
          d={roundedBarPath(no.x0, no.y0, no.x1 - no.x0, Math.max(no.y1 - no.y0, 1), [
            raioDoCanto,
            raioDoCanto,
            raioDoCanto,
            raioDoCanto,
          ])}
          fill={corDoNo(no.index)}
          key={no.label}
        >
          <title>{no.label}</title>
        </path>
      ))}

      {/* Rotulo de entrada fica a esquerda do no e o de saida a direita, cada um
          na sua banda reservada. O do meio nao tem banda: ele centraliza no
          proprio no, para pertencer a ele em vez de flutuar sobre o fluxo, e um
          halo da cor da superficie o separa do que passa por baixo. */}
      {showLabels &&
        grafo.nodes.map((no) => {
          const entrada = entradas.has(no.label);
          const saida = saidas.has(no.label);
          const aEsquerda = entrada && !saida;
          const noMeio = !entrada && !saida;
          const banda = aEsquerda ? bandaEsquerda : saida ? bandaDireita : width * BANDA_MAXIMA;

          return (
            <text
              className={`${styles.label} ${noMeio ? styles.labelSobreFluxo : ''}`}
              dominantBaseline="middle"
              key={`rotulo-${no.label}`}
              textAnchor={noMeio ? 'middle' : aEsquerda ? 'end' : 'start'}
              x={
                noMeio
                  ? (no.x0 + no.x1) / 2
                  : aEsquerda
                    ? no.x0 - RECUO_DO_ROTULO
                    : no.x1 + RECUO_DO_ROTULO
              }
              y={(no.y0 + no.y1) / 2}
            >
              {truncateToWidth(no.label, font, banda - RECUO_DO_ROTULO)}
            </text>
          );
        })}
    </PlainFrame>
  );
}
