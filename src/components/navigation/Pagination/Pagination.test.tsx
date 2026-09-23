import { fireEvent, render, screen } from '@testing-library/react';
import { Pagination, montarFaixa } from './Pagination';

describe('montarFaixa', () => {
  it('mostra tudo quando cabe', () => {
    expect(montarFaixa(1, 5, 1)).toEqual([1, 2, 3, 4, 5]);
  });

  it('abre reticencia a direita quando a atual esta no inicio', () => {
    expect(montarFaixa(2, 20, 1)).toEqual([1, 2, 3, null, 20]);
  });

  it('abre reticencia dos dois lados no meio', () => {
    expect(montarFaixa(10, 20, 1)).toEqual([1, null, 9, 10, 11, null, 20]);
  });

  it('abre reticencia a esquerda quando a atual esta no fim', () => {
    expect(montarFaixa(19, 20, 1)).toEqual([1, null, 18, 19, 20]);
  });

  it('respeita a quantidade de vizinhos', () => {
    expect(montarFaixa(10, 20, 2)).toEqual([1, null, 8, 9, 10, 11, 12, null, 20]);
  });
});

describe('Pagination', () => {
  it('nao renderiza nada com uma pagina so', () => {
    const { container } = render(<Pagination page={1} pageCount={1} onPageChange={() => undefined} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('marca a pagina atual e desabilita o passo anterior no inicio', () => {
    render(<Pagination page={1} pageCount={10} onPageChange={() => undefined} />);

    expect(screen.getByRole('button', { name: 'Pagina 1' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Pagina anterior' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Proxima pagina' })).toBeEnabled();
  });

  it('desabilita o proximo no fim', () => {
    render(<Pagination page={10} pageCount={10} onPageChange={() => undefined} />);

    expect(screen.getByRole('button', { name: 'Proxima pagina' })).toBeDisabled();
  });

  it('reporta a pagina escolhida e os passos', () => {
    const onPageChange = vi.fn();
    render(<Pagination page={5} pageCount={10} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Pagina 6' }));
    expect(onPageChange).toHaveBeenCalledWith(6);

    fireEvent.click(screen.getByRole('button', { name: 'Pagina anterior' }));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it('limita a pagina informada a faixa valida', () => {
    render(<Pagination page={99} pageCount={10} onPageChange={() => undefined} />);

    expect(screen.getByRole('button', { name: 'Pagina 10' })).toHaveAttribute('aria-current', 'page');
  });
});
