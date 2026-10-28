import { fireEvent, render, screen } from '@testing-library/react';
import { Pagination, montarFaixa } from './Pagination';

describe('montarFaixa', () => {
  it('mostra tudo quando cabe', () => {
    expect(montarFaixa(1, 5, 1)).toEqual([1, 2, 3, 4, 5]);
  });

  it('abre reticencia a direita quando a atual esta no inicio, sem encolher a faixa', () => {
    expect(montarFaixa(2, 20, 1)).toEqual([1, 2, 3, 4, 5, null, 20]);
    expect(montarFaixa(1, 10, 1)).toEqual([1, 2, 3, 4, 5, null, 10]);
  });

  it('nao esconde uma pagina so atras da reticencia', () => {
    expect(montarFaixa(4, 10, 1)).toEqual([1, 2, 3, 4, 5, null, 10]);
  });

  it('abre reticencia dos dois lados no meio', () => {
    expect(montarFaixa(10, 20, 1)).toEqual([1, null, 9, 10, 11, null, 20]);
  });

  it('abre reticencia a esquerda quando a atual esta no fim', () => {
    expect(montarFaixa(19, 20, 1)).toEqual([1, null, 16, 17, 18, 19, 20]);
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

    expect(screen.getByRole('button', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Página anterior' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button', { name: 'Próxima página' })).not.toHaveAttribute('aria-disabled');
  });

  it('desabilita o proximo no fim', () => {
    render(<Pagination page={10} pageCount={10} onPageChange={() => undefined} />);

    expect(screen.getByRole('button', { name: 'Próxima página' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('nao passa da borda pelo passo que continua focavel nela', () => {
    const onPageChange = vi.fn();
    render(<Pagination page={1} pageCount={10} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Página anterior' }));

    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('reporta a pagina escolhida e os passos', () => {
    const onPageChange = vi.fn();
    render(<Pagination page={5} pageCount={10} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Página 6' }));
    expect(onPageChange).toHaveBeenCalledWith(6);

    fireEvent.click(screen.getByRole('button', { name: 'Página anterior' }));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it('controlada, so muda a pagina atual quando o produto muda page', () => {
    render(<Pagination page={5} pageCount={10} onPageChange={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Página 6' }));

    expect(screen.getByRole('button', { name: 'Página 5' })).toHaveAttribute('aria-current', 'page');
  });

  it('sem controle, comeca pelo defaultPage e troca de pagina sozinha', () => {
    const onPageChange = vi.fn();
    render(<Pagination defaultPage={3} pageCount={10} onPageChange={onPageChange} />);
    expect(screen.getByRole('button', { name: 'Página 3' })).toHaveAttribute('aria-current', 'page');

    fireEvent.click(screen.getByRole('button', { name: 'Próxima página' }));

    expect(onPageChange).toHaveBeenCalledWith(4);
    expect(screen.getByRole('button', { name: 'Página 4' })).toHaveAttribute('aria-current', 'page');
  });

  it('sem page nem defaultPage, comeca na primeira', () => {
    render(<Pagination pageCount={10} />);

    expect(screen.getByRole('button', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page');
  });

  it('limita a pagina informada a faixa valida', () => {
    render(<Pagination page={99} pageCount={10} onPageChange={() => undefined} />);

    expect(screen.getByRole('button', { name: 'Página 10' })).toHaveAttribute('aria-current', 'page');
  });

  it('suspende a troca de pagina sem tirar os botoes do foco', () => {
    const onPageChange = vi.fn();
    render(<Pagination disabled page={5} pageCount={10} onPageChange={onPageChange} />);

    const pagina = screen.getByRole('button', { name: 'Página 6' });

    fireEvent.click(pagina);
    fireEvent.click(screen.getByRole('button', { name: 'Próxima página' }));

    expect(onPageChange).not.toHaveBeenCalled();
    expect(pagina).toHaveAttribute('aria-disabled', 'true');
    expect(pagina).not.toBeDisabled();
  });

  describe('intervalo da página', () => {
    it('não mostra o intervalo sem o total e o tamanho da página', () => {
      render(<Pagination page={1} pageCount={10} onPageChange={() => undefined} />);

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('mostra o intervalo da última página, que pode vir incompleta', () => {
      render(<Pagination page={3} pageCount={3} pageSize={25} totalItems={52} onPageChange={() => undefined} />);

      expect(screen.getByText('51–52 de 52')).toBeInTheDocument();
    });

    it('separa o milhar com ponto', () => {
      render(<Pagination page={25} pageCount={88} pageSize={50} totalItems={4380} onPageChange={() => undefined} />);

      expect(screen.getByText('1.201–1.250 de 4.380')).toBeInTheDocument();
    });

    it('anuncia por região viva, numa forma falada sem o travessão', () => {
      const { rerender } = render(
        <Pagination page={1} pageCount={3} pageSize={25} totalItems={52} onPageChange={() => undefined} />,
      );
      rerender(<Pagination page={2} pageCount={3} pageSize={25} totalItems={52} onPageChange={() => undefined} />);

      const regiao = screen.getByRole('status');
      expect(screen.getByText('26–50 de 52')).toHaveAttribute('aria-hidden', 'true');
      expect(regiao).toContainElement(screen.getByText('Itens 26 a 50 de 52'));
      expect(screen.getAllByRole('status')).toHaveLength(1);
    });

    it('troca o texto pelo formatRange', () => {
      const formatRange = vi.fn(({ start, end, total }) => `Documentos ${start} a ${end} de ${total}`);
      render(
        <Pagination
          formatRange={formatRange}
          page={2}
          pageCount={3}
          pageSize={25}
          totalItems={52}
          onPageChange={() => undefined}
        />,
      );

      expect(formatRange).toHaveBeenCalledWith({ start: 26, end: 50, total: 52 });
      expect(screen.getByRole('status')).toHaveTextContent(/^Documentos 26 a 50 de 52$/);
    });
  });

  describe('primeira e última página', () => {
    it('leva às pontas e desabilita a da ponta atual', () => {
      const onPageChange = vi.fn();
      render(<Pagination showFirstLast page={1} pageCount={10} onPageChange={onPageChange} />);

      expect(screen.getByRole('button', { name: 'Primeira página' })).toHaveAttribute('aria-disabled', 'true');

      fireEvent.click(screen.getByRole('button', { name: 'Primeira página' }));
      fireEvent.click(screen.getByRole('button', { name: 'Última página' }));

      expect(onPageChange).toHaveBeenCalledTimes(1);
      expect(onPageChange).toHaveBeenCalledWith(10);
    });

    it('não aparecem sem showFirstLast', () => {
      render(<Pagination page={1} pageCount={10} />);

      expect(screen.queryByRole('button', { name: 'Última página' })).not.toBeInTheDocument();
    });
  });

  describe('itens por página', () => {
    function escolherTamanho(tamanho: string) {
      fireEvent.click(screen.getByRole('combobox', { name: 'Itens por página' }));
      fireEvent.click(screen.getByRole('option', { name: tamanho }));
    }

    it('sem controle, começa pela primeira opção e tira dela o total de páginas', () => {
      render(<Pagination pageSizeOptions={[25, 50]} totalItems={120} />);

      expect(screen.getByRole('combobox', { name: 'Itens por página' })).toHaveTextContent('25');
      expect(screen.getByRole('button', { name: 'Página 5' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Página 6' })).not.toBeInTheDocument();
    });

    it('vai à página que contém o primeiro item da atual', () => {
      const onPageChange = vi.fn();
      const onPageSizeChange = vi.fn();
      render(
        <Pagination
          defaultPage={4}
          pageSizeOptions={[25, 100]}
          totalItems={400}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />,
      );

      escolherTamanho('100');

      expect(onPageSizeChange).toHaveBeenCalledWith(100);
      expect(onPageChange).toHaveBeenCalledWith(1);
      expect(screen.getByText('1–100 de 400')).toBeInTheDocument();
    });

    it('troca o tamanho mesmo com a troca de página suspensa', () => {
      const onPageSizeChange = vi.fn();
      render(<Pagination disabled pageSizeOptions={[25, 50]} totalItems={120} onPageSizeChange={onPageSizeChange} />);

      escolherTamanho('50');

      expect(onPageSizeChange).toHaveBeenCalledWith(50);
    });

    it('continua na tela com uma página só, para voltar a um tamanho menor', () => {
      render(<Pagination pageSize={100} pageSizeOptions={[25, 100]} totalItems={80} />);

      expect(screen.getByRole('combobox', { name: 'Itens por página' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Próxima página' })).not.toBeInTheDocument();
    });

    it('nomeia a lista aberta pelo campo', () => {
      render(<Pagination pageSizeOptions={[25, 50]} totalItems={120} />);

      fireEvent.click(screen.getByRole('combobox', { name: 'Itens por página' }));

      expect(screen.getByRole('listbox', { name: 'Itens por página' })).toBeInTheDocument();
    });
  });
});
