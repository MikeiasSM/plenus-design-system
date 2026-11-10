import { useState } from 'react';
import { Badge, Button, Card, EmptyState, NumberedList, PageHeader, Stack, Table } from '@plenustech/design-system';
import { IconPlusLg, IconUpload } from '@plenustech/design-system/icons';
import { IconBank } from '@plenustech/design-system/icons';
import { Coluna, Pagina } from '../Pagina';

const PRIMEIRA_CONTA = { id: 'horizonte', apelido: 'Conta principal', banco: 'Banco Horizonte', agencia: '1020', conta: '40213-7' };

export function Contas() {
  const [contas, setContas] = useState<(typeof PRIMEIRA_CONTA)[]>([]);

  return (
    <Pagina caminho={['Financeiro', 'Contas bancárias']}>
      <PageHeader maxWidth="1120px">
        <PageHeader.Title>Contas bancárias</PageHeader.Title>
        <PageHeader.Description>Contas usadas na conciliação e nos recebimentos.</PageHeader.Description>
        {contas.length > 0 && (
          <PageHeader.Actions>
            <Button><IconPlusLg />Nova conta</Button>
          </PageHeader.Actions>
        )}
      </PageHeader>
      <Coluna largura={1120}>
        <Stack>
          <Card>
            {contas.length === 0 ? (
              <>
                <Card.Body>
                  <EmptyState
                    actions={
                      <>
                        <Button variant="secondary"><IconUpload />Importar de uma planilha</Button>
                        <Button onClick={() => setContas([PRIMEIRA_CONTA])}>Registrar a primeira conta</Button>
                      </>
                    }
                    description="Com uma conta registrada, o sistema confere o extrato com os pedidos e mostra o saldo no fluxo de caixa."
                    icon={<IconBank />}
                    title="Nenhuma conta bancária registrada"
                  />
                </Card.Body>
                <Card.Body>
                  <NumberedList aria-label="Como funciona" layout="grid">
                    <NumberedList.Item description="Banco, agência e número." title="Registre a conta" />
                    <NumberedList.Item description="Arquivo OFX do internet banking." title="Envie o extrato" />
                    <NumberedList.Item description="O sistema sugere os pares." title="Concilie" />
                  </NumberedList>
                </Card.Body>
              </>
            ) : (
              <Card.Body flush>
                <Table label="Contas bancárias">
                  <Table.Header>
                    <Table.Column id="apelido">Conta</Table.Column>
                    <Table.Column id="banco">Banco</Table.Column>
                    <Table.Column hideBelow="sm" id="numero">Agência / conta</Table.Column>
                    <Table.Column id="situacao">Situação</Table.Column>
                  </Table.Header>
                  <Table.Body items={contas}>
                    {(conta) => (
                      <Table.Row id={conta.id}>
                        <Table.Cell>{conta.apelido}</Table.Cell>
                        <Table.Cell>{conta.banco}</Table.Cell>
                        <Table.Cell>{conta.agencia} / {conta.conta}</Table.Cell>
                        <Table.Cell><Badge tone="success">Ativa</Badge></Table.Cell>
                      </Table.Row>
                    )}
                  </Table.Body>
                </Table>
              </Card.Body>
            )}
          </Card>
        </Stack>
      </Coluna>
    </Pagina>
  );
}
