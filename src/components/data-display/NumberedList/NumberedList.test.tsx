import { createRef } from 'react';
import { render, screen, within } from '@testing-library/react';
import { NumberedList } from './NumberedList';

describe('NumberedList', () => {
  it('rende uma lista ordenada com os itens, titulos e descricoes em ordem', () => {
    render(
      <NumberedList>
        <NumberedList.Item description="Banco e conta." title="Registre a conta" />
        <NumberedList.Item title="Envie o extrato" />
      </NumberedList>,
    );

    const itens = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(screen.getByRole('list').tagName).toBe('OL');
    expect(itens).toHaveLength(2);
    expect(itens[0]).toHaveTextContent('Registre a conta');
    expect(itens[0]).toHaveTextContent('Banco e conta.');
    expect(itens[1]).toHaveTextContent('Envie o extrato');
  });

  it('entrega o layout a lista e aos itens', () => {
    render(
      <NumberedList layout="grid">
        <NumberedList.Item title="Passo" />
      </NumberedList>,
    );

    expect(screen.getByRole('list')).toHaveAttribute('data-layout', 'grid');
    expect(screen.getByRole('listitem')).toHaveAttribute('data-layout', 'grid');
  });

  it('encaminha ref, className e propriedades nativas na lista e no item', () => {
    const listaRef = createRef<HTMLOListElement>();
    const itemRef = createRef<HTMLLIElement>();
    render(
      <NumberedList aria-label="Passos" className="minha-lista" ref={listaRef}>
        <NumberedList.Item className="meu-item" data-teste="item" ref={itemRef} title="Passo" />
      </NumberedList>,
    );

    expect(listaRef.current).toBe(screen.getByRole('list', { name: 'Passos' }));
    expect(listaRef.current).toHaveClass('minha-lista');
    expect(itemRef.current).toBe(screen.getByRole('listitem'));
    expect(itemRef.current).toHaveClass('meu-item');
    expect(itemRef.current).toHaveAttribute('data-teste', 'item');
  });
});
