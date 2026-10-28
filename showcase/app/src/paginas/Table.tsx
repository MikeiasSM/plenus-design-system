import { useState, type ComponentProps } from 'react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Menu,
  Pagination,
  Progress,
  Table,
  type TableSelectionControl,
  type TableSelectionMode,
  type TableSize,
  type TableSort,
} from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

interface Membro {
  email: string;
  funcao: string;
  id: string;
  nome: string;
  status: string;
}

const equipe: Membro[] = [
  { id: '1', nome: 'Ana Prado', email: 'ana@plenustech.com', funcao: 'Administradora', status: 'Ativo' },
  { id: '2', nome: 'Bruno Dias', email: 'bruno@plenustech.com', funcao: 'Editor', status: 'Convidado' },
  { id: '3', nome: 'Célia Nunes', email: 'celia@plenustech.com', funcao: 'Leitora', status: 'Ativo' },
  { id: '4', nome: 'Diego Alves', email: 'diego@plenustech.com', funcao: 'Editor', status: 'Convidado' },
];

const vendas = [
  { id: 'v1', pedido: '#1042', cliente: 'Comércio Aurora', progresso: 100, valor: 'R$ 12.400,00' },
  { id: 'v2', pedido: '#1043', cliente: 'Indústria Belo', progresso: 60, valor: 'R$ 8.150,00' },
  { id: 'v3', pedido: '#1044', cliente: 'Transportes Cruz', progresso: 25, valor: 'R$ 3.720,00' },
];

const MODOS_DE_SELECAO = ['none', 'single', 'multiple'] as const;
const CONTROLES = ['padrão', 'checkbox', 'radio', 'toggle'] as const;
const TAMANHOS = ['md', 'sm'] as const;

function ordenar(membros: readonly Membro[], ordem: TableSort) {
  const campo = ordem.column === 'status' ? 'status' : 'nome';

  return [...membros].sort((a, b) => {
    const comparacao = a[campo].localeCompare(b[campo], 'pt-BR');
    return ordem.direction === 'ascending' ? comparacao : -comparacao;
  });
}

function PessoaNaCelula({ membro }: { membro: Membro }) {
  return (
    <div className="cell-person">
      <Avatar name={membro.nome} size="sm" />
      <div>
        <b>{membro.nome}</b>
        <span>{membro.email}</span>
      </div>
    </div>
  );
}

interface TabelaDoPlaygroundProps {
  controle: (typeof CONTROLES)[number];
  divider: boolean;
  highlightSelectedRow: boolean;
  loading: boolean;
  registrar: (evento: string) => void;
  rotulosNasLinhas: boolean;
  selectionMode: TableSelectionMode;
  size: TableSize;
  striped: boolean;
  vazia: boolean;
}

