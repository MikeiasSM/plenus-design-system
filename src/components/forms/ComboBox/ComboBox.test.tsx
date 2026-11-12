import { act, fireEvent, render, screen } from '@testing-library/react';
import { ComboBox, type ComboBoxMultipleProps, type ComboBoxOption, type ComboBoxSingleProps } from './ComboBox';

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

  it('com a lista aberta o Escape é dela e marca o evento; fechada, segue adiante', () => {
    const campo = montar();

    fireEvent.keyDown(campo, { key: 'ArrowDown' });
    expect(fireEvent.keyDown(campo, { key: 'Escape' })).toBe(false);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    expect(fireEvent.keyDown(campo, { key: 'Escape' })).toBe(true);
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

  describe('abertura controlável', () => {
    it('abre de início com defaultOpen', () => {
      montar({ defaultOpen: true });

      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('avisa a abertura e o fechamento em cada via, uma vez', () => {
      const onOpenChange = vi.fn();
      const campo = montar({ onOpenChange });

      fireEvent.click(campo);
      fireEvent.change(campo, { target: { value: 'r' } });
      expect(onOpenChange.mock.calls).toEqual([[true]]);

      fireEvent.keyDown(campo, { key: 'Escape' });
      fireEvent.keyDown(campo, { key: 'ArrowDown' });
      fireEvent.blur(campo);
      fireEvent.change(campo, { target: { value: 'g' } });
      fireEvent.keyDown(campo, { key: 'ArrowDown' });
      fireEvent.keyDown(campo, { key: 'Enter' });
      fireEvent.click(campo);
      fireEvent.click(screen.getByRole('option', { name: 'Goiânia' }));

      expect(onOpenChange.mock.calls).toEqual([
        [true], [false], [true], [false], [true], [false], [true], [false],
      ]);
    });

    it('abre e fecha por open, com o foco no campo', () => {
      const { rerender } = render(<ComboBox label="Cidade" open={false} options={opcoes} />);
      const campo = screen.getByRole('combobox', { name: 'Cidade' });
      campo.focus();

      rerender(<ComboBox label="Cidade" open options={opcoes} />);
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      expect(campo).toHaveAttribute('aria-expanded', 'true');

      rerender(<ComboBox label="Cidade" open={false} options={opcoes} />);
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(campo).toHaveFocus();
    });

    it('fechado pelo produto, desfaz a busca', () => {
      const onSearch = vi.fn();
      const { rerender } = render(<ComboBox label="Cidade" onSearch={onSearch} open options={opcoes} />);
      const campo = screen.getByRole('combobox', { name: 'Cidade' });

      fireEvent.change(campo, { target: { value: 'rio' } });
      rerender(<ComboBox label="Cidade" onSearch={onSearch} open={false} options={opcoes} />);

      expect(campo).toHaveValue('');
      expect(onSearch.mock.calls).toEqual([['rio'], ['']]);
    });

    it('controlado, digitar e fechar só pedem; a lista muda quando o produto atualiza open', () => {
      const onOpenChange = vi.fn();
      const { rerender } = render(<ComboBox label="Cidade" onOpenChange={onOpenChange} open={false} options={opcoes} />);
      const campo = screen.getByRole('combobox', { name: 'Cidade' });

      fireEvent.change(campo, { target: { value: 'rio' } });
      expect(onOpenChange).toHaveBeenLastCalledWith(true);
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

      rerender(<ComboBox label="Cidade" onOpenChange={onOpenChange} open options={opcoes} />);
      fireEvent.keyDown(campo, { key: 'Escape' });
      expect(onOpenChange).toHaveBeenLastCalledWith(false);
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
  });

  describe('clique na moldura do campo múltiplo', () => {
    it('fora do input, nas etiquetas e no respiro, leva o foco ao campo e abre a lista', () => {
      render(<ComboBox defaultValue={['rj', 'mg']} label="Cidades" options={opcoes} selectionMode="multiple" />);
      const campo = screen.getByRole('combobox', { name: 'Cidades' });
      const moldura = campo.parentElement as HTMLElement;

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      fireEvent.mouseDown(moldura.querySelector('[aria-hidden="true"]') as Element);

      expect(campo).toHaveFocus();
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('desabilitado, o clique na moldura não abre a lista', () => {
      render(<ComboBox defaultValue={['rj']} disabled label="Cidades" options={opcoes} selectionMode="multiple" />);

      fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Cidades' }).parentElement as HTMLElement);

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('rodapé da seleção múltipla', () => {
    function abrirMultiplo(props: Partial<ComboBoxMultipleProps> = {}) {
      render(<ComboBox label="Cidades" options={opcoes} selectionMode="multiple" {...props} />);
      const campo = screen.getByRole('combobox', { name: 'Cidades' });
      campo.focus();
      fireEvent.click(campo);
      return campo;
    }

    const marcada = (nome: string) => screen.getByRole('option', { name: nome }).getAttribute('aria-selected');

    it('sem as propriedades, o painel não tem rodapé', () => {
      abrirMultiplo();

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('seleciona todos os itens do resultado filtrado, sem desmarcar o que já estava', () => {
      const onValueChange = vi.fn();
      const campo = abrirMultiplo({ defaultValue: ['mg'], onValueChange, selectAll: true });
      fireEvent.change(campo, { target: { value: 'rio' } });

      fireEvent.click(screen.getByRole('button', { name: 'Selecionar todos' }));

      expect(onValueChange).toHaveBeenLastCalledWith(['mg', 'rj']);
      expect(screen.getByRole('button', { name: 'Selecionar todos' })).toBeDisabled();

      fireEvent.change(campo, { target: { value: '' } });

      expect(marcada('Sao Paulo')).toBe('false');
      expect(marcada('Rio de Janeiro')).toBe('true');
    });

    it('limpar desmarca tudo e fica desabilitado sem seleção', () => {
      const onValueChange = vi.fn();
      abrirMultiplo({ clearable: true, defaultValue: ['rj', 'mg'], onValueChange });

      fireEvent.click(screen.getByRole('button', { name: 'Limpar' }));

      expect(onValueChange).toHaveBeenLastCalledWith([]);
      expect(screen.getByRole('button', { name: 'Limpar' })).toBeDisabled();
    });

    it('usa os textos do produto', () => {
      abrirMultiplo({
        clearable: true,
        confirmSelection: true,
        labels: { apply: 'Filtrar', cancel: 'Voltar', clear: 'Zerar', selectAll: 'Todas' },
        selectAll: true,
      });

      for (const nome of ['Filtrar', 'Voltar', 'Zerar', 'Todas']) {
        expect(screen.getByRole('button', { name: nome })).toBeInTheDocument();
      }
    });

    it('anuncia a contagem a cada mudança', () => {
      abrirMultiplo({ selectAll: true });
      expect(screen.getByRole('status')).toHaveTextContent('Nenhum selecionado');

      fireEvent.click(screen.getByRole('option', { name: 'Sao Paulo' }));
      expect(screen.getByRole('status')).toHaveTextContent('1 selecionado');

      fireEvent.click(screen.getByRole('button', { name: 'Selecionar todos' }));
      expect(screen.getByRole('status')).toHaveTextContent('4 selecionados');
    });

    describe('aplicar', () => {
      it('só reporta e só vale ao aplicar', () => {
        const onValueChange = vi.fn();
        const campo = abrirMultiplo({ confirmSelection: true, onValueChange });

        fireEvent.click(screen.getByRole('option', { name: 'Sao Paulo' }));
        fireEvent.click(screen.getByRole('option', { name: 'Goiânia' }));

        expect(onValueChange).not.toHaveBeenCalled();
        expect(screen.getByRole('status')).toHaveTextContent('2 selecionados');
        expect(campo.parentElement).not.toHaveTextContent('Sao Paulo');

        fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

        expect(onValueChange).toHaveBeenCalledOnce();
        expect(onValueChange).toHaveBeenCalledWith(['sp', 'gyn']);
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        expect(campo.parentElement).toHaveTextContent('2 selecionados: Sao Paulo, Goiânia');
        expect(campo).toHaveFocus();
      });

      it.each([
        ['Cancelar', () => fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))],
        ['Escape', () => fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Escape' })],
        ['perder o foco', () => fireEvent.blur(screen.getByRole('combobox'))],
      ])('%s descarta o rascunho', (_nome, fechar) => {
        const onValueChange = vi.fn();
        const campo = abrirMultiplo({ confirmSelection: true, defaultValue: ['rj'], onValueChange });

        fireEvent.click(screen.getByRole('option', { name: 'Sao Paulo' }));
        fireEvent.click(screen.getByRole('option', { name: 'Rio de Janeiro' }));
        fechar();
        fireEvent.click(campo);

        expect(onValueChange).not.toHaveBeenCalled();
        expect(marcada('Sao Paulo')).toBe('false');
        expect(marcada('Rio de Janeiro')).toBe('true');
      });

      it('selecionar todos e limpar também ficam no rascunho', () => {
        const onValueChange = vi.fn();
        abrirMultiplo({ clearable: true, confirmSelection: true, onValueChange, selectAll: true });

        fireEvent.click(screen.getByRole('button', { name: 'Selecionar todos' }));
        fireEvent.click(screen.getByRole('button', { name: 'Limpar' }));
        fireEvent.click(screen.getByRole('button', { name: 'Selecionar todos' }));

        expect(onValueChange).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

        expect(onValueChange).toHaveBeenCalledWith(['sp', 'rj', 'mg', 'gyn']);
      });
    });

    describe('teclado', () => {
      it('o Tab do campo leva ao primeiro botão do rodapé, e o Shift+Tab volta ao campo', () => {
        const campo = abrirMultiplo({ confirmSelection: true, selectAll: true });

        fireEvent.keyDown(campo, { key: 'Tab' });
        const selecionarTodos = screen.getByRole('button', { name: 'Selecionar todos' });
        expect(selecionarTodos).toHaveFocus();
        expect(screen.getByRole('listbox')).toBeInTheDocument();

        fireEvent.keyDown(selecionarTodos, { key: 'Tab', shiftKey: true });
        expect(campo).toHaveFocus();
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      it('o Tab no último botão devolve o foco ao campo e fecha o painel', () => {
        const campo = abrirMultiplo({ confirmSelection: true });

        fireEvent.keyDown(campo, { key: 'Tab' });
        expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus();

        const aplicar = screen.getByRole('button', { name: 'Aplicar' });
        aplicar.focus();
        fireEvent.keyDown(aplicar, { key: 'Tab' });

        expect(campo).toHaveFocus();
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });

      it('o Escape no rodapé fecha e devolve o foco ao campo', () => {
        const campo = abrirMultiplo({ confirmSelection: true });
        fireEvent.keyDown(campo, { key: 'Tab' });

        fireEvent.keyDown(screen.getByRole('button', { name: 'Cancelar' }), { key: 'Escape' });

        expect(campo).toHaveFocus();
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });

      it('o foco no rodapé não fecha o painel', () => {
        const campo = abrirMultiplo({ confirmSelection: true });

        screen.getByRole('button', { name: 'Aplicar' }).focus();

        expect(campo).not.toHaveFocus();
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
    });
  });
});
