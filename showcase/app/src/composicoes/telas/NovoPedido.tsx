import { useState } from 'react';
import {
  Badge,
  Button,
  ButtonIcon,
  Card,
  InputNumber,
  PageHeader,
  SaveBar,
  Select,
  Sidebar,
  Table,
  Textarea,
  formatCurrency,
} from '@plenustech/design-system';
import { IconPlusLg, IconTrash } from '@plenustech/design-system/icons';
import { CAMINHO_DAS_COMPOSICOES } from '../menu';
import { CLIENTES, PRODUTOS, VENDEDORES } from '../dados';
import { Coluna, Pagina } from '../Pagina';

interface Item {
  chave: number;
  produto: string;
  quantidade: number | null;
}

interface Rascunho {
  cliente: string;
  desconto: number | null;
  itens: Item[];
  observacoes: string;
  vendedor: string;
}

const SALVO: Rascunho = {
  cliente: CLIENTES[0],
  vendedor: VENDEDORES[0],
  desconto: 0,
  observacoes: '',
  itens: [
    { chave: 1, produto: 'PF-2204', quantidade: 4 },
    { chave: 2, produto: 'FO-1180', quantidade: 10 },
  ],
};

const precoDe = (produto: string) => PRODUTOS.find((candidato) => candidato.id === produto)?.preco ?? 0;

export function NovoPedido() {
  // O rascunho já traz um desconto acima do salvo, para a barra aparecer ao abrir a tela.
  const [rascunho, setRascunho] = useState<Rascunho>({ ...SALVO, desconto: 7 });
  const [salvo, setSalvo] = useState(SALVO);
  const [salvando, setSalvando] = useState(false);
  const alterado = JSON.stringify(rascunho) !== JSON.stringify(salvo);

  const subtotal = rascunho.itens.reduce((soma, item) => soma + precoDe(item.produto) * (item.quantidade ?? 0), 0);
  const desconto = (subtotal * (rascunho.desconto ?? 0)) / 100;

  function alterar(parcial: Partial<Rascunho>) {
    setRascunho({ ...rascunho, ...parcial });
  }

  function alterarItem(chave: number, parcial: Partial<Item>) {
    alterar({ itens: rascunho.itens.map((item) => (item.chave === chave ? { ...item, ...parcial } : item)) });
  }

  function adicionarItem() {
    const chave = Math.max(0, ...rascunho.itens.map((item) => item.chave)) + 1;
    alterar({ itens: [...rascunho.itens, { chave, produto: PRODUTOS[2].id, quantidade: 1 }] });
  }

  function salvar() {
    setSalvando(true);
    window.setTimeout(() => {
      setSalvo(rascunho);
      setSalvando(false);
    }, 900);
  }

  return (
    <Pagina caminho={['Vendas', 'Pedidos', 'Novo pedido']}>
      <SaveBar onDiscard={() => setRascunho(salvo)} onSave={salvar} open={alterado} saving={salvando} />
      <PageHeader maxWidth="1120px">
        <PageHeader.Back href={`${CAMINHO_DAS_COMPOSICOES}/pedidos`} label="Voltar para Pedidos" />
        <PageHeader.Title>Novo pedido</PageHeader.Title>
        <PageHeader.Badges>
          <Badge tone="neutral">Rascunho</Badge>
        </PageHeader.Badges>
        <PageHeader.Description>Preencha o cliente e os itens. As alterações aguardam a barra de salvar.</PageHeader.Description>
      </PageHeader>
      <Coluna largura={1120}>
        <Sidebar>
          <Sidebar.Main className="grade-coluna">
            <Card>
              <Card.Header description="Quem compra e quem vende." headingLevel={2} title="Cliente" />
              <Card.Body>
                <div className="campos campos-2">
                  <Select
                    label="Cliente"
                    onValueChange={(cliente) => alterar({ cliente })}
                    options={CLIENTES.map((nome) => ({ label: nome, value: nome }))}
                    required
                    value={rascunho.cliente}
                  />
                  <Select
                    label="Vendedor"
                    onValueChange={(vendedor) => alterar({ vendedor })}
                    options={VENDEDORES.map((nome) => ({ label: nome, value: nome }))}
                    value={rascunho.vendedor}
                  />
                </div>
              </Card.Body>
            </Card>
            <Card>
              <Card.Header
                description="Produtos e quantidades do pedido."
                headingLevel={2}
                title="Itens"
                trailing={<Button onClick={adicionarItem} size="sm" variant="secondary"><IconPlusLg />Adicionar item</Button>}
              />
              <Card.Body flush>
                <Table label="Itens do pedido" size="sm">
                  <Table.Header>
                    <Table.Column id="produto">Produto</Table.Column>
                    <Table.Column id="quantidade" width="120px">Quantidade</Table.Column>
                    <Table.Column hideBelow="md" id="total" numeric>Total</Table.Column>
                    <Table.Column id="remover" width="56px"><span className="so-leitor">Remover</span></Table.Column>
                  </Table.Header>
                  <Table.Body items={rascunho.itens.map((item) => ({ ...item, id: String(item.chave) }))}>
                    {(item) => (
                      <Table.Row id={item.id}>
                        <Table.Cell>
                          <Select
                            aria-label="Produto"
                            onValueChange={(produto) => alterarItem(item.chave, { produto })}
                            options={PRODUTOS.map((produto) => ({ label: produto.descricao, value: produto.id }))}
                            value={item.produto}
                          />
                        </Table.Cell>
                        <Table.Cell>
                          <InputNumber
                            aria-label="Quantidade"
                            onValueChange={(quantidade) => alterarItem(item.chave, { quantidade })}
                            value={item.quantidade}
                          />
                        </Table.Cell>
                        <Table.Cell>{formatCurrency(precoDe(item.produto) * (item.quantidade ?? 0))}</Table.Cell>
                        <Table.Cell>
                          <ButtonIcon
                            icon={<IconTrash />}
                            label="Remover item"
                            onClick={() => alterar({ itens: rascunho.itens.filter((candidato) => candidato.chave !== item.chave) })}
                            size="sm"
                            variant="ghost"
                          />
                        </Table.Cell>
                      </Table.Row>
                    )}
                  </Table.Body>
                </Table>
              </Card.Body>
            </Card>
          </Sidebar.Main>
          <Sidebar.Aside className="grade-coluna">
            <Card>
              <Card.Header headingLevel={2} title="Resumo" />
              <Card.Body>
                <InputNumber
                  decimalScale={1}
                  hint="Acima de 5% o pedido vai para aprovação."
                  label="Desconto (%)"
                  onValueChange={(valor) => alterar({ desconto: valor })}
                  value={rascunho.desconto}
                />
              </Card.Body>
              <Card.Footer>
                <dl className="totais">
                  <div><dt>Subtotal</dt><dd>{formatCurrency(subtotal)}</dd></div>
                  <div><dt>Desconto</dt><dd>− {formatCurrency(desconto)}</dd></div>
                  <div className="totais-total"><dt>Total</dt><dd>{formatCurrency(subtotal - desconto)}</dd></div>
                </dl>
              </Card.Footer>
            </Card>
            <Card>
              <Card.Header headingLevel={2} title="Observações" />
              <Card.Body>
                <Textarea
                  label="Para a separação e a entrega"
                  onValueChange={(observacoes) => alterar({ observacoes })}
                  placeholder="Ex.: entregar pela manhã"
                  value={rascunho.observacoes}
                />
              </Card.Body>
            </Card>
          </Sidebar.Aside>
        </Sidebar>
      </Coluna>
    </Pagina>
  );
}
