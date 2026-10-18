import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { EmptyState } from './EmptyState';
import styles from './EmptyState.module.css';

describe('EmptyState', () => {
  it('mostra o titulo, a descricao e as acoes', () => {
    render(
      <EmptyState
        actions={<button type="button">Limpar filtros</button>}
        description="Ajuste a busca."
        title="Nenhum registro encontrado"
      />,
    );

    expect(screen.getByText('Nenhum registro encontrado')).toBeInTheDocument();
    expect(screen.getByText('Ajuste a busca.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Limpar filtros' })).toBeInTheDocument();
  });

  it('o vazio comum nao interrompe o leitor de tela, e a falha sim', () => {
    const { rerender } = render(<EmptyState title="Nenhum registro encontrado" />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    rerender(<EmptyState title="Não foi possível carregar" tone="danger" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar');
  });

  it('o icone e os cartoes ficam fora da leitura', () => {
    const { container } = render(<EmptyState title="Vazio" />);

    expect(container.querySelector('svg')?.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(container.getElementsByClassName(styles.card!)).toHaveLength(2);
  });

  it('os cartoes nao aparecem no tamanho pequeno nem na falha', () => {
    const { container, rerender } = render(<EmptyState size="sm" title="Vazio" />);

    expect(container.getElementsByClassName(styles.card!)).toHaveLength(0);

    rerender(<EmptyState title="Falhou" tone="danger" />);

    expect(container.getElementsByClassName(styles.card!)).toHaveLength(0);
  });

  it('leva as propriedades nativas, o className e a ref ao elemento de fora', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(<EmptyState className="largo" data-origem="lista" ref={ref} title="Vazio" />);

    expect(container.firstElementChild).toBe(ref.current);
    expect(ref.current).toHaveClass('largo');
    expect(ref.current).toHaveAttribute('data-origem', 'lista');
  });
});
