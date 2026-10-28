import { useState } from 'react';
import {
  ChartTooltip,
  ChartTreemap,
  formatarMoeda,
  type ChartHoveredNode,
  type ChartLegendAlign,
  type ChartLegendPosition,
  type ChartTreemapNode,
} from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';
import { DESPESAS, OPCOES_DE_ACCENT, TOTAL_DE_DESPESAS, accentDa, formatarCompacto, FORMATOS } from '../dadosDosGraficos';

const PRODUTOS_POR_MARGEM: ChartTreemapNode[] = [
  {
    label: 'Acima',
    intent: 'positive',
    children: [
      { label: 'Consultoria', value: 420000 },
      { label: 'Implantação', value: 260000 },
      { label: 'Treinamento', value: 120000 },
    ],
  },
  {
    label: 'No limite',
    intent: 'warning',
    children: [
      { label: 'Suporte', value: 180000 },
      { label: 'Manutenção', value: 90000 },
    ],
  },
  { label: 'Abaixo', intent: 'negative', children: [{ label: 'Revenda de hardware', value: 140000 }] },
];

const NOMES_DAS_MARGENS = {
  positive: 'Margem acima da meta',
  warning: 'Margem no limite',
  negative: 'Margem abaixo da meta',
};

const playground = definirPlayground({
  inicial: {
    title: 'Estrutura de despesas',
    dados: 'despesas',
    intentLabels: false,
    gap: 5,
    showDataLabels: true,
    legend: 'bottom',
    legendAlign: 'center',
    accent: 'nenhuma',
    formatValue: 'compacto',
    formatTooltipValue: 'igual',
  },
  controles: [
    { tipo: 'texto', nome: 'title' },
    { tipo: 'opcoes', nome: 'dados', opcoes: ['despesas', 'margem'] },
    { tipo: 'booleano', nome: 'intentLabels' },
    { tipo: 'numero', nome: 'gap', min: 0, max: 16 },
    { tipo: 'booleano', nome: 'showDataLabels' },
    { tipo: 'opcoes', nome: 'legend', opcoes: ['top', 'right', 'bottom', 'left', 'none'] },
    { tipo: 'opcoes', nome: 'legendAlign', opcoes: ['left', 'center', 'right'] },
    { tipo: 'opcoes', nome: 'accent', opcoes: OPCOES_DE_ACCENT },
    { tipo: 'opcoes', nome: 'formatValue', opcoes: Object.keys(FORMATOS) },
    { tipo: 'opcoes', nome: 'formatTooltipValue', opcoes: ['igual', ...Object.keys(FORMATOS)] },
  ],
  renderizar: (valores, registrar) => (
    <div style={{ width: '100%' }}>
      <ChartTreemap
        accent={accentDa(valores.accent)}
        formatTooltipValue={FORMATOS[valores.formatTooltipValue]?.formatar}
        formatValue={FORMATOS[valores.formatValue].formatar}
        gap={valores.gap}
        intentLabels={valores.intentLabels ? NOMES_DAS_MARGENS : undefined}
        legend={valores.legend as ChartLegendPosition}
        legendAlign={valores.legendAlign as ChartLegendAlign}
        nodes={valores.dados === 'margem' ? PRODUTOS_POR_MARGEM : DESPESAS}
        onHiddenGroupsChange={(ocultos) => registrar(`onHiddenGroupsChange: [${ocultos.join(', ')}]`)}
        onHoverNode={(caminho) => registrar(`onHoverNode: ${caminho ? caminho.map((nivel) => nivel.label).join(' › ') : null}`)}
        showDataLabels={valores.showDataLabels}
        title={valores.title}
      />
    </div>
  ),
  codigo: (valores) =>
    gerarJsx('ChartTreemap', [
      ['title', valores.title],
      ['nodes', expr(valores.dados === 'margem' ? 'produtosPorMargem' : 'despesas')],
      ['intentLabels', valores.intentLabels ? expr('nomesDasMargens') : undefined],
      ['gap', valores.gap, 5],
      ['showDataLabels', valores.showDataLabels, true],
      ['legend', valores.legend, 'bottom'],
      ['legendAlign', valores.legendAlign, 'center'],
      ['accent', accentDa(valores.accent)],
      ['formatValue', expr(FORMATOS[valores.formatValue].codigo)],
      ['formatTooltipValue', FORMATOS[valores.formatTooltipValue] && expr(FORMATOS[valores.formatTooltipValue].codigo)],
      ['onHoverNode', expr('setCaminho')],
    ]),
  verificar: (valores) => {
    const porStatus = valores.dados === 'margem';
    const verificacoes: Verificacao[] = [
      valores.title.trim()
        ? { nivel: 'ok', titulo: 'Nome acessível', detalhe: `O desenho é role="img" nomeado por "${valores.title.trim()}".` }
        : { nivel: 'falha', titulo: 'Sem título', detalhe: 'O title nomeia o gráfico para o leitor de tela. Sem ele, a imagem fica sem nome.' },
    ];

    if (porStatus && !valores.intentLabels) {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Cor sem explicação',
        detalhe: 'A cor carrega status, e a legenda lista os grupos. Com intentLabels, ela nomeia o significado das cores.',
      });
    }

    if (!porStatus && valores.intentLabels) {
      verificacoes.push({
        nivel: 'falha',
        titulo: 'Legenda de cores ausentes',
        detalhe: 'Os grupos não declaram intent: a legenda nomeia cores que o mapa não usa e deixa de desligar grupos.',
      });
    }

    if (porStatus && accentDa(valores.accent)) {
      verificacoes.push({ nivel: 'ok', titulo: 'Cor de tema ignorada', detalhe: 'Grupos com intent mantêm a cor de status.' });
    }

    if (valores.gap === 0) {
      verificacoes.push({ nivel: 'atencao', titulo: 'Sem folga', detalhe: 'As folhas de um grupo têm a mesma cor: sem gap, os retângulos vizinhos se fundem.' });
    }

    return verificacoes;
  },
});

