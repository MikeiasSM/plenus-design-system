import { render, screen } from '@testing-library/react';
import { Table } from './Table';

const linhas = [{ id: '1', nome: 'Ana' }];

function tabela(titulo: string) {
  return (
    <Table label={titulo} rows={linhas} selectionControl="radio" selectionMode="single">
      <Table.Header>
        <Table.Column id="nome">Nome</Table.Column>
      </Table.Header>
      <Table.Body items={linhas}>
        {(linha) => (
          <Table.Row id={linha.id} label={`Selecionar ${linha.nome}`}>
            <Table.Cell>{linha.nome}</Table.Cell>
          </Table.Row>
        )}
      </Table.Body>
    </Table>
  );
}

describe('selecao por radio na Table', () => {
  it('nao junta duas tabelas no mesmo grupo de radio', () => {
    render(
      <>
        {tabela('Primeira')}
        {tabela('Segunda')}
      </>,
    );

    const nomes = screen.getAllByRole('radio').map((radio) => radio.getAttribute('name'));

    expect(nomes).toHaveLength(2);
    expect(nomes[0]).not.toBe(nomes[1]);
  });
});
