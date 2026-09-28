import { fireEvent, render, screen } from '@testing-library/react';
import { Table } from './Table';

interface Membro {
  id: string;
  nome: string;
  status: string;
}

const membros: Membro[] = [
  { id: '1', nome: 'Ana Prado', status: 'Ativo' },
  { id: '2', nome: 'Bruno Dias', status: 'Convidado' },
  { id: '3', nome: 'Célia Nunes', status: 'Inativo' },
];

function montar(props: Partial<React.ComponentProps<typeof Table>> = {}, itens: Membro[] = membros) {
  return render(
    <Table label="Membros" rows={itens} {...props}>
      <Table.Header>
        <Table.Column id="nome" sortable>
          Nome
        </Table.Column>
        <Table.Column id="status" help="Situação do convite">
          Status
        </Table.Column>
        <Table.Column id="acoes" align="end" hideBelow="md">
          Ações
        </Table.Column>
      </Table.Header>
      <Table.Body items={itens} empty={<span>Nenhum membro encontrado</span>}>
        {(membro) => (
          <Table.Row id={membro.id} label={'Selecionar ' + membro.nome}>
            <Table.Cell>{membro.nome}</Table.Cell>
            <Table.Cell>{membro.status}</Table.Cell>
            <Table.Cell align="end" hideBelow="md" />
          </Table.Row>
        )}
      </Table.Body>
    </Table>,
  );
}

