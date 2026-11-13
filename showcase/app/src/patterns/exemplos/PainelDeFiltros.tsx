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
  IconStructure,
  Select,
  SidePanel,
  Sidebar,
  Stack,
  Table,
  Tag,
  VisuallyHidden,
} from '@plenustech/design-system';

const CHAMADOS = [
  { id: '1', titulo: 'Erro ao emitir a segunda via', situacao: 'aberto', responsavel: 'Ana Ribeiro' },
  { id: '2', titulo: 'Relatório mensal fora do prazo', situacao: 'andamento', responsavel: 'Bruno Lima' },
  { id: '3', titulo: 'Acesso negado ao módulo de estoque', situacao: 'resolvido', responsavel: 'Ana Ribeiro' },
  { id: '4', titulo: 'Troca do e-mail de cobrança', situacao: 'aberto', responsavel: 'Carla Nogueira' },
  { id: '5', titulo: 'Importação de planilha travada', situacao: 'andamento', responsavel: 'Carla Nogueira' },
  { id: '6', titulo: 'Logotipo cortado na impressão', situacao: 'resolvido', responsavel: 'Bruno Lima' },
];

const SITUACOES = [
  { label: 'Todas', value: 'todas' },
  { label: 'Aberto', value: 'aberto' },
  { label: 'Em andamento', value: 'andamento' },
  { label: 'Resolvido', value: 'resolvido' },
];

const RESPONSAVEIS = [
  { label: 'Todos', value: 'todos' },
  ...['Ana Ribeiro', 'Bruno Lima', 'Carla Nogueira'].map((nome) => ({ label: nome, value: nome })),
];

const SEM_FILTROS = { situacao: 'todas', responsavel: 'todos' };

const rotuloDe = (opcoes: { label: string; value: string }[], valor: string) => opcoes.find((opcao) => opcao.value === valor)?.label ?? valor;

export function PainelDeFiltros() {
  const [filtros, setFiltros] = useState(SEM_FILTROS);
  const [painelAberto, setPainelAberto] = useState(false);
  const gatilho = useRef<HTMLButtonElement>(null);

  const situacaoAtiva = filtros.situacao !== SEM_FILTROS.situacao;
  const responsavelAtivo = filtros.responsavel !== SEM_FILTROS.responsavel;
  const ativos = Number(situacaoAtiva) + Number(responsavelAtivo);
  const chamados = CHAMADOS.filter(
    (chamado) => (!situacaoAtiva || chamado.situacao === filtros.situacao) && (!responsavelAtivo || chamado.responsavel === filtros.responsavel),
  );

  // A Tag removida some: o foco vai ao botão Filtros, e não para o começo da página.
  function remover(padrao: Partial<typeof SEM_FILTROS>) {
    setFiltros({ ...filtros, ...padrao });
    gatilho.current?.focus();
  }

  return (
    <AppShell defaultOpen={false}>
      <Sidebar>
        <Sidebar.Rail>
          <Sidebar.RailItem current icon={<IconStructure size={20} />} label="Suporte" />
        </Sidebar.Rail>
        <Sidebar.Panel label="Suporte">
          <Sidebar.Item current icon={<IconFile size={18} />} label="Chamados" />
        </Sidebar.Panel>
      </Sidebar>
      <AppShell.Page>
        <AppShell.PageBar>
          <Breadcrumb items={[{ label: 'Suporte' }, { label: 'Chamados' }]} />
        </AppShell.PageBar>
        <AppShell.PageBody>
          <Container style={{ paddingBlock: 'var(--pl-space-5)' }}>
            <Stack>
              <Stack align="center" direction="horizontal" gap={2} wrap>
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
                {situacaoAtiva && (
                  <Tag onRemove={() => remover({ situacao: SEM_FILTROS.situacao })}>
                    Situação: {rotuloDe(SITUACOES, filtros.situacao)}
                  </Tag>
                )}
                {responsavelAtivo && (
                  <Tag onRemove={() => remover({ responsavel: SEM_FILTROS.responsavel })}>Responsável: {filtros.responsavel}</Tag>
                )}
              </Stack>
              <Card>
                <Card.Body flush>
                  {chamados.length === 0 ? (
                    <EmptyState
                      actions={<Button onClick={() => setFiltros(SEM_FILTROS)} variant="secondary">Limpar filtros</Button>}
                      description="Nenhum chamado com esses filtros."
                      size="sm"
                      title="Nada encontrado"
                    />
                  ) : (
                    <Table label="Chamados">
                      <Table.Header>
                        <Table.Column id="titulo">Chamado</Table.Column>
                        <Table.Column hideBelow="sm" id="situacao" width="160px">Situação</Table.Column>
                        <Table.Column hideBelow="md" id="responsavel" width="160px">Responsável</Table.Column>
                      </Table.Header>
                      <Table.Body items={chamados}>
                        {(chamado) => (
                          <Table.Row id={chamado.id}>
                            <Table.Cell>{chamado.titulo}</Table.Cell>
                            <Table.Cell>{rotuloDe(SITUACOES, chamado.situacao)}</Table.Cell>
                            <Table.Cell>{chamado.responsavel}</Table.Cell>
                          </Table.Row>
                        )}
                      </Table.Body>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Stack>
          </Container>
        </AppShell.PageBody>
      </AppShell.Page>
      {/* Irmão da página dentro do AppShell: abre ao lado e empurra a página, que continua usável. */}
      <SidePanel
        footer={
          <>
            <Button onClick={() => setFiltros(SEM_FILTROS)} variant="secondary">Limpar</Button>
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
        <Stack>
          <Select label="Situação" onValueChange={(situacao) => setFiltros({ ...filtros, situacao })} options={SITUACOES} value={filtros.situacao} />
          <Select label="Responsável" onValueChange={(responsavel) => setFiltros({ ...filtros, responsavel })} options={RESPONSAVEIS} value={filtros.responsavel} />
        </Stack>
      </SidePanel>
    </AppShell>
  );
}
