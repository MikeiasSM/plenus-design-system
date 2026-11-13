import { Card, Table, Tabs } from '@plenustech/design-system';

type Visao = 'todas' | 'abertas' | 'atrasadas';

const TAREFAS = [
  { id: '1', titulo: 'Conferir o estoque da matriz', prazo: '04/11/2026', situacao: 'aberta' },
  { id: '2', titulo: 'Renovar o certificado digital', prazo: '28/10/2026', situacao: 'atrasada' },
  { id: '3', titulo: 'Responder à cotação da transportadora', prazo: '06/11/2026', situacao: 'aberta' },
  { id: '4', titulo: 'Fechar a folha do mês', prazo: '30/10/2026', situacao: 'atrasada' },
  { id: '5', titulo: 'Revisar a tabela de preços', prazo: '10/11/2026', situacao: 'aberta' },
  { id: '6', titulo: 'Arquivar os contratos encerrados', prazo: '25/10/2026', situacao: 'atrasada' },
  { id: '7', titulo: 'Atualizar o cadastro de fornecedores', prazo: '12/11/2026', situacao: 'aberta' },
];

const VISOES: { chave: Visao; rotulo: string; situacoes: readonly string[] }[] = [
  { chave: 'todas', rotulo: 'Todas', situacoes: ['aberta', 'atrasada'] },
  { chave: 'abertas', rotulo: 'Em aberto', situacoes: ['aberta'] },
  { chave: 'atrasadas', rotulo: 'Atrasadas', situacoes: ['atrasada'] },
];

const tarefasDa = (situacoes: readonly string[]) => TAREFAS.filter((tarefa) => situacoes.includes(tarefa.situacao));

export function VisoesSalvas() {
  return (
    <Card>
      <Card.Body flush>
        <Tabs
          items={VISOES.map(({ chave, rotulo, situacoes }) => {
            const tarefas = tarefasDa(situacoes);

            return {
              key: chave,
              // A contagem vai no rótulo: ela faz parte do nome da aba, e o leitor de tela a lê junto.
              label: `${rotulo} (${tarefas.length})`,
              content: (
                <Table label={`Tarefas: ${rotulo.toLowerCase()}`}>
                  <Table.Header>
                    <Table.Column id="titulo">Tarefa</Table.Column>
                    <Table.Column id="prazo" width="120px">Prazo</Table.Column>
                  </Table.Header>
                  <Table.Body items={tarefas}>
                    {(tarefa) => (
                      <Table.Row id={tarefa.id}>
                        <Table.Cell>{tarefa.titulo}</Table.Cell>
                        <Table.Cell>{tarefa.prazo}</Table.Cell>
                      </Table.Row>
                    )}
                  </Table.Body>
                </Table>
              ),
            };
          })}
          label="Visões das tarefas"
        />
      </Card.Body>
    </Card>
  );
}
