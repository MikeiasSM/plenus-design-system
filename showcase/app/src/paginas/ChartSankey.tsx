import {
  ChartSankey,
  formatNumber,
  type ChartSankeyAlign,
  type ChartSankeyFlow,
  type ChartSankeyFlowColor,
  type ChartSankeyFlowValuePosition,
} from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';
import { OPCOES_DE_ACCENT, accentDa, formatarCompacto, FORMATOS } from '../dadosDosGraficos';

const RESULTADO: ChartSankeyFlow[] = [
  { source: 'Receita bruta', target: 'Deduções', value: 420000 },
  { source: 'Receita bruta', target: 'Receita líquida', value: 2580000 },
  { source: 'Receita líquida', target: 'CMV', value: 960000 },
  { source: 'Receita líquida', target: 'Margem bruta', value: 1620000 },
  { source: 'Margem bruta', target: 'Despesas', value: 502000 },
  { source: 'Margem bruta', target: 'Resultado', value: 1118000 },
];

// O fluxo desvia para uma etapa intermediária e volta a se encontrar colunas adiante, então as ligações se cruzam.
const ANALISE_DE_PROPOSTAS: ChartSankeyFlow[] = [
  { source: 'Propostas recebidas', target: 'Análise automática', value: 7400 },
  { source: 'Propostas recebidas', target: 'Análise manual', value: 1600 },
  { source: 'Análise automática', target: 'Aprovado', value: 4900 },
  { source: 'Análise automática', target: 'Análise manual', value: 1300 },
  { source: 'Análise automática', target: 'Recusado', value: 1200 },
  { source: 'Análise manual', target: 'Aprovado', value: 1150 },
  { source: 'Análise manual', target: 'Pendente de documento', value: 980 },
  { source: 'Análise manual', target: 'Recusado', value: 770 },
  { source: 'Pendente de documento', target: 'Aprovado', value: 610 },
  { source: 'Pendente de documento', target: 'Recusado', value: 370 },
  { source: 'Aprovado', target: 'Contratado', value: 5480 },
  { source: 'Aprovado', target: 'Desistiu', value: 1180 },
  { source: 'Contratado', target: 'Adimplente', value: 4930 },
  { source: 'Contratado', target: 'Inadimplente', value: 550 },
];

// Cada nó tem um pai só: nada se cruza.
const JORNADA_DE_COBRANCA: ChartSankeyFlow[] = [
  { source: 'Faturas emitidas', target: 'Enviadas', value: 4712 },
  { source: 'Faturas emitidas', target: 'Falha no envio', value: 108 },
  { source: 'Enviadas', target: 'Boleto aberto', value: 3980 },
  { source: 'Enviadas', target: 'Não aberto', value: 732 },
  { source: 'Boleto aberto', target: 'Pago no prazo', value: 2640 },
  { source: 'Boleto aberto', target: 'Pago em atraso', value: 890 },
  { source: 'Boleto aberto', target: 'Vencido', value: 450 },
  { source: 'Vencido', target: 'Negociado', value: 312 },
  { source: 'Vencido', target: 'Protestado', value: 138 },
  { source: 'Negociado', target: 'Quitado após acordo', value: 241 },
  { source: 'Negociado', target: 'Inadimplente do acordo', value: 71 },
];

const FLUXOS = {
  analiseDePropostas: ANALISE_DE_PROPOSTAS,
  jornadaDeCobranca: JORNADA_DE_COBRANCA,
  fluxoDoResultado: RESULTADO,
};

