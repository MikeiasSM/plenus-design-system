import { Badge, Button, Card, CardMetric, ChartBar, Columns, IconClock, IconExclamationTriangle, LinkList, PageHeader, Table, formatCurrency, formatPercent } from '@plenustech/design-system';
import { CAMINHO_DAS_COMPOSICOES } from '../menu';
import { DIAS_DO_GRAFICO, LANCAMENTOS, PEDIDOS, PEDIDOS_POR_DIA, PRODUTOS } from '../dados';
import { Coluna, Pagina } from '../Pagina';

const pendencias = [
  {
    id: 'aprovacao',
    titulo: 'Pedidos aguardando aprovação',
    detalhe: 'Parados na fila do gerente',
    quantidade: PEDIDOS.filter((pedido) => pedido.situacao === 'aprovacao').length,
    rota: 'pedidos',
  },
  {
    id: 'atrasados',
    titulo: 'Pedidos atrasados',
    detalhe: 'Passaram da data prometida ao cliente',
    quantidade: PEDIDOS.filter((pedido) => pedido.situacao === 'atrasado').length,
    rota: 'pedidos',
    urgente: true,
  },
  { id: 'conciliar', titulo: 'Lançamentos para conciliar', detalhe: 'Extrato de outubro, Banco Horizonte', quantidade: LANCAMENTOS.length, rota: 'conciliacao' },
  {
    id: 'estoque',
    titulo: 'Produtos abaixo do estoque mínimo',
    detalhe: 'Reponha antes de faltar',
    quantidade: PRODUTOS.filter((produto) => produto.estoque < produto.minimo).length,
    rota: 'produtos',
  },
  { id: 'cadastros', titulo: 'Cadastros de clientes incompletos', detalhe: 'Sem documento, endereço ou telefone', quantidade: 319, rota: 'clientes-base' },
  { id: 'certificado', titulo: 'Certificado digital vence em 18 dias', detalhe: 'Renove para não parar a emissão de notas', quantidade: 1, rota: 'configuracoes', urgente: true },
];

const atividades = [
  { id: 'a', texto: 'Rui Teixeira aprovou o pedido #48209', quando: 'há 12 min' },
  { id: 'b', texto: 'Importação de 112 lançamentos concluída', quando: 'há 1 h' },
  { id: 'c', texto: 'Marcos Lima ajustou o estoque de 3 produtos', quando: 'ontem' },
];

const urgentes = pendencias.filter((pendencia) => pendencia.urgente).length;

export function Inicio() {
  return (
    <Pagina caminho={['Início', 'Tela inicial']}>
      <PageHeader maxWidth="1120px">
        <PageHeader.Title>Bom dia, Suporte</PageHeader.Title>
        <PageHeader.Description>{urgentes} pendências são urgentes hoje. As demais podem esperar o fim do dia.</PageHeader.Description>
      </PageHeader>
      <Coluna largura={1120}>
        <Columns>
          <Columns.Main className="grade-coluna">
            <Card>
              <Card.Header description="Cada linha leva à tela onde a pendência se resolve." headingLevel={2} title="O que pede ação hoje" />
              <Card.Body flush>
                <LinkList aria-label="Pendências">
                  {pendencias.map((pendencia) => (
                    <LinkList.Item
                      description={pendencia.detalhe}
                      href={`${CAMINHO_DAS_COMPOSICOES}/${pendencia.rota}`}
                      icon={pendencia.urgente ? <IconExclamationTriangle /> : <IconClock />}
                      key={pendencia.id}
                      title={pendencia.titulo}
                      tone={pendencia.urgente ? 'danger' : 'neutral'}
                      trailing={<Badge tone={pendencia.urgente ? 'danger' : 'neutral'}>{pendencia.quantidade}</Badge>}
                    />
                  ))}
                </LinkList>
              </Card.Body>
            </Card>
            <Card>
              <Card.Header description="Últimos 14 dias. O fim de semana pesa pouco." headingLevel={2} title="Pedidos por dia" />
              <Card.Body>
                <ChartBar
                  categories={DIAS_DO_GRAFICO}
                  height={200}
                  hideTitle
                  legend="none"
                  series={[{ label: 'Pedidos', values: PEDIDOS_POR_DIA }]}
                  title="Pedidos por dia nos últimos 14 dias"
                />
              </Card.Body>
            </Card>
          </Columns.Main>
          <Columns.Aside className="grade-coluna">
            <CardMetric>
              <Card.Header description="Novembro, até hoje." headingLevel={2} title="Vendas do mês" />
              <CardMetric.Body>
                <CardMetric.Value formatValue={(valor) => formatCurrency(valor)} value={412380} />
                <CardMetric.Trend
                  comparisons={[{ label: 'vs. outubro', change: 0.082, value: 31240, formatValue: (valor) => formatCurrency(valor, { compact: 'symbol' }) }]}
                  formatPercent={(razao) => formatPercent(razao, { decimals: 1 })}
                />
              </CardMetric.Body>
            </CardMetric>
            <Card>
              <Card.Header headingLevel={2} title="Atividade recente" />
              <Card.Body flush>
                <Table label="Atividade recente" size="sm">
                  <Table.Header>
                    <Table.Column id="evento">Evento</Table.Column>
                    <Table.Column align="end" id="quando" width="90px">Quando</Table.Column>
                  </Table.Header>
                  <Table.Body items={atividades}>
                    {(atividade) => (
                      <Table.Row id={atividade.id}>
                        <Table.Cell>{atividade.texto}</Table.Cell>
                        <Table.Cell>{atividade.quando}</Table.Cell>
                      </Table.Row>
                    )}
                  </Table.Body>
                </Table>
              </Card.Body>
              <Card.Footer>
                <Button size="sm" variant="ghost">Ver tudo</Button>
              </Card.Footer>
            </Card>
          </Columns.Aside>
        </Columns>
      </Coluna>
    </Pagina>
  );
}
