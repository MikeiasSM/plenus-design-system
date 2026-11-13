import { useState } from 'react';
import { Button, Card, Grid, IconPlus, PageHeader, Progress, SegmentedControl, Table, formatNumber, formatPercent, Text } from '@plenustech/design-system';
import { IconGrid, IconTable } from '@plenustech/design-system/icons';
import { DEPOSITOS, TIPOS_DE_DEPOSITO } from '../dados';
import { Coluna, Pagina, SeloDaSituacao } from '../Pagina';

type Forma = 'cartoes' | 'tabela';

function Cartoes() {
  return (
    <Grid minColumnWidth={300}>
      {DEPOSITOS.map((deposito) => (
        <Card key={deposito.id}>
          <Card.Header
            badge={<SeloDaSituacao situacao={TIPOS_DE_DEPOSITO[deposito.tipo]} />}
            description={deposito.local}
            headingLevel={2}
            title={deposito.nome}
          />
          <Card.Body>
            <Progress label="Ocupação" showValue value={deposito.ocupacao} />
          </Card.Body>
          <Card.Footer
            start={
              <Text tone="tertiary" variant="caption">
                {formatNumber(deposito.itens)} itens · {deposito.responsavel}
              </Text>
            }
          />
        </Card>
      ))}
    </Grid>
  );
}

function Tabela() {
  return (
    <Card>
      <Card.Body flush>
        <Table label="Depósitos">
          <Table.Header>
            <Table.Column id="nome">Depósito</Table.Column>
            <Table.Column id="tipo">Tipo</Table.Column>
            <Table.Column hideBelow="md" id="local">Local</Table.Column>
            <Table.Column hideBelow="lg" id="responsavel">Responsável</Table.Column>
            <Table.Column id="itens" numeric>Itens</Table.Column>
            <Table.Column id="ocupacao" numeric>Ocupação</Table.Column>
          </Table.Header>
          <Table.Body items={DEPOSITOS}>
            {(deposito) => (
              <Table.Row id={deposito.id}>
                <Table.Cell>{deposito.nome}</Table.Cell>
                <Table.Cell><SeloDaSituacao situacao={TIPOS_DE_DEPOSITO[deposito.tipo]} /></Table.Cell>
                <Table.Cell>{deposito.local}</Table.Cell>
                <Table.Cell>{deposito.responsavel}</Table.Cell>
                <Table.Cell>{formatNumber(deposito.itens)}</Table.Cell>
                <Table.Cell>{formatPercent(deposito.ocupacao / 100)}</Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table>
      </Card.Body>
    </Card>
  );
}

export function Depositos() {
  const [forma, setForma] = useState<Forma>('cartoes');

  return (
    <Pagina caminho={['Estoque', 'Depósitos']}>
      <PageHeader maxWidth="1120px">
        <PageHeader.Title>Depósitos</PageHeader.Title>
        <PageHeader.Description>{DEPOSITOS.length} depósitos ativos. Cada um tem responsável e saldo próprios.</PageHeader.Description>
        <PageHeader.Actions>
          <SegmentedControl
            items={[
              { label: 'Cartões', value: 'cartoes', icon: <IconGrid /> },
              { label: 'Tabela', value: 'tabela', icon: <IconTable /> },
            ]}
            label="Forma de exibição"
            onValueChange={(valor) => setForma(valor as Forma)}
            value={forma}
          />
          <Button><IconPlus />Novo depósito</Button>
        </PageHeader.Actions>
      </PageHeader>
      <Coluna largura={1120}>{forma === 'cartoes' ? <Cartoes /> : <Tabela />}</Coluna>
    </Pagina>
  );
}
