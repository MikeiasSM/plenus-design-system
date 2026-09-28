import { fireEvent, render, screen } from '@testing-library/react';
import { List, type ListItem } from './List';

const cidades: ListItem[] = [
  { value: 'sp', label: 'São Paulo' },
  { value: 'rj', label: 'Rio de Janeiro' },
  { value: 'gyn', label: 'Goiânia' },
  { value: 'mao', label: 'Manaus', disabled: true },
];

function montar(props: Partial<React.ComponentProps<typeof List>> = {}) {
  return render(
    <List items={cidades} label="Cidades" {...props}>
      <List.Search />
      <List.SelectAll />
      <List.Options />
      <List.Empty>Nenhuma cidade encontrada</List.Empty>
    </List>,
  );
}

describe('List', () => {
  it('sem selecao e uma lista, nao uma caixa de listagem', () => {
    montar();

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  it('com selecao expoe listbox e marca o modo multiplo', () => {
    montar({ selectionMode: 'multiple' });

    const listbox = screen.getByRole('listbox', { name: 'Cidades' });
    expect(listbox).toHaveAttribute('aria-multiselectable', 'true');
    expect(screen.getAllByRole('option')).toHaveLength(4);
  });

  it('filtra localmente ignorando acento', () => {
    montar();

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'goiania' } });

    expect(screen.getByText('Goiânia')).toBeInTheDocument();
    expect(screen.queryByText('Rio de Janeiro')).not.toBeInTheDocument();
  });

  it('anuncia a lista vazia', () => {
    montar();

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'curitiba' } });

    expect(screen.getByText('Nenhuma cidade encontrada')).toBeInTheDocument();
  });

  it('acumula escolhas no modo multiplo e reporta os itens', () => {
    const escolhido = vi.fn();
    montar({ selectionMode: 'multiple', onSelectionChange: escolhido });

    fireEvent.click(screen.getByRole('option', { name: /São Paulo/ }));
    fireEvent.click(screen.getByRole('option', { name: /Goiânia/ }));

    expect(escolhido).toHaveBeenLastCalledWith([
      { value: 'sp', label: 'São Paulo' },
      { value: 'gyn', label: 'Goiânia' },
    ]);
  });

  it('substitui a escolha no modo simples', () => {
    const escolhido = vi.fn();
    montar({ selectionMode: 'single', onSelectionChange: escolhido });

    fireEvent.click(screen.getByRole('option', { name: 'São Paulo' }));
    fireEvent.click(screen.getByRole('option', { name: 'Goiânia' }));

    expect(escolhido).toHaveBeenLastCalledWith([{ value: 'gyn', label: 'Goiânia' }]);
  });

  it('ignora o clique em item desabilitado', () => {
    const escolhido = vi.fn();
    montar({ selectionMode: 'multiple', onSelectionChange: escolhido });

    fireEvent.click(screen.getByRole('option', { name: /Manaus/ }));

    expect(escolhido).not.toHaveBeenCalled();
  });

  it('navega pelo teclado a partir da busca e escolhe com Enter', () => {
    const escolhido = vi.fn();
    montar({ selectionMode: 'single', onSelectionChange: escolhido });

    const busca = screen.getByRole('searchbox');
    fireEvent.keyDown(busca, { key: 'ArrowDown' });
    fireEvent.keyDown(busca, { key: 'ArrowDown' });
    fireEvent.keyDown(busca, { key: 'Enter' });

    expect(escolhido).toHaveBeenLastCalledWith([{ value: 'rj', label: 'Rio de Janeiro' }]);
  });

  it('pula o item desabilitado ao percorrer com End', () => {
    render(
      <List items={cidades} label="Cidades" selectionMode="single">
        <List.Options />
      </List>,
    );

    const lista = screen.getByRole('listbox');
    fireEvent.keyDown(lista, { key: 'End' });

    expect(lista).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Goiânia' }).id);
  });

  it('deixa Home, End e Espaco editarem o texto da busca', () => {
    const escolhido = vi.fn();
    montar({ onSelectionChange: escolhido, selectionMode: 'single' });

    const busca = screen.getByRole('searchbox');
    fireEvent.keyDown(busca, { key: 'ArrowDown' });

    for (const tecla of ['Home', 'End', ' ']) {
      expect(fireEvent.keyDown(busca, { key: tecla })).toBe(true);
    }

    expect(escolhido).not.toHaveBeenCalled();
  });

  it('declara total e posicao de cada opcao', () => {
    montar({ selectionMode: 'single' });

    const opcao = screen.getByRole('option', { name: 'Rio de Janeiro' });
    expect(opcao).toHaveAttribute('aria-posinset', '2');
    expect(opcao).toHaveAttribute('aria-setsize', '4');
  });

  it('mantem visivel o selecionado que saiu do resultado da busca', () => {
    montar({ selectionMode: 'multiple' });

    fireEvent.click(screen.getByRole('option', { name: /São Paulo/ }));
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'goiania' } });

    expect(screen.getByRole('group', { name: 'Selecionados' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /São Paulo/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('nao filtra quando a busca e externa e avisa o produto', () => {
    const buscar = vi.fn();
    montar({ onSearch: buscar });

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'goi' } });

    expect(buscar).toHaveBeenCalledWith('goi');
    expect(screen.getByText('Rio de Janeiro')).toBeInTheDocument();
  });

  it('anuncia o carregamento em vez da lista vazia', () => {
    montar({ items: [], loading: true });

    expect(screen.getByRole('list')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Carregando')).toBeInTheDocument();
    expect(screen.queryByText('Nenhuma cidade encontrada')).not.toBeInTheDocument();
  });

  it('seleciona a faixa com Shift e clique, pulando o desabilitado do meio', () => {
    const escolhido = vi.fn();
    const comBloqueioNoMeio: ListItem[] = [
      { value: 'sp', label: 'São Paulo' },
      { value: 'mao', label: 'Manaus', disabled: true },
      { value: 'gyn', label: 'Goiânia' },
    ];
    montar({ items: comBloqueioNoMeio, selectionMode: 'multiple', onSelectionChange: escolhido });

    fireEvent.click(screen.getByRole('option', { name: /São Paulo/ }));
    fireEvent.click(screen.getByRole('option', { name: /Goiânia/ }), { shiftKey: true });

    expect(escolhido).toHaveBeenLastCalledWith([
      { value: 'sp', label: 'São Paulo' },
      { value: 'gyn', label: 'Goiânia' },
    ]);
  });

  it('ignora Shift e clique em item desabilitado', () => {
    const escolhido = vi.fn();
    montar({ selectionMode: 'multiple', onSelectionChange: escolhido });

    fireEvent.click(screen.getByRole('option', { name: /São Paulo/ }));
    fireEvent.click(screen.getByRole('option', { name: /Manaus/ }), { shiftKey: true });

    expect(escolhido).toHaveBeenLastCalledWith([{ value: 'sp', label: 'São Paulo' }]);
  });

  it('estende a escolha com Shift e seta', () => {
    const escolhido = vi.fn();
    montar({ selectionMode: 'multiple', onSelectionChange: escolhido });

    fireEvent.click(screen.getByRole('option', { name: /São Paulo/ }));
    fireEvent.keyDown(screen.getByRole('searchbox'), { key: 'ArrowDown', shiftKey: true });

    expect(escolhido).toHaveBeenLastCalledWith([
      { value: 'sp', label: 'São Paulo' },
      { value: 'rj', label: 'Rio de Janeiro' },
    ]);
  });

  it('marca e desmarca todos os habilitados', () => {
    const escolhido = vi.fn();
    montar({ selectionMode: 'multiple', onSelectionChange: escolhido });

    const todos = screen.getByRole('checkbox', { name: 'Selecionar todos' });
    fireEvent.click(todos);

    expect(escolhido).toHaveBeenLastCalledWith([
      { value: 'sp', label: 'São Paulo' },
      { value: 'rj', label: 'Rio de Janeiro' },
      { value: 'gyn', label: 'Goiânia' },
    ]);

    fireEvent.click(todos);
    expect(escolhido).toHaveBeenLastCalledWith([]);
  });

  it('mostra o marcar todos como indeterminado na escolha parcial', () => {
    montar({ selectionMode: 'multiple' });

    const todos = screen.getByRole('checkbox', { name: 'Selecionar todos' }) as HTMLInputElement;
    expect(todos.indeterminate).toBe(false);

    fireEvent.click(screen.getByRole('option', { name: /São Paulo/ }));

    expect(todos.indeterminate).toBe(true);
    expect(todos.checked).toBe(false);
  });

  it('nao oferece marcar todos fora da selecao multipla', () => {
    montar({ selectionMode: 'single' });

    expect(screen.queryByRole('checkbox', { name: 'Selecionar todos' })).not.toBeInTheDocument();
  });

  it('monta todas as opcoes quando nao ha medida, e nao so a janela inicial', () => {
    const muitas = Array.from({ length: 100 }, (_, indice) => ({ value: String(indice), label: 'Item ' + indice }));

    render(
      <List items={muitas} label="Itens" selectionMode="single">
        <List.Options height={320} />
      </List>,
    );

    expect(screen.getAllByRole('option')).toHaveLength(100);
  });

  it('nao perde a escolha controlada que nao esta entre os itens', () => {
    const escolhido = vi.fn();

    render(
      <List
        items={[{ value: 'rj', label: 'Rio de Janeiro' }]}
        label="Cidades"
        onSelectionChange={escolhido}
        selectionMode="multiple"
        value={[{ value: 'sp', label: 'São Paulo' }]}
      >
        <List.Options />
      </List>,
    );

    fireEvent.click(screen.getByRole('option', { name: /Rio de Janeiro/ }));

    expect(escolhido).toHaveBeenLastCalledWith([
      { value: 'sp', label: 'São Paulo' },
      { value: 'rj', label: 'Rio de Janeiro' },
    ]);
  });

  it('deixa o clique levar o foco a lista sem busca, que e quem o detem', () => {
    render(
      <List items={cidades} label="Cidades" selectionMode="single">
        <List.Options />
      </List>,
    );

    expect(fireEvent.mouseDown(screen.getByRole('option', { name: 'Goiânia' }))).toBe(true);
  });

  it('segura o foco no campo de busca ao clicar numa opcao', () => {
    montar({ selectionMode: 'single' });

    expect(fireEvent.mouseDown(screen.getByRole('option', { name: 'Goiânia' }))).toBe(false);
  });
});
