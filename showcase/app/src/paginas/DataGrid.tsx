import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Badge,
  ButtonIcon,
  ChartBar,
  DataGrid,
  formatDate,
  IconChartBar,
  SegmentedControl,
  type DataGridAsidePlacement,
  type DataGridColumn,
  type DataGridDetailContext,
  type DataGridQuery,
  type DataGridRowClickAction,
} from '@plenustech/design-system';
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

interface Item {
  id: string;
  produto: string;
  quantidade: number;
  unitario: number;
  total: number;
}

interface Entrega {
  id: string;
  data: string;
  quantidade: number;
  nota: string;
}

const PRODUTOS = ['Cabo flexível 2,5 mm', 'Disjuntor 20 A', 'Luva PVC 25 mm', 'Tinta acrílica 18 L', 'Lâmpada LED 9 W', 'Tomada 10 A'];

function sementeDe(id: string) {
  return [...id].reduce((soma, letra) => (soma * 31 + letra.charCodeAt(0)) % 10007, 7);
}

function itensDe(pedido: Pedido): Item[] {
  const semente = sementeDe(pedido.id);

  return Array.from({ length: (semente % 5) + 2 }, (_, i) => {
    const quantidade = ((semente + i * 13) % 40) + 2;
    const unitario = ((semente * (i + 3)) % 18000) / 100 + 5;
    return {
      id: `${pedido.id}-${i + 1}`,
      produto: PRODUTOS[(semente + i) % PRODUTOS.length],
      quantidade,
      unitario,
      total: Math.round(quantidade * unitario * 100) / 100,
    };
  });
}

function entregasDe(item: Item): Entrega[] {
  const semente = sementeDe(item.id);
  const partes = (semente % 4) + 1;

  return Array.from({ length: partes }, (_, i) => ({
    id: `${item.id}-${i + 1}`,
    data: `2026-10-${String(((semente + i * 6) % 27) + 1).padStart(2, '0')}`,
    quantidade: Math.max(Math.round(item.quantidade / partes), 1),
    nota: `NF ${40000 + ((semente + i) % 9999)}`,
  }));
}

const COLUNAS_DE_ITEM: DataGridColumn<Item>[] = [
  { id: 'produto', header: 'Produto', flex: 2, minWidth: 200 },
  { id: 'quantidade', header: 'Quantidade', type: 'number', width: 120 },
  { id: 'unitario', header: 'Unitário', type: 'currency', width: 130 },
  { id: 'total', header: 'Total', type: 'currency', width: 140 },
];

const COLUNAS_DE_ENTREGA: DataGridColumn<Entrega>[] = [
  { id: 'data', header: 'Data', type: 'date', width: 130 },
  { id: 'quantidade', header: 'Quantidade', type: 'number', width: 120 },
  { id: 'nota', header: 'Nota fiscal', minWidth: 140 },
];

const FORMAS = [
  { label: 'Tabela', value: 'tabela' },
  { label: 'Gráfico', value: 'grafico' },
];

/** No lateral e no diálogo o contêiner já mostra o título; o gráfico o guarda só para o leitor de tela. */
function GraficoDeEntregas({ hideTitle = false, item }: { hideTitle?: boolean; item: Item }) {
  const entregas = entregasDe(item);

  return (
    <ChartBar
      categories={entregas.map((entrega) => formatDate(entrega.data).slice(0, 5))}
      height={180}
      hideTitle={hideTitle}
      series={[{ label: 'Quantidade', values: entregas.map((entrega) => entrega.quantidade) }]}
      title={`Entregas de ${item.produto}`}
    />
  );
}

/** Terceiro nível: a escolha entre tabela e gráfico fica no estado do detalhe e volta depois de rolar ou recolher. */
function renderEntregas({ row, state, setState }: DataGridDetailContext<Item>) {
  const forma = state.forma === 'grafico' ? 'grafico' : 'tabela';

  return (
    <>
      <SegmentedControl
        items={FORMAS}
        label={`Forma das entregas de ${row.produto}`}
        size="sm"
        value={forma}
        onValueChange={(valor) => setState({ forma: valor })}
      />
      {forma === 'grafico' ? (
        <GraficoDeEntregas item={row} />
      ) : (
        <DataGrid
          columns={COLUNAS_DE_ENTREGA}
          getRowId={(entrega) => entrega.id}
          label={`Entregas de ${row.produto}`}
          rows={entregasDe(row)}
        />
      )}
    </>
  );
}

