import { useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Dialog,
  Grid,
  InputCurrency,
  InputNumber,
  InputText,
  PageHeader,
  Select,
  Stack,
  Table,
  formatCurrency,
  formatNumber,
} from '@plenustech/design-system';
import { IconPlusLg } from '@plenustech/design-system/icons';
import { PRODUTOS } from '../dados';
import { Coluna, Pagina } from '../Pagina';

interface Produto {
  descricao: string;
  estoque: number;
  id: string;
  minimo: number;
  preco: number;
  unidade: string;
}

const NOVO: Omit<Produto, 'id'> = { descricao: '', unidade: 'Un', preco: 0, estoque: 0, minimo: 0 };

const UNIDADES = ['Un', 'Jogo', 'Kit', 'Balde'].map((unidade) => ({ label: unidade, value: unidade }));

export function Produtos() {
  const [produtos, setProdutos] = useState<Produto[]>(PRODUTOS);
  const [novo, setNovo] = useState(NOVO);
  const [dialogoAberto, setDialogoAberto] = useState(false);
  const [recemCriado, setRecemCriado] = useState<string>();

  function incluir() {
    const id = `P-${1000 + produtos.length + 1}`;
    setProdutos([{ ...novo, id }, ...produtos]);
    setRecemCriado(id);
    setNovo(NOVO);
    setDialogoAberto(false);
  }

  return (
    <Pagina caminho={['Estoque', 'Produtos']}>
      <PageHeader maxWidth="1120px">
        <PageHeader.Title>Produtos</PageHeader.Title>
        <PageHeader.Description>Catálogo de peças e serviços com estoque e preço de venda.</PageHeader.Description>
        <PageHeader.Actions>
          <Button onClick={() => setDialogoAberto(true)}><IconPlusLg />Novo produto</Button>
        </PageHeader.Actions>
      </PageHeader>
      <Coluna largura={1120}>
        <Stack>
          <Alert title="Criar sem sair da lista" tone="info">
            Novo produto abre um diálogo com os campos essenciais. O item entra no topo da tabela, marcado como novo.
          </Alert>
          <Card>
            <Card.Body flush>
              <Table label="Produtos">
                <Table.Header>
                  <Table.Column id="id">Código</Table.Column>
                  <Table.Column id="descricao">Descrição</Table.Column>
                  <Table.Column hideBelow="md" id="unidade">Unidade</Table.Column>
                  <Table.Column id="preco" numeric>Preço</Table.Column>
                  <Table.Column id="estoque" numeric>Estoque</Table.Column>
                </Table.Header>
                <Table.Body items={produtos}>
                  {(produto) => (
                    <Table.Row id={produto.id}>
                      <Table.Cell>{produto.id}</Table.Cell>
                      <Table.Cell>
                        {produto.descricao} {produto.id === recemCriado && <Badge tone="info">Novo</Badge>}
                      </Table.Cell>
                      <Table.Cell>{produto.unidade}</Table.Cell>
                      <Table.Cell>{formatCurrency(produto.preco)}</Table.Cell>
                      <Table.Cell>
                        {produto.estoque < produto.minimo && <Badge tone="danger">Abaixo do mínimo</Badge>} {formatNumber(produto.estoque)}
                      </Table.Cell>
                    </Table.Row>
                  )}
                </Table.Body>
              </Table>
            </Card.Body>
          </Card>
        </Stack>
      </Coluna>
      <Dialog
        description="Os campos essenciais. O código é gerado sozinho."
        footer={
          <>
            <Button onClick={() => setDialogoAberto(false)} variant="secondary">Cancelar</Button>
            <Button disabled={!novo.descricao.trim()} onClick={incluir}>Criar produto</Button>
          </>
        }
        onOpenChange={setDialogoAberto}
        open={dialogoAberto}
        title="Novo produto"
      >
        <Stack>
          <InputText label="Descrição" onValueChange={(descricao) => setNovo({ ...novo, descricao })} required value={novo.descricao} />
          <Grid columns={3} minColumnWidth={163}>
            <Select label="Unidade" onValueChange={(unidade) => setNovo({ ...novo, unidade })} options={UNIDADES} value={novo.unidade} />
            <InputCurrency label="Preço" onValueChange={(preco) => setNovo({ ...novo, preco: preco ?? 0 })} value={novo.preco} />
            <InputNumber label="Estoque inicial" onValueChange={(estoque) => setNovo({ ...novo, estoque: estoque ?? 0 })} value={novo.estoque} />
          </Grid>
        </Stack>
      </Dialog>
    </Pagina>
  );
}
