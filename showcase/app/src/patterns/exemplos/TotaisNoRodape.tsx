import { useState } from 'react';
import { Card, DescriptionList, InputNumber, Table, formatCurrency, formatPercent } from '@plenustech/design-system';

const FRETE = 45;
const DESCONTO = 0.05;

const PRODUTOS = [
  { id: 'filtro', nome: 'Filtro de óleo', unitario: 38.5 },
  { id: 'pastilha', nome: 'Pastilha de freio dianteira', unitario: 189.9 },
  { id: 'correia', nome: 'Correia dentada', unitario: 96.7 },
];

export function TotaisNoRodape() {
  const [quantidades, setQuantidades] = useState<Record<string, number | null>>({ filtro: 4, pastilha: 2, correia: 1 });

  const subtotal = PRODUTOS.reduce((soma, produto) => soma + produto.unitario * (quantidades[produto.id] ?? 0), 0);
  const desconto = Math.round(subtotal * DESCONTO * 100) / 100;

  return (
    <Card>
      <Card.Header headingLevel={2} title="Itens do pedido" />
      <Card.Body flush>
        <Table label="Itens do pedido" size="sm">
          <Table.Header>
            <Table.Column id="nome">Produto</Table.Column>
            <Table.Column id="quantidade" width="120px">Quantidade</Table.Column>
            <Table.Column id="total" numeric width="120px">Total</Table.Column>
          </Table.Header>
          <Table.Body items={PRODUTOS}>
            {(produto) => (
              <Table.Row id={produto.id}>
                <Table.Cell>{produto.nome}</Table.Cell>
                <Table.Cell>
                  <InputNumber
                    aria-label={`Quantidade de ${produto.nome}`}
                    onValueChange={(quantidade) => setQuantidades({ ...quantidades, [produto.id]: quantidade })}
                    value={quantidades[produto.id]}
                  />
                </Table.Cell>
                <Table.Cell>{formatCurrency(produto.unitario * (quantidades[produto.id] ?? 0))}</Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table>
      </Card.Body>
      {/* Os totais vão no rodapé do cartão: o termo à esquerda, o valor à direita, e o total em destaque por último. */}
      <Card.Footer>
        <DescriptionList layout="inline">
          <DescriptionList.Item term="Subtotal">{formatCurrency(subtotal)}</DescriptionList.Item>
          <DescriptionList.Item term={`Desconto (${formatPercent(DESCONTO)})`}>− {formatCurrency(desconto)}</DescriptionList.Item>
          <DescriptionList.Item term="Frete">{formatCurrency(FRETE)}</DescriptionList.Item>
          <DescriptionList.Item emphasis term="Total">{formatCurrency(subtotal - desconto + FRETE)}</DescriptionList.Item>
        </DescriptionList>
      </Card.Footer>
    </Card>
  );
}
