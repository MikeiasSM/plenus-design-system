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
});