const playground = definirPlayground({
  inicial: {
    title: 'Análise de propostas',
    flows: 'analiseDePropostas',
    nodeAlign: 'justify',
    flowColor: 'source',
    showFlowValues: false,
    flowValuePosition: 'end',
    showLabels: true,
    nodeWidth: 12,
    nodePadding: 12,
    accent: 'nenhuma',
    formatValue: 'compacto',
    formatTooltipValue: 'igual',
  },
  controles: [
    { tipo: 'texto', nome: 'title' },
    { tipo: 'opcoes', nome: 'flows', opcoes: Object.keys(FLUXOS) },
    { tipo: 'opcoes', nome: 'nodeAlign', opcoes: ['justify', 'left', 'right', 'center'] },
    { tipo: 'opcoes', nome: 'flowColor', opcoes: ['source', 'target', 'neutral'] },
    { tipo: 'booleano', nome: 'showFlowValues' },
    { tipo: 'opcoes', nome: 'flowValuePosition', opcoes: ['start', 'middle', 'end'] },
    { tipo: 'booleano', nome: 'showLabels' },
    { tipo: 'numero', nome: 'nodeWidth', min: 2, max: 32 },
    { tipo: 'numero', nome: 'nodePadding', min: 0, max: 40 },
    { tipo: 'opcoes', nome: 'accent', opcoes: OPCOES_DE_ACCENT },
    { tipo: 'opcoes', nome: 'formatValue', opcoes: Object.keys(FORMATOS) },
    { tipo: 'opcoes', nome: 'formatTooltipValue', opcoes: ['igual', ...Object.keys(FORMATOS)] },
  ],
  renderizar: (valores) => (
    <div style={{ width: '100%' }}>
      <ChartSankey
        accent={accentDa(valores.accent)}
        flowColor={valores.flowColor as ChartSankeyFlowColor}
        flowValuePosition={valores.flowValuePosition as ChartSankeyFlowValuePosition}
        flows={FLUXOS[valores.flows as keyof typeof FLUXOS]}
        formatTooltipValue={FORMATOS[valores.formatTooltipValue]?.formatar}
        formatValue={FORMATOS[valores.formatValue].formatar}
        height={valores.flows === 'fluxoDoResultado' ? 320 : 420}
        nodeAlign={valores.nodeAlign as ChartSankeyAlign}
        nodePadding={valores.nodePadding}
        nodeWidth={valores.nodeWidth}
        showFlowValues={valores.showFlowValues}
        showLabels={valores.showLabels}
        title={valores.title}
      />
    </div>
  ),
  codigo: (valores) =>
    gerarJsx('ChartSankey', [
      ['title', valores.title],
      ['flows', expr(valores.flows)],
      ['nodeAlign', valores.nodeAlign, 'justify'],
      ['flowColor', valores.flowColor, 'source'],
      ['showFlowValues', valores.showFlowValues, false],
      ['flowValuePosition', valores.flowValuePosition, 'end'],
      ['showLabels', valores.showLabels, true],
      ['nodeWidth', valores.nodeWidth, 12],
      ['nodePadding', valores.nodePadding, 12],
      ['height', valores.flows === 'fluxoDoResultado' ? 320 : 420, 320],
      ['accent', accentDa(valores.accent)],
      ['formatValue', expr(FORMATOS[valores.formatValue].codigo)],
      ['formatTooltipValue', FORMATOS[valores.formatTooltipValue] && expr(FORMATOS[valores.formatTooltipValue].codigo)],
    ]),
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      valores.title.trim()
        ? { nivel: 'ok', titulo: 'Nome acessível', detalhe: `O desenho é role="img" nomeado por "${valores.title.trim()}".` }
        : { nivel: 'falha', titulo: 'Sem título', detalhe: 'O title nomeia o gráfico para o leitor de tela. Sem ele, a imagem fica sem nome.' },
    ];

    if (valores.flows === 'analiseDePropostas' && valores.flowColor !== 'neutral') {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Ligações que se cruzam',
        detalhe: 'Com tanto cruzamento, flowColor="neutral" deixa a estrutura mais legível.',
      });
    }

    if (valores.showFlowValues && valores.flowValuePosition === 'start') {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Valor junto ao rótulo',
        detalhe: 'Em start o valor disputa espaço com o rótulo da origem; o que cruzaria um rótulo é omitido.',
      });
    }

    if (!valores.showLabels) {
      verificacoes.push({ nivel: 'atencao', titulo: 'Nós sem nome na tela', detalhe: 'O aria-label e o <title> de cada marca continuam; a leitura visual depende do ponteiro.' });
    }

    return verificacoes;
  },
});

