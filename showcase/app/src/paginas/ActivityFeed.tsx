import { ActivityFeed, Card, Timeline } from '@plenustech/design-system';
import { gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina } from '../estrutura/tipos';

interface Acontecimento {
  comentario?: string;
  dataHora: string;
  id: string;
  momento: string;
  texto: string;
}

const ACONTECIMENTOS: Acontecimento[] = [
  { id: 'a', texto: 'Rui Teixeira aprovou o pedido #48209', momento: 'há 12 min', dataHora: '2026-11-09T09:48', comentario: 'Pode liberar, o cliente já confirmou o endereço.' },
  { id: 'b', texto: 'Importação de 112 lançamentos concluída', momento: 'há 1 h', dataHora: '2026-11-09T09:00' },
  { id: 'c', texto: 'Marcos Lima ajustou o estoque de 3 produtos', momento: 'ontem', dataHora: '2026-11-08T17:30', comentario: 'Contagem de fim de expediente.' },
  { id: 'd', texto: 'Ana Lima criou o pedido #48209', momento: '7 de novembro', dataHora: '2026-11-07T11:05' },
  { id: 'e', texto: 'Bruno Reis cadastrou o cliente Mercado Aurora', momento: '5 de novembro', dataHora: '2026-11-05T14:20' },
];

const HISTORICO_DO_PEDIDO: Acontecimento[] = [
  { id: 'entregue', texto: 'Transportadora marcou o pedido como entregue', momento: 'hoje, 10:32', dataHora: '2026-11-09T10:32' },
  { id: 'atraso', texto: 'Rui Teixeira registrou um atraso na entrega', momento: 'ontem, 16:10', dataHora: '2026-11-08T16:10', comentario: 'Caminhão quebrou na estrada. Previsão para amanhã cedo.' },
  { id: 'enviado', texto: 'Marcos Lima enviou o pedido', momento: '6 de novembro', dataHora: '2026-11-06T08:45', comentario: 'Despachado com nota fiscal e etiqueta de fragilidade.' },
  { id: 'criado', texto: 'Ana Lima criou o pedido', momento: '5 de novembro', dataHora: '2026-11-05T09:14' },
];

function Acontecimentos({ lista, comentarios = true, dataHora = true }: { lista: Acontecimento[]; comentarios?: boolean; dataHora?: boolean }) {
  return lista.map(({ id, texto, momento, dataHora: iso, comentario }) => (
    <ActivityFeed.Item
      comment={comentarios ? comentario : undefined}
      dateTime={dataHora ? iso : undefined}
      key={id}
      time={momento}
    >
      {texto}
    </ActivityFeed.Item>
  ));
}

const playground = definirPlayground({
  inicial: { itens: 4, comentarios: true, dataHora: true },
  controles: [
    { tipo: 'numero', nome: 'itens', min: 1, max: ACONTECIMENTOS.length },
    { tipo: 'booleano', nome: 'comentarios' },
    { tipo: 'booleano', nome: 'dataHora' },
  ],
  renderizar: (valores) => (
    <div style={{ width: 320 }}>
      <ActivityFeed aria-label="Atividade recente">
        <Acontecimentos comentarios={valores.comentarios} dataHora={valores.dataHora} lista={ACONTECIMENTOS.slice(0, valores.itens)} />
      </ActivityFeed>
    </div>
  ),
  codigo: (valores) => {
    const itens = ACONTECIMENTOS.slice(0, valores.itens)
      .map(({ texto, momento, dataHora, comentario }) =>
        gerarJsx(
          'ActivityFeed.Item',
          [
            ['time', momento],
            ['dateTime', valores.dataHora ? dataHora : undefined],
            ['comment', valores.comentarios ? comentario : undefined],
          ],
          texto,
        ),
      )
      .join('\n');

    return `<ActivityFeed aria-label="Atividade recente">\n${itens.replace(/^/gm, '  ')}\n</ActivityFeed>`;
  },
});

function AtividadeRecente() {
  return (
    <div style={{ width: 340 }}>
      <Card>
        <Card.Header headingLevel={2} title="Atividade recente" />
        <Card.Body>
          <ActivityFeed aria-label="Atividade recente">
            <Acontecimentos comentarios={false} lista={ACONTECIMENTOS.slice(0, 3)} />
          </ActivityFeed>
        </Card.Body>
      </Card>
    </div>
  );
}

