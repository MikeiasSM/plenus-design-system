import { fireEvent, render, screen } from '@testing-library/react';
import { Select, type SelectOption } from './Select';

const opcoes: SelectOption[] = [
  { value: 'pix', label: 'Pix' },
  { value: 'boleto', label: 'Boleto', disabled: true },
  { value: 'cartao', label: 'Cartao' },
];

function montar(props: Partial<React.ComponentProps<typeof Select>> = {}) {
  render(<Select label="Forma de pagamento" options={opcoes} {...props} />);
  return screen.getByRole('combobox', { name: 'Forma de pagamento' });
}

describe('Select', () => {
  it('mostra o placeholder e anuncia o popup', () => {
    const gatilho = montar();

    expect(gatilho).toHaveTextContent('Selecione');
    expect(gatilho).toHaveAttribute('aria-haspopup', 'listbox');
    expect(gatilho).toHaveAttribute('aria-expanded', 'false');
  });

  it('abre a lista e expoe as opcoes com estado de selecao', () => {
    fireEvent.click(montar({ defaultValue: 'pix' }));

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Pix' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('option', { name: 'Cartao' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('option', { name: 'Boleto' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('escolhe pelo clique, reporta o valor e fecha', () => {
    const onValueChange = vi.fn();
    const gatilho = montar({ onValueChange });
    fireEvent.click(gatilho);
    fireEvent.click(screen.getByRole('option', { name: 'Cartao' }));

    expect(onValueChange).toHaveBeenCalledWith('cartao');
    expect(gatilho).toHaveTextContent('Cartao');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('abre pelo teclado e navega pulando desabilitados', () => {
    const gatilho = montar();
    fireEvent.keyDown(gatilho, { key: 'ArrowDown' });

    const lista = screen.getByRole('listbox');
    expect(lista).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Pix' }).id);

    fireEvent.keyDown(lista, { key: 'ArrowDown' });
    expect(lista).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Cartao' }).id);
  });

  it('confirma com Enter', () => {
    const onValueChange = vi.fn();
    const gatilho = montar({ onValueChange });
    fireEvent.keyDown(gatilho, { key: 'ArrowDown' });
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Enter' });

    expect(onValueChange).toHaveBeenCalledWith('pix');
  });

  it('fecha pelo Escape e devolve o foco ao gatilho', () => {
    const gatilho = montar();
    fireEvent.click(gatilho);
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' });

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(gatilho).toHaveFocus();
  });

  it('abre de início com defaultOpen', () => {
    montar({ defaultOpen: true });

    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('avisa a abertura e o fechamento em cada via, sem controle', () => {
    const onOpenChange = vi.fn();
    const gatilho = montar({ onOpenChange });

    fireEvent.click(gatilho);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' });
    expect(onOpenChange).toHaveBeenLastCalledWith(false);

    fireEvent.keyDown(gatilho, { key: 'ArrowDown' });
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    fireEvent.click(screen.getByRole('option', { name: 'Cartao' }));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);

    fireEvent.click(gatilho);
    fireEvent.pointerDown(document.body);
    fireEvent.mouseDown(document.body);
    fireEvent.pointerUp(document.body);
    fireEvent.mouseUp(document.body);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(onOpenChange.mock.calls).toEqual([[true], [false], [true], [false], [true], [false]]);
  });

  it('abre e fecha por open e devolve o foco ao gatilho', () => {
    const { rerender } = render(<Select label="Forma" options={opcoes} open={false} />);
    const gatilho = screen.getByRole('combobox', { name: 'Forma' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    rerender(<Select label="Forma" options={opcoes} open />);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(gatilho).toHaveAttribute('aria-expanded', 'true');

    rerender(<Select label="Forma" options={opcoes} open={false} />);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(gatilho).toHaveFocus();
  });

  it('controlado, so muda quando o produto atualiza open', () => {
    const onOpenChange = vi.fn();
    render(<Select label="Forma" onOpenChange={onOpenChange} open={false} options={opcoes} />);
    const gatilho = screen.getByRole('combobox', { name: 'Forma' });

    fireEvent.click(gatilho);
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('controlado aberto, Escape pede o fechamento e a lista permanece', () => {
    const onOpenChange = vi.fn();
    render(<Select label="Forma" onOpenChange={onOpenChange} open options={opcoes} />);

    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' });

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('respeita o valor controlado e o estado desabilitado', () => {
    const { rerender } = render(
      <Select label="Forma" options={opcoes} value="pix" onValueChange={() => undefined} />,
    );
    expect(screen.getByRole('combobox', { name: 'Forma' })).toHaveTextContent('Pix');

    rerender(<Select label="Forma" options={opcoes} value="cartao" onValueChange={() => undefined} />);
    expect(screen.getByRole('combobox', { name: 'Forma' })).toHaveTextContent('Cartao');

    rerender(<Select label="Forma" options={opcoes} disabled />);
    expect(screen.getByRole('combobox', { name: 'Forma' })).toBeDisabled();
  });

  it('descreve erros pelo campo compartilhado', () => {
    const gatilho = montar({ error: 'Escolha uma opcao.' });

    expect(gatilho).toHaveAttribute('aria-invalid', 'true');
    expect(gatilho).toHaveAccessibleDescription('Escolha uma opcao.');
  });

  describe('opção com segunda linha', () => {
    const secoes: SelectOption[] = [
      { value: 'titulos', label: 'Títulos', description: 'Financeiro / Títulos', icon: <svg data-testid="icone" /> },
      { value: 'contratos', label: 'Contratos', description: 'Jurídico / Contratos' },
    ];

    it('nomeia a opção pelo rótulo e descreve pela segunda linha, com o ícone decorativo', () => {
      render(<Select label="Dentro de" options={secoes} />);
      fireEvent.click(screen.getByRole('combobox', { name: 'Dentro de' }));

      expect(screen.getByRole('option', { name: 'Títulos' })).toHaveAccessibleDescription('Financeiro / Títulos');
      expect(screen.getByTestId('icone').parentElement).toHaveAttribute('aria-hidden', 'true');
    });

    it('mostra no gatilho fechado só o rótulo da escolhida', () => {
      render(<Select label="Dentro de" options={secoes} />);
      const gatilho = screen.getByRole('combobox', { name: 'Dentro de' });
      fireEvent.click(gatilho);
      fireEvent.click(screen.getByRole('option', { name: 'Contratos' }));

      expect(gatilho).toHaveTextContent(/^Contratos$/);
    });
  });
});
