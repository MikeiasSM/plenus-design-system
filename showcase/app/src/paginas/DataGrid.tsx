import { useEffect, useMemo, useState } from 'react';
import { Badge, DataGrid, type DataGridColumn, type DataGridQuery } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

interface Pedido {
  id: string;
  cliente: string;
  cidade: string;
  emissao: string;
  valor: number;
  itens: number;
  urgente: boolean;
  [metrica: `m${number}`]: number;
}

const CLIENTES = ['Atacado Sul', 'Óleos Brasil', 'Casa Norte', 'Mercado Leste', 'Distribuidora Oeste', 'Empório Central'];
const CIDADES = ['São Paulo', 'Curitiba', 'Recife', 'Goiânia', 'Belém', 'Porto Alegre', 'Ribeirão Preto'];

/** Gerador determinístico: a mesma quantidade dá sempre os mesmos pedidos, e a ordenação é conferível. */
function gerarPedidos(quantidade: number, metricas = 0): Pedido[] {
  return Array.from({ length: quantidade }, (_, i) => {
    const semente = (i * 7919) % 10007;
    const pedido: Pedido = {
      id: `P-${String(i + 1).padStart(5, '0')}`,
      cliente: CLIENTES[semente % CLIENTES.length],
      cidade: CIDADES[(semente >> 2) % CIDADES.length],
      emissao: `2026-${String((semente % 12) + 1).padStart(2, '0')}-${String((semente % 28) + 1).padStart(2, '0')}`,
      valor: (semente * 37) % 25000,
      itens: (semente % 40) + 1,
      urgente: semente % 9 === 0,
    };

    for (let m = 1; m <= metricas; m += 1) {
      pedido[`m${m}`] = (semente * (m + 3)) % 1000;
    }

    return pedido;
  });
}

const COLUNAS: DataGridColumn<Pedido>[] = [
  { id: 'id', header: 'Pedido', width: 110 },
  { id: 'cliente', header: 'Cliente', flex: 2, minWidth: 180 },
  { id: 'cidade', header: 'Cidade', minWidth: 140 },
  { id: 'emissao', header: 'Emissão', type: 'date', width: 120 },
  { id: 'itens', header: 'Itens', type: 'number', width: 90 },
  { id: 'valor', header: 'Valor', type: 'currency', width: 140 },
  { id: 'urgente', header: 'Urgente', type: 'boolean', width: 100, searchable: false },
];

function colunasCom(metricas: number): DataGridColumn<Pedido>[] {
  const extras = Array.from({ length: metricas }, (_, i): DataGridColumn<Pedido> => ({
    id: `m${i + 1}`,
    header: `Métrica ${i + 1}`,
    type: 'number',
    width: 110,
  }));

  return [...COLUNAS, ...extras];
}

const idDoPedido = (pedido: Pedido) => pedido.id;

function GradeDoPlayground({
  colunas,
  linhas,
  loading,
  pagination,
  registrar,
  selectionMode,
}: {
  colunas: number;
  linhas: number;
  loading: boolean;
  pagination: boolean;
  registrar: (evento: string) => void;
  selectionMode: 'none' | 'single' | 'multiple';
}) {
  const metricas = Math.max(colunas - COLUNAS.length, 0);
  const pedidos = useMemo(() => gerarPedidos(linhas, metricas), [linhas, metricas]);
  const colunasDaGrade = useMemo(() => colunasCom(metricas), [metricas]);

  return (
    <DataGrid
      columns={colunasDaGrade}
      getRowId={idDoPedido}
      label="Pedidos"
      loading={loading}
      pagination={pagination}
      rows={pedidos}
      selectionMode={selectionMode}
      onSelectedIdsChange={(ids) => registrar(`onSelectedIdsChange: ${ids.length} linhas`)}
      onSortChange={(ordem) => registrar(`onSortChange: ${JSON.stringify(ordem)}`)}
      onStateChange={(retrato) => registrar(`onStateChange: ${JSON.stringify(retrato)}`)}
    >
      <DataGrid.Toolbar>
        <DataGrid.Search />
      </DataGrid.Toolbar>
    </DataGrid>
  );
}