function HistoricoDoPedido() {
  return (
    <div style={{ width: 380 }}>
      <ActivityFeed aria-label="Histórico do pedido #48209">
        <Acontecimentos lista={HISTORICO_DO_PEDIDO} />
      </ActivityFeed>
    </div>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt>Acontecimento</dt>
      <dd>O texto do item: quem fez o quê. Aceita links e destaques, que recebem foco pelo Tab como em qualquer texto.</dd>
      <dt>
        <code>comment</code>
      </dt>
      <dd>Cita um comentário abaixo do momento, e o marcador do item fica oco para destacá-lo na linha.</dd>
      <dt>
        <code>dateTime</code>
      </dt>
      <dd>
        Com a data em ISO 8601, o momento vira um <code>&lt;time&gt;</code> legível por máquina; sem ela, é texto simples.
      </dd>
      <dt>Ordem</dt>
      <dd>A que o produto passar: o componente não ordena. O habitual é do mais recente ao mais antigo.</dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Atividade recente num Card',
      descricao: 'Acontecimentos curtos, sem comentário, no corpo de um cartão com o título.',
      Previa: AtividadeRecente,
      codigo: `<Card>
  <Card.Header title="Atividade recente" />
  <Card.Body>
    <ActivityFeed aria-label="Atividade recente">
      <ActivityFeed.Item time="há 12 min" dateTime="2026-11-09T09:48">Rui Teixeira aprovou o pedido #48209</ActivityFeed.Item>
    </ActivityFeed>
  </Card.Body>
</Card>`,
    },
    {
      titulo: 'Histórico de um pedido, com comentários',
      descricao: 'Os itens com comentário ganham o marcador oco e a citação abaixo do momento.',
      Previa: HistoricoDoPedido,
      codigo: `<ActivityFeed aria-label="Histórico do pedido #48209">
  <ActivityFeed.Item time="ontem, 16:10" comment="Caminhão quebrou na estrada.">
    Rui Teixeira registrou um atraso na entrega
  </ActivityFeed.Item>
</ActivityFeed>`,
    },
  ],
  faca: {
    Previa: () => (
      <div style={{ width: 300 }}>
        <ActivityFeed aria-label="Atividade recente">
          <Acontecimentos comentarios={false} lista={ACONTECIMENTOS.slice(0, 3)} />
        </ActivityFeed>
      </div>
    ),
    texto: 'ActivityFeed para o registro do que aconteceu, do mais recente ao mais antigo.',
  },
  evite: {
    Previa: () => (
      <div style={{ width: 260 }}>
        <Timeline
          current="revisao"
          items={[
            { key: 'rascunho', label: 'Rascunho', date: '12/10/2026' },
            { key: 'revisao', label: 'Aguardando revisão', date: '14/10/2026' },
            { key: 'publicado', label: 'Publicado' },
          ]}
          label="Estados do documento"
        />
      </div>
    ),
    texto: 'ActivityFeed para os estados de um registro com o atual em destaque: isso é a Timeline.',
  },
  Modos,
  teclado: [{ teclas: ['Tab'], acao: 'A lista é estática e não recebe foco; links dentro do texto do acontecimento são alcançados com Tab.' }],
  garantias: [
    {
      garantia: 'Lista ordenada na ordem do produto',
      como: <>Um <code>&lt;ol&gt;</code> com um <code>&lt;li&gt;</code> por item, sem ordenar.</>,
      teste: 'ActivityFeed.test.tsx',
    },
    {
      garantia: 'Momento legível por máquina',
      como: <>Com <code>dateTime</code>, um <code>&lt;time&gt;</code>; sem ele, texto simples.</>,
      teste: 'ActivityFeed.test.tsx',
    },
    {
      garantia: 'Comentário citado',
      como: <>Um <code>&lt;blockquote&gt;</code> abaixo do momento, e o item leva <code>data-comment</code>.</>,
      teste: 'ActivityFeed.test.tsx',
    },
    { garantia: 'Marcador decorativo', como: <>O marcador leva <code>aria-hidden</code>: a lista é lida só pelo texto.</>, teste: 'ActivityFeed.test.tsx' },
    {
      garantia: 'Ref, classe e propriedades nativas',
      como: <>Vão para o <code>&lt;ol&gt;</code> na raiz e para o <code>&lt;li&gt;</code> no item.</>,
      teste: 'ActivityFeed.test.tsx',
    },
  ],
  notaDaApi: (
    <>
      <code>ActivityFeed</code> aceita as propriedades nativas de <code>&lt;ol&gt;</code> e o ref; dê um nome com <code>aria-label</code> quando a
      lista precisar de um. Cada <code>ActivityFeed.Item</code> aceita as de <code>&lt;li&gt;</code>, exceto <code>children</code>, que é o acontecimento.
    </>
  ),
  api: [
    { nome: 'children', tipo: 'ReactNode', descricao: 'Obrigatória, em ActivityFeed.Item. O acontecimento: quem fez o quê.' },
    { nome: 'time', tipo: 'ReactNode', descricao: <>Obrigatória, em <code>ActivityFeed.Item</code>. O momento como o produto o mostra, como &quot;há 12 min&quot;.</> },
    { nome: 'dateTime', tipo: 'string', descricao: <>Data legível por máquina do momento, em ISO 8601. Com ela, o momento vira <code>&lt;time&gt;</code>.</> },
    { nome: 'comment', tipo: 'ReactNode', descricao: 'Comentário citado abaixo do acontecimento. O marcador do item fica oco.' },
  ],
};
