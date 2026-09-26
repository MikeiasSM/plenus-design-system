import { fireEvent, render, screen } from '@testing-library/react';
import { List, type ListItem } from './List';

const primeira: ListItem[] = [{ value: 'sp', label: 'São Paulo' }];
const segunda: ListItem[] = [{ value: 'rj', label: 'Rio de Janeiro' }];

describe('List com busca assincrona', () => {
  it('nao descarta a escolha feita numa busca anterior', () => {
    const escolhas: ListItem[][] = [];

    const { rerender } = render(
      <List items={primeira} label="Cidades" onSelectionChange={(itens) => escolhas.push([...itens])} selectionMode="multiple">
        <List.Options />
      </List>,
    );

    fireEvent.click(screen.getByText('São Paulo'));
    expect(escolhas.at(-1)?.map((item) => item.value)).toEqual(['sp']);

    // A consulta seguinte troca a colecao inteira.
    rerender(
      <List items={segunda} label="Cidades" onSelectionChange={(itens) => escolhas.push([...itens])} selectionMode="multiple">
        <List.Options />
      </List>,
    );

    fireEvent.click(screen.getByText('Rio de Janeiro'));

    expect(escolhas.at(-1)?.map((item) => item.value)).toEqual(['sp', 'rj']);
  });
});