const playground = definirPlayground({
  inicial: { linhas: 10000, colunas: 7, selectionMode: 'multiple', pagination: false, loading: false },
  controles: [
    { tipo: 'numero', nome: 'linhas', min: 0, max: 50000, passo: 1000 },
    { tipo: 'numero', nome: 'colunas', min: 7, max: 30 },
    { tipo: 'opcoes', nome: 'selectionMode', opcoes: ['none', 'single', 'multiple'] },
    { tipo: 'booleano', nome: 'pagination' },
    { tipo: 'booleano', nome: 'loading' },
  ],
  renderizar: (valores, registrar) => (
    <GradeDoPlayground
      colunas={valores.colunas}
      linhas={valores.linhas}
      loading={valores.loading}
      pagination={valores.pagination}
      registrar={registrar}
      selectionMode={valores.selectionMode as 'none' | 'single' | 'multiple'}
    />
  ),
  codigo: (valores) =>
    gerarJsx(
      'DataGrid',
      [
        ['label', 'Pedidos'],
        ['columns', expr('colunas')],
        ['rows', expr('pedidos')],
        ['getRowId', expr('(pedido) => pedido.id')],
        ['selectionMode', valores.selectionMode, 'none'],
        ['pagination', valores.pagination, false],
        ['loading', valores.loading, false],
      ],
      '<DataGrid.Toolbar>\n    <DataGrid.Search />\n  </DataGrid.Toolbar>',
    ),
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      { nivel: 'ok', titulo: 'Grade nomeada', detalhe: 'role="grid" com aria-label, aria-rowcount com o total real e aria-colcount.' },
      { nivel: 'ok', titulo: 'Uma parada de Tab', detalhe: 'O foco anda pelas setas; Tab sai da grade.' },
    ];

    if (valores.linhas > 0) {
      verificacoes.push({
        nivel: 'ok',
        titulo: 'Janela virtual',
        detalhe: 'Só as linhas visíveis e uma margem estão no DOM; cada uma leva aria-rowindex absoluto.',
      });
    }

    if (valores.selectionMode === 'multiple') {
      verificacoes.push({ nivel: 'ok', titulo: 'Seleção múltipla', detalhe: 'aria-multiselectable na grade e aria-selected em cada linha.' });
    }

    return verificacoes;
  },
});

/** Simula um servidor: responde a cada consulta depois de 400 ms. A primeira consulta chega na montagem da grade. */
function ModoServidor() {
  const base = useMemo(() => gerarPedidos(5000), []);
  const [consulta, setConsulta] = useState<DataGridQuery | null>(null);
  const [resposta, setResposta] = useState<{ linhas: Pedido[]; total: number } | null>(null);
  const carregando = resposta === null;

  useEffect(() => {
    if (!consulta) {
      return undefined;
    }

    const termo = consulta.search.trim().toLowerCase();
    const timer = setTimeout(() => {
      const filtrados = termo ? base.filter((pedido) => pedido.cliente.toLowerCase().includes(termo)) : base;
      const [criterio] = consulta.sort;
      const ordenados = criterio
        ? [...filtrados].sort((a, b) => {
            const [va, vb] = [a[criterio.columnId as keyof Pedido], b[criterio.columnId as keyof Pedido]];
            return (va < vb ? -1 : va > vb ? 1 : 0) * (criterio.direction === 'asc' ? 1 : -1);
          })
        : filtrados;
      const inicio = (consulta.page - 1) * consulta.pageSize;
      setResposta({ linhas: ordenados.slice(inicio, inicio + consulta.pageSize), total: ordenados.length });
    }, 400);

    return () => clearTimeout(timer);
  }, [base, consulta]);

  return (
    <DataGrid
      columns={COLUNAS}
      dataMode="server"
      getRowId={idDoPedido}
      height={360}
      label="Pedidos do servidor"
      loading={carregando}
      pagination
      rows={resposta?.linhas ?? []}
      totalRows={resposta?.total ?? 0}
      onQueryChange={(nova) => {
        setResposta(null);
        setConsulta(nova);
      }}
    >
      <DataGrid.Toolbar>
        <DataGrid.Search placeholder="Buscar cliente" />
      </DataGrid.Toolbar>
    </DataGrid>
  );
}

const TONS = { true: 'danger', false: 'neutral' } as const;

function CelulaPropria() {
  const pedidos = useMemo(() => gerarPedidos(200), []);
  const colunas = useMemo<DataGridColumn<Pedido>[]>(
    () =>
      COLUNAS.map((coluna) =>
        coluna.id === 'urgente'
          ? {
              ...coluna,
              width: 120,
              renderCell: ({ row, text }) => <Badge tone={TONS[String(row.urgente) as 'true' | 'false']}>{text}</Badge>,
            }
          : coluna,
      ),
    [],
  );

  return <DataGrid columns={colunas} getRowId={idDoPedido} height={320} label="Pedidos com selo" rows={pedidos} />;
}

