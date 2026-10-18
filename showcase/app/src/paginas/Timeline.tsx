import {
  Steps,
  Timeline,
  type TimelineItem,
} from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const FLUXO_DE_PUBLICACAO: TimelineItem[] = [
  { key: 'rascunho', label: 'Rascunho', description: 'Criado por Ana Lima', date: '12/10/2026 09:14' },
  { key: 'revisao', label: 'Aguardando revisão', description: 'Com Bruno Reis', date: '14/10/2026 16:02' },
  { key: 'publicado', label: 'Publicado', description: 'Visível para todos os leitores' },
];

const CHAVES = FLUXO_DE_PUBLICACAO.map((estado) => estado.key);

function itensDoPlayground(descricoes: boolean, datas: boolean) {
  return FLUXO_DE_PUBLICACAO.map(({ key, label, description, date }) => ({
    key,
    label,
    description: descricoes ? description : undefined,
    date: datas ? date : undefined,
  }));
}

const playground = definirPlayground({
  inicial: { label: 'Fluxo de publicação', current: 'revisao', descricoes: true, datas: true },
  controles: [
    { tipo: 'texto', nome: 'label' },
    { tipo: 'opcoes', nome: 'current', opcoes: CHAVES },
    { tipo: 'booleano', nome: 'descricoes' },
    { tipo: 'booleano', nome: 'datas' },
  ],
  renderizar: (valores) => (
    <div style={{ width: 280 }}>
      <Timeline current={valores.current} items={itensDoPlayground(valores.descricoes, valores.datas)} label={valores.label} />
    </div>
  ),
  codigo: (valores) =>
    gerarJsx('Timeline', [
      ['label', valores.label],
      ['items', expr('estados')],
      ['current', valores.current],
    ]),
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      valores.label.trim()
        ? { nivel: 'ok', titulo: 'Lista nomeada', detalhe: `<ol aria-label="${valores.label.trim()}">.` }
        : { nivel: 'falha', titulo: 'Lista sem nome', detalhe: 'label é obrigatório: diz ao leitor de tela do que é a linha do tempo.' },
      {
        nivel: 'ok',
        titulo: 'Estado anunciado',
        detalhe: 'O atual leva aria-current="step" e ", atual"; os anteriores, ", concluído" para o leitor de tela.',
      },
    ];

    return verificacoes;
  },
});

function PainelDoDocumento() {
  return (
    <div className="demo-box" style={{ width: 300 }}>
      <strong>Fluxo de publicação</strong>
      <Timeline current="revisao" items={FLUXO_DE_PUBLICACAO} label="Fluxo de publicação" />
    </div>
  );
}

function Variantes() {
  return (
    <div>
      {CHAVES.map((chave) => (
        <div className="subsection" key={chave}>
          <h3>
            <code>current=&quot;{chave}&quot;</code>
          </h3>
          <div style={{ width: 280 }}>
            <Timeline current={chave} items={FLUXO_DE_PUBLICACAO} label={`Fluxo de publicação, em ${chave}`} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt>Estados</dt>
      <dd>
        Os anteriores ao atual contam como concluídos, com o visto; o atual fica em destaque e leva{' '}
        <code>aria-current=&quot;step&quot;</code>; os seguintes ficam apagados, por vir.
      </dd>
      <dt>Sem atual</dt>
      <dd>
        Com um <code>current</code> que não está na lista, todos os itens ficam por vir.
      </dd>
      <dt>Data e descrição</dt>
      <dd>Opcionais, abaixo do rótulo. A data é texto livre, já formatada pelo produto.</dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Fluxo de publicação no painel do documento',
      descricao: 'A Timeline só mostra em que estado o documento está; mudar de estado é ação do produto.',
      Previa: PainelDoDocumento,
      codigo: '<Timeline label="Fluxo de publicação" items={estados} current={documento.estado} />',
    },
  ],
  faca: {
    Previa: () => (
      <div style={{ width: 260 }}>
        <Timeline current="revisao" items={FLUXO_DE_PUBLICACAO} label="Fluxo de publicação" />
      </div>
    ),
    texto: 'Timeline para acompanhar os estados por que algo passa, sem que a pessoa navegue entre eles.',
  },
  evite: {
    Previa: () => (
      <div style={{ width: '100%' }}>
        <Steps
          current="servidor"
          items={[
            { key: 'conta', label: 'Conta' },
            { key: 'servidor', label: 'Servidor' },
            { key: 'teste', label: 'Teste' },
          ]}
          label="Etapas do e-mail"
        />
      </div>
    ),
    texto: 'Timeline para as etapas de um formulário que a pessoa preenche: isso é o Steps, que é navegação.',
  },
  Variantes,
  Modos,
  teclado: [{ teclas: ['Tab'], acao: 'Não recebe foco: é informação, sem controles.' }],
  garantias: [
    {
      garantia: 'Lista ordenada nomeada',
      como: <>Um <code>&lt;ol&gt;</code> com <code>aria-label</code>.</>,
      teste: 'Timeline.test.tsx',
    },
    {
      garantia: 'Estado atual',
      como: <><code>aria-current=&quot;step&quot;</code> e &quot;, atual&quot; no item atual.</>,
      teste: 'Timeline.test.tsx',
    },
    { garantia: 'Concluídos anunciados', como: 'Os anteriores somam ", concluído" ao texto, não só o visto.', teste: 'Timeline.test.tsx' },
  ],
  notaDaApi: 'Além destas, as propriedades nativas de <ol> e o ref, exceto children.',
  api: [
    {
      nome: 'items',
      tipo: 'readonly TimelineItem[]',
      descricao: <>Cada estado: <code>key</code>, <code>label</code>, <code>description</code> e <code>date</code>.</>,
    },
    { nome: 'current', tipo: 'string', descricao: 'Obrigatória. Chave do estado atual.' },
    { nome: 'label', tipo: 'string', descricao: 'Obrigatório. Nome da lista, para o leitor de tela.' },
  ],
};