describe('Table', () => {
  it('usa marcacao tabular semantica e nomeia a tabela', () => {
    montar();

    expect(screen.getByRole('table', { name: 'Membros' })).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')).toHaveLength(3);
    expect(screen.getAllByRole('row')).toHaveLength(4);
  });

  it('anuncia a coluna ordenavel e ignora as demais', () => {
    montar();

    expect(screen.getByRole('columnheader', { name: /Nome/ })).toHaveAttribute('aria-sort', 'none');
    expect(screen.getByRole('columnheader', { name: /Status/ })).not.toHaveAttribute('aria-sort');
  });

  it('alterna a direcao ao acionar a mesma coluna', () => {
    const ordenou = vi.fn();
    montar({ onSortChange: ordenou });

    const gatilho = screen.getByRole('button', { name: /Nome/ });

    fireEvent.click(gatilho);
    expect(ordenou).toHaveBeenLastCalledWith({ column: 'nome', direction: 'ascending' });
    expect(screen.getByRole('columnheader', { name: /Nome/ })).toHaveAttribute('aria-sort', 'ascending');

    fireEvent.click(gatilho);
    expect(ordenou).toHaveBeenLastCalledWith({ column: 'nome', direction: 'descending' });
    expect(screen.getByRole('columnheader', { name: /Nome/ })).toHaveAttribute('aria-sort', 'descending');
  });

  it('respeita a ordenacao controlada sem decidir por conta propria', () => {
    const ordenou = vi.fn();
    montar({ sort: { column: 'nome', direction: 'descending' }, onSortChange: ordenou });

    expect(screen.getByRole('columnheader', { name: /Nome/ })).toHaveAttribute('aria-sort', 'descending');

    fireEvent.click(screen.getByRole('button', { name: /Nome/ }));

    expect(ordenou).toHaveBeenLastCalledWith({ column: 'nome', direction: 'ascending' });
    expect(screen.getByRole('columnheader', { name: /Nome/ })).toHaveAttribute('aria-sort', 'descending');
  });

  it('anuncia o vazio ocupando a largura da tabela', () => {
    montar({}, []);

    const celula = screen.getByText('Nenhum membro encontrado').closest('td');
    expect(celula).toHaveAttribute('colspan', '3');
  });

  it('anuncia o carregamento em vez do vazio', () => {
    montar({ loading: true }, []);

    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Carregando');
    expect(screen.queryByText('Nenhum membro encontrado')).not.toBeInTheDocument();
  });

  it('descreve a coluna com ajuda sem exigir o ponteiro', () => {
    montar();

    expect(screen.getByRole('img', { name: 'Situação do convite' })).toHaveAttribute('tabindex', '0');
  });

  it('nao oferece selecao quando o modo e nenhum', () => {
    montar();

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.getAllByRole('row')[1]).not.toHaveAttribute('aria-selected');
  });

  it('marca a linha e reporta os identificadores', () => {
    const escolheu = vi.fn();
    montar({ selectionMode: 'multiple', onSelectionChange: escolheu });

    fireEvent.click(screen.getByRole('checkbox', { name: 'Selecionar Ana Prado' }));

    expect(escolheu).toHaveBeenLastCalledWith(['1']);
    expect(screen.getByRole('checkbox', { name: 'Selecionar Ana Prado' })).toBeChecked();
  });

  it('usa radio na selecao unica e substitui a escolha', () => {
    const escolheu = vi.fn();
    montar({ selectionMode: 'single', onSelectionChange: escolheu });

    fireEvent.click(screen.getByRole('radio', { name: 'Selecionar Ana Prado' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Selecionar Bruno Dias' }));

    expect(escolheu).toHaveBeenLastCalledWith(['2']);
  });

  it('marca a faixa com Shift', () => {
    const escolheu = vi.fn();
    montar({ selectionMode: 'multiple', onSelectionChange: escolheu });

    fireEvent.click(screen.getByRole('checkbox', { name: 'Selecionar Ana Prado' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Selecionar Célia Nunes' }), { shiftKey: true });

    expect(escolheu).toHaveBeenLastCalledWith(['1', '2', '3']);
  });

  it('marca todas as linhas e mostra o indeterminado na escolha parcial', () => {
    const escolheu = vi.fn();
    montar({ selectionMode: 'multiple', onSelectionChange: escolheu });

    const todas = screen.getByRole('checkbox', { name: 'Selecionar todas as linhas' }) as HTMLInputElement;

    fireEvent.click(screen.getByRole('checkbox', { name: 'Selecionar Ana Prado' }));
    expect(todas.indeterminate).toBe(true);

    fireEvent.click(todas);
    expect(escolheu).toHaveBeenLastCalledWith(['1', '2', '3']);
  });

  it('permite desligar o destaque da linha mantendo a marcacao', () => {
    montar({ selectionMode: 'multiple', highlightSelectedRow: false });

    fireEvent.click(screen.getByRole('checkbox', { name: 'Selecionar Ana Prado' }));

    const linha = screen.getAllByRole('row')[1];
    expect(screen.getByRole('checkbox', { name: 'Selecionar Ana Prado' })).toBeChecked();
    expect(linha.className).not.toContain('selected');
  });

  it('desmarca pela caixa na selecao unica, e anuncia a chave como chave', () => {
    const escolheu = vi.fn();
    montar({ selectionControl: 'toggle', selectionMode: 'single', onSelectionChange: escolheu });

    const chave = screen.getByRole('switch', { name: 'Selecionar Ana Prado' });

    fireEvent.click(chave);
    fireEvent.click(chave);

    expect(escolheu).toHaveBeenLastCalledWith([]);
  });

  it('nao oferece marcar todas sem as linhas para marcar', () => {
    montar({ rows: undefined, selectionMode: 'multiple' });

    expect(screen.getByRole('checkbox', { name: 'Selecionar todas as linhas' })).toBeDisabled();
  });

  it('deixa a ajuda da coluna fora do botao de ordenacao', () => {
    render(
      <Table label="Membros" rows={membros}>
        <Table.Header>
          <Table.Column help="Nome civil" id="nome" sortable>
            Nome
          </Table.Column>
        </Table.Header>
        <Table.Body items={membros}>{(membro) => <Table.Row id={membro.id}><Table.Cell>{membro.nome}</Table.Cell></Table.Row>}</Table.Body>
      </Table>,
    );

    const ajuda = screen.getByRole('img', { name: 'Nome civil' });

    expect(ajuda.closest('button')).toBeNull();
  });

  it('ajusta o vazio as colunas que ficaram', () => {
    function Tabela({ colunas }: { colunas: string[] }) {
      return (
        <Table label="Membros">
          <Table.Header>
            {colunas.map((coluna) => (
              <Table.Column id={coluna} key={coluna}>
                {coluna}
              </Table.Column>
            ))}
          </Table.Header>
          <Table.Body empty={<span>Vazio</span>} items={[]}>
            {() => null}
          </Table.Body>
        </Table>
      );
    }

    const { rerender } = render(<Tabela colunas={['a', 'b', 'c']} />);
    rerender(<Tabela colunas={['a']} />);

    expect(screen.getByText('Vazio').closest('td')).toHaveAttribute('colspan', '1');
  });

  it('comeca com a escolha inicial no modo nao controlado', () => {
    montar({ defaultSelectedIds: ['2'], selectionMode: 'multiple' });

    expect(screen.getByRole('checkbox', { name: 'Selecionar Bruno Dias' })).toBeChecked();
  });
});