function Modos() {
  return (
    <div className="stack">
      <dl className="modes">
        <dt>Nós e ligações</dt>
        <dd>
          A altura do nó é o volume que passa por ele, e a espessura da ligação é o valor dela. Sem <code>nodes</code>, os
          nós saem das próprias ligações; com ele, o produto decide ordem e aparência.
        </dd>
        <dt>Ponteiro</dt>
        <dd>A ligação sob o ponteiro sobe um degrau de tom e as demais apagam.</dd>
        <dt>Rótulos</dt>
        <dd>
          Sempre à direita do nó. O do nó de saída cai numa banda reservada; os demais, sobre o próprio fluxo, com um halo
          que os separa do que passa por baixo. Sem rótulos, a banda deixa de existir e o fluxo ocupa a largura toda.
        </dd>
        <dt><code>nodeAlign</code></dt>
        <dd>
          Onde os nós sem saída se encostam: em <code>justify</code> vão para a borda direita, em <code>left</code> ficam
          onde a contagem de passos os coloca.
        </dd>
        <dt><code>flowValuePosition</code></dt>
        <dd>
          <code>end</code> é o padrão porque nunca disputa espaço com o rótulo da origem. Em qualquer posição, o valor que
          cruzaria um rótulo é omitido, e continua no <code>aria-label</code> da ligação.
        </dd>
      </dl>
      <div className="subsection">
        <h3>Fluxo com ciclo</h3>
        <ChartSankey
          flows={[
            { source: 'Em análise', target: 'Devolvido', value: 40 },
            { source: 'Devolvido', target: 'Em análise', value: 25 },
          ]}
          title="Propostas devolvidas"
        />
        <p className="note">
          Um diagrama de fluxo é acíclico. O ciclo, e também o autolaço, é anunciado com <code>cyclicMessage</code> em vez
          de derrubar a página ou descartar ligações pelas costas.
        </p>
      </div>
    </div>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Da receita ao resultado',
      descricao: 'Cada passo da DRE reparte o que chega: a espessura é o valor que segue por ali.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartSankey flows={RESULTADO} formatValue={formatarCompacto} title="Fluxo do resultado" />
        </div>
      ),
      codigo: `<ChartSankey
  title="Fluxo do resultado"
  flows={[
    { source: 'Receita bruta', target: 'Deduções', value: 420000 },
    { source: 'Receita bruta', target: 'Receita líquida', value: 2580000 },
    { source: 'Receita líquida', target: 'CMV', value: 960000 },
    { source: 'Receita líquida', target: 'Margem bruta', value: 1620000 },
    { source: 'Margem bruta', target: 'Despesas', value: 502000 },
    { source: 'Margem bruta', target: 'Resultado', value: 1118000 },
  ]}
  formatValue={formatarCompacto}
/>`,
    },
    {
      titulo: 'Desvio e reencontro',
      descricao: 'Aprovado e Recusado recebem de três colunas cada um; com o cruzamento, a cor neutra lê melhor.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartSankey
            flowColor="neutral"
            flows={ANALISE_DE_PROPOSTAS}
            formatValue={formatNumber}
            height={420}
            title="Análise de propostas"
          />
        </div>
      ),
      codigo: `<ChartSankey
  title="Análise de propostas"
  flows={analiseDePropostas}
  flowColor="neutral"
  height={420}
/>`,
    },
    {
      titulo: 'Fluxo em árvore, com valores',
      descricao: 'Cada nó tem um pai só, então nenhuma ligação cruza outra; showFlowValues escreve o valor no fim de cada uma.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartSankey flows={JORNADA_DE_COBRANCA} formatValue={formatNumber} height={380} showFlowValues title="Jornada de cobrança" />
        </div>
      ),
      codigo: `<ChartSankey
  title="Jornada de cobrança"
  flows={jornadaDeCobranca}
  showFlowValues
  height={380}
/>`,
    },
  ],
  Modos,
  garantias: [
    { garantia: 'Nome acessível', como: <>O desenho é <code>role=&quot;img&quot;</code>, nomeado pelo <code>title</code>.</>, teste: 'ChartSankey.test.tsx' },
    {
      garantia: 'Descrição da ligação',
      como: <><code>aria-label</code> e <code>&lt;title&gt;</code> com origem, destino e valor.</>,
      teste: 'ChartSankey.test.tsx',
    },
    { garantia: 'Proporção', como: 'Altura do nó e espessura da ligação proporcionais ao volume.', teste: 'ChartSankey.test.tsx' },
    { garantia: 'Sem sobreposição', como: 'O valor que cruzaria o rótulo de um nó é omitido.', teste: 'ChartSankey.test.tsx' },
    { garantia: 'Ciclo anunciado', como: 'Ciclo e autolaço viram mensagem, em vez de derrubar a árvore.', teste: 'ChartSankey.test.tsx' },
    { garantia: 'Ausência anunciada', como: 'Sem ligações, ou com todas valendo zero, um EmptyState.', teste: 'ChartSankey.test.tsx' },
  ],
  api: [
    { nome: 'title', tipo: 'string', descricao: 'Título visível e nome acessível do gráfico.' },
    { nome: 'flows', tipo: 'readonly ChartSankeyFlow[]', descricao: <><code>{'{ source, target, value }'}</code>, uma por ligação.</> },
    { nome: 'nodes', tipo: 'readonly ChartSankeyNode[]', descricao: <>Ordem e aparência dos nós, <code>{'{ label, color?, intent? }'}</code>. Sem ela, saem das ligações.</> },
    { nome: 'nodeAlign', tipo: "'justify' | 'left' | 'right' | 'center'", padrao: "'justify'", descricao: 'Onde os nós sem saída se encostam.' },
    { nome: 'flowColor', tipo: "'source' | 'target' | 'neutral'", padrao: "'source'", descricao: 'De onde a ligação tira a cor.' },
    { nome: 'showFlowValues', tipo: 'boolean', padrao: 'false', descricao: 'Valor escrito em cada ligação.' },
    { nome: 'flowValuePosition', tipo: "'start' | 'middle' | 'end'", padrao: "'end'", descricao: 'Onde o valor da ligação é escrito.' },
    { nome: 'showLabels', tipo: 'boolean', padrao: 'true', descricao: 'Rótulo de cada nó.' },
    { nome: 'nodeWidth', tipo: 'number', padrao: '12', descricao: 'Largura do nó.' },
    { nome: 'nodePadding', tipo: 'number', padrao: '12', descricao: 'Folga vertical entre dois nós da mesma coluna.' },
    { nome: 'formatValue', tipo: '(value: number) => string', padrao: 'formatNumber', descricao: 'Formato dos valores e das descrições.' },
    { nome: 'accent', tipo: 'string', descricao: 'Cor de tema que abre a paleta categórica dos nós.' },
    { nome: 'height', tipo: "number | 'fill'", padrao: '320', descricao: 'Altura do desenho; fill a toma do contêiner.' },
    { nome: 'cyclicMessage', tipo: 'string', padrao: "'O fluxo volta sobre si mesmo e não pode ser desenhado'", descricao: 'Mensagem quando o fluxo tem ciclo.' },
    { nome: 'emptyMessage', tipo: 'string', padrao: "'Sem dados no período'", descricao: 'Texto do estado vazio.' },
    { nome: 'palette', tipo: 'ChartPalette', descricao: <>Lista de cores em rotação, ou <code>{'{ base }'}</code>, que gera os tons. Vence o <code>accent</code>.</> },
    { nome: 'onFlowClick', tipo: '(flow: ChartSankeyFlow) => void', descricao: 'Torna as ligações botões, percorridos pelas setas; o foco realça a faixa e abre o balão.' },
    { nome: 'onNodeClick', tipo: '(node: ChartSankeyNodeClick) => void', descricao: 'Torna os nós botões, numa linha abaixo das ligações; recebe o rótulo e o total que passa pelo nó.' },
  ],
};