function MasterDetail() {
  const pedidos = useMemo(() => gerarPedidos(1000), []);
  const [lateral, setLateral] = useState<DataGridAsidePlacement>('end');

  /* Segundo nível: o botão da linha abre o gráfico do item ao lado; o mesmo botão fecha, o de outro item troca. */
  const renderItens = useCallback(
    ({ row, state, setState }: DataGridDetailContext<Pedido>) => {
      const itens = itensDe(row);
      const aberto = itens.find((item) => item.id === state.grafico);
      const colunas: DataGridColumn<Item>[] = [
        ...COLUNAS_DE_ITEM,
        {
          id: 'grafico',
          header: 'Gráfico',
          width: 90,
          sortable: false,
          searchable: false,
          renderCell: ({ row: item }) => (
            <ButtonIcon
              aria-pressed={item.id === state.grafico}
              icon={<IconChartBar size={14} />}
              label={`Gráfico de ${item.produto}`}
              size="sm"
              tabIndex={-1}
              variant="ghost"
              onClick={() => setState({ grafico: item.id === state.grafico ? null : item.id })}
            />
          ),
        },
      ];

      return (
        <DataGrid.DetailLayout
          aside={aberto && <GraficoDeEntregas hideTitle item={aberto} />}
          asidePlacement={lateral}
          asideTitle={aberto ? `Entregas de ${aberto.produto}` : ''}
          onAsideClose={() => setState({ grafico: null })}
        >
          <DataGrid
            columns={colunas}
            getRowId={(item) => item.id}
            label={`Itens de ${row.id}`}
            renderDetail={renderEntregas}
            rows={itens}
          />
        </DataGrid.DetailLayout>
      );
    },
    [lateral],
  );

  return (
    <div className="stack">
      <SegmentedControl
        items={[
          { label: 'Lateral à direita', value: 'end' },
          { label: 'À esquerda', value: 'start' },
          { label: 'Em diálogo', value: 'dialog' },
        ]}
        label="Lugar do gráfico do item"
        size="sm"
        value={lateral}
        onValueChange={(valor) => setLateral(valor as DataGridAsidePlacement)}
      />
      <DataGrid
        columns={COLUNAS}
        getRowId={idDoPedido}
        height={560}
        label="Pedidos com itens"
        renderDetail={renderItens}
        rowClickAction="expand"
        rows={pedidos}
      >
        <DataGrid.Toolbar>
          <DataGrid.Search />
        </DataGrid.Toolbar>
      </DataGrid>
    </div>
  );
}

function renderItensSimples({ row }: DataGridDetailContext<Pedido>) {
  return <DataGrid columns={COLUNAS_DE_ITEM} getRowId={(item) => item.id} label={`Itens de ${row.id}`} rows={itensDe(row)} />;
}

