import { useState } from 'react';
import { Badge, Button, Card, EmptyState, PageHeader, Steps, Table } from '@plenustech/design-system';
import { IconPlusLg, IconUpload } from '@plenustech/design-system/icons';
import { IconBank } from '@plenustech/design-system/icons';
import { Coluna, Pagina } from '../Pagina';

const PASSOS = [
  { key: 'registrar', label: 'Registre a conta', description: 'Banco, agência e número.' },
  { key: 'enviar', label: 'Envie o extrato', description: 'Arquivo OFX do internet banking.' },
  { key: 'conciliar', label: 'Concilie', description: 'O sistema sugere os pares.' },
];

const PRIMEIRA_CONTA = { id: 'bb', apelido: 'Conta principal', banco: 'Banco do Brasil', agencia: '3412', conta: '55871-4' };

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
      <Coluna className="grade grade-uma" largura={1120}>
        <Card>
          {contas.length === 0 ? (
            <Card.Body>
              <EmptyState
                actions={
                  <>
                    <Button variant="secondary"><IconUpload />Importar de uma planilha</Button>
                    <Button onClick={() => setContas([PRIMEIRA_CONTA])}>Registrar a primeira conta</Button>
                  </>
                }
                description="Com uma conta registrada, o Painel confere o extrato com os pedidos e mostra o saldo no fluxo de caixa."
                icon={<IconBank />}
                title="Nenhuma conta bancária registrada"
              />
            </Card.Body>
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
        {contas.length === 0 && (
          <Card>
            <Card.Header description="O que acontece depois que a primeira conta existe." title="Como funciona" />
            <Card.Body>
              <Steps items={PASSOS} label="Como funciona" />
            </Card.Body>
          </Card>
        )}
      </Coluna>
    </Pagina>
  );
}