function TabelaDoPlayground({ controle, registrar, rotulosNasLinhas, vazia, ...props }: TabelaDoPlaygroundProps) {
  const [ordem, setOrdem] = useState<TableSort>({ column: 'nome', direction: 'ascending' });
  const membros = vazia ? [] : ordenar(equipe, ordem);

  function mudarOrdem(nova: TableSort) {
    setOrdem(nova);
    registrar(`onSortChange: ${nova.column} ${nova.direction}`);
  }

  return (
    <div style={{ width: '100%' }}>
      <Card>
        <Card.Body flush>
          <Table
            {...props}
            label="Membros da equipe"
            onSelectedIdsChange={(ids) => registrar(`onSelectedIdsChange: [${ids.join(', ')}]`)}
            onSortChange={mudarOrdem}
            rows={membros}
            selectionControl={controle === 'padrão' ? undefined : (controle as TableSelectionControl)}
            sort={ordem}
          >
            <Table.Header>
              <Table.Column id="nome" sortable>Nome</Table.Column>
              <Table.Column help="Define o que a pessoa pode fazer" hideBelow="sm" id="funcao">Função</Table.Column>
              <Table.Column id="status" sortable>Status</Table.Column>
            </Table.Header>
            <Table.Body items={membros}>
              {(membro) => (
                <Table.Row id={membro.id} label={rotulosNasLinhas ? `Selecionar ${membro.nome}` : undefined}>
                  <Table.Cell>
                    <PessoaNaCelula membro={membro} />
                  </Table.Cell>
                  <Table.Cell>{membro.funcao}</Table.Cell>
                  <Table.Cell>
                    <Badge tone={membro.status === 'Ativo' ? 'success' : 'warning'}>{membro.status}</Badge>
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
}

const playground = definirPlayground({
  inicial: {
    selectionMode: 'multiple',
    selectionControl: 'padrão',
    size: 'md',
    striped: false,
    divider: true,
    highlightSelectedRow: true,
    rotulosNasLinhas: true,
    loading: false,
    vazia: false,
  },
  controles: [
    { tipo: 'opcoes', nome: 'selectionMode', opcoes: MODOS_DE_SELECAO },
    { tipo: 'opcoes', nome: 'selectionControl', opcoes: CONTROLES },
    { tipo: 'opcoes', nome: 'size', opcoes: TAMANHOS },
    { tipo: 'booleano', nome: 'striped' },
    { tipo: 'booleano', nome: 'divider' },
    { tipo: 'booleano', nome: 'highlightSelectedRow' },
    { tipo: 'booleano', nome: 'rotulosNasLinhas' },
    { tipo: 'booleano', nome: 'loading' },
    { tipo: 'booleano', nome: 'vazia' },
  ],
  renderizar: (valores, registrar) => (
    <TabelaDoPlayground
      controle={valores.selectionControl as (typeof CONTROLES)[number]}
      divider={valores.divider}
      highlightSelectedRow={valores.highlightSelectedRow}
      key={`${valores.selectionMode}-${valores.selectionControl}`}
      loading={valores.loading}
      registrar={registrar}
      rotulosNasLinhas={valores.rotulosNasLinhas}
      selectionMode={valores.selectionMode as TableSelectionMode}
      size={valores.size as TableSize}
      striped={valores.striped}
      vazia={valores.vazia}
    />
  ),
  codigo: (valores) => {
    const rotulo = valores.rotulosNasLinhas ? ' label={`Selecionar ${membro.nome}`}' : '';

    return gerarJsx(
      'Table',
      [
        ['label', 'Membros da equipe'],
        ['rows', valores.selectionMode === 'none' ? undefined : expr('membros')],
        ['selectionMode', valores.selectionMode, 'none'],
        ['selectionControl', valores.selectionControl === 'padrão' ? undefined : valores.selectionControl],
        ['size', valores.size, 'md'],
        ['striped', valores.striped, false],
        ['divider', valores.divider, true],
        ['highlightSelectedRow', valores.highlightSelectedRow, true],
        ['loading', valores.loading, false],
        ['sort', expr('ordem')],
        ['onSortChange', expr('setOrdem')],
      ],
      `<Table.Header>
  <Table.Column id="nome" sortable>Nome</Table.Column>
  <Table.Column id="funcao" help="Define o que a pessoa pode fazer" hideBelow="sm">
    Função
  </Table.Column>
  <Table.Column id="status" sortable>Status</Table.Column>
</Table.Header>
<Table.Body items={membrosOrdenados}>
  {(membro) => (
    <Table.Row id={membro.id}${rotulo}>
      <Table.Cell>{membro.nome}</Table.Cell>
      <Table.Cell>{membro.funcao}</Table.Cell>
      <Table.Cell>{membro.status}</Table.Cell>
    </Table.Row>
  )}
</Table.Body>`,
    );
  },
  verificar: (valores) => {
    const comSelecao = valores.selectionMode !== 'none';
    const verificacoes: Verificacao[] = [
      { nivel: 'ok', titulo: 'Tabela nomeada', detalhe: '"Membros da equipe", pelo label.' },
      { nivel: 'ok', titulo: 'Ordenação anunciada', detalhe: 'aria-sort nas colunas ordenáveis; quem reordena os dados é o produto.' },
    ];

    if (comSelecao && !valores.rotulosNasLinhas) {
      verificacoes.push({
        nivel: 'falha',
        titulo: 'Controles sem distinção',
        detalhe: 'Sem label em Table.Row, toda linha se chama "Selecionar linha". Use o nome do registro.',
      });
    }

    if (comSelecao && valores.rotulosNasLinhas) {
      verificacoes.push({ nivel: 'ok', titulo: 'Controles nomeados', detalhe: '"Selecionar Ana Prado", e assim por diante.' });
    }

    if (valores.selectionMode === 'multiple' && valores.selectionControl === 'radio') {
      verificacoes.push({ nivel: 'atencao', titulo: 'Radio na seleção múltipla', detalhe: 'O radio promete uma escolha só. Na múltipla, use checkbox ou toggle.' });
    }

    if (valores.loading) {
      verificacoes.push({ nivel: 'ok', titulo: 'Carregando', detalhe: 'aria-busy na tabela, esqueleto fora da leitura e "Carregando" por role="status".' });
    } else if (valores.vazia) {
      verificacoes.push({ nivel: 'ok', titulo: 'Vazio anunciado', detalhe: 'Ocupa a largura da tabela; o marcar todas fica desabilitado.' });
    }

    return verificacoes;
  },
});

function EquipeEmCartao() {
  const [ordem, setOrdem] = useState<TableSort>({ column: 'nome', direction: 'ascending' });
  const [escolhidos, setEscolhidos] = useState<readonly string[]>([]);
  const [pagina, setPagina] = useState(1);

  return (
    <div style={{ width: '100%' }}>
      <Card>
        <Card.Header
          badge={<Badge>{equipe.length}</Badge>}
          description="Gerencie quem tem acesso ao espaço de trabalho."
          title="Membros da equipe"
          trailing={<Button size="sm">Convidar</Button>}
        />
        <Card.Body flush>
          <Table
            label="Membros da equipe"
            onSelectedIdsChange={setEscolhidos}
            onSortChange={setOrdem}
            rows={equipe}
            selectionMode="multiple"
            sort={ordem}
          >
            <Table.Header>
              <Table.Column id="nome" sortable>Nome</Table.Column>
              <Table.Column help="Define o que a pessoa pode fazer" id="funcao">Função</Table.Column>
              <Table.Column id="status" sortable>Status</Table.Column>
              <Table.Column align="end" hideBelow="md" id="acoes">Ações</Table.Column>
            </Table.Header>
            <Table.Body items={ordenar(equipe, ordem)}>
              {(membro) => (
                <Table.Row id={membro.id} label={`Selecionar ${membro.nome}`}>
                  <Table.Cell>
                    <PessoaNaCelula membro={membro} />
                  </Table.Cell>
                  <Table.Cell>{membro.funcao}</Table.Cell>
                  <Table.Cell>
                    <Badge tone={membro.status === 'Ativo' ? 'success' : 'warning'}>{membro.status}</Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Menu
                      items={[
                        { key: 'editar', label: 'Editar' },
                        { key: 'remover', label: 'Remover' },
                      ]}
                      label={`Ações de ${membro.nome}`}
                    >
                      <Button size="sm" variant="secondary">Ações</Button>
                    </Menu>
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
        </Card.Body>
        <Card.Footer>
          <span className="note">{escolhidos.length} selecionados</span>
          <Pagination onPageChange={setPagina} page={pagina} pageCount={5} />
        </Card.Footer>
      </Card>
    </div>
  );
}

function VendasCompactas() {
  return (
    <div style={{ width: '100%' }}>
      <Card>
        <Card.Body flush>
          <Table divider={false} label="Vendas" rows={vendas} selectionMode="single" size="sm" striped>
            <Table.Header>
              <Table.Column id="pedido">Pedido</Table.Column>
              <Table.Column id="cliente">Cliente</Table.Column>
              <Table.Column hideBelow="sm" id="entrega">Entrega</Table.Column>
              <Table.Column id="valor" numeric>Valor</Table.Column>
            </Table.Header>
            <Table.Body items={vendas}>
              {(venda) => (
                <Table.Row id={venda.id} label={`Selecionar ${venda.pedido}`}>
                  <Table.Cell>{venda.pedido}</Table.Cell>
                  <Table.Cell>{venda.cliente}</Table.Cell>
                  <Table.Cell>
                    <Progress label={`Entrega de ${venda.pedido}`} size="sm" value={venda.progresso} />
                  </Table.Cell>
                  <Table.Cell>{venda.valor}</Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
}

function ArquivosSemDados({ carregando }: { carregando: boolean }) {
  return (
    <Card>
      <Card.Header description={carregando ? 'Carregando.' : 'Sem registros.'} title="Arquivos" />
      <Card.Body flush>
        <Table label={carregando ? 'Arquivos carregando' : 'Arquivos vazios'} loading={carregando}>
          <Table.Header>
            <Table.Column id="arquivo">Arquivo</Table.Column>
            <Table.Column align="end" id="tamanho">Tamanho</Table.Column>
          </Table.Header>
          <Table.Body items={[] as { id: string; nome: string }[]}>
            {(arquivo) => (
              <Table.Row id={arquivo.id}>
                <Table.Cell>{arquivo.nome}</Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table>
      </Card.Body>
    </Card>
  );
}

function TabelaCurta({ titulo, ...props }: Partial<ComponentProps<typeof Table>> & { titulo: string }) {
  return (
    <div className="subsection">
      <h3>{titulo}</h3>
      <Card>
        <Card.Body flush>
          <Table {...props} label={titulo} rows={vendas}>
            <Table.Header>
              <Table.Column id="pedido">Pedido</Table.Column>
              <Table.Column id="valor" numeric>Valor</Table.Column>
            </Table.Header>
            <Table.Body items={vendas}>
              {(venda) => (
                <Table.Row id={venda.id} label={`Selecionar ${venda.pedido}`}>
                  <Table.Cell>{venda.pedido}</Table.Cell>
                  <Table.Cell>{venda.valor}</Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
}

function TabelaSimples() {
  return (
    <Table label="Pedidos">
      <Table.Header>
        <Table.Column id="pedido">Pedido</Table.Column>
        <Table.Column id="cliente">Cliente</Table.Column>
      </Table.Header>
      <Table.Body items={vendas}>
        {(venda) => (
          <Table.Row id={venda.id}>
            <Table.Cell>{venda.pedido}</Table.Cell>
            <Table.Cell>{venda.cliente}</Table.Cell>
          </Table.Row>
        )}
      </Table.Body>
    </Table>
  );
}

function Variantes() {
  return (
    <div className="demo-grid">
      <TabelaCurta titulo="md, com divisor" />
      <TabelaCurta size="sm" titulo="sm" />
      <TabelaCurta divider={false} striped titulo="striped, sem divisor" />
      <TabelaCurta defaultSelectedIds={['v1', 'v2']} selectionMode="multiple" titulo="checkbox" />
      <TabelaCurta defaultSelectedIds={['v1']} selectionMode="single" titulo="radio" />
      <TabelaCurta defaultSelectedIds={['v1']} selectionControl="toggle" selectionMode="single" titulo="toggle" />
    </div>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt>Ordenação</dt>
      <dd>
        É estado, não algoritmo. A tabela guarda a coluna e a direção, declara <code>aria-sort</code> e avisa por{' '}
        <code>onSortChange</code>; quem reordena as linhas é o produto ou o servidor. Com <code>sort</code>, a tabela segue o
        valor recebido; com <code>defaultSort</code>, guarda a própria.
      </dd>
      <dt>Seleção</dt>
      <dd>
        A coluna de seleção é do componente: radio na escolha única, caixa na múltipla, chave com{' '}
        <code>selectionControl=&quot;toggle&quot;</code>. Shift + clique marca a faixa; o cabeçalho marca todas e fica
        indeterminado na escolha parcial. <code>highlightSelectedRow</code> desliga o fundo da linha marcada.
      </dd>
      <dt>Vazio</dt>
      <dd>
        Diz que não achou nada e sugere rever a busca. <code>emptyTitle</code> e <code>emptyDescription</code> trocam os dois
        textos.
      </dd>
      <dt><code>loading</code></dt>
      <dd>
        As linhas viram esqueleto, na mesma quantidade das que estavam na tela, para a página não pular. A tabela fica com{' '}
        <code>aria-busy</code> e o leitor de tela ouve <code>loadingMessage</code>.
      </dd>
      <dt><code>hideBelow</code></dt>
      <dd>
        Descarta a coluna abaixo de 900px (<code>sm</code>), 1180px (<code>md</code>) ou 1280px (<code>lg</code>). A célula
        herda da coluna da mesma posição, como <code>align</code> e <code>numeric</code>.
      </dd>
      <dt><code>help</code></dt>
      <dd>Ícone de ajuda focável ao lado do título da coluna, com a dica no Tooltip, fora do botão de ordenação.</dd>
      <dt><code>stickyHeader</code></dt>
      <dd>
        O cabeçalho cola na rolagem da página enquanto a tabela cabe; se ela transbordar, na rolagem da própria tabela.
      </dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Equipe em cartão',
      descricao: 'Seleção múltipla, ordenação, ajuda na coluna Função e Ações que somem abaixo de 1180px.',
      Previa: EquipeEmCartao,
      codigo: `<Card>
  <Card.Header
    title="Membros da equipe"
    badge={<Badge>{membros.length}</Badge>}
    trailing={<Button size="sm">Convidar</Button>}
  />
  <Card.Body flush>
    <Table
      label="Membros da equipe"
      rows={membros}
      selectionMode="multiple"
      onSelectedIdsChange={setEscolhidos}
      sort={ordem}
      onSortChange={setOrdem}
    >
      <Table.Header>
        <Table.Column id="nome" sortable>Nome</Table.Column>
        <Table.Column id="funcao" help="Define o que a pessoa pode fazer">Função</Table.Column>
        <Table.Column id="status" sortable>Status</Table.Column>
        <Table.Column id="acoes" align="end" hideBelow="md">Ações</Table.Column>
      </Table.Header>
      <Table.Body items={membrosOrdenados}>
        {(membro) => (
          <Table.Row id={membro.id} label={\`Selecionar \${membro.nome}\`}>
            …
          </Table.Row>
        )}
      </Table.Body>
    </Table>
  </Card.Body>
  <Card.Footer>
    <span>{escolhidos.length} selecionados</span>
    <Pagination page={pagina} pageCount={5} onPageChange={setPagina} />
  </Card.Footer>
</Card>`,
    },
    {
      titulo: 'Vendas compactas',
      descricao: 'sm, zebra e sem divisor, com seleção única. O valor sai à direita e em mono porque a coluna é numeric.',
      Previa: VendasCompactas,
      codigo: `<Table label="Vendas" rows={vendas} size="sm" striped divider={false} selectionMode="single">
  <Table.Header>
    <Table.Column id="pedido">Pedido</Table.Column>
    <Table.Column id="cliente">Cliente</Table.Column>
    <Table.Column id="entrega" hideBelow="sm">Entrega</Table.Column>
    <Table.Column id="valor" numeric>Valor</Table.Column>
  </Table.Header>
  <Table.Body items={vendas}>
    {(venda) => (
      <Table.Row id={venda.id} label={\`Selecionar \${venda.pedido}\`}>
        <Table.Cell>{venda.pedido}</Table.Cell>
        <Table.Cell>{venda.cliente}</Table.Cell>
        <Table.Cell>
          <Progress label={\`Entrega de \${venda.pedido}\`} size="sm" value={venda.progresso} />
        </Table.Cell>
        <Table.Cell>{venda.valor}</Table.Cell>
      </Table.Row>
    )}
  </Table.Body>
</Table>`,
    },
    {
      titulo: 'Sem registros e carregando',
      descricao: 'O vazio desenhado, e o esqueleto com a mensagem só para o leitor de tela.',
      Previa: () => (
        <div className="demo-grid">
          <ArquivosSemDados carregando={false} />
          <ArquivosSemDados carregando />
        </div>
      ),
      codigo: `<Table label="Arquivos" loading={carregando}>
  <Table.Header>
    <Table.Column id="arquivo">Arquivo</Table.Column>
    <Table.Column id="tamanho" align="end">Tamanho</Table.Column>
  </Table.Header>
  <Table.Body items={arquivos}>
    {(arquivo) => (
      <Table.Row id={arquivo.id}>
        <Table.Cell>{arquivo.nome}</Table.Cell>
        <Table.Cell>{arquivo.tamanho}</Table.Cell>
      </Table.Row>
    )}
  </Table.Body>
</Table>`,
    },
  ],
  faca: {
    Previa: () => (
      <div style={{ width: '100%' }}>
        <Card>
          <Card.Body flush>
            <TabelaSimples />
          </Card.Body>
        </Card>
      </div>
    ),
    texto: 'A tabela dentro de um contêiner com borda, normalmente um Card com o corpo flush.',
  },
  evite: {
    Previa: () => (
      <div style={{ width: '100%' }}>
        <TabelaSimples />
      </div>
    ),
    texto: 'A tabela solta na página: ela não desenha contorno, e a faixa do cabeçalho fica sem linha em cima.',
  },
  Variantes,
  Modos,
  teclado: [
    { teclas: ['Tab'], acao: 'Percorre os controles: marcar todas, a seleção de cada linha, a ordenação, a ajuda das colunas e o que houver nas células.' },
    { teclas: ['Enter', 'Espaço'], acao: 'No título da coluna ordenável, alterna a direção.' },
    { teclas: ['Espaço'], acao: 'Marca ou desmarca a caixa, o radio ou a chave da linha.' },
  ],
  garantias: [
    { garantia: 'Marcação tabular', como: <><code>table</code> nativa, nomeada por <code>label</code>.</>, teste: 'Table.test.tsx' },
    { garantia: 'Ordenação anunciada', como: <><code>aria-sort</code> só nas colunas ordenáveis.</>, teste: 'Table.test.tsx' },
    { garantia: 'Ajuda sem ponteiro', como: 'O ícone de ajuda é focável e nomeado pelo texto da dica.', teste: 'Table.test.tsx' },
    { garantia: 'Seleção', como: 'Controles nativos nomeados pelo label da linha; marcar todas com estado indeterminado.', teste: 'Table.test.tsx' },
    { garantia: 'Grupos de radio', como: 'Duas tabelas na mesma página não viram um grupo só.', teste: 'selecao.test.tsx' },
    { garantia: 'Carregamento', como: <><code>aria-busy</code>, mensagem por <code>role=&quot;status&quot;</code> e esqueleto com <code>aria-hidden</code>.</>, teste: 'Table.test.tsx' },
    { garantia: 'Vazio', como: 'Uma célula que ocupa todas as colunas.', teste: 'Table.test.tsx' },
  ],
  notaDaApi: 'A Table aceita também as propriedades nativas de <div> e o ref, no envoltório de rolagem.',
  api: [
    { nome: 'label', tipo: 'string', descricao: 'Nome acessível da tabela.' },
    { nome: 'rows', tipo: 'readonly TableRowItem[]', padrao: '[]', descricao: <>As linhas que a seleção conhece, com <code>id</code> e <code>disabled</code>.</> },
    { nome: 'selectionMode', tipo: "'none' | 'single' | 'multiple'", padrao: "'none'", descricao: 'Liga a coluna de seleção.' },
    { nome: 'selectionControl', tipo: "'checkbox' | 'radio' | 'toggle'", descricao: 'Sem ele, radio na única e checkbox na múltipla.' },
    { nome: 'selectedIds', tipo: 'readonly string[]', descricao: 'Seleção controlada.' },
    { nome: 'defaultSelectedIds', tipo: 'readonly string[]', descricao: 'Seleção inicial, no modo não controlado.' },
    { nome: 'onSelectedIdsChange', tipo: '(ids: readonly string[]) => void', descricao: 'Recebe os ids marcados.' },
    { nome: 'onSelectionChange', tipo: '(ids: readonly string[]) => void', descricao: <>Obsoleto: use <code>onSelectedIdsChange</code>.</> },
    { nome: 'highlightSelectedRow', tipo: 'boolean', padrao: 'true', descricao: 'Fundo na linha marcada.' },
    { nome: 'sort', tipo: 'TableSort', descricao: <>Ordenação controlada: <code>{'{ column, direction }'}</code>.</> },
    { nome: 'defaultSort', tipo: 'TableSort', descricao: 'Ordenação inicial, no modo não controlado.' },
    { nome: 'onSortChange', tipo: '(sort: TableSort) => void', descricao: 'Avisa a nova ordenação; os dados são reordenados pelo produto.' },
    { nome: 'size', tipo: "'sm' | 'md'", padrao: "'md'", descricao: 'Linhas de 48 ou 60px.' },
    { nome: 'striped', tipo: 'boolean', padrao: 'false', descricao: 'Fundo alternado nas linhas.' },
    { nome: 'divider', tipo: 'boolean', padrao: 'true', descricao: 'Linha entre as linhas.' },
    { nome: 'stickyHeader', tipo: 'boolean', padrao: 'false', descricao: 'Cabeçalho colado no topo da rolagem.' },
    { nome: 'loading', tipo: 'boolean', padrao: 'false', descricao: 'Esqueleto no lugar das linhas.' },
    { nome: 'loadingMessage', tipo: 'string', padrao: "'Carregando'", descricao: 'Mensagem para o leitor de tela.' },
    { nome: 'Table.Column id', tipo: 'string', descricao: 'Obrigatório. Identifica a coluna na ordenação.' },
    { nome: 'Table.Column sortable', tipo: 'boolean', padrao: 'false', descricao: 'Título vira botão de ordenação.' },
    { nome: 'Table.Column numeric', tipo: 'boolean', padrao: 'false', descricao: 'Valor à direita, em mono com dígitos alinhados.' },
    { nome: 'Table.Column align', tipo: "'start' | 'center' | 'end'", descricao: 'Alinhamento; sem ele, end se numeric, senão start.' },
    { nome: 'Table.Column help', tipo: 'string', descricao: 'Texto da ajuda ao lado do título.' },
    { nome: 'Table.Column hideBelow', tipo: "'sm' | 'md' | 'lg'", descricao: 'Esconde a coluna abaixo do breakpoint.' },
    { nome: 'Table.Column width', tipo: 'string', descricao: 'Largura da coluna.' },
    { nome: 'Table.Body items', tipo: 'readonly T[]', descricao: <>Obrigatório. Cada item com <code>id</code>.</> },
    { nome: 'Table.Body children', tipo: '(item: T) => ReactNode', descricao: 'Obrigatório. Desenha a linha de cada item.' },
    { nome: 'Table.Body emptyTitle', tipo: 'string', padrao: "'Nenhum registro encontrado'", descricao: 'Título do vazio.' },
    { nome: 'Table.Body emptyDescription', tipo: 'string', descricao: 'Texto do vazio; o padrão sugere rever a busca e os filtros.' },
    { nome: 'Table.Row id', tipo: 'string', descricao: 'Obrigatório. Chave da linha e da seleção.' },
    { nome: 'Table.Row label', tipo: 'string', padrao: "'Selecionar linha'", descricao: 'Nome do controle de seleção da linha.' },
    { nome: 'Table.Row disabled', tipo: 'boolean', padrao: 'false', descricao: 'Desabilita o controle de seleção.' },
    { nome: 'Table.Cell align, numeric, hideBelow', tipo: 'TableAlign, boolean, TableBreakpoint', descricao: 'Os mesmos da coluna; sem valor próprio, seguem a coluna da mesma posição.' },
  ],
};