function EstadoSalvo() {
  const [retrato, setRetrato] = useState<unknown>(() => {
    try {
      return JSON.parse(sessionStorage.getItem('showcase-datagrid') ?? 'null');
    } catch {
      return null;
    }
  });
  const pedidos = useMemo(() => gerarPedidos(500), []);

  return (
    <div>
      <DataGrid
        columns={COLUNAS}
        getRowId={idDoPedido}
        height={320}
        initialState={retrato}
        label="Pedidos com estado salvo"
        pagination
        rows={pedidos}
        onStateChange={(novo) => {
          setRetrato(novo);
          try {
            sessionStorage.setItem('showcase-datagrid', JSON.stringify(novo));
          } catch {
            // Sem armazenamento, o exemplo só não lembra depois de recarregar.
          }
        }}
      >
        <DataGrid.Toolbar>
          <DataGrid.Search />
        </DataGrid.Toolbar>
      </DataGrid>
      <pre className="note">{JSON.stringify(retrato, null, 2)}</pre>
    </div>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt>Cliente</dt>
      <dd>
        Com <code>rows</code> inteiro, a grade busca, ordena e pagina sozinha. A busca compara o texto exibido, e não o
        valor cru: "1.250,00" acha a moeda que a pessoa vê. A ordenação é estável e deixa os vazios no fim.
      </dd>
      <dt>Servidor</dt>
      <dd>
        Com <code>dataMode="server"</code>, <code>rows</code> é a página atual e <code>totalRows</code> o total. Cada
        mudança de busca, ordem, página ou tamanho chega por <code>onQueryChange</code>, com a página de volta à primeira
        quando a busca ou a ordem mudam.
      </dd>
      <dt>Sem paginação</dt>
      <dd>Todas as linhas rolam na mesma área, desenhadas por janela: só as visíveis e uma margem estão no DOM.</dd>
      <dt>Estado salvo</dt>
      <dd>
        <code>onStateChange</code> entrega um retrato versionado da busca, da ordem e da página; <code>initialState</code>{' '}
        o restaura de uma vez, ignorando o que já não existe, como uma coluna removida. A seleção não entra no retrato.
      </dd>
      <dt>Vazio, carregando e falha</dt>
      <dd>
        Sem linhas, a grade diz que não há registro, ou que nada atende à busca. <code>loading</code> cobre as linhas e
        marca a grade com <code>aria-busy</code>; <code>error</code> aparece no lugar delas, anunciado como alerta.
      </dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Modo servidor',
      descricao: 'Busca, ordem e página vão ao servidor por onQueryChange; a grade mostra o que volta.',
      Previa: ModoServidor,
      largo: true,
      codigo:
        '<DataGrid\n  dataMode="server"\n  rows={resposta.linhas}\n  totalRows={resposta.total}\n  loading={carregando}\n  pagination\n  onQueryChange={buscar}\n  …\n/>',
    },
    {
      titulo: 'Célula própria',
      descricao: 'renderCell recebe a linha, o valor e o texto formatado.',
      Previa: CelulaPropria,
      largo: true,
      codigo: "{\n  id: 'urgente',\n  header: 'Urgente',\n  type: 'boolean',\n  renderCell: ({ row, text }) => <Badge tone={…}>{text}</Badge>,\n}",
    },
    {
      titulo: 'Estado salvo',
      descricao: 'Ordene, busque ou mude de página e recarregue: o retrato volta pelo initialState.',
      Previa: EstadoSalvo,
      largo: true,
      codigo: '<DataGrid\n  initialState={salvo}\n  onStateChange={salvar}\n  …\n/>',
    },
  ],
  Modos,
  teclado: [
    { teclas: ['Tab'], acao: 'Entra na grade pela última célula com foco e sai dela; uma parada só.' },
    { teclas: ['↑', '↓', '←', '→'], acao: 'Anda entre as células, do cabeçalho até a última linha.' },
    { teclas: ['Home', 'End'], acao: 'Primeira e última célula da linha.' },
    { teclas: ['Ctrl+Home', 'Ctrl+End'], acao: 'Primeira célula do cabeçalho e última da grade.' },
    { teclas: ['PageUp', 'PageDown'], acao: 'Uma tela de linhas para cima ou para baixo.' },
    { teclas: ['Enter'], acao: 'No cabeçalho, ordena; com Shift, soma a coluna à ordem. Na célula, entra no controle dela.' },
    { teclas: ['F2'], acao: 'Entra no controle da célula.' },
    { teclas: ['Esc'], acao: 'Sai do controle e volta à célula.' },
    { teclas: ['Espaço'], acao: 'Seleciona a linha; com Shift, a faixa desde a última. No cabeçalho, todas.' },
  ],
  garantias: [
    {
      garantia: 'Grade nomeada',
      como: <>role=&quot;grid&quot;, <code>aria-rowcount</code> com o total real e <code>aria-rowindex</code> absoluto.</>,
      teste: 'DataGrid.test.tsx',
    },
    {
      garantia: 'Ordem anunciada',
      como: <><code>aria-sort</code> no cabeçalho e região viva: "Ordenado por Total, crescente".</>,
      teste: 'DataGrid.test.tsx',
    },
    {
      garantia: 'Uma parada de Tab',
      como: 'Tabindex móvel: só a célula com foco recebe 0, e ela continua montada fora da janela virtual.',
      teste: 'DataGrid.test.tsx',
    },
    {
      garantia: 'Dois modos de teclado',
      como: 'Enter ou F2 entra no controle da célula; Esc volta; Tab circula dentro dela.',
      teste: 'DataGrid.test.tsx',
    },
  ],
  notaDaApi:
    'Cada fatia de estado vem no trio valor, padrão e aviso: sort, search, page, pageSize e selectedIds. Além destas, as propriedades nativas de <div>.',
  api: [
    { nome: 'label', tipo: 'string', descricao: 'Obrigatória. Nome da grade.' },
    { nome: 'columns', tipo: 'DataGridColumn<Row>[]', descricao: 'Obrigatória. Colunas como dados: id, header, type, largura e slots.' },
    { nome: 'rows', tipo: 'readonly Row[]', descricao: 'Obrigatória. Todas as linhas, ou a página atual no modo servidor.' },
    { nome: 'getRowId', tipo: '(row: Row) => string', descricao: 'Obrigatória. Chave estável de cada linha.' },
    { nome: 'dataMode', tipo: "'client' | 'server'", padrao: "'client'", descricao: 'Quem busca, ordena e pagina.' },
    { nome: 'totalRows', tipo: 'number', descricao: 'Total de linhas no modo servidor.' },
    { nome: 'onQueryChange', tipo: '(query: DataGridQuery) => void', descricao: 'No modo servidor, a consulta a cada mudança.' },
    { nome: 'sort', tipo: 'DataGridSortItem[]', descricao: 'Ordem em vários níveis: { columnId, direction }.' },
    { nome: 'search', tipo: 'string', descricao: 'Busca global sobre o texto exibido.' },
    { nome: 'pagination', tipo: 'boolean', padrao: 'false', descricao: 'Divide em páginas, com a paginação no rodapé.' },
    { nome: 'page', tipo: 'number', descricao: 'Página atual, a partir de 1.' },
    { nome: 'pageSize', tipo: 'number', padrao: 'pageSizeOptions[0]', descricao: 'Linhas por página.' },
    { nome: 'pageSizeOptions', tipo: 'readonly number[]', padrao: '[25, 50, 100]', descricao: 'Tamanhos oferecidos no rodapé.' },
    { nome: 'selectionMode', tipo: "'none' | 'single' | 'multiple'", padrao: "'none'", descricao: 'Caixa de seleção na primeira coluna.' },
    { nome: 'selectedIds', tipo: 'readonly string[]', descricao: 'Linhas selecionadas, pelas chaves.' },
    { nome: 'initialState', tipo: 'unknown', descricao: 'Retrato salvo, aplicado de uma vez na montagem.' },
    { nome: 'onStateChange', tipo: '(snapshot: DataGridSnapshot) => void', descricao: 'Retrato versionado a cada mudança.' },
    { nome: 'loading', tipo: 'boolean', padrao: 'false', descricao: 'Cobre as linhas e marca aria-busy.' },
    { nome: 'error', tipo: 'ReactNode', descricao: 'Falha mostrada no lugar das linhas.' },
    { nome: 'emptyMessage', tipo: 'ReactNode', descricao: 'Texto da grade vazia.' },
    { nome: 'height', tipo: 'number', padrao: '480', descricao: 'Altura da área rolável, em pixels.' },
  ],
};
