import { useMemo, useState } from 'react';
import { sankey, sankeyCenter, sankeyJustify, sankeyLeft, sankeyRight } from 'd3-sankey';
import {
  CHART_LABEL_BAND,
  CHART_LABEL_OFFSET,
  PlainFrame,
  chartHeight,
  measureLabel,
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

/**
 * Onde o valor da ligacao e escrito. O rotulo do no ocupa a faixa logo a
 * direita dele, entao `end` e o unico que nunca disputa espaco com o rotulo da
 * propria origem.
 */
export type ChartSankeyFlowValuePosition = 'start' | 'middle' | 'end';

export interface ChartSankeyProps {
  accent?: string;
  emptyMessage?: string;
  flowColor?: ChartSankeyFlowColor;
  flowValuePosition?: ChartSankeyFlowValuePosition;
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

interface Caixa {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

function seCruzam(uma: Caixa, outra: Caixa) {
  return uma.x0 < outra.x1 && outra.x0 < uma.x1 && uma.y0 < outra.y1 && outra.y0 < uma.y1;
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

export function ChartSankey({
  accent,
  emptyMessage = 'Sem dados no período',
  flowColor = 'source',
  flowValuePosition = 'end',
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
    ? Math.min(widestLabel(saidas, font), width * CHART_LABEL_BAND) + CHART_LABEL_OFFSET
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
      return width * CHART_LABEL_BAND;
    }

    const passo = Math.min(...colunas.slice(1).map((x, indice) => x - colunas[indice]));

    return Math.max(passo - nodeWidth - CHART_LABEL_OFFSET, 0);
  })();

  function rotuloDoNo(no: NoPosicionado) {
    const saida = saidas.includes(no.label);
    const texto = truncateToWidth(
      no.label,
      font,
      (saida ? bandaDireita : larguraDaEtapa) - CHART_LABEL_OFFSET,
    );
    const x = no.x1 + CHART_LABEL_OFFSET;
    const meio = (no.y0 + no.y1) / 2;

    return {
      caixa: {
        x0: x,
        x1: x + measureLabel(texto, font),
        y0: meio - font.lineHeight / 2,
        y1: meio + font.lineHeight / 2,
      } satisfies Caixa,
      texto,
      x,
      y: meio,
    };
  }

  const rotulosDosNos = showLabels ? grafo.nodes.map(rotuloDoNo) : [];

  /**
   * Valor de uma ligacao, ja posicionado. Ele e omitido quando cruza o rotulo
   * de algum no: dois textos sobrepostos nao informam nada, e o valor continua
   * no `title` da propria ligacao.
   */
  function valorDa(ligacao: LigacaoPosicionada) {
    const texto = formatValue(ligacao.value);
    const largura = measureLabel(texto, font);
    const saida = ligacao.source.x1;
    const chegada = ligacao.target.x0;
    const meio = (ligacao.y0 + ligacao.y1) / 2;

    const posicoes = {
      end: { anchor: 'end' as const, x: chegada - CHART_LABEL_OFFSET },
      middle: { anchor: 'middle' as const, x: (saida + chegada) / 2 },
      start: { anchor: 'start' as const, x: saida + CHART_LABEL_OFFSET },
    };

    const { anchor, x } = posicoes[flowValuePosition];
    const recuo = { end: largura, middle: largura / 2, start: 0 }[flowValuePosition];

    const caixa: Caixa = {
      x0: x - recuo,
      x1: x - recuo + largura,
      y0: meio - font.lineHeight / 2,
      y1: meio + font.lineHeight / 2,
    };

    if (rotulosDosNos.some((rotulo) => seCruzam(caixa, rotulo.caixa))) {
      return undefined;
    }

    return { anchor, texto, x, y: meio };
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
        grafo.links.map((ligacao) => {
          const valor = valorDa(ligacao);

          if (!valor) {
            return null;
          }

          return (
            <text
              className={`${styles.flowValue} ${styles.sobreFluxo}`}
              dominantBaseline="middle"
              key={`valor-${ligacao.source.label}-${ligacao.target.label}`}
              textAnchor={valor.anchor}
              x={valor.x}
              y={valor.y}
            >
              {valor.texto}
            </text>
          );
        })}

      {/* O rotulo fica sempre a direita do no. No no de saida ele cai na banda
          reservada; nos demais, sobre o proprio fluxo, e um halo da cor da
          superficie o separa do que passa por baixo. */}
      {rotulosDosNos.map((rotulo, indice) => (
        <text
          className={`${styles.label} ${saidas.includes(grafo.nodes[indice].label) ? '' : styles.sobreFluxo}`}
          dominantBaseline="middle"
          key={`rotulo-${grafo.nodes[indice].label}`}
          textAnchor="start"
          x={rotulo.x}
          y={rotulo.y}
        >
          {rotulo.texto}
        </text>
      ))}
    </PlainFrame>
  );
}
