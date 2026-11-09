import { Badge, Button, Card, Columns, IconMore, IconPencil, Menu, PageHeader, Table, Textarea, Timeline, formatCurrency, formatDate } from '@plenustech/design-system';
import { CAMINHO_DAS_COMPOSICOES } from '../menu';
import { DESCONTO, FRETE, ITENS_DO_PEDIDO, PEDIDOS, SUBTOTAL, TOTAL } from '../dados';
import { Coluna, Pagina, SeloDaSituacao } from '../Pagina';

const pedido = PEDIDOS[0];

const ANDAMENTO = [
  { key: 'criado', label: 'Pedido criado', date: `${formatDate(pedido.data)} · 09:12`, description: `Por ${pedido.vendedor}` },
  { key: 'desconto', label: 'Desconto de 5% aplicado', date: `${formatDate(pedido.data)} · 09:14` },
  { key: 'aprovacao', label: 'Aguardando aprovação do gerente', date: `${formatDate(pedido.data)} · 09:15` },
  { key: 'separacao', label: 'Separação' },
  { key: 'entrega', label: 'Entrega' },
];

const MAIS_ACOES = [
  { key: 'duplicar', label: 'Duplicar pedido' },
  { key: 'exportar', label: 'Exportar em PDF' },
  { key: 'cancelar', label: 'Cancelar pedido', tone: 'danger' as const },
];

function Definicoes({ itens }: { itens: readonly (readonly [string, string])[] }) {
  return (
    <dl className="definicoes">
      {itens.map(([termo, descricao]) => (
        <div key={termo}>
          <dt>{termo}</dt>
          <dd>{descricao}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Pedido() {
  return (
    <Pagina caminho={['Vendas', 'Pedidos', `Pedido #${pedido.numero}`]}>
      <PageHeader maxWidth="1120px">
        <PageHeader.Back href={`${CAMINHO_DAS_COMPOSICOES}/pedidos`} label="Voltar para Pedidos" />
        <PageHeader.Title>Pedido #{pedido.numero}</PageHeader.Title>
        <PageHeader.Badges>
          <SeloDaSituacao situacao={pedido.situacao} />
          <Badge tone="neutral">Boleto 28 dias</Badge>
        </PageHeader.Badges>
        <PageHeader.Context>
          <span>{pedido.cliente}</span>
          <span>criado em {formatDate(pedido.data)}</span>
          <span>{ITENS_DO_PEDIDO.length} itens</span>
        </PageHeader.Context>
        <PageHeader.Actions>
          <Menu items={MAIS_ACOES} label="Mais ações">
            <Button aria-label="Mais ações" variant="secondary"><IconMore /></Button>
          </Menu>
          <Button variant="secondary"><IconPencil />Editar</Button>
          <Button>Aprovar pedido</Button>
        </PageHeader.Actions>
      </PageHeader>
      <Coluna largura={1120}>
        <Columns>
          <Columns.Main className="grade-coluna">
            <Card>
              <Card.Header description="Pagamento por boleto em 28 dias." headingLevel={2} title="Itens do pedido" />
              <Card.Body flush>
                <Table label="Itens do pedido" size="sm">
                  <Table.Header>
                    <Table.Column id="produto">Produto</Table.Column>
                    <Table.Column hideBelow="sm" id="codigo">Código</Table.Column>
                    <Table.Column id="quantidade" numeric>Qtd.</Table.Column>
                    <Table.Column hideBelow="md" id="unitario" numeric>Unitário</Table.Column>
                    <Table.Column id="total" numeric>Total</Table.Column>
                  </Table.Header>
                  <Table.Body items={ITENS_DO_PEDIDO}>
                    {(item) => (
                      <Table.Row id={item.id}>
                        <Table.Cell>{item.nome}</Table.Cell>
                        <Table.Cell>{item.id}</Table.Cell>
                        <Table.Cell>{item.quantidade}</Table.Cell>
                        <Table.Cell>{formatCurrency(item.unitario)}</Table.Cell>
                        <Table.Cell>{formatCurrency(item.quantidade * item.unitario)}</Table.Cell>
                      </Table.Row>
                    )}
                  </Table.Body>
                </Table>
              </Card.Body>
              <Card.Footer>
                <dl className="totais">
                  <div><dt>Subtotal</dt><dd>{formatCurrency(SUBTOTAL)}</dd></div>
                  <div><dt>Desconto (5%)</dt><dd>− {formatCurrency(DESCONTO)}</dd></div>
                  <div><dt>Frete</dt><dd>{formatCurrency(FRETE)}</dd></div>
                  <div className="totais-total"><dt>Total</dt><dd>{formatCurrency(TOTAL)}</dd></div>
                </dl>
              </Card.Footer>
            </Card>
            <Card>
              <Card.Header headingLevel={2} title="Andamento" />
              <Card.Body>
                <Timeline current="aprovacao" items={ANDAMENTO} label="Andamento do pedido" />
              </Card.Body>
              <Card.Footer>
                <Textarea aria-label="Comentário" placeholder="Escreva um comentário para a equipe" />
                <Button size="sm" variant="secondary">Comentar</Button>
              </Card.Footer>
            </Card>
          </Columns.Main>
          <Columns.Aside className="grade-coluna">
            <Card>
              <Card.Header headingLevel={2} title="Cliente" trailing={<Button size="sm" variant="ghost">Ver base</Button>} />
              <Card.Body>
                <Definicoes
                  itens={[
                    ['Nome', pedido.cliente],
                    ['CNPJ', '12.345.678/0001-95'],
                    ['Contato', 'Fernanda Alves · (77) 3000-0000'],
                    ['Crédito disponível', formatCurrency(18400)],
                  ]}
                />
              </Card.Body>
            </Card>
            <Card>
              <Card.Header headingLevel={2} title="Entrega" />
              <Card.Body>
                <Definicoes
                  itens={[
                    ['Endereço', 'Av. das Palmeiras, 2210, Centro, Santa Aurora, GO'],
                    ['Transportadora', 'Rota Sul Transportes'],
                    ['Previsão', formatDate(new Date(2026, 10, 7))],
                  ]}
                />
              </Card.Body>
            </Card>
          </Columns.Aside>
        </Columns>
      </Coluna>
    </Pagina>
  );
}
