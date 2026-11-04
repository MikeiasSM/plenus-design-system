import { max, min, sum } from 'd3-array';

export type AlinhamentoDoSankey = 'left' | 'right' | 'center' | 'justify';

export interface FluxoDoSankey {
  source: string;
  target: string;
  value: number;
}

export interface NoDoSankey {
  depth: number;
  height: number;
  index: number;
  label: string;
  layer: number;
  sourceLinks: LigacaoDoSankey[];
  targetLinks: LigacaoDoSankey[];
  value: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export interface LigacaoDoSankey {
  index: number;
  source: NoDoSankey;
  target: NoDoSankey;
  value: number;
  width: number;
  y0: number;
  y1: number;
}

export interface OpcoesDoLeiaute {
  align: AlinhamentoDoSankey;
  flows: readonly FluxoDoSankey[];
  /** Rotulos na ordem declarada: e a ordem inicial dos nos em cada coluna. */
  labels: readonly string[];
  nodePadding: number;
  nodeWidth: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

const ITERACOES = 6;

const ALINHAMENTO: Record<AlinhamentoDoSankey, (no: NoDoSankey, colunas: number) => number> = {
  center: (no) =>
    no.targetLinks.length ? no.depth : no.sourceLinks.length ? min(no.sourceLinks, (l) => l.target.depth)! - 1 : 0,
  justify: (no, colunas) => (no.sourceLinks.length ? no.depth : colunas - 1),
  left: (no) => no.depth,
  right: (no, colunas) => colunas - 1 - no.height,
};

function porAlturaDaOrigem(a: LigacaoDoSankey, b: LigacaoDoSankey) {
  return a.source.y0 - b.source.y0 || a.index - b.index;
}

function porAlturaDoDestino(a: LigacaoDoSankey, b: LigacaoDoSankey) {
  return a.target.y0 - b.target.y0 || a.index - b.index;
}

function criarNosELigacoes(labels: readonly string[], flows: readonly FluxoDoSankey[]) {
  const nos: NoDoSankey[] = labels.map((label, index) => ({
    depth: 0,
    height: 0,
    index,
    label,
    layer: 0,
    sourceLinks: [],
    targetLinks: [],
    value: 0,
    x0: 0,
    x1: 0,
    y0: 0,
    y1: 0,
  }));
  const porRotulo = new Map(nos.map((no) => [no.label, no]));

  const ligacoes = flows.map((fluxo, index): LigacaoDoSankey => {
    const source = porRotulo.get(fluxo.source);
    const target = porRotulo.get(fluxo.target);

    if (!source || !target) {
      throw new Error(`no ausente: ${source ? fluxo.target : fluxo.source}`);
    }

    const ligacao = { index, source, target, value: fluxo.value, width: 0, y0: 0, y1: 0 };
    source.sourceLinks.push(ligacao);
    target.targetLinks.push(ligacao);

    return ligacao;
  });

  for (const no of nos) {
    no.value = Math.max(sum(no.sourceLinks, (l) => l.value), sum(no.targetLinks, (l) => l.value));
  }

  return { ligacoes, nos };
}

/** Distancia de cada no ate o inicio (`depth`) ou ate o fim (`height`) do fluxo, em passos. */
function medirProfundidades(
  nos: NoDoSankey[],
  propriedade: 'depth' | 'height',
  vizinhos: (no: NoDoSankey) => NoDoSankey[],
) {
  let atuais = new Set(nos);

  for (let passo = 0; atuais.size; passo++) {
    if (passo > nos.length) {
      throw new Error('ligacao circular');
    }

    const proximos = new Set<NoDoSankey>();

    for (const no of atuais) {
      no[propriedade] = passo;
      vizinhos(no).forEach((vizinho) => proximos.add(vizinho));
    }

    atuais = proximos;
  }
}

function distribuirEmColunas(nos: NoDoSankey[], { align, nodeWidth, x0, x1 }: OpcoesDoLeiaute) {
  const quantidade = max(nos, (no) => no.depth)! + 1;
  const passo = (x1 - x0 - nodeWidth) / (quantidade - 1);
  const colunas: NoDoSankey[][] = Array.from({ length: quantidade }, () => []);

  for (const no of nos) {
    no.layer = Math.max(0, Math.min(quantidade - 1, Math.floor(ALINHAMENTO[align](no, quantidade))));
    no.x0 = x0 + no.layer * passo;
    no.x1 = no.x0 + nodeWidth;
    colunas[no.layer].push(no);
  }

  return colunas;
}

function reordenarLigacoes(nos: NoDoSankey[]) {
  for (const { sourceLinks, targetLinks } of nos) {
    sourceLinks.sort(porAlturaDoDestino);
    targetLinks.sort(porAlturaDaOrigem);
  }
}

function reordenarLigacoesVizinhas({ sourceLinks, targetLinks }: NoDoSankey) {
  targetLinks.forEach(({ source }) => source.sourceLinks.sort(porAlturaDoDestino));
  sourceLinks.forEach(({ target }) => target.targetLinks.sort(porAlturaDaOrigem));
}

/** Altura do destino que deixaria a ligacao horizontal, dado o espaco que as irmas ocupam. */
function topoIdealDoDestino(origem: NoDoSankey, destino: NoDoSankey, espaco: number) {
  let y = origem.y0 - ((origem.sourceLinks.length - 1) * espaco) / 2;

  for (const { target, width } of origem.sourceLinks) {
    if (target === destino) break;
    y += width + espaco;
  }

  for (const { source, width } of destino.targetLinks) {
    if (source === origem) break;
    y -= width;
  }

  return y;
}

function topoIdealDaOrigem(origem: NoDoSankey, destino: NoDoSankey, espaco: number) {
  let y = destino.y0 - ((destino.targetLinks.length - 1) * espaco) / 2;

  for (const { source, width } of destino.targetLinks) {
    if (source === origem) break;
    y += width + espaco;
  }

  for (const { target, width } of origem.sourceLinks) {
    if (target === destino) break;
    y -= width;
  }

  return y;
}

function empurrarParaBaixo(nos: NoDoSankey[], y: number, inicio: number, alfa: number, espaco: number) {
  for (let i = inicio; i < nos.length; ++i) {
    const no = nos[i];
    const dy = (y - no.y0) * alfa;

    if (dy > 1e-6) {
      no.y0 += dy;
      no.y1 += dy;
    }

    y = no.y1 + espaco;
  }
}

function empurrarParaCima(nos: NoDoSankey[], y: number, inicio: number, alfa: number, espaco: number) {
  for (let i = inicio; i >= 0; --i) {
    const no = nos[i];
    const dy = (no.y1 - y) * alfa;

    if (dy > 1e-6) {
      no.y0 -= dy;
      no.y1 -= dy;
    }

    y = no.y0 - espaco;
  }
}

function resolverColisoes(nos: NoDoSankey[], alfa: number, espaco: number, y0: number, y1: number) {
  const meio = nos.length >> 1;
  const referencia = nos[meio];

  empurrarParaCima(nos, referencia.y0 - espaco, meio - 1, alfa, espaco);
  empurrarParaBaixo(nos, referencia.y1 + espaco, meio + 1, alfa, espaco);
  empurrarParaCima(nos, y1, nos.length - 1, alfa, espaco);
  empurrarParaBaixo(nos, y0, 0, alfa, espaco);
}

function relaxarDaEsquerdaParaDireita(
  colunas: NoDoSankey[][],
  alfa: number,
  beta: number,
  espaco: number,
  y0: number,
  y1: number,
) {
  for (let i = 1; i < colunas.length; ++i) {
    const coluna = colunas[i];

    for (const destino of coluna) {
      let y = 0;
      let peso = 0;

      for (const { source, value } of destino.targetLinks) {
        const ponderado = value * (destino.layer - source.layer);
        y += topoIdealDoDestino(source, destino, espaco) * ponderado;
        peso += ponderado;
      }

      if (!(peso > 0)) continue;

      const dy = (y / peso - destino.y0) * alfa;
      destino.y0 += dy;
      destino.y1 += dy;
      reordenarLigacoesVizinhas(destino);
    }

    coluna.sort((a, b) => a.y0 - b.y0);
    resolverColisoes(coluna, beta, espaco, y0, y1);
  }
}

function relaxarDaDireitaParaEsquerda(
  colunas: NoDoSankey[][],
  alfa: number,
  beta: number,
  espaco: number,
  y0: number,
  y1: number,
) {
  for (let i = colunas.length - 2; i >= 0; --i) {
    const coluna = colunas[i];

    for (const origem of coluna) {
      let y = 0;
      let peso = 0;

      for (const { target, value } of origem.sourceLinks) {
        const ponderado = value * (target.layer - origem.layer);
        y += topoIdealDaOrigem(origem, target, espaco) * ponderado;
        peso += ponderado;
      }

      if (!(peso > 0)) continue;

      const dy = (y / peso - origem.y0) * alfa;
      origem.y0 += dy;
      origem.y1 += dy;
      reordenarLigacoesVizinhas(origem);
    }

    coluna.sort((a, b) => a.y0 - b.y0);
    resolverColisoes(coluna, beta, espaco, y0, y1);
  }
}

function posicionarVerticalmente(colunas: NoDoSankey[][], { nodePadding, y0, y1 }: OpcoesDoLeiaute) {
  const espaco = Math.min(nodePadding, (y1 - y0) / (max(colunas, (c) => c.length)! - 1));
  const escala = min(colunas, (c) => (y1 - y0 - (c.length - 1) * espaco) / sum(c, (no) => no.value))!;

  for (const nos of colunas) {
    let y = y0;

    for (const no of nos) {
      no.y0 = y;
      no.y1 = y + no.value * escala;
      y = no.y1 + espaco;
      no.sourceLinks.forEach((ligacao) => {
        ligacao.width = ligacao.value * escala;
      });
    }

    const folga = (y1 - y + espaco) / (nos.length + 1);

    nos.forEach((no, i) => {
      no.y0 += folga * (i + 1);
      no.y1 += folga * (i + 1);
    });
    reordenarLigacoes(nos);
  }

  for (let i = 0; i < ITERACOES; ++i) {
    const alfa = Math.pow(0.99, i);
    const beta = Math.max(1 - alfa, (i + 1) / ITERACOES);

    relaxarDaDireitaParaEsquerda(colunas, alfa, beta, espaco, y0, y1);
    relaxarDaEsquerdaParaDireita(colunas, alfa, beta, espaco, y0, y1);
  }
}

function posicionarLigacoes(nos: NoDoSankey[]) {
  for (const no of nos) {
    let saida = no.y0;
    let entrada = no.y0;

    for (const ligacao of no.sourceLinks) {
      ligacao.y0 = saida + ligacao.width / 2;
      saida += ligacao.width;
    }

    for (const ligacao of no.targetLinks) {
      ligacao.y1 = entrada + ligacao.width / 2;
      entrada += ligacao.width;
    }
  }
}

/**
 * Leiaute do diagrama de Sankey, portado do `d3-sankey` 0.12 sem as opcoes que
 * o `ChartSankey` nao usa. Lanca se o fluxo tem ciclo ou aponta para no ausente.
 */
export function posicionarSankey(opcoes: OpcoesDoLeiaute) {
  const { ligacoes, nos } = criarNosELigacoes(opcoes.labels, opcoes.flows);

  medirProfundidades(nos, 'depth', (no) => no.sourceLinks.map((l) => l.target));
  medirProfundidades(nos, 'height', (no) => no.targetLinks.map((l) => l.source));
  posicionarVerticalmente(distribuirEmColunas(nos, opcoes), opcoes);
  posicionarLigacoes(nos);

  return { links: ligacoes, nodes: nos };
}