function GradeDoPlayground({
  colunas,
  detalhe,
  linhas,
  loading,
  pagination,
  registrar,
  rowClickAction,
  selectionMode,
}: {
  colunas: number;
  detalhe: boolean;
  linhas: number;
  loading: boolean;
  pagination: boolean;
  registrar: (evento: string) => void;
  rowClickAction: DataGridRowClickAction;
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
      renderDetail={detalhe ? renderItensSimples : undefined}
      rowClickAction={rowClickAction}
      rows={pedidos}
      selectionMode={selectionMode}
      onExpandedIdsChange={(ids) => registrar(`onExpandedIdsChange: [${ids.join(', ')}]`)}
      onRowActivate={(pedido) => registrar(`onRowActivate: ${pedido.id}`)}
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
  inicial: {
    linhas: 10000,
    colunas: 7,
    selectionMode: 'multiple',
    detalhe: true,
    rowClickAction: 'none',
    pagination: false,
    loading: false,
  },
  controles: [
    { tipo: 'numero', nome: 'linhas', min: 0, max: 50000, passo: 1000 },
    { tipo: 'numero', nome: 'colunas', min: 7, max: 30 },
    { tipo: 'opcoes', nome: 'selectionMode', opcoes: ['none', 'single', 'multiple'] },
    { tipo: 'booleano', nome: 'detalhe' },
    { tipo: 'opcoes', nome: 'rowClickAction', opcoes: ['none', 'expand', 'select', 'activate'] },
    { tipo: 'booleano', nome: 'pagination' },
    { tipo: 'booleano', nome: 'loading' },
  ],
  renderizar: (valores, registrar) => (
    <GradeDoPlayground
      colunas={valores.colunas}
      detalhe={valores.detalhe}
      linhas={valores.linhas}
      loading={valores.loading}
      pagination={valores.pagination}
      registrar={registrar}
      rowClickAction={valores.rowClickAction as DataGridRowClickAction}
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
        ['renderDetail', valores.detalhe ? expr('({ row }) => <ItensDoPedido pedido={row} />') : undefined],
        ['rowClickAction', valores.rowClickAction, 'none'],
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

    if (valores.detalhe) {
      verificacoes.push({
        nivel: 'ok',
        titulo: 'Grade em árvore',
        detalhe: 'role="treegrid", aria-expanded nas linhas com detalhe e o detalhe numa célula nomeada pela linha-mãe.',
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
      <dt>Master-detail</dt>
      <dd>
        <code>renderDetail</code> desenha o detalhe numa linha de largura total, logo abaixo da linha-mãe; <code>rowHasDetail</code>{' '}
        tira a seta de quem não tem. O conteúdo é livre: uma <code>DataGrid</code> dentro dele fica aninhada, sem rolagem
        própria, e rola com a de fora, em quantos níveis houver. O detalhe que sai da tela é desmontado; o estado dele,
        entregue por <code>state</code> e <code>setState</code>, e o das grades de dentro ficam guardados e voltam.
      </dd>
      <dt>Lateral do detalhe</dt>
      <dd>
        <code>DataGrid.DetailLayout</code> põe um conteúdo ao lado, como um gráfico, à direita, à esquerda ou num diálogo,
        com a proporção em <code>asideSize</code>, 40% por padrão. A grade não sabe o que há no lateral.
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
      titulo: 'Master-detail em três níveis',
      descricao:
        'Pedidos, itens e entregas numa rolagem só. O botão de gráfico do item abre o lateral; nas entregas, a escolha entre tabela e gráfico volta depois de rolar ou recolher.',
      Previa: MasterDetail,
      largo: true,
      codigo:
        "<DataGrid\n  renderDetail={({ row, state, setState }) => (\n    <DataGrid.DetailLayout aside={…} asideTitle=\"Entregas\">\n      <DataGrid label={`Itens de ${row.id}`} renderDetail={renderEntregas} … />\n    </DataGrid.DetailLayout>\n  )}\n  rowClickAction=\"expand\"\n  …\n/>",
    },
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
    {
      teclas: ['Enter'],
      acao: 'No cabeçalho, ordena; com Shift, soma a coluna à ordem. Na linha, faz a ação do clique ou entra no controle. No detalhe, entra no conteúdo.',
    },
    { teclas: ['Ctrl+Enter'], acao: 'Na linha, abre ou recolhe o detalhe.' },
    { teclas: ['F2'], acao: 'Entra no controle da célula.' },
    { teclas: ['Esc'], acao: 'Sai do controle e volta à célula; numa grade aninhada, volta ao detalhe da linha-mãe.' },
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
      garantia: 'Detalhe nomeado',
      como: (
        <>
          role=&quot;treegrid&quot;, <code>aria-expanded</code> e <code>aria-level</code> nas linhas com detalhe; o detalhe é uma
          célula só, com <code>aria-colspan</code> e o nome da linha-mãe.
        </>
      ),
      teste: 'DataGrid.test.tsx',
    },
    {
      garantia: 'Estado que sobrevive',
      como: 'O estado do detalhe e o das grades aninhadas ficam guardados pelo caminho da linha e voltam ao remontar.',
      teste: 'DataGrid.test.tsx',
    },
    {
      garantia: 'Dois modos de teclado',
      como: 'Enter ou F2 entra no controle da célula; Esc volta; Tab circula dentro dela.',
      teste: 'DataGrid.test.tsx',
    },
  ],
  notaDaApi:
    'Cada fatia de estado vem no trio valor, padrão e aviso: sort, search, page, pageSize, selectedIds e expandedIds. Além destas, as propriedades nativas de <div>.',
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
    {
      nome: 'renderDetail',
      tipo: '(context: DataGridDetailContext<Row>) => ReactNode',
      descricao: 'Conteúdo do detalhe: row, level, state e setState. Uma DataGrid dentro dele fica aninhada.',
    },
    { nome: 'rowHasDetail', tipo: '(row: Row) => boolean', descricao: 'Quais linhas têm detalhe. Sem ela, todas.' },
    { nome: 'expandedIds', tipo: 'readonly string[]', descricao: 'Linhas com o detalhe aberto, pelas chaves.' },
    { nome: 'expandMode', tipo: "'single' | 'multiple'", padrao: "'multiple'", descricao: 'Na single, abrir um detalhe fecha o outro.' },
    {
      nome: 'rowClickAction',
      tipo: "'none' | 'expand' | 'select' | 'activate'",
      padrao: "'none'",
      descricao: 'Ação do clique na linha e do Enter sobre ela.',
    },
    { nome: 'onRowActivate', tipo: '(row: Row) => void', descricao: "Com rowClickAction='activate', abre o registro." },
    { nome: 'initialState', tipo: 'unknown', descricao: 'Retrato salvo, aplicado de uma vez na montagem.' },
    { nome: 'onStateChange', tipo: '(snapshot: DataGridSnapshot) => void', descricao: 'Retrato versionado a cada mudança.' },
    { nome: 'loading', tipo: 'boolean', padrao: 'false', descricao: 'Cobre as linhas e marca aria-busy.' },
    { nome: 'error', tipo: 'ReactNode', descricao: 'Falha mostrada no lugar das linhas.' },
    { nome: 'emptyMessage', tipo: 'ReactNode', descricao: 'Texto da grade vazia.' },
    { nome: 'height', tipo: 'number', padrao: '480', descricao: 'Altura da área rolável, em pixels. Não vale na grade aninhada.' },
  ],
};