function CaminhoNoPonteiro() {
  const [caminho, setCaminho] = useState<readonly ChartHoveredNode[] | null>(null);

  return (
    <div style={{ width: '100%' }}>
      <ChartTooltip
        columns={[{ format: formatarMoeda }]}
        computed={{ compute: (valor) => valor / TOTAL_DE_DESPESAS }}
        rows={(caminho ?? []).map((nivel, indice, niveis) => ({
          emphasis: indice === niveis.length - 1,
          label: nivel.label,
          values: [nivel.value],
        }))}
        subtitle="Valor e fatia do total de despesas"
        title={caminho?.at(-1)?.label}
      >
        <ChartTreemap showTooltip={false} formatValue={formatarCompacto} nodes={DESPESAS} onHoverNode={setCaminho} title="Estrutura de despesas" />
      </ChartTooltip>
    </div>
  );
}

function Modos() {
  return (
    <div className="stack">
      <dl className="modes">
        <dt>Cor</dt>
        <dd>
          A folha herda a cor do grupo; a <code>intent</code> ou a <code>color</code> própria vencem a herdada. O texto sobre
          o retângulo usa o token de texto daquela cor.
        </dd>
        <dt><code>intentLabels</code></dt>
        <dd>
          Quando a cor carrega status, a legenda passa a nomear as cores, e não os grupos. Sem ele, lista os grupos e
          desliga cada um, redistribuindo a área.
        </dd>
        <dt><code>showDataLabels</code></dt>
        <dd>
          Rótulo e valor são cortados conforme a área: onde não cabe o valor, fica só o rótulo; onde não cabe nem o rótulo,
          fica só a área.
        </dd>
        <dt><code>onHoverNode</code></dt>
        <dd>
          Entrega o caminho do grupo até o retângulo sob o ponteiro, cada nível com o valor somado. Com ele, o{' '}
          <code>&lt;title&gt;</code> sai.
        </dd>
      </dl>
      <div className="subsection">
        <h3>Sem dados</h3>
        <ChartTreemap nodes={[]} title="Estrutura de despesas" />
        <p className="note">Sem nenhum valor positivo, o gráfico anuncia a ausência em vez de desenhar um mapa vazio.</p>
      </div>
    </div>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Colorido por status',
      descricao: 'Com intentLabels, a legenda explica o significado das cores, e não a categoria.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartTreemap
            formatValue={formatarCompacto}
            height={300}
            intentLabels={NOMES_DAS_MARGENS}
            nodes={PRODUTOS_POR_MARGEM}
            title="Produtos por margem"
          />
        </div>
      ),
      codigo: `<ChartTreemap
  title="Produtos por margem"
  nodes={[
    { label: 'Acima', intent: 'positive', children: [{ label: 'Consultoria', value: 420000 }, ...] },
    { label: 'No limite', intent: 'warning', children: [{ label: 'Suporte', value: 180000 }, ...] },
    { label: 'Abaixo', intent: 'negative', children: [{ label: 'Revenda de hardware', value: 140000 }] },
  ]}
  intentLabels={{
    positive: 'Margem acima da meta',
    warning: 'Margem no limite',
    negative: 'Margem abaixo da meta',
  }}
  height={300}
  formatValue={formatarCompacto}
/>`,
    },
    {
      titulo: 'Grupos categóricos',
      descricao: 'Sem status, a legenda lista os grupos e desliga cada um; a área se redistribui.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartTreemap formatValue={formatarCompacto} nodes={DESPESAS} title="Estrutura de despesas" />
        </div>
      ),
      codigo: `<ChartTreemap
  title="Estrutura de despesas"
  nodes={[
    { label: 'Operacionais', children: [{ label: 'Pessoal', value: 520000 }, ...] },
    { label: 'Administrativas', children: [{ label: 'Sistemas', value: 160000 }, ...] },
    { label: 'Financeiras', children: [{ label: 'Juros', value: 120000 }] },
  ]}
  formatValue={formatarCompacto}
/>`,
    },
    {
      titulo: 'Caminho no ponteiro',
      descricao: 'onHoverNode entrega grupo e folha com os valores somados; a última linha, a do retângulo, sobe de tom.',
      Previa: CaminhoNoPonteiro,
      codigo: `const [caminho, setCaminho] = useState<readonly ChartHoveredNode[] | null>(null);

<ChartTooltip
  title={caminho?.at(-1)?.label}
  subtitle="Valor e fatia do total de despesas"
  columns={[{ format: formatarMoeda }]}
  computed={{ compute: (valor) => valor / totalDeDespesas }}
  rows={(caminho ?? []).map((nivel, indice, niveis) => ({
    emphasis: indice === niveis.length - 1,
    label: nivel.label,
    values: [nivel.value],
  }))}
>
  <ChartTreemap showTooltip={false} title="Estrutura de despesas" nodes={despesas} onHoverNode={setCaminho} />
</ChartTooltip>`,
    },
  ],
  Modos,
  teclado: [
    { teclas: ['Tab'], acao: 'Percorre as entradas da legenda, que são botões quando listam os grupos. O desenho não recebe foco.' },
    { teclas: ['Enter', 'Espaço'], acao: 'Liga ou desliga o grupo da entrada focada; aria-pressed acompanha.' },
  ],
  garantias: [
    { garantia: 'Nome acessível', como: <>O desenho é <code>role=&quot;img&quot;</code>, nomeado pelo <code>title</code>.</>, teste: 'ChartTreemap.test.tsx' },
    {
      garantia: 'Descrição da folha',
      como: <><code>aria-label</code> com rótulo e valor; sem costura, também no <code>&lt;title&gt;</code>.</>,
      teste: 'ChartTreemap.test.tsx',
    },
    { garantia: 'Legenda com sentido', como: 'Nomeia as cores com intentLabels; sem ele, lista e desliga os grupos.', teste: 'ChartTreemap.test.tsx' },
    { garantia: 'Contraste do rótulo', como: <>Rótulo e valor usam o token <code>chart.on-*</code> da cor do retângulo.</>, teste: 'check:contraste' },
    { garantia: 'Volta pela legenda', como: 'Com todos os grupos desligados, nenhum bloco é desenhado e a legenda fica.', teste: 'ChartTreemap.test.tsx' },
    { garantia: 'Ausência anunciada', como: 'Sem valor positivo, um EmptyState no lugar do desenho.', teste: 'ChartTreemap.test.tsx' },
  ],
  api: [
    { nome: 'title', tipo: 'string', descricao: 'Título visível e nome acessível do gráfico.' },
    {
      nome: 'nodes',
      tipo: 'readonly ChartTreemapNode[]',
      descricao: <><code>{'{ label, value?, children?, color?, intent? }'}</code>; o nó sem value vale a soma dos filhos.</>,
    },
    { nome: 'intentLabels', tipo: 'Partial<Record<SeriesIntent, string>>', descricao: 'Nome de cada intenção; troca a legenda de grupos pela de cores.' },
    { nome: 'gap', tipo: 'number', padrao: '5', descricao: 'Folga entre dois retângulos vizinhos.' },
    { nome: 'showDataLabels', tipo: 'boolean', padrao: 'true', descricao: 'Rótulo e valor dentro do retângulo, onde couberem.' },
    { nome: 'formatValue', tipo: '(value: number) => string', padrao: 'formatarNumero', descricao: 'Formato do valor nos rótulos e nas descrições.' },
    { nome: 'formatTooltipValue', tipo: '(value: number) => string', padrao: 'formatValue', descricao: 'Formato dos valores no balão: o eixo pode sair compacto e o balão, exato.' },
    { nome: 'accent', tipo: 'string', descricao: 'Cor de tema que abre a paleta categórica dos grupos.' },
    { nome: 'height', tipo: "number | 'fill'", padrao: '280', descricao: 'Altura do desenho; fill a toma do contêiner.' },
    { nome: 'legend', tipo: "'top' | 'bottom' | 'left' | 'right' | 'none'", padrao: "'bottom'", descricao: 'Posição da legenda.' },
    { nome: 'legendAlign', tipo: "'left' | 'center' | 'right'", padrao: "'center'", descricao: 'Apoio da legenda horizontal.' },
    { nome: 'hiddenGroups', tipo: 'readonly string[]', descricao: 'Grupos ocultos, pelo rótulo, no modo controlado.' },
    { nome: 'defaultHiddenGroups', tipo: 'readonly string[]', descricao: 'Grupos ocultos de início, no modo não controlado.' },
    { nome: 'onHiddenGroupsChange', tipo: '(hidden: readonly string[]) => void', descricao: 'Avisa cada mudança feita pela legenda.' },
    {
      nome: 'onHoverNode',
      tipo: '(path: readonly ChartHoveredNode[] | null) => void',
      descricao: 'Caminho do grupo ao nó sob o ponteiro, com os valores somados; costura para o ChartTooltip.',
    },
    { nome: 'emptyMessage', tipo: 'string', padrao: "'Sem dados no período'", descricao: 'Texto do estado vazio.' },
    { nome: 'palette', tipo: 'ChartPalette', descricao: <>Lista de cores em rotação, ou <code>{'{ base }'}</code>, que gera os tons. Vence o <code>accent</code>.</> },
    { nome: 'onNodeClick', tipo: '(path: readonly ChartHoveredNode[]) => void', descricao: 'Torna os retângulos botões; o clique entrega o caminho do grupo até o nó.' },
  ],
};
