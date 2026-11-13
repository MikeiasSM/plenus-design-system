import { useEffect, useRef, useState } from 'react';
import { Avatar, AvatarItem, ButtonIcon, Card, IconTrash, Table, VisuallyHidden } from '@plenustech/design-system';

const MEMBROS = [
  { id: 'ar', nome: 'Ana Ribeiro', papel: 'Administradora' },
  { id: 'bl', nome: 'Bruno Lima', papel: 'Gerente comercial' },
  { id: 'cn', nome: 'Carla Nogueira', papel: 'Financeiro' },
  { id: 'dt', nome: 'Diego Teixeira', papel: 'Atendimento' },
];

export function ColunaDeAcaoDeLinha() {
  const [membros, setMembros] = useState(MEMBROS);
  // O botão de cada linha: quando uma linha some, o foco vai para a vizinha, e não para o começo da página.
  const botoes = useRef(new Map<string, HTMLElement>());
  const [focarEm, setFocarEm] = useState<string | null>(null);

  useEffect(() => {
    if (focarEm) {
      botoes.current.get(focarEm)?.focus();
      setFocarEm(null);
    }
  }, [focarEm]);

  function remover(id: string) {
    const indice = membros.findIndex((membro) => membro.id === id);
    const restantes = membros.filter((membro) => membro.id !== id);

    setMembros(restantes);
    // A linha que tomou o lugar da removida, ou a de cima, quando a removida era a última.
    setFocarEm(restantes[Math.min(indice, restantes.length - 1)]?.id ?? null);
  }

  return (
    <Card>
      <Card.Body flush>
        <Table label="Membros da equipe">
          <Table.Header>
            <Table.Column id="nome">Membro</Table.Column>
            {/* A coluna não tem título na tela: o texto oculto dá o nome dela ao leitor de tela. */}
            <Table.Column align="end" id="remover" width="72px">
              <VisuallyHidden>Remover</VisuallyHidden>
            </Table.Column>
          </Table.Header>
          {/* O vazio fica no corpo da própria tabela, com o cabeçalho à vista. */}
          <Table.Body emptyDescription="Ninguém na equipe." emptyTitle="Nenhum membro" items={membros}>
            {(membro) => (
              <Table.Row id={membro.id}>
                <Table.Cell>
                  <AvatarItem avatar={<Avatar name={membro.nome} size="sm" />} description={membro.papel} title={membro.nome} />
                </Table.Cell>
                <Table.Cell>
                  {/* O nome é único por linha: "Remover" repetido não diz o quê. A dica abre para o lado, sem cobrir a linha de cima. */}
                  <ButtonIcon
                    icon={<IconTrash />}
                    label={`Remover ${membro.nome}`}
                    onClick={() => remover(membro.id)}
                    ref={(botao) => {
                      if (botao) {
                        botoes.current.set(membro.id, botao);
                      } else {
                        botoes.current.delete(membro.id);
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
    </Card>
  );
}
