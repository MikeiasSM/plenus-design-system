import { useRef, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  IconFilter,
  IconPlus,
  IconSearch,
  InputText,
  PageHeader,
  Pagination,
  Select,
  SidePanel,
  Stack,
  Table,
  Tabs,
  VisuallyHidden,
  formatCurrency,
  formatDate,
  type TableSort,
  Text,
} from '@plenustech/design-system';
import { IconDownload } from '@plenustech/design-system/icons';
import { CAMINHO_DAS_COMPOSICOES } from '../menu';
import { PEDIDOS, SITUACOES, VENDEDORES, type Pedido, type SituacaoDoPedido } from '../dados';
import { Coluna, Pagina, SeloDaSituacao } from '../Pagina';

const POR_PAGINA = 8;

type Visao = 'todos' | SituacaoDoPedido;

const VISOES: { chave: Visao; rotulo: string }[] = [
  { chave: 'todos', rotulo: 'Todos' },
  { chave: 'aprovacao', rotulo: 'Aguardando aprovação' },
  { chave: 'separacao', rotulo: 'Em separação' },
  { chave: 'atrasado', rotulo: 'Atrasados' },
];

interface Filtros {
  situacao: string;
  vendedor: string;
}

const SEM_FILTROS: Filtros = { situacao: 'todas', vendedor: 'todos' };

const contar = (visao: Visao) => PEDIDOS.filter((pedido) => visao === 'todos' || pedido.situacao === visao).length;

function ordenar(pedidos: readonly Pedido[], { column, direction }: TableSort) {
  const sentido = direction === 'ascending' ? 1 : -1;
  const valor = (pedido: Pedido) => (column === 'data' ? pedido.data.getTime() : (pedido[column as keyof Pedido] as string | number));

  return [...pedidos].sort((a, b) => (valor(a) > valor(b) ? sentido : valor(a) < valor(b) ? -sentido : 0));
}

interface ListaProps {
  busca: string;
  filtros: Filtros;
  limparBuscaEFiltros: () => void;
  visao: Visao;
}

