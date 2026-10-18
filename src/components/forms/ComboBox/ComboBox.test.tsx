import { act, fireEvent, render, screen } from '@testing-library/react';
import { ComboBox, type ComboBoxOption, type ComboBoxSingleProps } from './ComboBox';

const opcoes: ComboBoxOption[] = [
  { value: 'sp', label: 'Sao Paulo' },
  { value: 'rj', label: 'Rio de Janeiro' },
  { value: 'mg', label: 'Belo Horizonte' },
  { value: 'gyn', label: 'Goiânia' },
];

function montar(props: Partial<ComboBoxSingleProps> = {}) {
  render(<ComboBox label="Cidade" options={opcoes} {...props} />);
  return screen.getByRole('combobox', { name: 'Cidade' });
}

describe('ComboBox', () => {
  it('anuncia a autocompletar por lista e comeca fechado', () => {
    const campo = montar();

    expect(campo).toHaveAttribute('aria-autocomplete', 'list');
    expect(campo).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('filtra pelo texto digitado, ignorando caixa', () => {
    const campo = montar();
    fireEvent.change(campo, { target: { value: 'rio' } });

    expect(screen.getByRole('option', { name: 'Rio de Janeiro' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Sao Paulo' })).not.toBeInTheDocument();
  });

  it('filtra sem acento o texto acentuado', () => {
    const campo = montar();

    fireEvent.change(campo, { target: { value: 'goiania' } });

    expect(screen.getByRole('option', { name: 'Goiânia' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Rio de Janeiro' })).not.toBeInTheDocument();
  });

  it('avisa quando nada corresponde', () => {
    fireEvent.change(montar(), { target: { value: 'curitiba' } });

    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(screen.getByText('Nenhum resultado')).toBeInTheDocument();
  });

  it('escolhe pelo clique, preenche o campo e reporta o valor', () => {
    const onValueChange = vi.fn();
    const campo = montar({ onValueChange });
    fireEvent.change(campo, { target: { value: 'belo' } });
    fireEvent.click(screen.getByRole('option', { name: 'Belo Horizonte' }));

    expect(onValueChange).toHaveBeenCalledWith('mg');
    expect(campo).toHaveValue('Belo Horizonte');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('abre e percorre a lista completa pelo teclado', () => {
    const campo = montar();
    fireEvent.keyDown(campo, { key: 'ArrowDown' });

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(campo).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Sao Paulo' }).id);

    fireEvent.keyDown(campo, { key: 'ArrowDown' });
    expect(campo).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Rio de Janeiro' }).id);
  });

  it('confirma com Enter e limpa o filtro com Escape', () => {
    const onValueChange = vi.fn();
    const campo = montar({ onValueChange });

    fireEvent.keyDown(campo, { key: 'ArrowDown' });
    fireEvent.keyDown(campo, { key: 'Enter' });
    expect(onValueChange).toHaveBeenCalledWith('sp');

    fireEvent.change(campo, { target: { value: 'xyz' } });
    fireEvent.keyDown(campo, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(campo).toHaveValue('Sao Paulo');
  });

  it('delega a busca ao produto sem filtrar por conta propria', () => {
    const buscar = vi.fn();
    const campo = montar({ onSearch: buscar });

    fireEvent.change(campo, { target: { value: 'goi' } });

    expect(buscar).toHaveBeenCalledWith('goi');
    expect(screen.getByRole('option', { name: 'Rio de Janeiro' })).toBeInTheDocument();
  });

  it('anuncia o carregamento da busca externa', () => {
    const campo = montar({ onSearch: vi.fn(), options: [], loading: true });

    fireEvent.click(campo);

    expect(screen.getByRole('listbox')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Carregando')).toBeInTheDocument();
    expect(screen.queryByText('Nenhum resultado')).not.toBeInTheDocument();
  });

  it('volta ao texto da escolha quando o campo perde o foco no meio de uma busca', () => {
    render(<ComboBox defaultValue="rj" label="Cidade" options={[{ label: 'Rio de Janeiro', value: 'rj' }]} />);

    const campo = screen.getByRole('combobox', { name: 'Cidade' });

    fireEvent.change(campo, { target: { value: 'xyz' } });
    fireEvent.blur(campo);

    expect(campo).toHaveValue('Rio de Janeiro');
  });

  it('nao fecha a lista pelo clique no painel fora de uma opcao', () => {
    render(<ComboBox label="Cidade" options={[{ label: 'Rio de Janeiro', value: 'rj' }]} />);

    const campo = screen.getByRole('combobox', { name: 'Cidade' });

    fireEvent.change(campo, { target: { value: 'xyz' } });

    expect(fireEvent.mouseDown(screen.getByText('Nenhum resultado'))).toBe(false);
  });

  describe('escolha multipla', () => {
    it('acumula as escolhas com a lista aberta e reporta todas', () => {
      const onValueChange = vi.fn();
      render(<ComboBox label="Cidades" onValueChange={onValueChange} options={opcoes} selectionMode="multiple" />);
      const campo = screen.getByRole('combobox', { name: 'Cidades' });

      fireEvent.click(campo);
      fireEvent.click(screen.getByRole('option', { name: 'Sao Paulo' }));
      fireEvent.click(screen.getByRole('option', { name: 'Goiânia' }));

      expect(onValueChange).toHaveBeenLastCalledWith(['sp', 'gyn']);
      expect(screen.getByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true');
      expect(screen.getByRole('option', { name: 'Goiânia' })).toHaveAttribute('aria-selected', 'true');
      expect(campo).toHaveValue('');
    });

    it('mostra a primeira etiqueta e a contagem do resto, e descreve o total ao leitor de tela', () => {
      render(<ComboBox defaultValue={['rj', 'mg', 'gyn']} label="Cidades" options={opcoes} selectionMode="multiple" />);

      expect(screen.getByText('Rio de Janeiro')).toBeInTheDocument();
      expect(screen.getByText('+2')).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: 'Cidades' })).toHaveAccessibleDescription(
        '3 selecionados: Rio de Janeiro, Belo Horizonte, Goiânia',
      );
    });

    describe('medido', () => {
      beforeEach(() => {
        class Observador {
          constructor(private aviso: (entradas: []) => void) {}
          observe() {
            queueMicrotask(() => this.aviso([]));
          }
          unobserve() {}
          disconnect() {}
        }

        Object.defineProperty(globalThis, 'ResizeObserver', { configurable: true, value: Observador });
      });

      afterEach(() => {
        Reflect.deleteProperty(globalThis, 'ResizeObserver');
        Reflect.deleteProperty(HTMLElement.prototype, 'scrollWidth');
      });

      it('mostra todas as etiquetas enquanto cabem', async () => {
        render(<ComboBox defaultValue={['rj', 'mg', 'gyn']} label="Cidades" options={opcoes} selectionMode="multiple" />);

        expect(await screen.findByText('Goiânia')).toBeInTheDocument();
        expect(screen.getByText('Belo Horizonte')).toBeInTheDocument();
        expect(screen.queryByText('+2')).not.toBeInTheDocument();
      });

      it('resume quando as etiquetas transbordam', async () => {
        Object.defineProperty(HTMLElement.prototype, 'scrollWidth', { configurable: true, value: 500 });
        render(<ComboBox defaultValue={['rj', 'mg', 'gyn']} label="Cidades" options={opcoes} selectionMode="multiple" />);

        await act(() => Promise.resolve());

        expect(screen.getByText('+2')).toBeInTheDocument();
        expect(screen.queryByText('Goiânia')).not.toBeInTheDocument();
      });
    });

    it('remove a ultima escolha com Backspace no campo vazio', () => {
      const onValueChange = vi.fn();
      render(
        <ComboBox
          defaultValue={['rj', 'mg']}
          label="Cidades"
          onValueChange={onValueChange}
          options={opcoes}
          selectionMode="multiple"
        />,
      );

      fireEvent.keyDown(screen.getByRole('combobox', { name: 'Cidades' }), { key: 'Backspace' });

      expect(onValueChange).toHaveBeenLastCalledWith(['rj']);
    });

    it('envia ao formulario um valor por escolha', () => {
      render(
        <form aria-label="Cadastro">
          <ComboBox defaultValue={['rj', 'mg']} label="Cidades" name="cidades" options={opcoes} selectionMode="multiple" />
        </form>,
      );

      expect(new FormData(screen.getByRole<HTMLFormElement>('form')).getAll('cidades')).toEqual(['rj', 'mg']);
    });
  });

  describe('opção composta e grupos', () => {
    const documentos: ComboBoxOption[] = [
      { value: 'guia', label: 'Guia de integração', description: 'Faturamento', group: 'Documentos', icon: <svg data-testid="icone" /> },
      { value: 'manual', label: 'Manual do operador', description: 'Atendimento', group: 'Documentos' },
      { value: 'faturamento', label: 'Faturamento', group: 'Coleções' },
    ];

    function abrir() {
      render(<ComboBox label="Buscar no acervo" options={documentos} />);
      const campo = screen.getByRole('combobox', { name: 'Buscar no acervo' });
      fireEvent.keyDown(campo, { key: 'ArrowDown' });
      return campo;
    }

    it('nomeia a opção pelo rótulo e descreve pela segunda linha', () => {
      abrir();
      const opcao = screen.getByRole('option', { name: 'Guia de integração' });

      expect(opcao).toHaveAccessibleDescription('Faturamento');
      expect(screen.getByTestId('icone').parentElement).toHaveAttribute('aria-hidden', 'true');
    });

    it('agrupa as opções seguidas sob o título do grupo', () => {
      abrir();
      const grupo = screen.getByRole('group', { name: 'Documentos' });

      expect(grupo).toContainElement(screen.getByRole('option', { name: 'Manual do operador' }));
      expect(screen.getByRole('group', { name: 'Coleções' })).toContainElement(
        screen.getByRole('option', { name: 'Faturamento' }),
      );
    });

    it('o título do grupo fica fora da navegação: as setas passam de um grupo ao outro', () => {
      const campo = abrir();
      fireEvent.keyDown(campo, { key: 'ArrowDown' });
      fireEvent.keyDown(campo, { key: 'ArrowDown' });

      expect(campo).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Faturamento' }).id);
    });

    it('a busca esconde o grupo que ficou sem opção', () => {
      const campo = abrir();
      fireEvent.change(campo, { target: { value: 'manual' } });

      expect(screen.getByRole('group', { name: 'Documentos' })).toBeInTheDocument();
      expect(screen.queryByRole('group', { name: 'Coleções' })).not.toBeInTheDocument();
    });
  });
});
