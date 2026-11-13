import { useEffect, useRef, useState } from 'react';
import { Button, ButtonIcon, Card, EmptyState, IconPlus, IconTrash, IconUpload, NumberedList, Table, VisuallyHidden } from '@plenustech/design-system';
import { IconPeople } from '@plenustech/design-system/icons';

const IMPORTADOS = [
  { id: 'rs', nome: 'Transportes Rota Sul', cidade: 'Santa Aurora' },
  { id: 'vv', nome: 'Agropecuária Vale Verde', cidade: 'Rio Claro' },
  { id: 'pe', nome: 'Posto Estrela do Oeste', cidade: 'Santa Aurora' },
];

export function VazioDaPrimeiraVez() {
  const [clientes, setClientes] = useState<typeof IMPORTADOS>([]);
  // Quando uma linha some, o foco vai para a vizinha; quando a última some, para a ação principal do vazio.
  const botoes = useRef(new Map<string, HTMLElement>());
  const primeiraAcao = useRef<HTMLButtonElement>(null);
  const [focarEm, setFocarEm] = useState<string | null>(null);

  useEffect(() => {
    if (focarEm) {
      (focarEm === 'vazio' ? primeiraAcao.current : botoes.current.get(focarEm))?.focus();
      setFocarEm(null);
    }
  }, [focarEm]);

  function remover(id: string) {
    const indice = clientes.findIndex((cliente) => cliente.id === id);
    const restantes = clientes.filter((cliente) => cliente.id !== id);

    setClientes(restantes);
    setFocarEm(restantes[Math.min(indice, restantes.length - 1)]?.id ?? 'vazio');
  }

  return (
    <Card>
      {clientes.length === 0 ? (
        <>
          <Card.Body>
            {/* Até duas ações: a secundária antes da principal. */}
            <EmptyState
              actions={
                <>
                  <Button onClick={() => setClientes(IMPORTADOS)} variant="secondary"><IconUpload />Importar de uma planilha</Button>
                  <Button onClick={() => setClientes(IMPORTADOS.slice(0, 1))} ref={primeiraAcao}><IconPlus />Cadastrar o primeiro cliente</Button>
                </>
              }
              description="Com clientes cadastrados, você cria pedidos e acompanha o crédito de cada um."
              icon={<IconPeople />}
              title="Nenhum cliente cadastrado"
            />
          </Card.Body>
          <Card.Body>
            <NumberedList aria-label="Como começar" layout="grid">
              <NumberedList.Item description="Nome, documento e endereço." title="Cadastre o cliente" />
              <NumberedList.Item description="Limite e prazo de pagamento." title="Defina o crédito" />
              <NumberedList.Item description="O cliente já aparece na tela de pedidos." title="Crie o primeiro pedido" />
            </NumberedList>
          </Card.Body>
        </>
      ) : (
        <Card.Body flush>
          <Table label="Clientes">
            <Table.Header>
              <Table.Column id="nome">Cliente</Table.Column>
              <Table.Column hideBelow="sm" id="cidade">Cidade</Table.Column>
              <Table.Column align="end" id="remover" width="72px"><VisuallyHidden>Remover</VisuallyHidden></Table.Column>
            </Table.Header>
            <Table.Body items={clientes}>
              {(cliente) => (
                <Table.Row id={cliente.id}>
                  <Table.Cell>{cliente.nome}</Table.Cell>
                  <Table.Cell>{cliente.cidade}</Table.Cell>
                  <Table.Cell>
                    <ButtonIcon
                      icon={<IconTrash />}
                      label={`Remover ${cliente.nome}`}
                      onClick={() => remover(cliente.id)}
                      ref={(botao) => {
                        if (botao) {
                          botoes.current.set(cliente.id, botao);
                        } else {
                          botoes.current.delete(cliente.id);
                        }
                      }}
                      size="sm"
                      tooltipPlacement="left"
                      variant="ghost"
                    />
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
        </Card.Body>
      )}
    </Card>
  );
}