function ListaDePedidos({ busca, filtros, limparBuscaEFiltros, visao }: ListaProps) {
  const [ordem, setOrdem] = useState<TableSort>({ column: 'data', direction: 'descending' });
  const [selecionados, setSelecionados] = useState<readonly string[]>([]);
  const [pagina, setPagina] = useState(1);
  // Buscar ou filtrar volta à primeira página: a consulta nova recomeça a paginação.
  const consulta = `${busca}|${filtros.situacao}|${filtros.vendedor}`;
  const [consultaDaPagina, setConsultaDaPagina] = useState(consulta);

  if (consulta !== consultaDaPagina) {
    setConsultaDaPagina(consulta);
    setPagina(1);
  }

  const termo = busca.trim().toLowerCase();
  const filtrados = PEDIDOS.filter(
    (pedido) =>
      (visao === 'todos' || pedido.situacao === visao) &&
      (filtros.situacao === 'todas' || pedido.situacao === filtros.situacao) &&
      (filtros.vendedor === 'todos' || pedido.vendedor === filtros.vendedor) &&
      (!termo || `${pedido.cliente} ${pedido.numero}`.toLowerCase().includes(termo)),
  );
  const paginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const pedidos = ordenar(filtrados, ordem).slice((Math.min(pagina, paginas) - 1) * POR_PAGINA, Math.min(pagina, paginas) * POR_PAGINA);

  if (filtrados.length === 0) {
    return (
      <EmptyState
        actions={<Button onClick={limparBuscaEFiltros} variant="secondary">Limpar busca e filtros</Button>}
        description="Nenhum pedido com esses critérios."
        size="sm"
        title="Nada encontrado"
      />
    );
  }

  return (
    <>
      <Table
        label="Pedidos"
        onSelectedIdsChange={setSelecionados}
        onSortChange={setOrdem}
        rows={pedidos}
        selectedIds={selecionados}
        selectionMode="multiple"
        sort={ordem}
      >
        <Table.Header>
          <Table.Column id="numero" sortable width="96px">Pedido</Table.Column>
          <Table.Column id="cliente" sortable>Cliente</Table.Column>
          <Table.Column hideBelow="md" id="data" sortable width="104px">Data</Table.Column>
          <Table.Column id="situacao" width="176px">Situação</Table.Column>
          <Table.Column id="total" numeric sortable width="120px">Total</Table.Column>
        </Table.Header>
        <Table.Body items={pedidos}>
          {(pedido) => (
            <Table.Row id={pedido.id} label={`Selecionar pedido ${pedido.numero}`}>
              <Table.Cell>
                <a href={`${CAMINHO_DAS_COMPOSICOES}/pedido`}>#{pedido.numero}</a>
              </Table.Cell>
              <Table.Cell>{pedido.cliente}</Table.Cell>
              <Table.Cell>{formatDate(pedido.data)}</Table.Cell>
              <Table.Cell><SeloDaSituacao situacao={SITUACOES[pedido.situacao]} /></Table.Cell>
              <Table.Cell>{formatCurrency(pedido.total)}</Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
      </Table>
      {(selecionados.length > 0 || paginas > 1) && (
        <Card.Footer
          start={
            selecionados.length > 0 && (
              <Text tone="tertiary" variant="caption">
                {selecionados.length === 1 ? '1 selecionado' : `${selecionados.length} selecionados`}
              </Text>
            )
          }
        >
          <Pagination onPageChange={setPagina} page={Math.min(pagina, paginas)} pageSize={POR_PAGINA} totalItems={filtrados.length} />
        </Card.Footer>
      )}
    </>
  );
}

export function Pedidos() {
  const [visao, setVisao] = useState<Visao>('todos');
  const [busca, setBusca] = useState('');
  const [filtros, setFiltros] = useState(SEM_FILTROS);
  const [painelAberto, setPainelAberto] = useState(false);
  const gatilho = useRef<HTMLButtonElement>(null);
  const ativos = [filtros.situacao !== 'todas', filtros.vendedor !== 'todos'].filter(Boolean).length;

  function limparBuscaEFiltros() {
    setBusca('');
    setFiltros(SEM_FILTROS);
  }

  return (
    <>
      <Pagina caminho={['Vendas', 'Pedidos']}>
        <PageHeader>
          <PageHeader.Title>Pedidos</PageHeader.Title>
          <PageHeader.Description>Acompanhe os pedidos de venda, da aprovação à entrega.</PageHeader.Description>
          <PageHeader.Actions>
            <Button variant="secondary"><IconDownload />Exportar</Button>
            <Button href={`${CAMINHO_DAS_COMPOSICOES}/novo-pedido`}><IconPlus />Novo pedido</Button>
          </PageHeader.Actions>
        </PageHeader>
        <Coluna largura="total">
          <Card>
            <Card.Body flush>
              <Tabs
                items={VISOES.map(({ chave, rotulo }) => ({
                  key: chave,
                  label: `${rotulo} (${contar(chave)})`,
                  content: (
                    <>
                      <Table.Toolbar label="Busca e filtros dos pedidos">
                        <InputText
                          aria-label="Buscar pedido"
                          icon={<IconSearch />}
                          onValueChange={setBusca}
                          placeholder="Buscar por cliente ou número"
                          type="search"
                          value={busca}
                        />
                        <Button aria-expanded={painelAberto} onClick={() => setPainelAberto(!painelAberto)} ref={gatilho} variant="secondary">
                          <IconFilter />
                          Filtros
                          {ativos > 0 && (
                            <>
                              <Badge tone="info">{ativos}</Badge>
                              <VisuallyHidden>{' aplicados'}</VisuallyHidden>
                            </>
                          )}
                        </Button>
                      </Table.Toolbar>
                      <ListaDePedidos busca={busca} filtros={filtros} limparBuscaEFiltros={limparBuscaEFiltros} visao={chave} />
                    </>
                  ),
                }))}
                label="Visões salvas"
                onSelectedKeyChange={(chave) => setVisao(chave as Visao)}
                selectedKey={visao}
              />
            </Card.Body>
          </Card>
        </Coluna>
      </Pagina>
      <SidePanel
        footer={
          <>
            <Button onClick={() => setFiltros(SEM_FILTROS)} variant="secondary">Limpar</Button>
            <Button
              onClick={() => {
                setPainelAberto(false);
                gatilho.current?.focus();
              }}
            >
              Concluir
            </Button>
          </>
        }
        onOpenChange={setPainelAberto}
        open={painelAberto}
        title="Filtros"
      >
        <Stack>
          <Select
            label="Situação"
            onValueChange={(situacao) => setFiltros({ ...filtros, situacao })}
            options={[{ label: 'Todas', value: 'todas' }, ...Object.entries(SITUACOES).map(([value, { rotulo }]) => ({ label: rotulo, value }))]}
            value={filtros.situacao}
          />
          <Select
            label="Vendedor"
            onValueChange={(vendedor) => setFiltros({ ...filtros, vendedor })}
            options={[{ label: 'Todos', value: 'todos' }, ...VENDEDORES.map((nome) => ({ label: nome, value: nome }))]}
            value={filtros.vendedor}
          />
        </Stack>
      </SidePanel>
    </>
  );
}
