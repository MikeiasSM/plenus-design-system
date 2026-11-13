import { useRef, useState } from 'react';
import {
  AppShell,
  Badge,
  Breadcrumb,
  Button,
  Card,
  Container,
  EmptyState,
  IconFile,
  IconFilter,
  IconSearch,
  IconStructure,
  InputText,
  Pagination,
  Select,
  SidePanel,
  Sidebar,
  Table,
  Tag,
  Text,
  VisuallyHidden,
} from '@plenustech/design-system';

const POR_PAGINA = 5;

const CONTRATOS = [
  { id: '1', cliente: 'Transportes Rota Sul', situacao: 'ativo', valor: 'R$ 12.400,00' },
  { id: '2', cliente: 'Mecânica Irmãos Duarte', situacao: 'ativo', valor: 'R$ 3.150,00' },
  { id: '3', cliente: 'Agropecuária Vale Verde', situacao: 'vencido', valor: 'R$ 8.900,00' },
  { id: '4', cliente: 'Posto Estrela do Oeste', situacao: 'ativo', valor: 'R$ 5.720,00' },
  { id: '5', cliente: 'Oficina Santa Cruz', situacao: 'vencido', valor: 'R$ 1.980,00' },
  { id: '6', cliente: 'Distribuidora Planalto', situacao: 'ativo', valor: 'R$ 21.300,00' },
  { id: '7', cliente: 'Frota Express Logística', situacao: 'ativo', valor: 'R$ 9.640,00' },
  { id: '8', cliente: 'Auto Center Aurora', situacao: 'vencido', valor: 'R$ 2.410,00' },
  { id: '9', cliente: 'Fazenda São Jorge', situacao: 'ativo', valor: 'R$ 17.080,00' },
  { id: '10', cliente: 'Pneus Centro', situacao: 'ativo', valor: 'R$ 4.260,00' },
  { id: '11', cliente: 'Retífica do Vale', situacao: 'vencido', valor: 'R$ 6.730,00' },
  { id: '12', cliente: 'Cooperativa Horizonte', situacao: 'ativo', valor: 'R$ 14.900,00' },
];

const SITUACOES = [
  { label: 'Todas', value: 'todas' },
  { label: 'Ativos', value: 'ativo' },
  { label: 'Vencidos', value: 'vencido' },
];

export function BarraDaTabela() {
  const [busca, setBusca] = useState('');
  const [situacao, setSituacao] = useState('todas');
  const [painelAberto, setPainelAberto] = useState(false);
  const gatilho = useRef<HTMLButtonElement>(null);
  const [pagina, setPagina] = useState(1);
  const [selecionados, setSelecionados] = useState<readonly string[]>([]);

  const termo = busca.trim().toLowerCase();
  const filtrados = CONTRATOS.filter(
    (contrato) => (situacao === 'todas' || contrato.situacao === situacao) && (!termo || contrato.cliente.toLowerCase().includes(termo)),
  );
  const paginaAtual = Math.min(pagina, Math.max(1, Math.ceil(filtrados.length / POR_PAGINA)));
  const contratos = filtrados.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);

  function filtrar(valor: string) {
    setSituacao(valor);
    setPagina(1);
  }

  function limpar() {
    setBusca('');
    filtrar('todas');
  }

  return (
    <AppShell defaultOpen={false}>
      <Sidebar>
        <Sidebar.Rail>
          <Sidebar.RailItem current icon={<IconStructure size={20} />} label="Comercial" />
        </Sidebar.Rail>
        <Sidebar.Panel label="Comercial">
          <Sidebar.Item current icon={<IconFile size={18} />} label="Contratos" />
        </Sidebar.Panel>
      </Sidebar>
      <AppShell.Page>
        <AppShell.PageBar>
          <Breadcrumb items={[{ label: 'Comercial' }, { label: 'Contratos' }]} />
        </AppShell.PageBar>
        <AppShell.PageBody>
          <Container style={{ paddingBlock: 'var(--pl-space-5)' }}>
            <Card>
              <Card.Body flush>
                <Table.Toolbar label="Busca e filtros dos contratos">
                  <InputText
                    aria-label="Buscar contrato"
                    icon={<IconSearch />}
                    onValueChange={(valor) => {
                      setBusca(valor);
                      setPagina(1);
                    }}
                    placeholder="Buscar por cliente"
                    type="search"
                    value={busca}
                  />
                  <Button aria-expanded={painelAberto} onClick={() => setPainelAberto(!painelAberto)} ref={gatilho} variant="secondary">
                    <IconFilter />
                    Filtros
                    {situacao !== 'todas' && (
                      <>
                        <Badge tone="info">1</Badge>
                        <VisuallyHidden>{' aplicado'}</VisuallyHidden>
                      </>
                    )}
                  </Button>
                  {/* O filtro ativo fica à vista depois que o painel fecha, como no pattern Painel de filtros. */}
                  {situacao !== 'todas' && (
                    <Tag
                      onRemove={() => {
                        filtrar('todas');
                        gatilho.current?.focus();
                      }}
                    >
                      Situação: {SITUACOES.find((opcao) => opcao.value === situacao)?.label}
                    </Tag>
                  )}
                </Table.Toolbar>
                {filtrados.length === 0 ? (
                  <EmptyState
                    actions={<Button onClick={limpar} variant="secondary">Limpar busca e filtros</Button>}
                    description="Nenhum contrato com esses critérios."
                    size="sm"
                    title="Nada encontrado"
                  />
                ) : (
                  <Table
                    label="Contratos"
                    onSelectedIdsChange={setSelecionados}
                    rows={contratos}
                    selectedIds={selecionados}
                    selectionMode="multiple"
                  >
                    <Table.Header>
                      <Table.Column id="cliente">Cliente</Table.Column>
                      <Table.Column hideBelow="sm" id="situacao" width="120px">Situação</Table.Column>
                      <Table.Column id="valor" numeric width="180px">Valor</Table.Column>
                    </Table.Header>
                    <Table.Body items={contratos}>
                      {(contrato) => (
                        <Table.Row id={contrato.id} label={`Selecionar o contrato de ${contrato.cliente}`}>
                          <Table.Cell>{contrato.cliente}</Table.Cell>
                          <Table.Cell>{contrato.situacao === 'ativo' ? 'Ativo' : 'Vencido'}</Table.Cell>
                          <Table.Cell>{contrato.valor}</Table.Cell>
                        </Table.Row>
                      )}
                    </Table.Body>
                  </Table>
                )}
              </Card.Body>
              <Card.Footer
                start={
                  <Text tone="tertiary" variant="caption">
                    {selecionados.length > 0
                      ? `${selecionados.length} ${selecionados.length === 1 ? 'selecionado' : 'selecionados'}`
                      : `${filtrados.length} ${filtrados.length === 1 ? 'resultado' : 'resultados'}`}
                  </Text>
                }
              >
                <Pagination onPageChange={setPagina} page={paginaAtual} pageSize={POR_PAGINA} totalItems={filtrados.length} />
              </Card.Footer>
            </Card>
          </Container>
        </AppShell.PageBody>
      </AppShell.Page>
      <SidePanel
        footer={
          <>
            <Button onClick={() => filtrar('todas')} variant="secondary">Limpar</Button>
            <Button
              onClick={() => {
                setPainelAberto(false);
                // O Esc e o fechar do painel já devolvem o foco ao gatilho; o Concluir é do produto, e devolve por conta própria.
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
        <Select
          label="Situação"
          onValueChange={filtrar}
          options={SITUACOES}
          value={situacao}
        />
      </SidePanel>
    </AppShell>
  );
}
